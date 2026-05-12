import React, { useState, useEffect } from "react";
import { Autocomplete, TextField, Box, Typography } from "@mui/material";

const ReferenceColumnAutocomplete = ({ tables = [], value, onSelect }) => {
  const [selectedValue, setSelectedValue] = useState(null);

  // Helper function to get the reference column object from a table
  const getReferenceColumnObject = (table) => {
    if (!table || !table.columns || !table.referenceColumn) return null;
    
    // Find the column where columnName equals referenceColumn
    return table.columns.find(
      column => column.columnName === table.referenceColumn
    );
  };

  // Sync external value prop with internal state
  useEffect(() => {
    console.log('🔍 ReferenceColumnAutocomplete props:', { 
      tables, 
      value, 
      tablesCount: tables.length 
    });
    
    if (value) {
      // If value is a string (table name), find the matching table object
      if (typeof value === 'string') {
        const foundTable = tables.find(table => table.tableName === value);
        if (foundTable) {
          console.log('✅ Found table for string value:', foundTable);
          console.log('📊 Reference column object:', getReferenceColumnObject(foundTable));
          setSelectedValue(foundTable);
        } else {
          console.log('❌ No table found for string value:', value);
          setSelectedValue(null);
        }
      } 
      // If value is already a table object
      else if (value.tableName && value.columns) {
        console.log('✅ Using provided table object:', value);
        console.log('📊 Reference column object:', getReferenceColumnObject(value));
        setSelectedValue(value);
      }
      // If value is null/undefined
      else {
        console.log('📭 Value is null/undefined');
        setSelectedValue(null);
      }
    } else {
      setSelectedValue(null);
    }
  }, [value, tables]);

  const handleChange = (event, selectedTable) => {
    console.log('🔄 Autocomplete changed - Selected table:', selectedTable);
    
    if (selectedTable) {
      // Get the reference column object
      const referenceColumnObj = getReferenceColumnObject(selectedTable);
      console.log('📊 Reference column object found:', referenceColumnObj);
      
      setSelectedValue(selectedTable);
      
      if (onSelect) {
        // Pass both the table and the column object
        onSelect(
          {
            tableName: selectedTable.tableName,
            referenceColumn: selectedTable.referenceColumn,
            tableData: selectedTable // Pass full table data if needed
          },
          referenceColumnObj // Pass the column object
        );
      }
    } else {
      // Handle clear
      setSelectedValue(null);
      if (onSelect) {
        onSelect(null, null);
      }
    }
  };

  // Format the label to show table name and reference column
  const getOptionLabel = (option) => {
    if (!option) return '';
    return `${option.tableName} • ${option.referenceColumn}`;
  };

  return (
    <Box sx={{ width: "100%" }}>
      <Autocomplete
        size="small"
        options={tables}
        value={selectedValue}
        onChange={handleChange}
        getOptionLabel={getOptionLabel}
        slotProps={{
          paper: {
            elevation: 3,
            sx: {
              borderRadius: 2,
              mt: 1,
            },
          },
        }}
        renderOption={(props, option) => {
          const { key, ...rest } = props;
          const refColumnObj = getReferenceColumnObject(option);
          
          return (
            <Box
              component="li"
              key={key}
              {...rest}
              sx={{
                display: "flex",
                flexDirection: "column",
                py: 1,
                px: 1.5,
                cursor: "pointer",
                "&:hover": {
                  backgroundColor: "action.hover",
                },
              }}
            >
              <Typography variant="subtitle2" fontWeight={600} sx={{ fontSize: '0.9rem' }}>
                {option.tableName}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontSize: "0.8rem" }}
                >
                  Reference Column: {option.referenceColumn}
                </Typography>
              </Box>
            </Box>
          );
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            size="small"
            label="Select Reference Table"
            placeholder="Search table..."
            variant="outlined"
            inputProps={{ ...params.inputProps, style: { fontSize: '0.9rem', fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif' } }}
            InputLabelProps={{ ...params.InputLabelProps, style: { fontSize: '0.9rem', fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif' } }}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 2.5,
                bgcolor: 'background.paper',
              },
            }}
          />
        )}
        noOptionsText="No reference tables available"
        isOptionEqualToValue={(option, value) => {
          if (!option || !value) return false;
          return option.tableName === value.tableName;
        }}
        clearOnBlur={false}
        blurOnSelect
      />
    </Box>
  );
};

// Add Chip import at the top
import Chip from '@mui/material/Chip';

export default ReferenceColumnAutocomplete;