import React from 'react';
import Snackbar from '@mui/material/Snackbar';
import {Alert, AlertTitle } from '@mui/material';

function ErrorAlert({title, message}) {
  const [open, setOpen] = React.useState(true);

  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpen(false);
  };

  return (
    <div>
      <Snackbar
        open={open}
        autoHideDuration={5000} // 5 seconds
        onClose={handleClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert variant="filled" severity="error" onClose={handleClose}>
        <AlertTitle>{title}</AlertTitle>
            <div>
                    {message}
                </div>
    </Alert>

      </Snackbar>
    </div>
  );
}

export default ErrorAlert;