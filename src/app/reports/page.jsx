'use client'
import React, { useState } from "react";
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  RadioGroup,
  FormControlLabel,
  Radio,
  Typography,
  IconButton,
} from "@mui/material";
import { DeleteOutlineOutlined } from '@mui/icons-material';
import Grid from "@mui/material/Grid2"; // Import stable Grid2

const GLEReportPage = () => {
  // State to manage the list of criteria
  const [criteriaList, setCriteriaList] = useState([
    {
      transaction: "",
      operator: "",
      value: "",
      logicalOperator: "AND",
    },
  ]);

  // Transaction options
  const transactionOptions = [
    { name: "Payment", type: "string" },
    { name: "Refund", type: "string" },
    { name: "Transfer", type: "number" },
  ];

  // Operator options based on field type
  const operatorOptions = {
    string: ["contains", "starts with", "ends with", "equals", "not equal"],
    number: ["<", ">", "==", "!=", "<=", ">="],
  };

  // Handle adding a new criteria
  const handleAddCriteria = () => {
    setCriteriaList([
      ...criteriaList,
      {
        transaction: "",
        operator: "",
        value: "",
        logicalOperator: "AND",
      },
    ]);
  };

  // Handle removing a criteria
  const handleRemoveCriteria = (index) => {
    const newCriteriaList = criteriaList.filter((_, i) => i !== index);
    setCriteriaList(newCriteriaList);
  };

  // Handle changes in transaction, operator, value, or logical operator
  const handleChange = (index, field, value) => {
    const newCriteriaList = [...criteriaList];
    newCriteriaList[index][field] = value;
    setCriteriaList(newCriteriaList);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        GLE Report Page
      </Typography>

      {/* Render each search criteria */}
      {criteriaList.map((criteria, index) => (
        <Box key={index} sx={{ mb: 3, border: 1, p: 2, borderRadius: 1 }}>
          {/* First Row: Transaction, Operator, Value */}
          <Grid container spacing={2} alignItems="center">
            {/* Transaction Selection */}
            <Grid xs={12} sm={4}>
              <FormControl fullWidth sx={{ minWidth: 200 }}> {/* Set initial width */}
                <InputLabel>Transaction</InputLabel>
                <Select
                  value={criteria.transaction}
                  onChange={(e) =>
                    handleChange(index, "transaction", e.target.value)
                  }
                  label="Transaction"
                >
                  {transactionOptions.map((option, i) => (
                    <MenuItem key={i} value={option.name}>
                      {option.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Operator Selection */}
            <Grid xs={12} sm={3}>
              <FormControl fullWidth sx={{ minWidth: 150 }}> {/* Set initial width */}
                <InputLabel>Operator</InputLabel>
                <Select
                  value={criteria.operator}
                  onChange={(e) =>
                    handleChange(index, "operator", e.target.value)
                  }
                  label="Operator"
                  disabled={!criteria.transaction}
                >
                  {criteria.transaction &&
                    operatorOptions[
                      transactionOptions.find(
                        (t) => t.name === criteria.transaction
                      ).type
                    ].map((operator, i) => (
                      <MenuItem key={i} value={operator}>
                        {operator}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Value Input */}
            <Grid xs={12} sm={3}>
              <TextField
                fullWidth
                label="Value"
                value={criteria.value}
                onChange={(e) => handleChange(index, "value", e.target.value)}
              />
            </Grid>

            {/* Remove Criteria Button (only show if there are multiple criteria) */}
            {criteriaList.length > 1 && (
              <Grid xs={12} sm={2}>
                <IconButton
                  onClick={() => handleRemoveCriteria(index)}
                  aria-label="delete"
                >
                  <DeleteOutlineOutlined />
                </IconButton>
              </Grid>
            )}
          </Grid>

          {/* Second Row: Logical Operator Selection (Centered) */}
          {index < criteriaList.length - 1 && (
            <Grid container justifyContent="center" sx={{ mt: 2 }}>
              <FormControl component="fieldset">
                <RadioGroup
                  row
                  value={criteria.logicalOperator}
                  onChange={(e) =>
                    handleChange(index, "logicalOperator", e.target.value)
                  }
                >
                  <FormControlLabel
                    value="AND"
                    control={<Radio />}
                    label="AND"
                  />
                  <FormControlLabel
                    value="OR"
                    control={<Radio />}
                    label="OR"
                  />
                </RadioGroup>
              </FormControl>
            </Grid>
          )}
        </Box>
      ))}

      {/* Add Criteria Button */}
      <Button variant="contained" onClick={handleAddCriteria} sx={{ mt: 2 }}>
        Add Criteria
      </Button>
    </Box>
  );
};

export default GLEReportPage;