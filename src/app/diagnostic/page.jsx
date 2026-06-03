"use client";
import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  MenuItem,
  TextField,
  IconButton,
  Divider,
  Tooltip,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  Snackbar,
  Alert,
  Slide,
  Typography,
  Popover,
  List,
  ListItemButton,
  ListItemText,
  InputAdornment,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import SearchIcon from "@mui/icons-material/Search";
import HighlightOffOutlinedIcon from "@mui/icons-material/HighlightOffOutlined";
import PlayCircleOutlineOutlinedIcon from "@mui/icons-material/PlayCircleOutlineOutlined";
import Grid from "@mui/material/Grid"; 
import { dataloaderApi, reportingApi } from '../services/api-client';
import CustomTabPanel from '../component/custom-tab-panel';
import CircularProgress from '@mui/material/CircularProgress';
import { green } from '@mui/material/colors';
import Fab from '@mui/material/Fab';
import CheckIcon from '@mui/icons-material/Check';
import UpdateIcon from '@mui/icons-material/Update';
import { useTenant } from "../tenant-context";
import EnhancedDataGridTabs from "../component/map-tabs";

const InstrumentDiagnosticPage = () => {
  const theme = useTheme();
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
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });
  const showToast = (message, severity = 'success') => setToast({ open: true, message, severity });
  const handleToastClose = (_, reason) => { if (reason === 'clickaway') return; setToast(p => ({ ...p, open: false })); };

  // Attribute options
  const [attributeOptions, setAttributeOptions] = useState([]);
  const [reportData, setReportData] = useState([]);
  const [instrumentId, setInstrumentId] = useState('');
  const [models, setModels] = useState([]);
  const [model, setModel] = useState(models.length > 0 ? models[0]._id : "");
  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const timer = React.useRef(undefined);
  const [postingDates, setPostingDates] = React.useState([]);
  const [postingDate, setPostingDate] = React.useState('');
  const [diagnosticData, setDiagnosticData] = React.useState({});
  const [datepickerAnchor, setDatepickerAnchor] = React.useState(null);
  const [datepickerSearch, setDatepickerSearch] = React.useState('');
  const [modelpickerAnchor, setModelpickerAnchor] = React.useState(null);
  const [modelpickerSearch, setModelpickerSearch] = React.useState('');

  const filteredPostingDates = postingDates.filter(d =>
    d.label.toLowerCase().includes(datepickerSearch.toLowerCase())
  );
  const filteredModels = models.filter(m =>
    m.modelName.toLowerCase().includes(modelpickerSearch.toLowerCase())
  );



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
    const fetchModels = `/model/get/all`;
    dataloaderApi.get(fetchModels)
      .then(response => {
        setModels(response.data);
      })
      .catch(error => {
        console.error('Error fetching attributes:', error);
      });
  };


  const fetchAllPostingDates = () => {
    const fetchPostingDates = `/diagnostic/get/event-postingdates`;
    reportingApi.get(fetchPostingDates)
      .then(response => {
        setPostingDates(response.data);
        console.info('Posting Dates:', response.data);
      })
      .catch(error => {
        console.error('Error fetching posting dates from EventHistory:', error);
      });
  };

  const downloadDiagnostic = () => {
    const downloadFile = `/diagnostic/download`;
    console.info('postingDate:', postingDate);
    const diagnosticRequest = {
      tenant: tenant,
      instrumentId: instrumentId,
      modelId: model,
      postingDate: postingDate,
    };

    console.log('Download Request:', diagnosticRequest);

    reportingApi.post(downloadFile, diagnosticRequest, {
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
        showToast('Diagnostic file downloaded successfully.');
      })
      .catch(error => {
        console.error('Error downloading Excel file:', error);
        showToast('Failed to download diagnostic file.', 'error');
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

    const executeReportAPI = `/diagnostic/generate`;

    reportingApi.post(executeReportAPI, diagnosticRequest)
      .then(response => {
        const data = response.data;

        setDiagnosticData(data.valueMapList);
        setSuccess(true);
        setLoading(false);
        console.log('Full Response:', data);
        showToast('Diagnostic report loaded successfully.');
      })
      .catch(error => {
        console.error('Error fetching data:', error);
        setErrorMessage(error.message);
        setShowErrorMessage(true);
        setLoading(false);
        showToast('Failed to run diagnostic. Please check your filters.', 'error');
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
    return columnDefs
      .filter((col) => !col.attributeName?.startsWith('_'))
      .map((col) => ({
        field: col.attributeName,
        headerName: col.attributeAlias,
        width: 200,
        editable: false,
      }));
  };

  return (
    <Box sx={{ bgcolor: alpha(theme.palette.grey[50], 0.5), minHeight: '100vh', pb: 1 }}>
      <Container maxWidth={false} sx={{ py: 1, px: 2 }}>

        {/* Header Section */}
        <Box sx={{
          p: 1.5,
          borderBottom: '1.5px solid',
          borderColor: (t) => alpha(t.palette.divider, 0.2),
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { sm: 'center' },
          gap: 2,
          mb: 4,
        }}>
          <Box>
            <Typography variant="h5" fontWeight={600} color="text.primary" sx={{ letterSpacing: '-0.5px' }}>
              Diagnostic Report
            </Typography>
          </Box>
          <Divider />
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Execute filter" arrow>
              <IconButton
                aria-label="execute"
                onClick={executeFiler}
                sx={{ bgcolor: 'rgba(22,163,74,0.1)', border: '1px solid rgba(21,128,61,0.35)', color: '#16a34a', boxShadow: 1, transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', '&:hover': { bgcolor: 'rgba(22,163,74,0.2)', borderColor: '#15803d', boxShadow: 3, transform: 'scale(1.08)' }, '&:active': { transform: 'scale(0.94)' } }}
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
                    }}
                  />
                )}
              </IconButton>
            </Tooltip>
            <Tooltip title="Download Diagnostic" arrow>
              <IconButton
                onClick={downloadDiagnostic}
                aria-label="Download file"
                sx={{ bgcolor: 'white', boxShadow: 1, transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', '&:hover': { bgcolor: 'grey.50', boxShadow: 3, transform: 'scale(1.08)' }, '&:active': { transform: 'scale(0.94)' } }}
              >
                <FileDownloadOutlinedIcon color="action" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
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
            overflow="fit-content"
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
                    sx={{ minWidth: 350, '& .MuiInputLabel-root:not(.MuiInputLabel-shrink)': { fontSize: '0.875rem' } }}
                  />
                </Grid>

                <Grid xs={12} sm={3}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Select Model"
                    value={model ? (models.find(m => m.id === model)?.modelName || model) : ''}
                    onClick={(e) => { setModelpickerAnchor(e.currentTarget); setModelpickerSearch(''); }}
                    inputProps={{ readOnly: true, style: { cursor: 'pointer' } }}
                    sx={{ m: 1, minWidth: 350 }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon fontSize="small" sx={{ color: 'text.disabled' }} />
                        </InputAdornment>
                      ),
                      endAdornment: model ? (
                        <InputAdornment position="end">
                          <IconButton
                            size="small"
                            onClick={(e) => { e.stopPropagation(); setModel(''); }}
                            sx={{ color: 'text.disabled', '&:hover': { color: 'error.main' } }}
                          >
                            <HighlightOffOutlinedIcon sx={{ fontSize: '0.95rem' }} />
                          </IconButton>
                        </InputAdornment>
                      ) : null,
                    }}
                  />
                </Grid>

                <Popover
                  open={Boolean(modelpickerAnchor)}
                  anchorEl={modelpickerAnchor}
                  onClose={() => setModelpickerAnchor(null)}
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                  transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                  slotProps={{
                    paper: {
                      sx: {
                        mt: 0.75,
                        width: 350,
                        borderRadius: 3,
                        boxShadow: '0 8px 32px rgba(15,23,42,0.16)',
                        border: '1px solid', borderColor: 'divider',
                        overflow: 'hidden',
                      },
                    },
                  }}
                >
                  <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: alpha(theme.palette.divider, 0.6) }}>
                    <TextField
                      autoFocus
                      fullWidth
                      size="small"
                      placeholder="Search models..."
                      value={modelpickerSearch}
                      onChange={(e) => setModelpickerSearch(e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon fontSize="small" sx={{ color: 'text.disabled' }} />
                          </InputAdornment>
                        ),
                      }}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />
                  </Box>
                  <List dense disablePadding sx={{ maxHeight: 280, overflow: 'auto' }}>
                    {filteredModels.length === 0 ? (
                      <ListItemButton disabled sx={{ justifyContent: 'center', py: 2.5 }}>
                        <Typography variant="caption" color="text.disabled">No models found.</Typography>
                      </ListItemButton>
                    ) : filteredModels.map((m) => (
                      <ListItemButton
                        key={m.id}
                        selected={m.id === model}
                        onClick={() => { setModel(m.id); setModelpickerAnchor(null); }}
                        sx={{
                          py: 1, px: 2,
                          '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.06) },
                          '&.Mui-selected': { bgcolor: alpha(theme.palette.primary.main, 0.1) },
                        }}
                      >
                        <ListItemText
                          primary={m.modelName}
                          primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: 500 }}
                        />
                      </ListItemButton>
                    ))}
                  </List>
                </Popover>

                <Grid xs={12} sm={3}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Select Posting Date"
                    value={postingDate ? (postingDates.find(d => d.value === postingDate)?.label || postingDate) : ''}
                    onClick={(e) => { setDatepickerAnchor(e.currentTarget); setDatepickerSearch(''); }}
                    inputProps={{ readOnly: true, style: { cursor: 'pointer' } }}
                    sx={{ m: 1, minWidth: 350 }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon fontSize="small" sx={{ color: 'text.disabled' }} />
                        </InputAdornment>
                      ),
                      endAdornment: postingDate ? (
                        <InputAdornment position="end">
                          <IconButton
                            size="small"
                            onClick={(e) => { e.stopPropagation(); setPostingDate(''); }}
                            sx={{ color: 'text.disabled', '&:hover': { color: 'error.main' } }}
                          >
                            <HighlightOffOutlinedIcon sx={{ fontSize: '0.95rem' }} />
                          </IconButton>
                        </InputAdornment>
                      ) : null,
                    }}
                  />
                </Grid>

                <Popover
                  open={Boolean(datepickerAnchor)}
                  anchorEl={datepickerAnchor}
                  onClose={() => setDatepickerAnchor(null)}
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                  transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                  slotProps={{
                    paper: {
                      sx: {
                        mt: 0.75,
                        width: 350,
                        borderRadius: 3,
                        boxShadow: '0 8px 32px rgba(15,23,42,0.16)',
                        border: '1px solid', borderColor: 'divider',
                        overflow: 'hidden',
                      },
                    },
                  }}
                >
                  <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: alpha(theme.palette.divider, 0.6) }}>
                    <TextField
                      autoFocus
                      fullWidth
                      size="small"
                      placeholder="Search dates..."
                      value={datepickerSearch}
                      onChange={(e) => setDatepickerSearch(e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon fontSize="small" sx={{ color: 'text.disabled' }} />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Box>
                  <List dense disablePadding sx={{ maxHeight: 280, overflow: 'auto' }}>
                    {filteredPostingDates.length === 0 ? (
                      <ListItemButton disabled sx={{ justifyContent: 'center', py: 2.5 }}>
                        <Typography variant="caption" color="text.disabled">No dates found.</Typography>
                      </ListItemButton>
                    ) : filteredPostingDates.map((pdate) => (
                      <ListItemButton
                        key={pdate.value}
                        selected={pdate.value === postingDate}
                        onClick={() => { setPostingDate(pdate.value); setDatepickerAnchor(null); }}
                        sx={{
                          py: 1, px: 2,
                          '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.06) },
                          '&.Mui-selected': { bgcolor: alpha(theme.palette.primary.main, 0.1) },
                        }}
                      >
                        <ListItemText
                          primary={pdate.label}
                          primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: 500 }}
                        />
                      </ListItemButton>
                    ))}
                  </List>
                </Popover>

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

      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={handleToastClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        sx={{ top: '55px', '@media (min-width:600px)': { top: '55px' } }}
        slots={{ transition: Slide }} slotProps={{ transition: { direction: 'left' } }}
      >
        <Alert
          onClose={handleToastClose}
          severity={toast.severity}
          variant="standard"
          sx={{
            borderRadius: 3, fontWeight: 600, fontSize: '0.85rem',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)', minWidth: 280,
            bgcolor: toast.severity === 'success' ? 'rgba(22,163,74,0.12)' : 'rgba(220,38,38,0.10)',
            border: toast.severity === 'success' ? '1px solid rgba(22,163,74,0.3)' : '1px solid rgba(220,38,38,0.3)',
            color: toast.severity === 'success' ? '#15803d' : '#dc2626',
            '& .MuiAlert-icon': { color: toast.severity === 'success' ? '#16a34a' : '#dc2626' },
          }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
      </Container>
    </Box>
  );
};


export default InstrumentDiagnosticPage;