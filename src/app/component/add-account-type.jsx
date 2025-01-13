import React, { useState } from 'react';
import { Dialog
  , DialogTitle
  , DialogContent
  , DialogActions
  , Button
  , TextField
  , Autocomplete
  , IconButton
  , Typography
  , Box
  , Tooltip
  , Divider } from '@mui/material';
import HighlightOffOutlinedIcon from '@mui/icons-material/HighlightOffOutlined';
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

  const handleAccountType = async () => {
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
      <DialogTitle>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'start',
          }}
        >
          {/* Top Left: Image */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',  // Change 'left' to 'flex-start'
              gap: 1,
              width: 'fit-content' // Ensures the Box doesn't take more space than needed
            }}
          >
            <img
              src="fyntrac.png"
              alt="Logo"
              style={{
                width: '100px',
                height: 'auto',  // Maintain aspect ratio
                maxWidth: '100%' // Ensures responsiveness
              }}
            />
            <Typography variant="h6">Account Type</Typography>
          </Box>
          <Tooltip title='Close'>
          <IconButton
            onClick={handleClose}
            edge="end"
            aria-label="close"
            sx={{
              color: 'grey.500',
              '&:hover': { color: 'black' },
            }}
          >
            <HighlightOffOutlinedIcon />
          </IconButton>
          </Tooltip>
        </Box>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <TextField
        sx={{ width: '500px' }} 
          label="Account Subtype"
          fullWidth
          value={accountSubType}
          onChange={(e) => setAccountSubType(e.target.value)}
        />

        <Autocomplete
        sx={{ width: '500px' }} 
          disablePortal
          id="dataType-combo"
          options={defaultAccountTypes}
          value={accountType}
          getOptionLabel={(option) => option}
          onChange={(event, newValue) => { setAccountType(newValue) }} // newValue will be the selected option object
          renderInput={(params) => <TextField {...params} label="Account Type" />}
        />
      </DialogContent>
      <DialogActions sx={{ justifyContent: "center" }}>
        <Tooltip title='Save'>
        <Button
          onClick={handleAccountType}
          sx={{
            bgcolor: '#39B6FF',
            color: 'white',
            '&:hover': {
              color: '#E6E6EF', // Prevent text color from changing on hover
            },
          }}
        >
          Save
        </Button>
        </Tooltip>
      </DialogActions>
      <Divider />
      <div>
        {showSuccessMessage && <SuccessAlert title={'Data saved successfully.'} message={successMessage} onClose={() => setOpen(false)} />}
        {showErrorMessage && <ErrorAlert title={'Error!'} message={errorMessage} onClose={() => setOpen(false)} />}
      </div>
    </Dialog>
  );
};

export default AddAccountTypeDialog;
