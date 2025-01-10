import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Checkbox, FormControlLabel, Divider} from '@mui/material';
import axios from 'axios';
import SuccessAlert from '../component/success-alert'
import ErrorAlert from '../component/error-alert'

const AddTransactionDialog = ({ open, onClose, editData }) => {
  const [transactionName, setTransactionName] = useState('');
  const [isExclusive, setIsExclusive] = useState(false);
  const [isGL, setIsGL] = useState(false);
  const [id, setId] = useState(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showErrorMessage, setShowErrorMessage] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');



  const serviceURL = process.env.NEXT_PUBLIC_SUBLEDGER_SERVICE_URI + '/transaction/add';
    
  React.useEffect(() => {
    if (editData) {
      // Populate form fields with editData if provided
      setTransactionName(editData.name);
      setIsExclusive(editData.exclusive === 1 ? true : false);
      setIsGL(editData.isGL === 1 ? true : false);
      setId(editData.id);
    } else {
      // Clear form fields if no editData (e.g., for adding new transaction)
      setTransactionName('');
      setIsExclusive(false);
      setIsGL(false);
    }
  }, [editData]);

  const handleAddTransaction = async () => {
    try {
      const response = await axios.post(serviceURL, {
        name: transactionName,
        exclusive: isExclusive ? 1 : 0,
        isGL: isGL ? 1 : 0,
        id: id
      },
      {
      headers: {
        'X-Tenant': process.env.NEXT_PUBLIC_TENANT,
        Accept: '*/*',
        'Postman-Token': '091bd74b-e836-4185-896a-008fd64b4f46',
      }
    }
    );
      setSuccessMessage(response.data);
      setShowSuccessMessage(true);

      setTimeout(() => {
        setShowSuccessMessage(false);
        setShowErrorMessage(false);
        onClose(false);
      }, 3000);
      } catch (error) {
      // Handle error if needed
      setErrorMessage(error);
      setShowErrorMessage(true);

    }
  };

  const handleClose = () => {
    setShowErrorMessage(false);
    setShowSuccessMessage(false);
    onClose(false);
  };
  
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Transaction</DialogTitle>
      <Divider />
      <DialogContent>
        <TextField
          label="Transaction Name"
          fullWidth
          value={transactionName}
          onChange={(e) => setTransactionName(e.target.value)}
        />
        <FormControlLabel
          control={<Checkbox checked={isExclusive} onChange={(e) => setIsExclusive(e.target.checked)} />}
          label="Is Exclusive"
        />
        <FormControlLabel
          control={<Checkbox checked={isGL} onChange={(e) => setIsGL(e.target.checked)} />}
          label="Is GL"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button onClick={handleAddTransaction} sx={{ bgcolor: '#62CD14', color: 'white', 
        '&:hover': {
          color: '#62CD14', // Prevent text color from changing on hover
        }, }}>
          Save
        </Button>
      </DialogActions>
      <Divider />
      <div>
      {showSuccessMessage &&  <SuccessAlert title={'Data saved successfully.'} message={successMessage} onClose={() => setOpen(false)} />}
      {showErrorMessage && <ErrorAlert title={'Error!'} message={errorMessage} onClose={() => setOpen(false)} />}
      </div>
    </Dialog>
  );
};

export default AddTransactionDialog;
