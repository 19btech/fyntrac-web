import React, { useState } from 'react';
import { Dialog
  , DialogTitle
  , DialogContent
  , DialogActions
  , Button
  , TextField
  , Checkbox
  , FormControlLabel
  , Autocomplete
  , IconButton
  , Typography
  , Tooltip
  , Box
  , Divider } from '@mui/material';
import HighlightOffOutlinedIcon from '@mui/icons-material/HighlightOffOutlined';
import axios from 'axios';
import SuccessAlert from '../component/success-alert'
import ErrorAlert from '../component/error-alert'
import { useTenant } from "../tenant-context";

const AddAttributeDialog = ({ open, onClose, editData }) => {
  const { tenant } = useTenant();
  const [userField, setUserField] = useState('');
  const [attributeName, setAttributeName] = useState('');
  const [isReclassable, setIsReclassable] = useState(false);
  const [isVersionable, setIsVersionable] = useState(false);
  const [dataType, setDataType] = useState('String');
  const [isNullable, setIsNullable] = useState(false);
  const [id, setId] = useState(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showErrorMessage, setShowErrorMessage] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const dataTypes = [{ label: 'STRING' },
  { label: 'NUMBER' },
  { label: 'DATE' },
  { label: 'BOOLEAN' }];

  const defaultDataTypes = ['STRING',
    'NUMBER',
    'DATE',
    'BOOLEAN'];

  const serviceURL = process.env.NEXT_PUBLIC_SUBLEDGER_SERVICE_URI + '/attribute/add';

  React.useEffect(() => {
    if (editData) {
      // Populate form fields with editData if provided
      setAttributeName(editData.attributeName);
      setUserField(editData.userField);
      setDataType(editData.dataType);
      setIsReclassable(editData.isReclassable === 1 ? true : false);
      setIsVersionable(editData.isVersionable === 1 ? true : false);
      setIsNullable(editData.isNullable === 1 ? true : false);
      setId(editData.id);
    } else {
      // Clear form fields if no editData (e.g., for adding new transaction)
      setUserField('');
      setAttributeName('');
      setIsReclassable(false);
      setIsVersionable(false);
      setIsNullable(false);
      setDataType('STRING');

    }
  }, [editData]);

  const handleAddAttribute = async () => {
    console.log('Tenant...', tenant);
    try {
      const response = await axios.post(serviceURL, {
        userField: userField,
        attributeName: attributeName,
        dataType: dataType,
        isReclassable: isReclassable ? 1 : 0,
        isVersionable: isVersionable ? 1 : 0,
        isNullable: isNullable ? 1 : 0,
        id: id
      },
        {
          headers: {
            'X-Tenant': tenant,
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
            <Typography variant="h6">Attributes</Typography>
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
          label="User Field"
          fullWidth
          value={userField}
          onChange={(e) => setUserField(e.target.value)}
        />
        <TextField
         sx={{ width: '500px' }}
          label="Attribute Name"
          fullWidth
          value={attributeName}
          onChange={(e) => setAttributeName(e.target.value)}
        />

        <Autocomplete
         sx={{ width: '500px' }}
          disablePortal
          id="dataType-combo"
          options={defaultDataTypes}
          value={dataType}
          getOptionLabel={(option) => option}
          onChange={(event, newValue) => { setDataType(newValue) }} // newValue will be the selected option object
          renderInput={(params) => <TextField {...params} label="Data Type" />}
        />

        <FormControlLabel
          control={<Checkbox checked={isReclassable} onChange={(e) => setIsReclassable(e.target.checked)} />}
          label="Reclassable"
        />
        <FormControlLabel
          control={<Checkbox checked={isVersionable} onChange={(e) => setIsVersionable(e.target.checked)} />}
          label="Versionable"
        />
        <FormControlLabel
          control={<Checkbox checked={isNullable} onChange={(e) => setIsNullable(e.target.checked)} />}
          label="Nullable"
        />
      </DialogContent>

      <DialogActions sx={{ justifyContent: "center" }}>
        <Tooltip title='Save'>
        <Button
          onClick={handleAddAttribute}
          sx={{
            bgcolor: '#14213d',
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

export default AddAttributeDialog;
