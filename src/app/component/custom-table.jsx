import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Chip,
  Alert,
  Card,
  CircularProgress,
  IconButton,
  Tooltip,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  DeleteOutline as DeleteOutlineIcon,
  VpnKeyOutlined as KeyOutlineIcon,
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';

const CreateTableDialog = ({ open, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    tableName: '',
    description: '',
    tableType: 'OPERATIONAL',
  });
  const [columns, setColumns] = useState([]);
  const [primaryKeys, setPrimaryKeys] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // DataGrid columns configuration
  const columnColumns = [
    {
      field: 'columnName',
      headerName: 'COLUMN NAME',
      width: 220,
      editable: true,
      headerClassName: 'column-header',
    },
    {
      field: 'dataType',
      headerName: 'DATA TYPE',
      width: 140,
      editable: true,
      type: 'singleSelect',
      valueOptions: ['STRING', 'NUMBER', 'DATE', 'BOOLEAN'],
      headerClassName: 'column-header',
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          variant="outlined"
          sx={{
            fontSize: '0.75rem',
            height: 24,
            borderColor: 'primary.light',
            color: 'text.primary',
          }}
        />
      ),
    },
    {
      field: 'nullable',
      headerName: 'NULLABLE',
      width: 100,
      type: 'boolean',
      editable: true,
      headerClassName: 'column-header',
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          <Chip
            label={params.value ? 'NULL' : 'NOT NULL'}
            size="small"
            color={params.value ? 'default' : 'primary'}
            variant={params.value ? 'outlined' : 'filled'}
            sx={{ fontSize: '0.7rem', height: 22 }}
          />
        </Box>
      ),
    },
    {
      field: 'isPrimaryKey',
      headerName: 'PRIMARY KEY',
      width: 120,
      headerClassName: 'column-header',
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          <Tooltip title={primaryKeys.includes(params.row.columnName) ? 'Remove as primary key' : 'Set as primary key'}>
            <IconButton
              size="small"
              onClick={() => handleTogglePrimaryKey(params.row.columnName)}
              color={primaryKeys.includes(params.row.columnName) ? 'primary' : 'default'}
              sx={{
                border: primaryKeys.includes(params.row.columnName) ? '1px solid' : '1px solid',
                borderColor: primaryKeys.includes(params.row.columnName) ? 'primary.main' : 'divider',
                backgroundColor: primaryKeys.includes(params.row.columnName) ? 'primary.light' : 'transparent',
                '&:hover': {
                  backgroundColor: primaryKeys.includes(params.row.columnName) ? 'primary.main' : 'action.hover',
                  '& .MuiSvgIcon-root': {
                    color: primaryKeys.includes(params.row.columnName) ? 'white' : 'inherit',
                  },
                },
              }}
            >
              <KeyOutlineIcon 
                fontSize="small" 
                sx={{ 
                  color: primaryKeys.includes(params.row.columnName) ? 'primary.main' : 'action.active',
                }} 
              />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
    {
      field: 'actions',
      headerName: '',
      width: 60,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          <Tooltip title="Delete column">
            <IconButton
              color="error"
              size="small"
              onClick={() => handleDeleteColumn(params.row.id)}
              sx={{ 
                border: '1px solid',
                borderColor: 'divider',
                opacity: 0.7, 
                '&:hover': { 
                  opacity: 1,
                  backgroundColor: 'error.light',
                  borderColor: 'error.main',
                  '& .MuiSvgIcon-root': {
                    color: 'error.main',
                  },
                } 
              }}
            >
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  const addColumn = () => {
    const newColumn = {
      id: `col_${Date.now()}`,
      columnName: '',
      dataType: 'STRING',
      nullable: true,
    };
    setColumns([...columns, newColumn]);
  };

  const handleDeleteColumn = (columnId) => {
    const columnToDelete = columns.find(col => col.id === columnId);
    const updatedColumns = columns.filter(col => col.id !== columnId);
    setColumns(updatedColumns);
    
    if (columnToDelete && primaryKeys.includes(columnToDelete.columnName)) {
      setPrimaryKeys(primaryKeys.filter(pk => pk !== columnToDelete.columnName));
    }
  };

  const handleTogglePrimaryKey = (columnName) => {
    if (primaryKeys.includes(columnName)) {
      setPrimaryKeys(primaryKeys.filter(pk => pk !== columnName));
    } else {
      setPrimaryKeys([...primaryKeys, columnName]);
    }
  };

  const handleProcessRowUpdate = (newRow) => {
    const updatedColumns = columns.map(col => 
      col.id === newRow.id ? newRow : col
    );
    setColumns(updatedColumns);
    return newRow;
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.tableName.trim()) {
      newErrors.tableName = 'Table name is required';
    }
    
    if (columns.length === 0) {
      newErrors.columns = 'At least one column is required';
    }
    
    const columnErrors = columns.some(col => !col.columnName.trim());
    if (columnErrors) {
      newErrors.columns = 'All columns must have a name';
    }
    
    if (primaryKeys.length === 0) {
      newErrors.primaryKeys = 'At least one primary key is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const tableData = {
        ...formData,
        columns: columns.map((col, index) => ({
          userField: `USERFIELD${index + 1}`,
          columnName: col.columnName,
          dataType: col.dataType,
          nullable: col.nullable,
          displayOrder: index,
        })),
        primaryKeys,
      };
      
      console.log('Submitting:', tableData);
      await new Promise(resolve => setTimeout(resolve, 1000));
      onSuccess();
      
      // Reset form
      setFormData({ tableName: '', description: '', tableType: 'OPERATIONAL' });
      setColumns([]);
      setPrimaryKeys([]);
    } catch (error) {
      console.error('Error creating table:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      slotProps={{
        sx: {
          borderRadius: 2,
          boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
        }
      }}
    >
      <DialogTitle sx={{ 
        pb: 1,
        borderBottom: '1px solid',
        borderColor: 'divider'
      }}>
        <Typography variant="h6" fontWeight="600">
          Create Custom Table
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Define your table structure and properties
        </Typography>
      </DialogTitle>
      
      <DialogContent sx={{ p: 3 }}>
        {/* Basic Information */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" fontWeight="600" sx={{ mb: 2 }}>
            Basic Information
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
            <TextField
              fullWidth
              label="Table Name"
              value={formData.tableName}
              onChange={(e) => setFormData({ ...formData, tableName: e.target.value })}
              error={!!errors.tableName}
              helperText={errors.tableName}
              size="small"
              required
            />
            <FormControl fullWidth size="small">
              <InputLabel>Table Type</InputLabel>
              <Select
                value={formData.tableType}
                label="Table Type"
                onChange={(e) => setFormData({ ...formData, tableType: e.target.value })}
              >
                <MenuItem value="OPERATIONAL">Operational</MenuItem>
                <MenuItem value="REFERENCE">Reference</MenuItem>
              </Select>
            </FormControl>
          </Box>
          <TextField
            fullWidth
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            multiline
            rows={2}
            size="small"
            sx={{ mt: 2 }}
            placeholder="Brief description of this table's purpose..."
          />
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Columns Section */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box>
              <Typography variant="subtitle2" fontWeight="600">
                Table Structure
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Define columns and their properties
              </Typography>
            </Box>
            <Button
              startIcon={<AddIcon />}
              onClick={addColumn}
              variant="outlined"
              size="small"
              sx={{ borderRadius: 1 }}
            >
              Add Column
            </Button>
          </Box>

          {errors.columns && (
            <Alert severity="error" sx={{ mb: 2 }} size="small">
              {errors.columns}
            </Alert>
          )}

          {columns.length > 0 ? (
            <Card variant="outlined" sx={{ borderRadius: 1 , p: 2}}>
              <DataGrid
                rows={columns}
                columns={columnColumns}
                disableRowSelectionOnClick
                disableColumnMenu
                hideFooter
                autoHeight
                editMode="row"
                processRowUpdate={handleProcessRowUpdate}
                onProcessRowUpdateError={(error) => console.error(error)}
                density="compact"
                sx={{
                  border: 'none',
                  '& .MuiDataGrid-cell': {
                    border: 'none',
                    py: 0.5,
                    display: 'flex',
                    alignItems: 'center',
                  },
                  '& .MuiDataGrid-columnHeaders': {
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    backgroundColor: 'background.default',
                    minHeight: '36px !important',
                    maxHeight: '36px !important',
                  },
                  '& .MuiDataGrid-columnHeader': {
                    py: 1,
                  },
                  '& .MuiDataGrid-columnHeaderTitle': {
                    fontWeight: 600,
                  },
                  '& .column-header': {
                    fontWeight: '600',
                    fontSize: '0.75rem',
                    color: 'text.secondary',
                  },
                  '& .MuiDataGrid-row': {
                    minHeight: '40px !important',
                    maxHeight: '40px !important',
                    '&:hover': {
                      backgroundColor: 'action.hover',
                    },
                  },
                  '& .MuiDataGrid-virtualScroller': {
                    minHeight: 120,
                  },
                  '& .MuiDataGrid-cell--editable': {
                    '&:focus': {
                      outline: '2px solid',
                      outlineColor: 'primary.main',
                      outlineOffset: -2,
                    },
                  },
                }}
              />
            </Card>
          ) : (
            <Alert severity="info" sx={{ borderRadius: 1 }} size="small">
              No columns defined. Click "Add Column" to start building your table structure.
            </Alert>
          )}
        </Box>

        {/* Primary Keys Section */}
        <Box>
          <Typography variant="subtitle2" fontWeight="600" sx={{ mb: 1 }}>
            Primary Keys
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
            Click the key icon to set columns as primary keys
          </Typography>

          {errors.primaryKeys && (
            <Alert severity="error" sx={{ mb: 2 }} size="small">
              {errors.primaryKeys}
            </Alert>
          )}

          {primaryKeys.length > 0 ? (
            <Box display="flex" flexWrap="wrap" gap={1}>
              {primaryKeys.map((pk, index) => (
                <Chip
                  key={index}
                  label={pk}
                  color="primary"
                  variant="filled"
                  size="small"
                  onDelete={() => handleTogglePrimaryKey(pk)}
                  deleteIcon={<KeyOutlineIcon />}
                  sx={{ borderRadius: 1 }}
                />
              ))}
            </Box>
          ) : (
            <Alert severity="warning" sx={{ borderRadius: 1 }} size="small">
              No primary keys selected. Select at least one column as primary key.
            </Alert>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 2, gap: 1, borderTop: '1px solid', borderColor: 'divider' }}>
        <Button 
          onClick={onClose} 
          disabled={loading}
          sx={{ borderRadius: 1 }}
        >
          Cancel
        </Button>
        <Box flex={1} />
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          disabled={loading || columns.length === 0 || primaryKeys.length === 0}
          startIcon={loading ? <CircularProgress size={16} /> : null}
          sx={{ borderRadius: 1, px: 3 }}
        >
          {loading ? 'Creating...' : 'Create Table'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateTableDialog;