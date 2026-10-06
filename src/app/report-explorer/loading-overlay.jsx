"use client";

import React, { useEffect, useState } from 'react';
import { alpha, useTheme } from '@mui/material/styles';
import { Box, Typography } from '@mui/material';
import { EASE_CSS, radius, shadow, surface, tint } from './tokens';

// Bar heights of the animated chart (percent of its height).
const BARS = [45, 75, 55, 90, 65];

const formatElapsed = (seconds) => (seconds < 60
  ? `${seconds}s`
  : `${Math.floor(seconds / 60)}m ${String(seconds % 60).padStart(2, '0')}s`);

/**
 * Shown over the report body while a report loads: an animated chart, the elapsed time and the
 * current step of a multi-request load (e.g. "Aug 2026 · REVENUE (3 of 6)").
 * Over existing rows it dims them, so a refresh reads as in progress.
 */
export default function LoadingOverlay({ progress, overRows = false }) {
  const theme = useTheme();
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const started = Date.now();
    const timer = setInterval(() => setElapsed(Math.floor((Date.now() - started) / 1000)), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <Box
      role="status"
      aria-live="polite"
      sx={{
        position: 'absolute',
        inset: 0,
        zIndex: 3,
        display: 'grid',
        placeItems: 'center',
        p: 3,
        bgcolor: alpha(surface.raised, overRows ? 0.72 : 0.9),
        backdropFilter: overRows ? 'blur(1px)' : 'none',
        borderRadius: radius.lg,
        animation: `reportLoadingIn 200ms ${EASE_CSS}`,
        '@keyframes reportLoadingIn': { from: { opacity: 0 }, to: { opacity: 1 } },
      }}
    >
      <Box
        sx={{
          textAlign: 'center',
          px: 4,
          py: 3,
          minWidth: 260,
          maxWidth: 380,
          bgcolor: surface.raised,
          border: `1px solid ${tint(theme, 0.14)}`,
          borderRadius: radius.lg,
          boxShadow: shadow.md,
        }}
      >
        <Box
          aria-hidden
          sx={{
            mx: 'auto',
            mb: 2,
            width: 76,
            height: 52,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            gap: '6px',
            borderBottom: `2px solid ${tint(theme, 0.25)}`,
          }}
        >
          {BARS.map((height, i) => (
            <Box
              key={i}
              sx={{
                width: 10,
                height: `${height}%`,
                borderRadius: '3px 3px 0 0',
                bgcolor: 'primary.main',
                transformOrigin: 'bottom',
                animation: `reportLoadingBar 1.1s ${EASE_CSS} ${i * 0.12}s infinite alternate`,
                '@keyframes reportLoadingBar': {
                  from: { transform: 'scaleY(0.25)', opacity: 0.45 },
                  to: { transform: 'scaleY(1)', opacity: 1 },
                },
                '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
              }}
            />
          ))}
        </Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
          {overRows ? 'Refreshing report…' : 'Loading report…'}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, minHeight: 20 }}>
          {progress || 'Fetching data'}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, fontVariantNumeric: 'tabular-nums' }}>
          {formatElapsed(elapsed)}
          {elapsed >= 20 ? ' · large reports can take a minute or two' : ''}
        </Typography>
      </Box>
    </Box>
  );
}
