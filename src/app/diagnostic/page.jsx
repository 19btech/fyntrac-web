"use client";
import React, { useState, useEffect } from "react";
import {
  Box,
  MenuItem,
  TextField,
  IconButton,
  Divider,
  Stack,
  Tooltip,
  Tabs,
  Tab,
  ReturnType,
  FormControl,
  InputLabel,
  Select,
} from "@mui/material";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import PlayCircleOutlineOutlinedIcon from "@mui/icons-material/PlayCircleOutlineOutlined";
import GridHeader from "../component/gridHeader";
import Grid from "@mui/material/Grid2"; // Import stable Grid2
import axios from 'axios';
import CustomDataGrid from "@/app/component/custom-data-grid";
import CustomTabPanel from '../component/custom-tab-panel';
import CircularProgress from '@mui/material/CircularProgress';
import { green } from '@mui/material/colors';
import Button from '@mui/material/Button';
import Fab from '@mui/material/Fab';
import CheckIcon from '@mui/icons-material/Check';
import SaveIcon from '@mui/icons-material/Save';
import UpdateIcon from '@mui/icons-material/Update';
const InstrumentDiagnosticPage = () => {
  // State to manage the list of criteria
  const [criteriaList, setCriteriaList] = useState([
    {
      attributeName: "",
      operator: "",
      values: "",
      filters: [], // Use filters directly in criteria
      logicalOperator: "AND",
    },
  ]);

  const [showErrorMessage, setShowErrorMessage] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [isAttribuesFetched, setIsAttribuesFetched] = React.useState(false);
  // Attribute options
  const [attributeOptions, setAttributeOptions] = useState([]);
  const [gridHeader, setGridHeader] = useState([]);
  const [reportData, setReportData] = useState([]);
  const [instrumentId, setInstrumentId] = useState('');
  const [models, setModels] = useState([]);
  const [model, setModel] = useState(models.length > 0 ? models[0]._id : "");
  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [transactionActivityHeader, setTransactionActivityHeader] = React.useState([]);
  const [transactionActivityData, setTransactionActivityData] = React.useState([]);
  const timer = React.useRef < ReturnType < typeof setTimeout >> (undefined);
  const [tabOrder, setTabOrder] = React.useState(0);
  const [instrumentAttributeHeader, setInstrumentAttributeHeader] = React.useState([]);
  const [instrumentAttributeData, setInstrumentAttributeData] = React.useState([]);
  const [balancesHeader, setBalancesHeader] = React.useState([]);
  const [balancesData, setBalancesData] = React.useState([]);
  const [executionStateHeader, setExecutionStateHeader] = React.useState([]);
  const [executionStateData, setExecutionStateData] = React.useState([]);
  const buttonSx = {
    ...(success && {
      bgcolor: green[500],
      '&:hover': {
        bgcolor: green[700],
      },
    }),
  };


  const handleButtonClick = () => {
    if (!loading) {
      setSuccess(false);
      setLoading(true);
      timer.current = setTimeout(() => {
        setSuccess(true);
        setLoading(false);
      }, 2000);
    }
  };

  function a11yProps(index) {
    return {
      id: `simple-tab-${index}`,
      'aria-controls': `simple-tabpanel-${index}`,
    };
  }

  const fetchAllModels = () => {
    const fetchModels = `${process.env.NEXT_PUBLIC_SUBLEDGER_SERVICE_URI}/model/get/all`;
    axios.get(fetchModels, {
      headers: {
        'X-Tenant': process.env.NEXT_PUBLIC_TENANT,
        Accept: '*/*',
        'Postman-Token': '091bd74b-e836-4185-896a-008fd64b4f46',
      }
    })
      .then(response => {
        setModels(response.data);
      })
      .catch(error => {
        console.error('Error fetching attributes:', error);
      });
  };

  const downloadDiagnostic = () => {
    const downloadFile = `${process.env.NEXT_PUBLIC_REPORTING_SERVICE_URI}/diagnostic/download`;

    const diagnosticRequest = {
      tenant: process.env.NEXT_PUBLIC_TENANT,
      instrumentId: instrumentId,
      modelId: model,
    };

    console.log('Download Request:', diagnosticRequest);

    axios.post(downloadFile, diagnosticRequest, {
      headers: {
        'X-Tenant': process.env.NEXT_PUBLIC_TENANT,
        Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
      responseType: 'blob' // ✅ required
    })
      .then(response => {
        const url = window.URL.createObjectURL(
          new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
        );

        // Use backend-provided filename, fallback to default
        const disposition = response.headers['content-disposition'];
        let fileName = "report.xlsx";
        if (disposition && disposition.includes("filename=")) {
          fileName = disposition.split("filename=")[1].replace(/"/g, '');
        }

        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();

        // cleanup
        link.remove();
        window.URL.revokeObjectURL(url);
      })
      .catch(error => {
        console.error('Error downloading Excel file:', error);
      });
  };


  useEffect(() => {
    fetchAllModels();
  }, []); // Empty dependency array means this runs once when the component mounts

  useEffect(() => {
    console.log('reporting attributes:', attributeOptions);
    const header = generateGridColumns(attributeOptions);
    setGridHeader(header);
    console.log('Header:', header);
  }, [attributeOptions]); // This will log the updated attributeOptions whenever it changes

  const executeReport = () => {
    // Simulate a click anywhere on the page
    document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    console.log('criteriaList:', criteriaList);

    setSuccess(false);
    setLoading(true);

    const diagnosticRequest = {
      tenant: process.env.NEXT_PUBLIC_TENANT,
      instrumentId: instrumentId,
      modelId: model
    };

    console.log('request:', diagnosticRequest);

    const executeReportAPI = `${process.env.NEXT_PUBLIC_REPORTING_SERVICE_URI}/diagnostic/generate`;

    axios.post(executeReportAPI, diagnosticRequest, {
      headers: {
        'X-Tenant': process.env.NEXT_PUBLIC_TENANT,
        Accept: '*/*',
      }
    })
      .then(response => {
        const data = response.data;

        setReportData(data);
        setSuccess(true);
        setLoading(false);

        // ✅ Safely handle arrays in the response
        setTransactionActivityHeader(generateGridColumns(data.transactionActivityHeader) ?? []);
        setTransactionActivityData(data.transactionActivityData ?? []);

        setInstrumentAttributeHeader(generateGridColumns(data.instrumentAttributeHeader));
        setInstrumentAttributeData(data.instrumentAttributeData);

        setBalancesHeader(generateGridColumns(data.balancesHeader));
        setBalancesData(data.balancesData);

        setExecutionStateHeader(generateGridColumns(data.executionStateHeader));
        setExecutionStateData(data.executionStateData);
        console.log('Header:', data.transactionActivityHeader);
        console.log('Rows:', data.transactionActivityData);
        console.log('Full Response:', data);
      })
      .catch(error => {
        console.error('Error fetching data:', error);
        setErrorMessage(error.message);
        setShowErrorMessage(true);
      });
  };

  useEffect(() => {
    console.log('reporting data:', reportData);
  }, [reportData]); // This will log the updated reportData whenever it changes

  // Execute Filter
  const executeFiler = () => {
    executeReport();
  }

  const handleChange = (index, field, value) => {
    setCriteriaList((prevCriteria) => {
      const newCriteria = [...prevCriteria];
      newCriteria[index][field] = value;
      return newCriteria;
    });
  };

  const handleTabChange = (event, newValue) => {
    setTabOrder(newValue);
  };

  const generateGridColumns = (columnDefs) => {
    return columnDefs.map((col) => ({
      field: col.attributeName, // Use attributeName as the field
      headerName: col.attributeAlias, // Use attributeAlias as the header name
      width: 200, // Set a default width (you can customize this)
      editable: false, // Set editable to false or true based on your requirements
    }));
  };

  return (
    <div>
      <Grid container spacing={3}>
        <Grid size="auto">
          <div className="left">
            <GridHeader>Diagnostic Report</GridHeader>
          </div>
        </Grid>
        <Grid size={6} />
        <Grid size="grow">
          <div className="right">
            <Stack direction="row" spacing={1}>
              <Tooltip title="Execute filter" arrow>
                <IconButton
                  aria-label="execute"
                  onClick={executeFiler}
                  sx={{ "&:hover": { backgroundColor: "darkgrey" } }}
                >
                  <PlayCircleOutlineOutlinedIcon />

                  {loading && (
                    <CircularProgress
                      size={24}
                      sx={{
                        color: green[500],
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        marginTop: '-12px',
                        marginLeft: '-12px',
                        size: 'small',
                      }}
                    />
                  )}


                </IconButton>
              </Tooltip>
              <Tooltip title="Download report data" arrow>
                <IconButton
                  onClick={downloadDiagnostic}
                  aria-label="Download file"
                  sx={{ "&:hover": { backgroundColor: "darkgrey" } }}
                >
                  <FileDownloadOutlinedIcon />
                </IconButton>
              </Tooltip>
            </Stack>
          </div>
        </Grid>
      </Grid>

      <Divider />
      <Box sx={{ width: '100%', borderBottom: 1, borderColor: 'divider', alignItems: 'flex-start', margin: 0, padding: 0 }}>
        <Tabs sx={{ width: '90rem' }} value={0} aria-label="Filter">
          <Tab label="Filter" sx={{ textTransform: 'none' }} />
        </Tabs>
      </Box>

      <CustomTabPanel value={0} index={0}>

        <Box
          display="flex"
          flexDirection="column"
          height="78vh" // Full viewport height
        >
          <Box
            flex="0 0 11%" // First row occupies 30%
            overflow="auto"
          >
            <Box key={1} justifyContent="center" sx={{
              mb: 1, border: 0, p: 1, borderRadius: 1, flexDirection: 'column',
            }} >
              <Grid container spacing={1} alignItems="center" justifyContent="center">
                <Grid xs={12} sm={4} alignItems="center">
                  <TextField
                    fullWidth
                    label="Instrument"
                    value={instrumentId}
                    onChange={(e) => setInstrumentId(e.target.value)}
                    size="small"
                    sx={{ minWidth: 350 }}
                  >

                  </TextField>
                </Grid>

                <Grid xs={12} sm={3}>
                  <FormControl fullWidth sx={{ m: 1, minWidth: 350 }}>
                    <InputLabel id="sort-by-select-model">Select Model</InputLabel>
                    <Select
                      labelId="sort-by-select-model"
                      id="sort-by-select"
                      value={model}
                      label="Select Model"
                      size="small" 
                      onChange={(e) => setModel(e.target.value)}
                    >
                      {/* Map over the sort options to create a menu item for each */}
                      {models.map((model) => (
                        <MenuItem key={model.id} value={model.id}>
                          {model.modelName}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid xs={12} sm={3}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box sx={{ m: 1, position: 'relative' }}>
                      <Fab
                        size='small'
                        aria-label="progress"
                        color="primary"
                        sx={buttonSx}
                        onClick={handleButtonClick}
                      >
                        {success ? <CheckIcon size="small" /> : <UpdateIcon size="small" />}
                      </Fab>
                      {loading && (
                        <CircularProgress

                          size={10}
                          sx={{
                            color: green[500],
                            position: 'absolute',
                            top: -6,
                            left: -6,
                            zIndex: 1,
                          }}
                        />
                      )}
                    </Box>

                  </Box>
                </Grid>
              </Grid>
              <Grid container justifyContent="center" sx={{ mt: 1 }}>
              </Grid>
            </Box>

          </Box>

          <Box
            flex="1" // Third row takes the remaining space
            overflow="auto" // Enable scrolling if content overflows
          >
            <Box>
              <Tabs sx={{ width: '90rem' }} value={tabOrder} onChange={handleTabChange} aria-label="Diagnostic Report">
                <Tab label="Transaction Activity" {...a11yProps(0)} sx={{ textTransform: "none" }} />
                <Tab label="Instrument Attribute History" {...a11yProps(1)} sx={{ textTransform: "none" }} />
                <Tab label="Balances" {...a11yProps(2)} sx={{ textTransform: "none" }} />
                <Tab label="Execution Detail" {...a11yProps(3)} sx={{ textTransform: "none" }} />
              </Tabs>
            </Box>
            <Box>
              <CustomTabPanel value={tabOrder} index={0}>
                <CustomDataGrid
                  columns={transactionActivityHeader ?? []}
                  rows={transactionActivityData ?? []}
                />
              </CustomTabPanel>

              <CustomTabPanel value={tabOrder} index={1}>
                <CustomDataGrid
                  columns={instrumentAttributeHeader ?? []}
                  rows={instrumentAttributeData ?? []}
                />
              </CustomTabPanel>

              <CustomTabPanel value={tabOrder} index={2}>
                <CustomDataGrid
                  columns={balancesHeader ?? []}
                  rows={balancesData ?? []}
                />
              </CustomTabPanel>

              <CustomTabPanel value={tabOrder} index={3}>
                <CustomDataGrid
                  columns={executionStateHeader ?? []}
                  rows={executionStateData ?? []}
                />
              </CustomTabPanel>
            </Box>
          </Box>
        </Box>
      </CustomTabPanel>

    </div>
  );
};


export default InstrumentDiagnosticPage;