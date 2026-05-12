import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Autocomplete,
  IconButton, Typography, Tooltip, Box,
  Chip, Alert, Slide, Stack,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import HighlightOffOutlinedIcon from '@mui/icons-material/HighlightOffOutlined';
import ListAltOutlinedIcon from '@mui/icons-material/ListAltOutlined';
import { dataloaderApi } from '../services/api-client';
import { useTenant } from "../tenant-context";

const AddChartOfAccountDialog = ({ open, onClose, editData }) => {
  const { tenant } = useTenant();
  const theme = useTheme();
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [accountSubtype, setAccountSubtype] = useState('');
  const [id, setId] = useState(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showErrorMessage, setShowErrorMessage] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [accountSubtypes, setAccountSubtypes] = useState([]);

  const serviceURL = '/chartofaccount/add';
  const sericeGetSubTypeURL = '/accounttype/get/subtypes'

  const [attributeMetadata, setAttributeMetadata] = useState([]);
  const [formValues, setFormValues] = useState({});
  const [formErrors, setFormErrors] = useState({});

  React.useEffect(() => {
    // Fetch attribute metadata from backend on component mount
    fetchAttributeMetadata();
  }, []);

  const fetchAttributeMetadata = () => {
    dataloaderApi.get('/attribute/get/isreclassable/attributes')
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
    if (accountSubtypes.length === 0) {
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

    dataloaderApi.get(sericeGetSubTypeURL)
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
      const response = await dataloaderApi.post(serviceURL, {
        accountName: accountName,
        accountSubtype: accountSubtype,
        accountNumber: accountNumber,
        id: id,
        attributes: formValues,
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

  const isEditMode = !!editData;
  const canSave = accountNumber.trim() && accountName.trim() && accountSubtype;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      slots={{ transition: Slide }}
      slotProps={{ transition: { direction: 'up' } }}
      PaperProps={{
        sx: {
          borderRadius: 4,
          boxShadow: '0 32px 64px rgba(15,23,42,0.18)',
          overflow: 'hidden',
          border: '1px solid',
          borderColor: 'divider',
          fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif',
          '& .MuiTypography-root, & .MuiInputBase-root, & .MuiButton-root, & .MuiChip-root, & .MuiFormHelperText-root': {
            fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif',
          },
        },
      }}
    >
      <DialogTitle sx={{ p: 0, flexShrink: 0 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            px: 3, pt: 3, pb: 2.5,
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <img src="fyntrac.png" alt="Fyntrac" style={{ width: 72, height: 'auto' }} />
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <Chip
                  icon={<ListAltOutlinedIcon sx={{ fontSize: '12px !important' }} />}
                  label="Chart of Accounts"
                  size="small"
                  sx={{
                    height: 20, fontSize: '0.6rem', fontWeight: 700,
                    letterSpacing: 0.8, textTransform: 'uppercase',
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    color: theme.palette.primary.main, borderRadius: 1,
                  }}
                />
                {isEditMode && (
                  <Chip label="Edit Mode" size="small" sx={{
                    height: 20, fontSize: '0.6rem', fontWeight: 700,
                    letterSpacing: 0.8, textTransform: 'uppercase',
                    bgcolor: alpha(theme.palette.warning.main, 0.1),
                    color: theme.palette.warning.dark, borderRadius: 1,
                  }} />
                )}
              </Box>
              <Typography variant="h6" fontWeight={700} sx={{ lineHeight: 1.2, color: 'text.primary' }}>
                {isEditMode ? 'Edit' : 'Add'} Chart of Account
              </Typography>
            </Box>
          </Box>
          <Tooltip title="Close" placement="left">
            <IconButton onClick={handleClose} size="small" sx={{
              color: 'text.secondary', bgcolor: 'action.hover', borderRadius: 2,
              '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.12), color: 'error.main' },
            }}>
              <HighlightOffOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0, bgcolor: alpha(theme.palette.grey[500], 0.03) }}>
        <Box sx={{ px: 3.5, pt: 3, pb: 2.5, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {showSuccessMessage && (
            <Alert severity="success" variant="outlined" sx={{ borderRadius: 2.5, py: 0.5, fontSize: '0.8rem', bgcolor: 'rgba(22,163,74,0.08)', borderColor: 'rgba(22,163,74,0.35)' }}>
              {successMessage || 'Chart of account saved successfully.'}
            </Alert>
          )}
          {showErrorMessage && (
            <Alert severity="error" variant="outlined" sx={{ borderRadius: 2.5, py: 0.5, fontSize: '0.8rem', bgcolor: 'rgba(220,38,38,0.08)', borderColor: 'rgba(220,38,38,0.35)' }}>
              {String(errorMessage) || 'An error occurred.'}
            </Alert>
          )}
          <Stack direction="row" spacing={2}>
            <TextField
              label="Account Number"
              fullWidth required size="small"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              sx={{
                '& .MuiOutlinedInput-root': { borderRadius: 2.5, bgcolor: 'background.paper', fontSize: '0.9rem' },
                '& .MuiInputLabel-root': { fontSize: '0.9rem' },
              }}
            />
            <TextField
              label="Account Name"
              fullWidth required size="small"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              sx={{
                '& .MuiOutlinedInput-root': { borderRadius: 2.5, bgcolor: 'background.paper', fontSize: '0.9rem' },
                '& .MuiInputLabel-root': { fontSize: '0.9rem' },
              }}
            />
          </Stack>
          <Autocomplete
            fullWidth disablePortal
            options={accountSubtypes}
            value={accountSubtype}
            getOptionLabel={(option) => option}
            onChange={(event, newValue) => setAccountSubtype(newValue)}
            renderOption={(props, option) => (
              <Box component="li" {...props} sx={{ fontSize: '0.82rem !important' }}>{option}</Box>
            )}
            renderInput={(params) => (
              <TextField {...params} label="Account Subtype" required size="small"
                sx={{
                  '& .MuiOutlinedInput-root': { borderRadius: 2.5, bgcolor: 'background.paper', fontSize: '0.9rem' },
                  '& .MuiInputLabel-root': { fontSize: '0.9rem' },
                }}
              />
            )}
          />
          {attributeMetadata.length > 0 && (
            <Stack spacing={2}>
              {attributeMetadata.map(attribute => (
                <TextField
                  key={attribute.attributeName}
                  name={attribute.attributeName}
                  label={attribute.attributeName}
                  size="small"
                  type={attribute.dataType === 'Number' ? 'number' : 'text'}
                  value={formValues[attribute.attributeName] ?? ''}
                  onChange={handleInputChange}
                  error={!!formErrors[attribute.attributeName]}
                  helperText={formErrors[attribute.attributeName] || ''}
                  fullWidth
                  sx={{
                    '& .MuiOutlinedInput-root': { borderRadius: 2.5, bgcolor: 'background.paper', fontSize: '0.9rem' },
                    '& .MuiInputLabel-root': { fontSize: '0.9rem' },
                  }}
                />
              ))}
            </Stack>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{
        px: 3.5, py: 2, borderTop: '1px solid', borderColor: 'divider',
        bgcolor: 'background.paper', justifyContent: 'flex-end', gap: 1.25,
      }}>
        <Button onClick={handleClose} variant="text" sx={{
          borderRadius: 2, textTransform: 'none', fontWeight: 600,
          color: 'text.secondary', px: 2.5, '&:hover': { bgcolor: 'action.hover' },
        }}>
          Cancel
        </Button>
        <Button onClick={handleAddChartOfAccount} variant="contained" disabled={!canSave} sx={{
          borderRadius: 2, textTransform: 'none', fontWeight: 700, minWidth: 150, px: 3,
          background: '#14213d', color: '#fff', boxShadow: '0 6px 16px rgba(20,33,61,0.35)',
          '&:hover': { background: '#0d1628', boxShadow: '0 8px 22px rgba(20,33,61,0.45)' },
          '&.Mui-disabled': { background: 'rgba(20,33,61,0.35)', color: '#fff', boxShadow: 'none' },
        }}>
          {isEditMode ? 'Update Account' : 'Save Account'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddChartOfAccountDialog;
