import React, { useState, useEffect } from "react";
import {
  Box, Typography, TextField, InputAdornment, IconButton,
  Popover, List, ListItemButton, ListItemText,
} from "@mui/material";
import { alpha, useTheme } from '@mui/material/styles';
import SearchIcon from '@mui/icons-material/Search';
import HighlightOffOutlinedIcon from '@mui/icons-material/HighlightOffOutlined';

const ReferenceColumnAutocomplete = ({ tables = [], value, onSelect }) => {
  const theme = useTheme();
  const [selectedValue, setSelectedValue] = useState(null);
  const [pickerAnchor, setPickerAnchor] = useState(null);
  const [pickerSearch, setPickerSearch] = useState('');

  const getReferenceColumnObject = (table) => {
    if (!table || !table.columns || !table.referenceColumn) return null;
    return table.columns.find(col => col.columnName === table.referenceColumn);
  };

  useEffect(() => {
    if (value) {
      if (typeof value === 'string') {
        const foundTable = tables.find(table => table.tableName === value);
        setSelectedValue(foundTable || null);
      } else if (value.tableName && value.columns) {
        setSelectedValue(value);
      } else {
        setSelectedValue(null);
      }
    } else {
      setSelectedValue(null);
    }
  }, [value, tables]);

  const handleSelect = (table) => {
    const referenceColumnObj = getReferenceColumnObject(table);
    setSelectedValue(table);
    if (onSelect) {
      onSelect(
        { tableName: table.tableName, referenceColumn: table.referenceColumn, tableData: table },
        referenceColumnObj
      );
    }
    setPickerAnchor(null);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    setSelectedValue(null);
    if (onSelect) onSelect(null, null);
  };

  const filteredTables = tables.filter(t =>
    t.tableName?.toLowerCase().includes(pickerSearch.toLowerCase()) ||
    t.referenceColumn?.toLowerCase().includes(pickerSearch.toLowerCase())
  );

  const displayValue = selectedValue
    ? `${selectedValue.tableName} • ${selectedValue.referenceColumn}`
    : '';

  return (
    <Box sx={{ width: '100%' }}>
      <TextField
        fullWidth size="small"
        label="Select Reference Table"
        value={displayValue}
        onClick={(e) => { setPickerAnchor(e.currentTarget); setPickerSearch(''); }}
        inputProps={{ readOnly: true, style: { cursor: 'pointer', fontSize: '0.9rem', fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif' } }}
        InputLabelProps={{ style: { fontSize: '0.9rem', fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif' } }}
        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5, bgcolor: 'background.paper' } }}
        InputProps={{
          startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" sx={{ color: 'text.disabled' }} /></InputAdornment>,
          endAdornment: selectedValue ? (
            <InputAdornment position="end">
              <IconButton size="small" onClick={handleClear} sx={{ color: 'text.disabled', '&:hover': { color: 'error.main' } }}>
                <HighlightOffOutlinedIcon sx={{ fontSize: '0.95rem' }} />
              </IconButton>
            </InputAdornment>
          ) : null,
        }}
      />
      <Popover
        open={Boolean(pickerAnchor)} anchorEl={pickerAnchor}
        onClose={() => setPickerAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{ paper: { sx: { mt: 0.75, width: pickerAnchor?.offsetWidth, borderRadius: 3, boxShadow: '0 8px 32px rgba(15,23,42,0.16)', border: '1px solid', borderColor: 'divider', overflow: 'hidden' } } }}
      >
        <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: alpha(theme.palette.divider, 0.6) }}>
          <TextField autoFocus fullWidth size="small" placeholder="Search tables..."
            value={pickerSearch} onChange={(e) => setPickerSearch(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" sx={{ color: 'text.disabled' }} /></InputAdornment> }}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />
        </Box>
        <List dense disablePadding sx={{ maxHeight: 280, overflow: 'auto' }}>
          {filteredTables.length === 0 ? (
            <ListItemButton disabled sx={{ justifyContent: 'center', py: 2.5 }}>
              <Typography variant="caption" color="text.disabled">No reference tables available.</Typography>
            </ListItemButton>
          ) : filteredTables.map((table) => (
            <ListItemButton
              key={table.tableName}
              selected={selectedValue?.tableName === table.tableName}
              onClick={() => handleSelect(table)}
              sx={{ py: 1, px: 2, '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.06) }, '&.Mui-selected': { bgcolor: alpha(theme.palette.primary.main, 0.1) } }}
            >
              <ListItemText
                primary={<Typography sx={{ fontSize: '0.9rem', fontWeight: 600, fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif' }}>{table.tableName}</Typography>}
                secondary={<Typography sx={{ fontSize: '0.8rem', color: 'text.secondary', fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif' }}>Reference Column: {table.referenceColumn}</Typography>}
              />
            </ListItemButton>
          ))}
        </List>
      </Popover>
    </Box>
  );
};

export default ReferenceColumnAutocomplete;
