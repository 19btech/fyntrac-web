/**
 * Calculated-column formulas.
 *
 * Expressions reference fields by their column header in brackets (a "]" inside a header is
 * written "]]", e.g. [Amount [USD]]]) and support
 * + - * / parentheses, numbers and ABS / ROUND / MIN / MAX, e.g.
 *     ([Revenue] - [Revenue - PPA]) / ABS([Beginning Deferred Revenue]) * 100
 * Parsed with a small recursive-descent parser — never eval().
 *
 * Values are calculated on what the row displays: raw values for detail rows,
 * aggregated values for summary / subtotal / total rows, so ratios are
 * ratio-of-sums rather than sum-of-ratios.
 */

// Field reference in a formula (function declaration: the templates below use it).
function ref(header) {
  return `[${String(header).replace(/]/g, ']]')}]`;
}

export const FORMULA_TEMPLATES = [
  { id: 'sum', label: 'Add', hint: 'A + B', inputs: 2, build: (a, b) => `${ref(a)} + ${ref(b)}` },
  { id: 'difference', label: 'Subtract', hint: 'A − B', inputs: 2, build: (a, b) => `${ref(a)} - ${ref(b)}` },
  { id: 'product', label: 'Multiply', hint: 'A × B', inputs: 2, build: (a, b) => `${ref(a)} * ${ref(b)}` },
  { id: 'ratio', label: 'Ratio', hint: 'A ÷ B', inputs: 2, build: (a, b) => `${ref(a)} / ${ref(b)}` },
  { id: 'percentOf', label: 'Percent of', hint: 'A ÷ B × 100', inputs: 2, format: 'percent', build: (a, b) => `${ref(a)} / ${ref(b)} * 100` },
  { id: 'change', label: '% change', hint: '(A − B) ÷ |B| × 100', inputs: 2, format: 'percent', build: (a, b) => `(${ref(a)} - ${ref(b)}) / ABS(${ref(b)}) * 100` },
  { id: 'abs', label: 'Absolute value', hint: '|A|', inputs: 1, build: (a) => `ABS(${ref(a)})` },
  { id: 'negate', label: 'Reverse sign', hint: '−A', inputs: 1, build: (a) => `-${ref(a)}` },
  { id: 'sumWhere', label: 'Sum where', hint: 'Σ A where field is …', inputs: 0 },
  { id: 'custom', label: 'Custom expression', hint: 'Write your own', inputs: 0 },
];

const FUNCTIONS = {
  ABS: { min: 1, max: 1, fn: ([x]) => Math.abs(x) },
  ROUND: {
    min: 1,
    max: 2,
    fn: ([x, n = 0]) => {
      const f = 10 ** Math.max(0, Math.min(10, Math.trunc(n)));
      return Math.round(x * f) / f;
    },
  },
  MIN: { min: 1, max: 50, fn: (args) => Math.min(...args) },
  MAX: { min: 1, max: 50, fn: (args) => Math.max(...args) },
};

export const fieldRef = (header) => ref(header);

const tokenize = (src) => {
  const tokens = [];
  let i = 0;
  while (i < src.length) {
    const ch = src[i];
    if (/\s/.test(ch)) { i += 1; continue; }
    if (ch === '[') {
      let name = '';
      let j = i + 1;
      let closed = false;
      while (j < src.length) {
        if (src[j] === ']') {
          if (src[j + 1] === ']') { name += ']'; j += 2; continue; }
          closed = true;
          break;
        }
        name += src[j];
        j += 1;
      }
      if (!closed) throw new Error('Missing ] after field name');
      tokens.push({ type: 'field', value: name.trim() });
      i = j + 1;
      continue;
    }
    const num = /^(\d+\.?\d*|\.\d+)/.exec(src.slice(i));
    if (num) { tokens.push({ type: 'num', value: Number(num[0]) }); i += num[0].length; continue; }
    const ident = /^[A-Za-z_]+/.exec(src.slice(i));
    if (ident) { tokens.push({ type: 'ident', value: ident[0].toUpperCase() }); i += ident[0].length; continue; }
    if ('+-*/(),'.includes(ch)) { tokens.push({ type: 'op', value: ch }); i += 1; continue; }
    throw new Error(`Unexpected character "${ch}"`);
  }
  return tokens;
};

// Returns an evaluator (values) => number|null and the list of referenced fields.
const parse = (src, resolveField) => {
  const tokens = tokenize(src);
  const refs = new Set();
  let pos = 0;
  const peek = () => tokens[pos];
  const take = (value) => {
    const t = tokens[pos];
    if (!t || (value && t.value !== value)) throw new Error(value ? `Expected "${value}"` : 'Unexpected end of formula');
    pos += 1;
    return t;
  };

  const binary = (left, op, right) => (v) => {
    const a = left(v);
    const b = right(v);
    if (a === null || b === null) return null;
    if (op === '+') return a + b;
    if (op === '-') return a - b;
    if (op === '*') return a * b;
    return b === 0 ? null : a / b; // divide by zero → blank, not Infinity
  };

  function expr() {
    let node = term();
    while (peek()?.type === 'op' && '+-'.includes(peek().value)) node = binary(node, take().value, term());
    return node;
  }
  function term() {
    let node = unary();
    while (peek()?.type === 'op' && '*/'.includes(peek().value)) node = binary(node, take().value, unary());
    return node;
  }
  function unary() {
    if (peek()?.value === '-') { take(); const inner = unary(); return (v) => { const x = inner(v); return x === null ? null : -x; }; }
    if (peek()?.value === '+') { take(); return unary(); }
    return primary();
  }
  function primary() {
    const t = take();
    if (t.type === 'num') return () => t.value;
    if (t.type === 'field') {
      const field = resolveField(t.value);
      if (!field) throw new Error(`Unknown field [${t.value}]`);
      refs.add(field);
      return (v) => {
        const raw = v[field];
        if (raw === null || raw === undefined || raw === '') return 0;
        const n = Number(raw);
        return Number.isNaN(n) ? null : n;
      };
    }
    if (t.type === 'ident') {
      const def = FUNCTIONS[t.value];
      if (!def) throw new Error(`Unknown function ${t.value}`);
      take('(');
      const args = [expr()];
      while (peek()?.value === ',') { take(); args.push(expr()); }
      take(')');
      if (args.length < def.min || args.length > def.max) throw new Error(`${t.value} takes ${def.min === def.max ? def.min : `${def.min}–${def.max}`} argument(s)`);
      return (v) => {
        const vals = args.map((a) => a(v));
        return vals.some((x) => x === null) ? null : def.fn(vals);
      };
    }
    if (t.value === '(') { const node = expr(); take(')'); return node; }
    throw new Error(`Unexpected "${t.value}"`);
  }

  if (!tokens.length) throw new Error('Formula is empty');
  const root = expr();
  if (pos < tokens.length) throw new Error(`Unexpected "${tokens[pos].value}"`);
  return {
    evaluate: (values) => {
      const out = root(values);
      return out === null || !Number.isFinite(out) ? null : out;
    },
    refs: [...refs],
  };
};

/**
 * meta: column meta ({ field, header, numeric }). Only numeric fields can be referenced.
 * Returns { evaluate, refs } or { error }.
 */
export const compileFormula = (expression, meta) => {
  const byName = new Map();
  meta.forEach((m) => {
    if (!m.numeric || (m.calc && !m.sumWhere)) return;
    byName.set(m.header.toLowerCase(), m.field);
    byName.set(m.field.toLowerCase(), m.field);
  });
  try {
    return parse(expression || '', (name) => byName.get(name.toLowerCase()));
  } catch (e) {
    return { error: e.message };
  }
};

export const calcField = (id) => `calc:${id}`;
