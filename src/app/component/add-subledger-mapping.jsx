import React, { use, useState } from 'react';
import {
  Dialog
  , DialogTitle
  , DialogContent
  , DialogActions
  , Button
  , TextField
  , Autocomplete
  , IconButton
  , Typography
  , Tooltip
  , Box
  , Divider
} from '@mui/material';
import HighlightOffOutlinedIcon from '@mui/icons-material/HighlightOffOutlined';
import axios from 'axios';
import SuccessAlert from '../component/success-alert'
import ErrorAlert from '../component/error-alert'


function sleep(duration) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, duration);
  });
}

const AddSubledgerMappingDialog = ({ open, onClose, editData }) => {
  const [transactionName, setTransactionName] = useState('');
  const [sign, setSign] = useState('');
  const [entryType, setEntryType] = useState('');
  const [accountSubType, setAccountSubType] = useState('');
  const [id, setId] = useState(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showErrorMessage, setShowErrorMessage] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [accountSubtypes, setAccountSubtypes] = useState([]);
  const [transactionNames, setTransactionNames] = useState([]);
  const [signs, setSigns] = useState(['AMOUNT < 0', 'AMOUNT > 0']);
  const [entryTypes, setEntryTypes] = useState(['DEBIT', 'CREDIT']);

  const serviceURL = process.env.NEXT_PUBLIC_SUBLEDGER_SERVICE_URI + '/subledgermapping/add';
  const sericeGetSubTypeURL = process.env.NEXT_PUBLIC_SUBLEDGER_SERVICE_URI + '/accounttype/get/subtypes'
  const serviceGetTransactionNamesURL = process.env.NEXT_PUBLIC_SUBLEDGER_SERVICE_URI + '/transaction/get/transactions'

  React.useEffect(() => {
    if (accountSubtypes.length === 0) {
      fetchAccountSubtypes();
    }

    if (transactionNames.length === 0) {
      fetchTransactionNames();
    }

    if (editData) {
      // Populate form fields with editData if provided
      setTransactionName(editData.transactionName);
      setSign(editData.sign);
      setEntryType(editData.entryType);
      setAccountSubType(editData.accountSubType);
      setId(editData.id);
    } else {
      // Clear form fields if no editData (eaccountSubtypes.g., for adding new transaction)
      setTransactionName('');
      setSign('');
      setEntryType('');
      setAccountSubType('');
    }
  }, [editData]);

  const fetchAccountSubtypes = () => {

    axios.get(sericeGetSubTypeURL, {
      headers: {
        'X-Tenant': process.env.NEXT_PUBLIC_TENANT,
        Accept: '*/*',
        'Postman-Token': '091bd74b-e836-4185-896a-008fd64b4f46',
      }
    })
      .then(response => {
        setAccountSubtypes(response.data);
        // Handle success response if needed
      })
      .catch(error => {
        // Handle error if needed
      });
  };

  const fetchTransactionNames = () => {

    axios.get(serviceGetTransactionNamesURL, {
      headers: {
        'X-Tenant': process.env.NEXT_PUBLIC_TENANT,
        Accept: '*/*',
        'Postman-Token': '091bd74b-e836-4185-896a-008fd64b4f46',
      }
    })
      .then(response => {
        setTransactionNames(response.data);
      })
      .catch(error => {
        // Handle error if needed
      });
  };

  const handleAddSubledgerMapping = async () => {
    try {
      const response = await axios.post(serviceURL, {
        transactionName: transactionName,
        sign: sign,
        entryType: entryType,
        accountSubType: accountSubType,
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
            <Typography variant="h6">Subledger Mapping</Typography>
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
      <DialogContent sx={{ display: 'flex',  flexDirection: 'column', gap: '16px' }}>
        <Autocomplete
        sx={{ width: '500px' }}
          disablePortal
          id="transactionName"
          options={transactionNames}
          value={transactionName}
          getOptionLabel={(option) => option}
          onChange={(event, newValue) => { setTransactionName(newValue) }} // newValue will be the selected option object
          renderInput={(params) => <TextField {...params} label="Transaction Name" />}
        />

        <Autocomplete
        sx={{ width: '500px' }}
          disablePortal
          id="Criteria"
          options={signs}
          value={sign}
          getOptionLabel={(option) => option}
          onChange={(event, newValue) => { setSign(newValue) }} // newValue will be the selected option object
          renderInput={(params) => <TextField {...params} label="Criteria" />}
        />

        <Autocomplete
        sx={{ width: '500px' }}
          disablePortal
          id="entryType"
          options={entryTypes}
          value={entryType}
          getOptionLabel={(option) => option}
          onChange={(event, newValue) => { setEntryType(newValue) }} // newValue will be the selected option object
          renderInput={(params) => <TextField {...params} label="Entry Type" />}
        />

        <Autocomplete
        sx={{ width: '500px' }}
          disablePortal
          id="dataType-combo"
          options={accountSubtypes}
          value={accountSubType}
          getOptionLabel={(option) => option}
          onChange={(event, newValue) => { setAccountSubType(newValue) }} // newValue will be the selected option object
          renderInput={(params) => <TextField {...params} label="Account Subtype" />}
        />

      </DialogContent>
      <DialogActions sx={{ justifyContent: "center" }}>
        <Tooltip title='Save'>
          <Button
            onClick={handleAddSubledgerMapping}
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

export default AddSubledgerMappingDialog;