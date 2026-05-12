import React from 'react';
import Snackbar from '@mui/material/Snackbar';
import Slide from '@mui/material/Slide';
import { Alert, AlertTitle } from '@mui/material';

function ErrorAlert({ title, message, open, onClose }) {
  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    onClose();  // Call the parent's onClose to hide the alert
  };

  // Ensure message is always a string
  const safeMessage = 
    typeof message === 'string'
      ? message
      : JSON.stringify(message, null, 2); // fallback for objects

  return (
    <Snackbar
      open={open}
      autoHideDuration={5000}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      slots={{ transition: Slide }} slotProps={{ transition: { direction: 'left' } }}
    >
      <Alert
        variant="standard"
        severity="error"
        onClose={handleClose}
        sx={{
          borderRadius: 3, fontWeight: 600, fontSize: '0.85rem',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)', minWidth: 280,
          bgcolor: 'rgba(220,38,38,0.10)', color: '#dc2626',
          border: '1px solid rgba(220,38,38,0.3)',
          '& .MuiAlert-icon': { color: '#dc2626' },
        }}
      >
        {title && <AlertTitle>{title}</AlertTitle>}
        <div style={{ whiteSpace: 'pre-wrap' }}>
          {safeMessage}
        </div>
      </Alert>
    </Snackbar>
  );
}

export default ErrorAlert;
