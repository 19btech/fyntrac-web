import React, { useState } from 'react';
import { Chip, TextField, InputAdornment, Box } from '@mui/material';

const ChipInput = (inputValue, handleOnChange) => {
  const [chips, setChips] = useState([]);

  const handleKeyDown = (event) => {
    if (event.key === ' ') {
      event.preventDefault(); // Prevent the default space behavior
      if (inputValue.trim()) {
        setChips((prevChips) => [...prevChips, inputValue.trim()]);
        setInputValue(''); // Clear the input
      }
    }
  };

  const handleDelete = (chipToDelete) => () => {
    setChips((chips) => chips.filter((chip) => chip !== chipToDelete));
  };

  return (
    <TextField
      size="small"
      label="Enter values"
      variant="outlined"
      value={inputValue}
      onChange={(e) => handleOnChange(e.target.value)}
      onKeyDown={handleKeyDown}
      fullWidth
      sx={{ width: '600px' }}
      slotProps={{
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <Box display="flex" flexDirection="row" flexWrap="nowrap">
                {chips.map((chip) => (
                  <Chip
                    key={chip}
                    label={chip}
                    onDelete={handleDelete(chip)}
                    style={{ margin: '2px' }}
                  />
                ))}
              </Box>
            </InputAdornment>
          ),
        },
      }}
    />
  );
};

export default ChipInput;