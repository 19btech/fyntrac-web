import * as React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';

export default function ConfirmationDialog({ dialogTitle, dialogDescription, open, onClose, action}) {

  return (
    <React.Fragment>
      <Dialog sx={{
      '& .MuiDialog-paper': {
        width: '100%', // Set width to 100% (full width)
        maxWidth: '800px', // Optional: Set a specific max-width for the dialog
      },
    }}
        open={open}
        onClose={onClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {dialogTitle}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            {dialogDescription}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>No</Button>
          <Button onClick={action} autoFocus sx={{ bgcolor: '#62CD14', color: 'white', 
        '&:hover': {
          color: '#62CD14', // Prevent text color from changing on hover
        }, }}>
            Yes
          </Button>
        </DialogActions>
      </Dialog>
    </React.Fragment>
  );
}
