import React, { useState } from "react";
import { Autocomplete, TextField, Box, Typography } from "@mui/material";

const ReferenceColumnAutocomplete = ({ tables = [], onSelect }) => {
  const [value, setValue] = useState(null);

  const handleChange = (event, selected) => {
    setValue(selected);
    if (selected && onSelect) {
      onSelect({
        tableName: selected.tableName,
        referenceColumn: selected.referenceColumn,
      });
    }
  };

  return (
    <Box sx={{ width: "30%" }}>
      <Autocomplete
        size="medium"
        options={tables}
        value={value}
        onChange={handleChange}
        getOptionLabel={(option) =>
          `${option.tableName} • ${option.referenceColumn}`
        }
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
          const { key, ...rest } = props; // Extract key from props
          return (
            <Box
              component="li"
              key={key} // Pass key explicitly
              {...rest} // Spread remaining props
              sx={{
                display: "flex",
                flexDirection: "column",
                py: 1,
                px: 1.5,
              }}
            >
              <Typography variant="subtitle2" fontWeight={600}>
                {option.tableName}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontSize: "0.8rem" }}
              >
                Reference Column: {option.referenceColumn}
              </Typography>
            </Box>
          );
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            size="medium"
            label="Select Reference Table"
            placeholder="Search table..."
            variant="outlined"
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
              },
            }}
          />
        )}
        noOptionsText="No reference tables"
        isOptionEqualToValue={(option, value) =>
          option.tableName === value.tableName &&
          option.referenceColumn === value.referenceColumn
        }
      />
    </Box>
  );
};

export default ReferenceColumnAutocomplete;
