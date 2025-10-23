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
  , Tooltip
  , Box
  , Divider } from '@mui/material';
import HighlightOffOutlinedIcon from '@mui/icons-material/HighlightOffOutlined';
import axios from 'axios';
import SuccessAlert from '../component/success-alert'
import ErrorAlert from '../component/error-alert'
import { useTenant } from "../tenant-context";

const AddAggregationDialog = ({ open, onClose, editData }) => {
  const { tenant } = useTenant();
  const [transactionName, setTransactionName] = useState('');
  const [metricName, setMetricName] = useState('');
  const [level, setLevel] = useState(false);
  const [id, setId] = useState(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showErrorMessage, setShowErrorMessage] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const defaultLevels = ['ATTRIBUTE',
    'INSTRUMENT',
    'TENANT'
  ];


  const serviceURL = process.env.NEXT_PUBLIC_SUBLEDGER_SERVICE_URI + '/aggregation/add';
  const serviceGetTransactionNamesURL = process.env.NEXT_PUBLIC_SUBLEDGER_SERVICE_URI + '/transaction/get/transactions'
  const [transactionNames, setTransactionNames] = useState([]);

  React.useEffect(() => {
    if (transactionNames.length === 0) {
      fetchTransactionNames();
    }
    if (editData) {
      // Populate form fields with editData if provided
      setTransactionName(editData.transactionName);
      setMetricName(editData.metricName);
      setLevel(editData.level);
      setId(editData.id);
    } else {
      // Clear form fields if no editData (e.g., for adding new transaction)
      setTransactionName('');
      setMetricName('');
      setLevel('ATTRIBUTE');

    }
  }, [editData]);

  const fetchTransactionNames = () => {

    axios.get(serviceGetTransactionNamesURL, {
      headers: {
        'X-Tenant': tenant,
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

  const handleAddAggregation = async () => {
    try {
      const response = await axios.post(serviceURL, {
        transactionName: transactionName,
        metricName: metricName,
        level: level,
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
            <Typography variant="h6">Aggregation</Typography>
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

        <TextField
          sx={{ width: '500px' }}
          label="Metric Name"
          fullWidth
          value={metricName}
          onChange={(e) => setMetricName(e.target.value)}
        />

        <Autocomplete
          sx={{ width: '500px' }}
          disablePortal
          id="dataType-combo"
          options={defaultLevels}
          value={level}
          getOptionLabel={(option) => option}
          onChange={(event, newValue) => { setLevel(newValue) }} // newValue will be the selected option object
          renderInput={(params) => <TextField {...params} label="Aggregation Level" />}
        />
      </DialogContent>
      <DialogActions sx={{ justifyContent: "center" }}>
        <Tooltip title='Save'>
        <Button
          onClick={handleAddAggregation}
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

export default AddAggregationDialog;
