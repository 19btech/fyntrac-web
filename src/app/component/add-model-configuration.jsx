import React, { useState } from 'react';
import axios from 'axios';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  Divider,
  Chip,
  Autocomplete,
  TextField,
  Typography,
  IconButton,
  RadioGroup,
  Radio,
  Checkbox,
} from '@mui/material';
import HighlightOffOutlinedIcon from '@mui/icons-material/HighlightOffOutlined';
import SuccessAlert from '../component/success-alert'
import ErrorAlert from '../component/error-alert'

const AddModelConfiguration = ({ open, onClose, editData }) => {
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showErrorMessage, setShowErrorMessage] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [aggregationLevel, setAggregationLevel] = useState('');



  const [availableTransactions, setAvailableTransactions] = useState([]);
  const [availableMetrics, setAvailableMetrics] = useState([]);
  var fixedTransactions = [];
  var fixedMetrics = [];
  const [transactions, setTransactions] = React.useState([...fixedTransactions]);
  const [metrics, setMetrics] = React.useState([...fixedMetrics]);
  const [currentVersion, setCurrentVersion] = React.useState(false);
  const [lastOpenVersion, setLastOpenVersion] = React.useState(false);
  const [firstVersion, setFirstVersion] = React.useState(false);

  const [attributeVersions, setAttributeVersions] = useState({
    currentOpen: false,
    lastOpen: false,
    firstVersion: false,
  });

  const serviceGetTransactionNamesURL = process.env.NEXT_PUBLIC_SUBLEDGER_SERVICE_URI + '/transaction/get/transactionNames'
  const serviceGetMetricsURL = process.env.NEXT_PUBLIC_SUBLEDGER_SERVICE_URI + '/aggregation/get/metrics'

  React.useEffect(() => {
    if (availableTransactions.length === 0) {
      fetchTransactionNames();
    }

    if (availableMetrics.length === 0) {
      fetchMetricNames();
    }
    if (editData) {
      console.log('Model Config:', editData);
      setTransactions(editData.modelConfig.transactions);
      setMetrics(editData.modelConfig.metrics);
      setCurrentVersion(editData.modelConfig.currentVersion);
      setLastOpenVersion(editData.modelConfig.lastOpenVersion);
      setFirstVersion(editData.modelConfig.firstVersion);
      setAggregationLevel(editData.modelConfig.aggregationLevel);
    } else {
      setTransactions([]);
      setMetrics([]);
      setCurrentVersion(false);
      setLastOpenVersion(false);
      setFirstVersion(false);
      setAggregationLevel('');


    }
  }, [editData]);

  const fetchMetricNames = () => {

    axios.get(serviceGetMetricsURL, {
      headers: {
        'X-Tenant': process.env.NEXT_PUBLIC_TENANT,
        Accept: '*/*',
        'Postman-Token': '091bd74b-e836-4185-896a-008fd64b4f46',
      }
    })
      .then(response => {
        console.log('Metrics:', response.data);
        setAvailableMetrics(response.data);
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
        console.log('Transactions:', response.data);
        setAvailableTransactions(response.data);
      })
      .catch(error => {
        // Handle error if needed
      });
  };


  const handleClose = () => {
    setShowErrorMessage(false);
    setShowSuccessMessage(false);
    onClose(false);
  };

  const handleAggregationLevelChange = (event) => {
    setAggregationLevel(event.target.value);
  };


  const handleCurrentOpenVersionChange = (event) => {
    const { name, checked } = event.target;
    if (checked) {
      setCurrentVersion(true);
    } else {
      setCurrentVersion(false);
    }

  };

  const handleLastOpenVersionChange = (event) => {
    const { name, checked } = event.target;
    if (checked) {
      setLastOpenVersion(true);
    } else {
      setLastOpenVersion(false);
    }

  };

  const handleFirstVersionChange = (event) => {
    const { name, checked } = event.target;
    if (checked) {
      setFirstVersion(true);
    } else {
      setFirstVersion(false);
    }

  };
  const handleSaveConfiguration = async () => {
    const serviceURL = process.env.NEXT_PUBLIC_SUBLEDGER_SERVICE_URI + '/model/save';
    console.log('Selected Transactions:', transactions);
    console.log('Selected Metrics:', metrics);
    try {
      const model = {
        "id": editData.id,
        "orderId": editData.orderId,
        "modelName": editData.modelName,
        "uploadDate": editData.uploadDate,
        "uploadStatus": editData.uploadStatus,
        "modelStatus": editData.modelStatus === 'CONFIGURE' ? 'INACTIVE' : editData.modelStatus,
        "uploadedBy": editData.uploadedBy,
        "isDeleted": editData.isDeleted,
        "lastModifiedDate": editData.lastModifiedDate,
        "modifiedBy": editData.modifiedBy,
        "modelConfig": {
          "transactions": transactions,
          "metrics": metrics,
          "aggregationLevel": aggregationLevel,
          "currentVersion": currentVersion,
          "lastOpenVersion": lastOpenVersion,
          "firstVersion": firstVersion
        },
        "modelFileId": editData.modelFileId
      };
      console.log('Model to Save:', model);
      const response = await axios.post(serviceURL, model,
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
  }

  return (
    <Dialog sx={{
      '& .MuiDialog-paper': {
        width: '600px', // Set the width
      },
    }} open={open} onClose={onClose}>
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
            <Typography variant="h6">Model Configuration</Typography>
          </Box>
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
        </Box>
      </DialogTitle>
      <Divider />
      <DialogContent>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'left',
            flexDirection: 'column',
            gap: 1,
          }}
        >
          {/* Left Side: Available Transactions */}
          {/*<InputLabel>Select Transactions</InputLabel> */}
          <Autocomplete
            multiple
            id="model-configuration-transactions"
            value={transactions}
            onChange={(event, newValue) => {
              setTransactions([
                ...fixedTransactions,
                ...newValue.filter((option) => !fixedTransactions.includes(option)),
              ]);
            }}
            options={availableTransactions}
            isOptionEqualToValue={(option, value) => option.transactionName === value.transactionName}
            getOptionLabel={(option) => option.transactionName}
            renderTags={(tagValue, getTagProps) =>
              tagValue.map((option, index) => {
                const { key, ...tagProps } = getTagProps({ index });
                return (
                  <Chip
                    key={key}
                    label={option.transactionName}
                    {...tagProps}
                    disabled={fixedTransactions.includes(option)}
                  />
                );
              })
            }
            style={{ width: 500 }}
            renderInput={(params) => (
              <TextField {...params} label="Transactions" placeholder="Select Transactions" />
            )}
          />
          <Typography style={{ align: 'left', alignContent: 'left', fontSize: '12px', color: 'gray' }}>
            Define the Transactions to be included in model.
          </Typography>
          <Autocomplete
            multiple
            id="model-configuration-metrics"
            value={metrics}
            onChange={(event, newValue) => {
              setMetrics([
                ...fixedMetrics,
                ...newValue.filter((option) => !fixedMetrics.includes(option)),
              ]);
            }}
            options={availableMetrics}
            getOptionLabel={(option) => option.metricName}
            isOptionEqualToValue={(option, value) => option.metricName === value.metricName}
            renderTags={(tagValue, getTagProps) =>
              tagValue.map((option, index) => {
                const { key, ...tagProps } = getTagProps({ index });
                return (
                  <Chip
                    key={key}
                    label={option.metricName}
                    {...tagProps}
                    disabled={fixedMetrics.includes(option)}
                  />
                );
              })
            }
            style={{ width: 500 }}
            renderInput={(params) => (
              <TextField {...params} label="Metrics" placeholder="Select Metrics" />
            )}
          />
          <Typography style={{ align: 'left', alignContent: 'left', fontSize: '12px', color: 'gray' }}>
            Define the Aggregation Metrics to be included in model.
          </Typography>
        </Box>
        <Divider sx={{ marginTop: 3, marginBottom: 2 }} />
        <Box sx={{
          display: 'flex',
          alignItems: 'left',
          flexDirection: 'column',
          gap: 1,
        }}>

          <Typography variant="h8" sx={{ alignItems: 'left', alignContent: 'left' }}>
            Aggregation Level
          </Typography>
          <RadioGroup
            row
            aria-labelledby="aggregation-level"
            name="aggregation-level-radio-buttons-group"
            value={aggregationLevel}
            onChange={handleAggregationLevelChange}
          >
            <Box sx={{ display: 'flex', alignItems: 'left', }}>
              <Radio value="INSTRUMENT" />
              <Typography>Instrument</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'left', }}>
              <Radio value="ATTRIBUTE" />
              <Typography>Attribute</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'left', }}>
              <Radio value="TENANT" />
              <Typography>Tenant</Typography>
            </Box>
          </RadioGroup>
          <Typography style={{ align: 'left', alignContent: 'left', fontSize: '12px', color: 'gray' }}>
            Define granuality of Aggregation Metrics iteration to be within model.
          </Typography>
        </Box>

        <Divider sx={{ marginTop: 3, marginBottom: 2 }} />

        <Box>
          {/* Combined Label */}
          <Typography variant="h8" sx={{ marginBottom: 2 }}>
            Attribute Version
          </Typography>
          {/* All Checkboxes in a Single Row */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Checkbox
                name="currentOpen"
                checked={currentVersion}
                onChange={handleCurrentOpenVersionChange}
              />
              <Typography>Current Open</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Checkbox
                name="lastOpen"
                checked={lastOpenVersion}
                onChange={handleLastOpenVersionChange}
              />
              <Typography>Last Open</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Checkbox
                name="firstVersion"
                checked={firstVersion}
                onChange={handleFirstVersionChange}
              />
              <Typography>First Version</Typography>
            </Box>
          </Box>
          <Typography style={{ align: 'left', alignContent: 'left', fontSize: '12px', color: 'gray' }}>
            Select Attribute Version(s) to use in model.
          </Typography>
        </Box>
        <Divider sx={{ marginTop: 3, marginBottom: 2 }} />
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          flexDirection: 'column',
          gap: 1,
        }} >
          <Button onClick={handleSaveConfiguration} sx={{
              bgcolor: '#39B6FF',
              color: 'white',
              '&:hover': {
                color: '#E6E6EF', // Prevent text color from changing on hover
              },
            }}>
            Save Configuration
          </Button>
        </Box>
      </DialogContent>
      <div>
        {showSuccessMessage && <SuccessAlert title={'Data saved successfully.'} message={successMessage} onClose={() => onClose(false)} />}
        {showErrorMessage && <ErrorAlert title={'Error!'} message={errorMessage} onClose={() => onClose(false)} />}
      </div>
    </Dialog>
  );
};

export default AddModelConfiguration;
