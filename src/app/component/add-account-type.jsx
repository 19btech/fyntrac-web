import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Autocomplete, Checkbox, FormControlLabel, Divider} from '@mui/material';
import axios from 'axios';
import SuccessAlert from '../component/success-alert'
import ErrorAlert from '../component/error-alert'

const AddAccountTypeDialog = ({ open, onClose, editData }) => {
  const [accountSubType, setAccountSubType] = useState('');
  const [accountType, setAccountType] = useState('');
  const [id, setId] = useState(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showErrorMessage, setShowErrorMessage] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const defaultAccountTypes = ['BALANCESHEET',
  'INCOMESTATEMENT',
  'CLEARING'];


  const serviceURL = process.env.NEXT_PUBLIC_SUBLEDGER_SERVICE_URI + '/accounttype/add';
    
  React.useEffect(() => {
    if (editData) {
      // Populate form fields with editData if provided
      setAccountSubType(editData.accountSubType);
      setAccountType(editData.accountType);
      setId(editData.id);
    } else {
      // Clear form fields if no editData (e.g., for adding new transaction)
      setAccountSubType('');
      setAccountType('BALANCESHEET');
      
    }
  }, [editData]);

  const handleAddAggregation = async () => {
    try {
      const response = await axios.post(serviceURL, {
        accountSubType: accountSubType,
        accountType: accountType,
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
      <DialogTitle>Account Type</DialogTitle>
      <Divider />
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <TextField
          label="Account Subtype"
          fullWidth
          value={accountSubType}
          onChange={(e) => setAccountSubType(e.target.value)}
        />

<Autocomplete
  disablePortal
  id="dataType-combo"
  options={defaultAccountTypes}
  value={accountType}
  getOptionLabel={(option) => option}
  onChange={(event, newValue) => { setAccountType(newValue)}} // newValue will be the selected option object
  renderInput={(params) => <TextField {...params} label="Account Type" />}
/>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button onClick={handleAddAggregation} sx={{ bgcolor: '#62CD14', color: 'white', 
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

export default AddAccountTypeDialog;
