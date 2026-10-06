"use client";

import React from 'react';
import { Alert, Slide, Snackbar } from '@mui/material';

// The application's toast (as on the Diagnostic / report pages): top-right, slides in,
// tinted green for success and red for errors. Info uses the same treatment in the primary tint.
const TONES = {
  success: { bg: 'rgba(22,163,74,0.12)', border: 'rgba(22,163,74,0.3)', color: '#15803d', icon: '#16a34a' },
  error: { bg: 'rgba(220,38,38,0.10)', border: 'rgba(220,38,38,0.3)', color: '#dc2626', icon: '#dc2626' },
  info: { bg: 'rgba(99,102,241,0.10)', border: 'rgba(99,102,241,0.3)', color: '#4338CA', icon: '#6366F1' },
};

export default function AppToast({ toast, onClose }) {
  const tone = TONES[toast.severity] ?? TONES.success;
  const handleClose = (_, reason) => {
    if (reason === 'clickaway') return;
    onClose();
  };
  return (
    <Snackbar
      open={toast.open}
      autoHideDuration={4000}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      sx={{ top: '55px', '@media (min-width:600px)': { top: '55px' } }}
      slots={{ transition: Slide }}
      slotProps={{ transition: { direction: 'left' } }}
    >
      <Alert
        onClose={handleClose}
        severity={toast.severity}
        variant="standard"
        sx={{
          borderRadius: 3,
          fontWeight: 600,
          fontSize: '0.85rem',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          minWidth: 280,
          bgcolor: tone.bg,
          border: `1px solid ${tone.border}`,
          color: tone.color,
          '& .MuiAlert-icon': { color: tone.icon },
        }}
      >
        {toast.message}
      </Alert>
    </Snackbar>
  );
}
