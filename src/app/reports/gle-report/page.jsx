"use client";
import React, { useState, useEffect } from "react";
import {
  Box,
  MenuItem,
  TextField,
  RadioGroup,
  FormControlLabel,
  Radio,
  IconButton,
  Divider,
  Stack,
  Tooltip,
  Chip,
  InputAdornment,
  Tabs,
  Tab,
  Snackbar,
  Alert,
  Slide,
} from "@mui/material";
import { DeleteOutlineOutlined } from "@mui/icons-material";
import CachedRoundedIcon from "@mui/icons-material/CachedRounded";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import PlayCircleOutlineOutlinedIcon from "@mui/icons-material/PlayCircleOutlineOutlined";
import ClickAwayListener from '@mui/material/ClickAwayListener';
import GridHeader from "../../component/gridHeader";
import Grid from "@mui/material/Grid"; 
import { reportingApi } from '../../services/api-client';
import CustomDataGrid from "@/app/component/custom-data-grid";
import CustomTabPanel from '../../component/custom-tab-panel';
import { useTenant } from "../../tenant-context";

const GLEReportPage = () => {
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

  const [isAttribuesFetched, setIsAttribuesFetched] = React.useState(false);
  // Attribute options
  const [attributeOptions, setAttributeOptions] = useState([]);
  const [gridHeader, setGridHeader] = useState([]);
  const [reportData, setReportData] = useState([]);
  // Operator options based on field type
  const operatorOptions = {
    String: ["contains", "starts with", "ends with", "equals", "not equal"],
    Double: ["<", ">", "==", "!=", "<=", ">="],
    Integer: ["<", ">", "==", "!=", "<=", ">="],
    Long: ["<", ">", "==", "!=", "<=", ">="],
    Date: ["<", ">", "==", "!=", "<=", ">="],
  };

  const fetchReportAttributes = () => {

    const fetchSettings = `/jeReport/get/attributes`;
    reportingApi.get(fetchSettings)
      .then(response => {
        setAttributeOptions(response.data);
      })
      .catch(error => {
        console.error('Error fetching attributes:', error);
      });
  };

  useEffect(() => {
    fetchReportAttributes();
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

    const filteredCriteriaList = criteriaList.filter(criteria => criteria.filters.length > 0);
    console.log('filters:', filteredCriteriaList);
    const executeReportAPI = `/jeReport/execute`;
    reportingApi.post(executeReportAPI, filteredCriteriaList)
      .then(response => {

        const dataWithIds = response.data.map((item, index) => ({
          ...item,
          // 👇 THIS IS THE FIX: Spread the attributes to the top level
          ...(item.attributes || {}),
          id: item.id || index + 1,
        }));

        setReportData(dataWithIds);
        showToast('Report data loaded successfully.');
      })
      .catch(error => {
        console.error('Error fetching data:', error);
        setErrorMessage(error.message);
        setShowErrorMessage(true);
        showToast('Failed to execute report. Please try again.', 'error');
      });
  };

  useEffect(() => {
    console.log('reporting data:', reportData);
  }, [reportData]); // This will log the updated reportData whenever it changes

  // Execute Filter
  const executeFiler = () => {
    executeReport();
  }

  const downloadReport = () => {
    const filteredCriteriaList = criteriaList.filter(c => c.filters.length > 0);
    reportingApi.post('/jeReport/download', filteredCriteriaList, {
      headers: { Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
      responseType: 'blob',
    })
      .then(response => {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const disposition = response.headers['content-disposition'];
        let fileName = 'gle-report.xlsx';
        if (disposition && disposition.includes('filename=')) {
          fileName = disposition.split('filename=')[1].replace(/"/g, '');
        }
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        showToast('Report downloaded successfully.');
      })
      .catch(error => {
        console.error('Download error:', error);
        showToast('Failed to download report.', 'error');
      });
  };

  const handleChange = (index, field, value) => {
    setCriteriaList((prevCriteria) => {
      const newCriteria = [...prevCriteria];
      newCriteria[index][field] = value;
      return newCriteria;
    });
  };

  const handleKeyDown = (event, index) => {
    if (event.key === ' ') {
      event.preventDefault(); // Prevent the default space behavior
      addFilter(index);
    }
  };

  const handleClickAway = (index) => {
    addFilter(index);
  };

  const addFilter = (index) => {
    const trimmedValue = criteriaList[index].values.trim();
    if (trimmedValue) {
      setCriteriaList((prevCriteria) => {
        const newCriteria = [...prevCriteria];
        const currentFilters = newCriteria[index].filters;

        // Check if the value already exists in the current filters
        if (!currentFilters.includes(trimmedValue)) {
          newCriteria[index].filters.push(trimmedValue); // Add filter to the specified criteria
        }
        return newCriteria; // Return the updated criteria
      });
      handleChange(index, 'values', ''); // Clear the input after updating filters
    }
  };

  const handleDeleteFilter = (criteriaIndex, filterToDelete) => () => {
    setCriteriaList((prevCriteria) => {
      const newCriteria = [...prevCriteria];
      newCriteria[criteriaIndex].filters = newCriteria[criteriaIndex].filters.filter((filter) => filter !== filterToDelete);
      return newCriteria;
    });
  };

  // Handle adding a new criteria
  const handleAddCriteria = () => {
    setCriteriaList([
      ...criteriaList,
      {
        attributeName: "",
        operator: "",
        values: "",
        filters: [], // Initialize with empty filters
        logicalOperator: "AND",
      },
    ]);
  };

  // Handle removing a criteria
  const handleRemoveCriteria = (index) => {
    setCriteriaList(criteriaList.filter((_, i) => i !== index));
  };

  const generateGridColumns = (columnDefs) => {
    console.log('Generating grid columns from:', columnDefs);
    return columnDefs.map((col) => ({
      field: col.attributeName, // Use attributeName as the field
      headerName: toProperCase(col.attributeAlias), // Use attributeAlias as the header name
      width: 200, // Set a default width (you can customize this)
      editable: false, // Set editable to false or true based on your requirements
    }));
  };

  const toProperCase = (str) =>
    str
      .replace(/_/g, ' ')
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

  return (
    <div>
      <Grid container spacing={3}>
        <Grid size="auto">
          <div className="left">
            <GridHeader>Journal Entry Report</GridHeader>
          </div>
        </Grid>
        <Grid size={6} />
        <Grid size="grow">
          <div className="right">
            <Stack direction="row" spacing={1}>
              <Tooltip title="Add filter" arrow>
                <IconButton
                  aria-label="add"
                  onClick={handleAddCriteria}
                  sx={{ bgcolor: 'white', boxShadow: 1, transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', '&:hover': { bgcolor: 'grey.50', boxShadow: 3, transform: 'scale(1.08)' }, '&:active': { transform: 'scale(0.94)' } }}
                >
                  <AddOutlinedIcon color="action" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Execute filter" arrow>
                <IconButton
                  aria-label="execute"
                  onClick={executeFiler}
                  sx={{ bgcolor: 'rgba(22,163,74,0.1)', border: '1px solid rgba(21,128,61,0.35)', color: '#16a34a', boxShadow: 1, transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', '&:hover': { bgcolor: 'rgba(22,163,74,0.2)', borderColor: '#15803d', boxShadow: 3, transform: 'scale(1.08)' }, '&:active': { transform: 'scale(0.94)' } }}
                >
                  <PlayCircleOutlineOutlinedIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Download report data" arrow>
                <IconButton
                  aria-label="Download file"
                  onClick={downloadReport}
                  sx={{ bgcolor: 'white', boxShadow: 1, transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', '&:hover': { bgcolor: 'grey.50', boxShadow: 3, transform: 'scale(1.08)' }, '&:active': { transform: 'scale(0.94)' } }}
                >
                  <FileDownloadOutlinedIcon color="action" />
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
            flex="0 0 20%" // First row occupies 30%
            overflow="auto"
          >
            {criteriaList.map((criteria, index) => (
              <Box key={index} justifyContent="center" sx={{
                mb: 1, border: 0, p: 1, borderRadius: 1, flexDirection: 'column',
              }} >
                <Grid container spacing={1} alignItems="center" justifyContent="center">
                  <Grid xs={12} sm={4} alignItems="center">
                    <TextField
                      fullWidth
                      select
                      label="Attributes"
                      value={criteria.attributeName}
                      onChange={(e) => handleChange(index, "attributeName", e.target.value)}
                      size="small"
                      sx={{ minWidth: 350 }}
                    >
                      {attributeOptions.length > 0 ? (
                        attributeOptions.map((option, i) => (
                          <MenuItem key={i} value={option.attributeName}>
                            {option.attributeName}
                          </MenuItem>
                        ))
                      ) : (
                        <MenuItem disabled value="">
                          No options available
                        </MenuItem>
                      )}
                    </TextField>
                  </Grid>

                  <Grid xs={12} sm={3}>
                    <TextField
                      fullWidth
                      select
                      label="Operator"
                      value={criteria.operator}
                      onChange={(e) => handleChange(index, "operator", e.target.value)}
                      disabled={!criteria.attributeName}
                      size="small"
                      sx={{ minWidth: 150 }}
                    >
                      {criteria.attributeName &&
                        operatorOptions[attributeOptions.find((t) => t.attributeName === criteria.attributeName)?.dataType] ? (
                        operatorOptions[
                          attributeOptions.find((t) => t.attributeName === criteria.attributeName).dataType
                        ].map((operator, i) => (
                          <MenuItem key={i} value={operator}>
                            {operator}
                          </MenuItem>
                        ))
                      ) : (
                        <MenuItem disabled value="">
                          Select a column first
                        </MenuItem>
                      )}
                    </TextField>
                  </Grid>

                  <Grid xs={12} sm={3}>
                    <ClickAwayListener onClickAway={() => handleClickAway(index)} key={index}>
                      <TextField
                        size="small"
                        label={`Enter values for Filter ${index + 1}`}
                        variant="outlined"
                        value={criteriaList[index].values}
                        onChange={(e) => handleChange(index, "values", e.target.value)}
                        onKeyDown={(event) => handleKeyDown(event, index)} // Pass index
                        disabled={!criteria.operator}
                        fullWidth
                        sx={{ width: '900px' }}
                        slotProps={{
                          input: {
                            startAdornment: (
                              <InputAdornment position="start">
                                <Box display="flex" flexDirection="row" flexWrap="nowrap">
                                  {criteria.filters.map((filter) => (
                                    <Chip
                                      key={filter}
                                      label={filter}
                                      onDelete={handleDeleteFilter(index, filter)} // Pass criteria index
                                      style={{ margin: '2px' }}
                                    />
                                  ))}
                                </Box>
                              </InputAdornment>
                            ),
                          },
                        }}
                      />
                    </ClickAwayListener>
                  </Grid>

                  {criteriaList.length > 1 && (
                    <Grid xs={12} sm={2}>
                      <IconButton
                        onClick={() => handleRemoveCriteria(index)}
                        aria-label="delete"
                        size="small"
                      >
                        <DeleteOutlineOutlined />
                      </IconButton>
                    </Grid>
                  )}
                </Grid>

                {index < criteriaList.length - 1 && (
                  <Grid container justifyContent="center" sx={{ mt: 1 }}>
                    <RadioGroup
                      row
                      value={criteria.logicalOperator}
                      onChange={(e) => handleChange(index, "logicalOperator", e.target.value)}
                      style={{ display: 'flex', alignItems: 'center' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', marginRight: '16px' }}>
                        <Radio
                          value="AND"
                          size="small"
                          sx={{
                            '&.Mui-checked': {
                              color: '#007BFF',
                            },
                            '&:hover': {
                              backgroundColor: 'rgba(0, 123, 255, 0.1)',
                            },
                          }}
                        />
                        <span style={{
                          marginLeft: '8px',
                          fontSize: '14px',
                          color: '#333',
                          letterSpacing: '0.5px',
                        }}>
                          AND
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <Radio
                          value="OR"
                          size="small"
                          sx={{
                            '&.Mui-checked': {
                              color: '#007BFF',
                            },
                            '&:hover': {
                              backgroundColor: 'rgba(0, 123, 255, 0.1)',
                            },
                          }}
                        />
                        <span style={{
                          marginLeft: '8px',
                          fontSize: '14px',
                          color: '#333',
                          letterSpacing: '0.5px',
                        }}>
                          OR
                        </span>
                      </div>
                    </RadioGroup>
                  </Grid>
                )}
              </Box>
            ))}
          </Box>

          <Box
            flex="1" // Third row takes the remaining space
            overflow="auto" // Enable scrolling if content overflows
          >
            <Box
              height="100%" // Ensure the grid takes full height of the container
              overflow="auto" // Enable scrolling for the grid if needed
            >
              <CustomDataGrid columns={gridHeader} rows={reportData} />
            </Box>
          </Box>
        </Box>
      </CustomTabPanel>
      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={handleToastClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
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
    </div>
  );
};

export default GLEReportPage;