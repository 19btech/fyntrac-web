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
import CustomTabPanel from '../component/custom-tab-panel';
import CircularProgress from '@mui/material/CircularProgress';
import { green } from '@mui/material/colors';
import Fab from '@mui/material/Fab';
import CheckIcon from '@mui/icons-material/Check';
import UpdateIcon from '@mui/icons-material/Update';
import { useTenant } from "../tenant-context";
import EnhancedDataGridTabs from "../component/map-tabs";

const InstrumentDiagnosticPage = () => {
  const { tenant } = useTenant();
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

  // Attribute options
  const [attributeOptions, setAttributeOptions] = useState([]);
  const [reportData, setReportData] = useState([]);
  const [instrumentId, setInstrumentId] = useState('');
  const [models, setModels] = useState([]);
  const [model, setModel] = useState(models.length > 0 ? models[0]._id : "");
  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const timer = React.useRef < ReturnType < typeof setTimeout >> (undefined);
  const [postingDates, setPostingDates] = React.useState([]);
  const [postingDate, setPostingDate] = React.useState('');
  const [diagnosticData, setDiagnosticData] = React.useState({});

     

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
        'X-Tenant': tenant,
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


  const fetchAllPostingDates = () => {
    const fetchPostingDates = `${process.env.NEXT_PUBLIC_REPORTING_SERVICE_URI}/diagnostic/get/event-postingdates`;
    axios.get(fetchPostingDates, {
      headers: {
        'X-Tenant': tenant,
        Accept: '*/*',
        'Postman-Token': '091bd74b-e836-4185-896a-008fd64b4f46',
      }
    })
      .then(response => {
        setPostingDates(response.data);
        console.info('Posting Dates:', response.data);
      })
      .catch(error => {
        console.error('Error fetching posting dates from EventHistory:', error);
      });
  };

  const downloadDiagnostic = () => {
    const downloadFile = `${process.env.NEXT_PUBLIC_REPORTING_SERVICE_URI}/diagnostic/download`;
    console.info('postingDate:', postingDate);
    const diagnosticRequest = {
      tenant: tenant,
      instrumentId: instrumentId,
      modelId: model,
      postingDate: postingDate,
    };

    console.log('Download Request:', diagnosticRequest);

    axios.post(downloadFile, diagnosticRequest, {
      headers: {
        'X-Tenant': tenant,
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
    fetchAllPostingDates();
  }, []); // Empty dependency array means this runs once when the component mounts

  useEffect(() => {
    console.log('reporting attributes:', attributeOptions);
    const header = generateGridColumns(attributeOptions);
    console.log('Header:', header);
  }, [attributeOptions]); // This will log the updated attributeOptions whenever it changes

  const executeReport = () => {
    // Simulate a click anywhere on the page
    document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    console.log('criteriaList:', criteriaList);

    setSuccess(false);
    setLoading(true);

    console.info('postingDate:', postingDate);
    const diagnosticRequest = {
      tenant: tenant,
      instrumentId: instrumentId,
      modelId: model,
      postingDate: postingDate,
    };

    console.log('request:', diagnosticRequest);

    const executeReportAPI = `${process.env.NEXT_PUBLIC_REPORTING_SERVICE_URI}/diagnostic/generate`;

    axios.post(executeReportAPI, diagnosticRequest, {
      headers: {
        'X-Tenant': tenant,
        Accept: '*/*',
      }
    })
      .then(response => {
        const data = response.data;

        setDiagnosticData(data.valueMapList);
        setSuccess(true);
        setLoading(false);

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
                      {/* Map over the sort options Select Modelto create a menu item for each */}
                      {models.map((model) => (
                        <MenuItem key={model.id} value={model.id}>
                          {model.modelName}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid xs={12} sm={3}>
                  <FormControl fullWidth sx={{ m: 1, minWidth: 350 }}>
                    <InputLabel id="sort-by-select-model">Select Posting</InputLabel>
                    <Select
                      labelId="sort-by-select-posting-date"
                      id="sort-by-select-posting-date"
                      value={postingDate}
                      label="Select Posting"
                      size="small"
                      onChange={(e) => setPostingDate(e.target.value)}
                    >
                      {/* Map over the sort options Select Posting Date to create a menu item for each */}
                      {postingDates.map((pdate) => (
                        <MenuItem key={pdate.value} value={pdate.value}>
                          {pdate.label}
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

            <div style={{ padding: '20px' }}>
              <EnhancedDataGridTabs
                data={diagnosticData}
                title="Enterprise Data Manager"
                // onExport={handleExport}
              />
            </div>

          </Box>
        </Box>
      </CustomTabPanel>

    </div>
  );
};


export default InstrumentDiagnosticPage;