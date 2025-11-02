import React from 'react';
import Snackbar from '@mui/material/Snackbar';
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
      open={open}  // Controlled by parent
      autoHideDuration={5000}  // 5 seconds
      onClose={handleClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
    >
      <Alert variant="filled" severity="success" onClose={handleClose}>
        <AlertTitle>{title}</AlertTitle>
        <div>{message}</div>
      </Alert>
    </Snackbar>
  );
}

export default SuccessAlert;
