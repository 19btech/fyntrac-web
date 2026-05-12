import React from 'react';
import Snackbar from '@mui/material/Snackbar';
import Slide from '@mui/material/Slide';
import { Alert, AlertTitle } from '@mui/material';

function SuccessAlert({ title, message, open, onClose }) {
  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    onClose();  // Call the parent's onClose to hide the alert
  };

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
        severity="success"
        onClose={handleClose}
        sx={{
          borderRadius: 3, fontWeight: 600, fontSize: '0.85rem',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)', minWidth: 280,
          bgcolor: 'rgba(22,163,74,0.12)', color: '#15803d',
          border: '1px solid rgba(22,163,74,0.3)',
          '& .MuiAlert-icon': { color: '#16a34a' },
        }}
      >
        {title && <AlertTitle>{title}</AlertTitle>}
        <div>{message}</div>
      </Alert>
    </Snackbar>
  );
}

export default SuccessAlert;
