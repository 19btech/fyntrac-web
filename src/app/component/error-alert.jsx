import React from 'react';
import Snackbar from '@mui/material/Snackbar';
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
      open={open}  // Controlled by parent
      autoHideDuration={5000}  // 5 seconds
      onClose={handleClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
    >
      <Alert variant="filled" severity="error" onClose={handleClose}>
        <AlertTitle>{title}</AlertTitle>
        <div style={{ whiteSpace: 'pre-wrap' }}>
          {safeMessage}
        </div>
      </Alert>
    </Snackbar>
  );
}

export default ErrorAlert;
