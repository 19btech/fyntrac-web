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
  Autocomplete,
} from "@mui/material";
import { DeleteOutlineOutlined } from "@mui/icons-material";
import CachedRoundedIcon from "@mui/icons-material/CachedRounded";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import PlayCircleOutlineOutlinedIcon from "@mui/icons-material/PlayCircleOutlineOutlined";
import ClickAwayListener from '@mui/material/ClickAwayListener';
import GridHeader from "../../component/gridHeader";
import Grid from "@mui/material/Grid2"; // Import stable Grid2
import axios from 'axios';
import CustomDataGrid from "@/app/component/custom-data-grid";
import CustomTabPanel from '../../component/custom-tab-panel';
import { useTenant } from "../../tenant-context";

const CustomOperationalDataReportPage = () => {
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

  const [isAttribuesFetched, setIsAttribuesFetched] = React.useState(false);
  // Attribute options
  const [attributeOptions, setAttributeOptions] = useState([]);
  const [gridHeader, setGridHeader] = useState([]);
  const [reportData, setReportData] = useState([]);
  const [reportSources, setReportSources] = useState([{}]);

  const [reportSource, setReportSource] = useState({});

  // Operator options based on field type
  const operatorOptions = {
    String: ["contains", "starts with", "ends with", "equals", "not equal"],
    Double: ["<", ">", "==", "!=", "<=", ">="],
    Integer: ["<", ">", "==", "!=", "<=", ">="],
    Long: ["<", ">", "==", "!=", "<=", ">="],
    Date: ["<", ">", "==", "!=", "<=", ">="],
  };

const fetchReportAttributes = (source) => {
  const fetchSettings = `${process.env.NEXT_PUBLIC_REPORTING_SERVICE_URI}/custom-operational-data/get/attributes/${source.label}`;
  console.log('uri:', fetchSettings);
  axios.get(fetchSettings, {
    headers: {
      'X-Tenant': tenant,
      Accept: '*/*',
    }
  })
  .then(response => {
    console.log();
    setAttributeOptions([]);
    setAttributeOptions(response.data);
  })
  .catch(error => {
    console.error('Error fetching attributes:', error);
  });
};

const fetchReportSources = () => {
  const fetchReportSources = `${process.env.NEXT_PUBLIC_REPORTING_SERVICE_URI}/custom-operational-data/get/table-names`;
  console.log('uri:', fetchReportSources);
  axios.get(fetchReportSources, {
    headers: {
      'X-Tenant': tenant,
      Accept: '*/*',
    }
  })
  .then(response => {
    console.log();
    setReportSources([]);
    setReportSources(response.data);
    if(reportSources.length > 0) {
        console.log('reportSources[0]:', reportSources[0]);
        setReportSource(reportSources[0]);
    }
  })
  .catch(error => {
    console.error('Error fetching attributes:', error);
  });
};
  useEffect(() => {
    fetchReportSources();
    fetchReportAttributes(reportSource);
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
    const executeReportAPI = `${process.env.NEXT_PUBLIC_REPORTING_SERVICE_URI}/custom-operational-data/execute/${reportSource.value}`;
    axios.post(executeReportAPI, filteredCriteriaList, {
      headers: {
        'X-Tenant': tenant,
        Accept: '*/*',
        'Postman-Token': '091bd74b-e836-4185-896a-008fd64b4f46',
      }
    })
      .then(response => {
        console.log('Report Data:', response.data);
        setReportData(response.data);
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
    return columnDefs.map((col) => ({
      field: col.attributeName, // Use attributeName as the field
      headerName: col.attributeAlias, // Use attributeAlias as the header name
      width: 200, // Set a default width (you can customize this)
      editable: false, // Set editable to false or true based on your requirements
    }));
  };


  const updateReportSource = (source) => {
    console.log('source:', source);
    setReportSource(source);
    fetchReportAttributes(source);
  }

  return (
    <div>
      <Grid container spacing={3}>
        <Grid size="auto">
          <div className="left">
            <GridHeader>Custom Reference Data Report</GridHeader>
          </div>
        </Grid>
        <Grid size={6} />
        <Grid size="grow">
          <div className="right">
            <Stack direction="row" spacing={1}>
              <Box sx={{ width: '260px', paddingBottom: 1 }}>
                <Autocomplete
                  sx={{
                    width: '250px',
                    '& .MuiInputBase-root': {
                      height: 30,
                      fontSize: '0.85rem'
                    }
                  }}
                  disablePortal
                  id="widget-1"
                  options={reportSources}
                  getOptionLabel={(option) => option?.label || ''}
                  value={reportSource}
                  onChange={(event, newValue) => updateReportSource(newValue || null)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label={reportSource?.label?.trim() ? '' : 'Select source'} // hide label if selected
                      variant="standard"
                      size="small"
                      slotProps={{
                        input: {
                          ...params.InputProps,
                          sx: { height: 36 }
                        }
                      }}
                    />
                  )}
                />

              </Box>
              <Tooltip title="Add filter" arrow>
                <IconButton
                  aria-label="add"
                  onClick={handleAddCriteria}
                  sx={{ "&:hover": { backgroundColor: "darkgrey" } }}
                >
                  <AddOutlinedIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Execute filter" arrow>
                <IconButton
                  aria-label="execute"
                  onClick={executeFiler}
                  sx={{ "&:hover": { backgroundColor: "darkgrey" } }}
                >
                  <PlayCircleOutlineOutlinedIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Download report data" arrow>
                <IconButton
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
    </div>
  );
};

export default CustomOperationalDataReportPage;