import { alpha } from '@mui/material/styles';

/**
 * Visual tokens shared by the Report Explorer so every surface uses the same
 * borders, radii, shadows and motion. Colours derive from the app theme's primary.
 */

export const EASE = [0.4, 0, 0.2, 1];
export const EASE_CSS = 'cubic-bezier(0.4, 0, 0.2, 1)';

export const line = '#E2E8F0';
export const lineStrong = '#CBD5E1';

export const surface = {
  page: '#F8FAFC',
  raised: '#FFFFFF',
  sunken: '#F1F5F9',
};

export const radius = { sm: '6px', md: '8px', lg: '12px' };

export const shadow = {
  xs: '0 1px 2px rgba(15, 23, 42, 0.05)',
  sm: '0 1px 3px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04)',
  md: '0 10px 24px -12px rgba(15, 23, 42, 0.18)',
  lg: '0 18px 40px -16px rgba(15, 23, 42, 0.25)',
};

export const tint = (theme, amount) => alpha(theme.palette.primary.main, amount);

// framer-motion presets
export const fadeUp = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
  transition: { duration: 0.22, ease: EASE },
};

export const staggerChild = (index) => ({
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.2, ease: EASE, delay: Math.min(index, 8) * 0.025 },
});

// CSS enter animations. Used instead of framer-motion `layout` for items inside the
// report view: layout animations measure every element on each render and forced
// full-grid reflows (~200ms per render on large reports).
export const enterPop = {
  animation: `reportPopIn 160ms ${EASE_CSS}`,
  '@keyframes reportPopIn': { from: { opacity: 0, transform: 'scale(0.92)' }, to: { opacity: 1, transform: 'none' } },
};
export const enterSlide = {
  animation: `reportSlideIn 180ms ${EASE_CSS}`,
  '@keyframes reportSlideIn': { from: { opacity: 0, transform: 'translateX(8px)' }, to: { opacity: 1, transform: 'none' } },
};

// Neutralises the global MuiCard/MuiButton hover "lift" for dense, data-heavy UI.
export const noLift = { '&:hover': { transform: 'none' } };
