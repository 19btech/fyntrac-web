"use client"
import React, { createContext, useContext, useMemo, useRef, useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Box,
    Typography,
    TextField,
    Button,
    IconButton,
    Tooltip,
    Chip,
    Slide,
    InputAdornment,
    useTheme,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { DataGrid } from '@mui/x-data-grid';
import HighlightOffOutlinedIcon from '@mui/icons-material/HighlightOffOutlined';
import SearchIcon from '@mui/icons-material/Search';
import LabelOutlinedIcon from '@mui/icons-material/LabelOutlined';
import RestartAltIcon from '@mui/icons-material/RestartAlt';

export const DISPLAY_NAME_MAX = 100;

// Letters, numbers and underscores only — no spaces or other special characters.
export const DISPLAY_NAME_PATTERN = /^[A-Za-z0-9_]+$/;
export const DISPLAY_NAME_RULE = 'Use only letters, numbers and underscores (_), with no spaces.';
export const isValidDisplayName = (name) => DISPLAY_NAME_PATTERN.test(String(name ?? '').trim());

// Two names are the same when they differ only in case ("Opening_Cash" = "opening_cash").
export const normalizeDisplayName = (name) => String(name ?? '').trim().replace(/\s+/g, ' ').toLowerCase();

const FONT = '"Inter", "Helvetica Neue", Arial, sans-serif';
const MONO = 'ui-monospace, SFMono-Regular, Consolas, monospace';
const PAGE_SIZE = 100; // the community grid's page size limit

// Same look as the Events grid; column separators are visible so columns can be resized.
const GRID_SX = {
    border: 0,
    fontFamily: FONT,
    fontSize: '0.85rem',
    '& *': { fontFamily: FONT },
    '& .MuiDataGrid-columnHeaders': { borderBottom: '2px solid #e2e8f0' },
    '& .MuiDataGrid-columnHeader': { bgcolor: '#f8fafc' },
    '& .MuiDataGrid-columnHeaderTitle': {
        color: '#475569', fontSize: '0.72rem', fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase',
    },
    '& .MuiDataGrid-columnSeparator': { color: '#cbd5e1' },
    '& .MuiDataGrid-columnSeparator:hover': { color: '#6366F1' },
    '& .MuiDataGrid-scrollbarFiller, & .MuiDataGrid-filler': { bgcolor: '#f8fafc' },
    '& .MuiDataGrid-sortIcon': { color: '#94a3b8' },
    '& .MuiDataGrid-row:hover': { bgcolor: alpha('#14213d', 0.03) },
    '& .MuiDataGrid-cell': { display: 'flex', alignItems: 'center', py: 1, borderColor: 'divider' },
    '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within, & .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-columnHeader:focus-within': { outline: 'none' },
    '& .MuiDataGrid-footerContainer': { borderTop: '1px solid', borderColor: 'divider', bgcolor: alpha('#14213d', 0.02) },
};

const partChip = (label, color) => (
    <Chip label={label} size="small" sx={{
        height: 22, fontSize: '0.72rem', fontWeight: 600, borderRadius: 1.5, maxWidth: '100%',
        bgcolor: alpha(color, 0.12), color, border: `1px solid ${alpha(color, 0.25)}`,
    }} />
);

// The display name inputs read the draft from context, so typing doesn't rebuild the grid's
// columns (which would undo any column resizing).
const DraftContext = createContext(null);

function DisplayNameCell({ comboKey, placeholder }) {
    const { draft, setDraft, errorFor } = useContext(DraftContext);
    const err = errorFor(comboKey);
    return (
        <TextField
            fullWidth size="small"
            value={draft[comboKey] ?? ''}
            placeholder={placeholder}
            onChange={(e) => setDraft(prev => ({ ...prev, [comboKey]: e.target.value }))}
            // Keep typing (space, arrows, etc.) inside the input instead of the grid's keyboard navigation.
            onKeyDown={(e) => { if (e.key !== 'Escape') e.stopPropagation(); }}
            error={Boolean(err)}
            helperText={err || ''}
            slotProps={{ htmlInput: { maxLength: DISPLAY_NAME_MAX + 20 } }}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'background.paper' }, '& .MuiFormHelperText-root': { mx: 0.5 } }}
        />
    );
}

/**
 * Display names for every combination of one source mapping row
 * (source column × version type × map field).
 *
 * combos:     [{ key, column, version, mapping, columnName, defaultName }] — labels already resolved;
 *             columnName is the generated column (e.g. ATTRIBUTE_PRODUCT_ID_CURRENT) and the default name
 * names:      { [key]: displayName } currently saved on the row
 * takenNames: Map of normalised display names used by the other mapping rows → their source table
 * onApply(names) receives { [key]: trimmed name } for every combination.
 */
export default function DisplayNamesDialog({ open, onClose, onApply, sourceTable: sourceTableProp, combos: combosProp, names, takenNames: takenNamesProp }) {
    const theme = useTheme();
    // While closing, the parent no longer has a row: keep showing the last one until the slide-out ends.
    const shown = useRef({ combos: [], sourceTable: '', takenNames: new Map() });
    if (open) shown.current = { combos: combosProp, sourceTable: sourceTableProp, takenNames: takenNamesProp };
    const { combos, sourceTable, takenNames } = shown.current;
    const [draft, setDraft] = useState({});
    const [search, setSearch] = useState('');
    const [submitted, setSubmitted] = useState(false);

    // Fill the names as the modal opens (during render, so it never shows empty or the previous row's names).
    const [wasOpen, setWasOpen] = useState(false);
    if (open !== wasOpen) {
        setWasOpen(open);
        if (open) {
            const initial = {};
            combos.forEach(c => { initial[c.key] = names?.[c.key] || c.defaultName; });
            setDraft(initial);
            setSearch('');
            setSubmitted(false);
        }
    }

    const hasVersion = combos.some(c => c.version);
    const hasMapping = combos.some(c => c.mapping);
    const draftRef = useRef(draft);
    draftRef.current = draft;

    // Error per combination: empty, too long, or used twice (in this row or another row).
    const errors = useMemo(() => {
        const counts = {};
        combos.forEach(c => {
            const n = normalizeDisplayName(draft[c.key]);
            if (n) counts[n] = (counts[n] || 0) + 1;
        });
        const out = {};
        combos.forEach(c => {
            const name = (draft[c.key] ?? '').trim();
            const lower = normalizeDisplayName(name);
            if (!name) out[c.key] = 'Display name is required';
            else if (!DISPLAY_NAME_PATTERN.test(name)) out[c.key] = DISPLAY_NAME_RULE;
            else if (name.length > DISPLAY_NAME_MAX) out[c.key] = `At most ${DISPLAY_NAME_MAX} characters`;
            else if (counts[lower] > 1) out[c.key] = 'Used more than once in this mapping';
            else if (takenNames?.has(lower)) out[c.key] = `Already used in this event (${takenNames.get(lower)} mapping)`;
        });
        return out;
    }, [draft, combos, takenNames]);

    const errorCount = Object.keys(errors).length;
    const query = search.trim().toLowerCase();
    const rows = useMemo(() => {
        const visible = query
            ? combos.filter(c => [c.columnName, c.column, c.version, c.mapping].some(v => v && v.toLowerCase().includes(query)))
            : combos;
        return visible.map(c => ({ ...c, id: c.key, n: combos.indexOf(c) + 1 }));
    }, [combos, query]);

    // "Required" only shows after Apply; the other errors show while typing.
    const errorFor = (key) => {
        const e = errors[key];
        return submitted ? e : (e && e !== 'Display name is required' ? e : '');
    };

    const columns = useMemo(() => {
        const chipCol = (field, headerName, color, width) => ({
            field, headerName, width, minWidth: 110,
            renderCell: ({ value }) => (value ? partChip(value, color) : <Typography sx={{ color: 'text.disabled' }}>—</Typography>),
        });
        return [
            { field: 'n', headerName: '#', width: 64, minWidth: 56, type: 'number', align: 'left', headerAlign: 'left' },
            chipCol('column', 'Source Column', theme.palette.primary.dark, 170),
            ...(hasVersion ? [chipCol('version', 'Version Type', theme.palette.warning.dark, 140)] : []),
            ...(hasMapping ? [chipCol('mapping', 'Map Field', theme.palette.secondary.dark, 170)] : []),
            {
                field: 'columnName', headerName: 'Column Name', width: 290, minWidth: 140,
                renderCell: ({ value }) => (
                    <Typography title={value} sx={{ fontFamily: MONO, fontSize: '0.75rem', fontWeight: 600, color: '#14213d', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {value}
                    </Typography>
                ),
            },
            {
                field: 'displayName', headerName: 'Display Name', flex: 1, minWidth: 240,
                // Sorts by what is typed right now.
                valueGetter: (_value, row) => draftRef.current[row.key] ?? '',
                renderCell: ({ row }) => <DisplayNameCell comboKey={row.key} placeholder={row.defaultName} />,
            },
        ];
    }, [hasVersion, hasMapping, theme]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleApply = () => {
        setSubmitted(true);
        if (errorCount > 0) return;
        const result = {};
        combos.forEach(c => { result[c.key] = draft[c.key].trim().replace(/\s+/g, ' '); });
        onApply(result);
    };

    const resetAll = () => {
        const reset = {};
        combos.forEach(c => { reset[c.key] = c.defaultName; });
        setDraft(reset);
    };


    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="lg"
            fullWidth
            slots={{ transition: Slide }}
            slotProps={{
                transition: { direction: 'up' },
                paper: { sx: { borderRadius: 4, overflow: 'hidden', border: '1px solid', borderColor: 'divider', boxShadow: '0 32px 64px rgba(15,23,42,0.22)' } },
            }}
        >
            <DialogTitle sx={{ p: 0, flexShrink: 0 }}>
                <Box sx={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    px: 3, pt: 3, pb: 2.5,
                    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
                    borderBottom: '1px solid', borderColor: 'divider',
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <img src="/fyntrac.png" alt="Fyntrac" style={{ width: 72, height: 'auto' }} />
                        <Box>
                            <Chip
                                icon={<LabelOutlinedIcon sx={{ fontSize: '12px !important' }} />}
                                label={sourceTable || 'Source Mapping'}
                                size="small"
                                sx={{
                                    height: 20, mb: 1, fontSize: '0.6rem', fontWeight: 700,
                                    letterSpacing: 0.8, textTransform: 'uppercase',
                                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                                    color: theme.palette.primary.main, borderRadius: 1,
                                }}
                            />
                            <Typography variant="h6" fontWeight={700} sx={{ lineHeight: 1.2, color: 'text.primary' }}>
                                Display Names
                            </Typography>
                        </Box>
                    </Box>
                    <Tooltip title="Close" placement="left">
                        <IconButton onClick={onClose} size="small" aria-label="Close" sx={{
                            color: 'text.secondary', bgcolor: 'action.hover', borderRadius: 2,
                            '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.12), color: 'error.main' },
                        }}>
                            <HighlightOffOutlinedIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Box>
            </DialogTitle>

            <DialogContent sx={{ px: 3, pt: '20px !important', pb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2, flexWrap: 'wrap' }}>
                    <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary', flex: 1, minWidth: 240 }}>
                        Name each of the <strong>{combos.length}</strong> combination{combos.length === 1 ? '' : 's'} in this mapping.
                        This is the name shown wherever the value is used.
                    </Typography>
                    <TextField
                        size="small" placeholder="Search combinations…" value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" sx={{ color: 'text.disabled' }} /></InputAdornment> }}
                        sx={{ width: 260, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />
                    <Tooltip title="Set every name back to its default">
                        <Button onClick={resetAll} size="small" startIcon={<RestartAltIcon fontSize="small" />}
                            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, color: 'text.secondary' }}>
                            Reset to defaults
                        </Button>
                    </Tooltip>
                </Box>

                <DraftContext.Provider value={{ draft, setDraft, errorFor }}>
                    <Box sx={{ maxHeight: '55vh', display: 'flex', flexDirection: 'column', border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
                        <DataGrid
                            rows={rows}
                            columns={columns}
                            getRowHeight={() => 'auto'}
                            columnHeaderHeight={44}
                            disableColumnMenu
                            disableColumnFilter
                            disableColumnSelector
                            disableRowSelectionOnClick
                            initialState={{ pagination: { paginationModel: { pageSize: PAGE_SIZE } } }}
                            pageSizeOptions={[PAGE_SIZE]}
                            hideFooter={rows.length <= PAGE_SIZE}
                            localeText={{ noRowsLabel: query ? 'No combinations match your search.' : 'No combinations.' }}
                            sx={GRID_SX}
                        />
                    </Box>
                </DraftContext.Provider>
                {submitted && errorCount > 0 && (
                    <Typography sx={{ mt: 1.25, fontSize: '0.8rem', color: 'error.main', fontWeight: 600 }}>
                        Fix {errorCount} display name{errorCount === 1 ? '' : 's'} before applying.
                    </Typography>
                )}
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
                <Button onClick={handleApply} variant="contained" sx={{
                    borderRadius: 2, textTransform: 'none', fontWeight: 700, px: 2.5,
                    background: '#14213d', color: '#fff',
                    boxShadow: '0 4px 12px rgba(20,33,61,0.28)',
                    '&:hover': { background: '#1e3057', boxShadow: '0 6px 18px rgba(20,33,61,0.4)' },
                }}>
                    Apply Names
                </Button>
            </DialogActions>
        </Dialog>
    );
}
