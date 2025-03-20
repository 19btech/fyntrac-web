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
} from "@mui/material";
import { DeleteOutlineOutlined } from "@mui/icons-material";
import CachedRoundedIcon from "@mui/icons-material/CachedRounded";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import PlayCircleOutlineOutlinedIcon from "@mui/icons-material/PlayCircleOutlineOutlined";

import GridHeader from "../../component/gridHeader";
import Grid from "@mui/material/Grid2"; // Import stable Grid2
import axios from 'axios';
import CustomDataGrid from "@/app/component/custom-data-grid";
import CustomTabPanel from '../../component/custom-tab-panel'


const GLEReportPage = () => {
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
  // Operator options based on field type
  const operatorOptions = {
    String: ["contains", "starts with", "ends with", "equals", "not equal"],
    Double: ["<", ">", "==", "!=", "<=", ">="],
    Integer: ["<", ">", "==", "!=", "<=", ">="],
    Long: ["<", ">", "==", "!=", "<=", ">="],
    Date: ["<", ">", "==", "!=", "<=", ">="],
  };

  const fetchReportAttributes = () => {
    const fetchSettings = `${process.env.NEXT_PUBLIC_REPORTING_SERVICE_URI}/jeReport/get/attributes`;
    axios.get(fetchSettings, {
      headers: {
        'X-Tenant': process.env.NEXT_PUBLIC_TENANT,
        Accept: '*/*',
        'Postman-Token': '091bd74b-e836-4185-896a-008fd64b4f46',
      }
    })
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
    const fetchSettings = `${process.env.NEXT_PUBLIC_REPORTING_SERVICE_URI}/jeReport/execute`;
    axios.post(fetchSettings, criteriaList, {
      headers: {
        'X-Tenant': process.env.NEXT_PUBLIC_TENANT,
        Accept: '*/*',
        'Postman-Token': '091bd74b-e836-4185-896a-008fd64b4f46',
      }
    })
      .then(response => {
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
    console.log('criteriaList', criteriaList);
    executeReport();
  }

  const handleKeyDown = (event, index) => {
    if (event.key === ' ') {
      event.preventDefault(); // Prevent the default space behavior

      // Check if the input value is not empty
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

  // Handle changes in attributeName, operator, or logical operator
  const handleChange = (index, field, value) => {
    const updatedCriteria = [...criteriaList];
    updatedCriteria[index][field] = value;
    setCriteriaList(updatedCriteria);
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
            <GridHeader>Journal Entry Report</GridHeader>
          </div>
        </Grid>
        <Grid size={6} />
        <Grid size="grow">
          <div className="right">
            <Stack direction="row" spacing={1}>
              <Tooltip title="Refresh page" arrow>
                <IconButton
                  aria-label="refresh"
                  sx={{ "&:hover": { backgroundColor: "darkgrey" } }}
                >
                  <CachedRoundedIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Upload Rule File" arrow>
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
      <Box sx={{ backgroundColor: "#e2e5ea", padding: 1, width: "100%" }} />

      <Grid container spacing={3}>
        <Grid size="auto">
          <div className="left">
            <GridHeader>Filters</GridHeader>
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
            </Stack>
          </div>
        </Grid>
      </Grid>

      <Box sx={{ p: 1 }} justifyContent="center">
        {/* Render each search criteria */}
        {criteriaList.map((criteria, index) => (
          <Box key={index} justifyContent="center" sx={{ mb: 1, border: 1, p: 1, borderRadius: 1 }}>
            <Grid container spacing={1} alignItems="center">
              {/* Attribute Selection */}
              <Grid xs={12} sm={4} alignItems="center">
                <TextField
                  fullWidth
                  select
                  label="Attributes"
                  value={criteria.attributeName}
                  onChange={(e) => handleChange(index, "attributeName", e.target.value)}
                  size="small"
                  sx={{ minWidth: 200 }}
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

              {/* Operator Selection */}
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

              {/* Value Input */}
              <Grid xs={12} sm={3}>
                <TextField
                  size="small"
                  label={`Enter values for Filter ${index + 1}`}
                  variant="outlined"
                  value={criteriaList[index].values}
                  onChange={(e) => handleChange(index, "values", e.target.value)}
                  onKeyDown={(event) => handleKeyDown(event, index)} // Pass index
                  fullWidth
                  sx={{ width: '600px' }}
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
              </Grid>

              {/* Remove Criteria Button */}
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

            {/* Second Row: Logical Operator Selection */}
            {index < criteriaList.length - 1 && (
              <Grid container justifyContent="center" sx={{ mt: 1 }}>
                <RadioGroup
                  row
                  value={criteria.logicalOperator}
                  onChange={(e) =>
                    handleChange(index, "logicalOperator", e.target.value)
                  }
                >
                  <FormControlLabel
                    value="AND"
                    control={<Radio size="small" />}
                    label="AND"
                  />
                  <FormControlLabel
                    value="OR"
                    control={<Radio size="small" />}
                    label="OR"
                  />
                </RadioGroup>
              </Grid>
            )}
          </Box>
        ))}
      </Box>
      <div>
        <CustomDataGrid columns={gridHeader} rows={reportData} />
      </div>
    </div>
  );
};

export default GLEReportPage;