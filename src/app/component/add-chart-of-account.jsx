import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,  Divider, Autocomplete} from '@mui/material';
import { List, ListItem, ListItemText } from '@mui/material';
import axios from 'axios';
import SuccessAlert from '../component/success-alert'
import ErrorAlert from '../component/error-alert'
import CircularProgress from '@mui/material/CircularProgress';

function sleep(duration) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, duration);
    });setIsAddAttributeDialogOpen
  }

const AddChartOfAccountDialog = ({ open, onClose, editData }) => {
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [accountSubtype, setAccountSubtype] = useState('');
  const [id, setId] = useState(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showErrorMessage, setShowErrorMessage] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [accountSubtypes, setAccountSubtypes] = useState([]);

  const serviceURL = process.env.NEXT_PUBLIC_SUBLEDGER_SERVICE_URI + '/chartofaccount/add';
  const sericeGetSubTypeURL = process.env.NEXT_PUBLIC_SUBLEDGER_SERVICE_URI + '/accounttype/get/subtypes'
  
  const [attributeMetadata, setAttributeMetadata] = useState([]);
  const [formValues, setFormValues] = useState({});
  const [formErrors, setFormErrors] = useState({});

  React.useEffect(() => {
    // Fetch attribute metadata from backend on component mount
    fetchAttributeMetadata();
  }, []);

  const fetchAttributeMetadata = () => {
    axios.get(process.env.NEXT_PUBLIC_SUBLEDGER_SERVICE_URI + '/attribute/get/isreclassable/attributes', {
      headers: {
        'X-Tenant': process.env.NEXT_PUBLIC_TENANT,
        Accept: '*/*',
        'Postman-Token': '091bd74b-e836-4185-896a-008fd64b4f46',
      }
    })
      .then(response => {
        const metadata = response.data;
        setAttributeMetadata(metadata);
        initializeForm(metadata);
      })
      .catch(error => {
        console.error('Error fetching attribute metadata:', error);
      });
  };

  const initializeForm = (metadata) => {
    const initialFormValues = {};
    metadata.forEach(attribute => {
      initialFormValues[attribute.attributeName] = '';
    });
    setFormValues(initialFormValues);
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormValues({
      ...formValues,
      [name]: value
    });

    // Validate input based on attribute data type
    validateInput(name, value);
  };

  const validateInput = (name, value) => {
    const attribute = attributeMetadata.find(attr => attr.attributeName === name);
    if (attribute) {
      const { dataType } = attribute;
      let isValid = true;

      switch (dataType) {
        case 'String':
          // Example string validation logic
          isValid = typeof value === 'string';
          break;
        case 'Number':
          // Example number validation logic
          isValid = !isNaN(value);
          break;
        case 'Date':
          // Example date validation logic (you can use libraries like moment.js for date validation)
          isValid = !isNaN(Date.parse(value));
          break;
        case 'Boolean':
          // Example boolean validation logic
          isValid = value === 'true' || value === 'false';
          break;
        default:
          isValid = true;
          break;
      }

      // Update form errors based on validation result
      setFormErrors({
        ...formErrors,
        [name]: isValid ? '' : `Invalid ${dataType} value`
      });
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    // Process form submission here, e.g., send data to backend API
   };

  React.useEffect(() => {
    if(accountSubtypes.length === 0) {
        fetchAccountSubtypes();
    }
    if (editData) {
      // Populate form fields with editData if provided
      setAccountName(editData.accountName);
      setAccountNumber(editData.accountNumber);
      setAccountSubtype(editData.accountSubtype);
      setId(editData.id);
      setFormValues(editData.attributes);
    } else {
      // Clear form fields if no editData (eaccountSubtypes.g., for adding new transaction)
      setAccountName('');
      setAccountNumber('');
      setAccountSubtype('');
      
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


  const handleAddChartOfAccount = async () => {
    try {
      const response = await axios.post(serviceURL, {
        accountName: accountName,
        accountSubtype: accountSubtype,
        accountNumber: accountNumber,
        id: id,
        attributes: formValues,
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
    <Dialog open={open} onClose={onClose} sx={{
      '& .MuiDialog-paper': {
        width: '100%', // Set width to 100% (full width)
        maxWidth: '800px', // Optional: Set a specific max-width for the dialog
      },
    }}>
      <DialogTitle>Chart of Accounts</DialogTitle>
      <Divider />
      <DialogContent sx={{ width: '100', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <TextField
          label="Account Number"
          fullWidth
          value={accountNumber}
          onChange={(e) => setAccountNumber(e.target.value)}
        />
        <TextField
          label="Account Name"
          fullWidth
          value={accountName}
          onChange={(e) => setAccountName(e.target.value)}
        />

<Autocomplete
  disablePortal
  id="dataType-combo"
  options={accountSubtypes}
  value={accountSubtype}
  getOptionLabel={(option) => option}
  onChange={(event, newValue) => {setAccountSubtype(newValue)}} // newValue will be the selected option object
  renderInput={(params) => <TextField {...params} label="Account Subtype" />}
/>

{attributeMetadata.map(attribute => (
        <TextField
          key={attribute.attributeName}
          name={attribute.attributeName}
          label={attribute.attributeName}
          type={attribute.dataType === 'Number' ? 'number' : 'text'}
          value={formValues[attribute.attributeName]}
          onChange={handleInputChange}
          error={!!formErrors[attribute.attributeName]}
          helperText={formErrors[attribute.attributeName] || ''}
          fullWidth
          margin="normal"
          variant="outlined"
        />
      ))}
      
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button onClick={handleAddChartOfAccount} sx={{ bgcolor: '#62CD14', color: 'white', 
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

export default AddChartOfAccountDialog;