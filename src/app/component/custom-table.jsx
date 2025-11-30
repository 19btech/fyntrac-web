import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Chip,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  Paper,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  DeleteOutline as DeleteOutlineIcon,
  VpnKeyOutlined as KeyOutlineIcon,
  InfoOutlined as InfoIcon,
  ErrorOutline as ErrorIcon,
  Key as KeyIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { useTenant } from "../tenant-context";
import ReferenceColumnAutocomplete from "./reference-column-select";
import HighlightOffOutlinedIcon from '@mui/icons-material/HighlightOffOutlined';
// Column name validation
const validateColumnName = (columnName) => {
  if (!columnName?.trim()) return 'Column name is required';

  const regex = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
  if (!regex.test(columnName))
    return 'Invalid column name: start with letter/underscore, use letters/numbers/underscores only';

  if (columnName.length > 63) return 'Column name cannot exceed 63 characters';

  const reserved = [
    'select', 'insert', 'update', 'delete', 'create', 'drop', 'table', 'column', 'key',
    'from', 'where', 'join', 'and', 'or', 'not', 'null', 'primary', 'foreign', 'references'
  ];
  if (reserved.includes(columnName.toLowerCase())) return 'Cannot use SQL reserved keyword';

  return null;
};

const CreateTableDialog = ({ open, onClose, onSuccess, tableType, tables = [] }) => {
  const [formData, setFormData] = useState({ tableName: '', description: '' });
  const [columns, setColumns] = useState([]);
  const [primaryKeys, setPrimaryKeys] = useState([]);
  const [referenceColumn, setReferenceColumn] = useState('');
  const [selectedReferenceTable, setSelectedReferenceTable] = useState(null);
  const [errors, setErrors] = useState({});
  const [columnErrors, setColumnErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { tenant, user } = useTenant();
  const baseURL = process.env.NEXT_PUBLIC_SUBLEDGER_SERVICE_URI;
  const [currentTableType, setCurrentTableType] = useState(tableType);
  const [referenceTables, setReferenceTables] = useState(tables);

  // Inject default OPERATIONAL columns
  useEffect(() => {
    if (open && currentTableType === 'OPERATIONAL') {
      const defaultOperationalColumns = [
        { id: 'op_instrumentId', columnName: 'instrumentId', dataType: 'STRING', nullable: false, editable: false },
        { id: 'op_attributeId', columnName: 'attributeId', dataType: 'STRING', nullable: false, editable: false },
        { id: 'op_postingDate', columnName: 'postingDate', dataType: 'DATE', nullable: false, editable: false },
        { id: 'op_effectiveDate', columnName: 'effectiveDate', dataType: 'DATE', nullable: false, editable: false },
      ];
      setColumns(defaultOperationalColumns);
      setPrimaryKeys(['instrumentId', 'attributeId']);
    } else if (!open) {
      // Reset state when dialog is closed
      setColumns([]);
      setPrimaryKeys([]);
    }
  }, [open, currentTableType]);

  const headers = {
    'X-Tenant': tenant,
    'X-User-Id': user?.id || '',
    'Content-Type': 'application/json',
  };

  const addColumn = () => {
    setColumns((prev) => [
      ...prev,
      { id: `col_${Date.now()}`, columnName: '', dataType: 'STRING', nullable: true, editable: true },
    ]);
  };

  const handleDeleteColumn = (id) => {
    const col = columns.find((c) => c.id === id);
    if (col && col.editable === false) return; // Prevent deletion of non-editable columns
    setColumns(columns.filter((c) => c.id !== id));
    if (col && primaryKeys.includes(col.columnName)) {
      setPrimaryKeys(primaryKeys.filter((pk) => pk !== col.columnName));
    }
    if (col && referenceColumn === col.columnName) {
      setReferenceColumn('');
    }
    setColumnErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[id];
      return newErrors;
    });
  };

  const onReferenceColumnSelect = (referenceTable, column) => {
    setReferenceColumn(referenceTable.referenceColumn);
    setSelectedReferenceTable(referenceTable.tableName);
    console.log(selectedReferenceTable, referenceColumn);
  }


  const handleTogglePrimaryKey = (columnName) => {
    if (!columnName) return;
    setPrimaryKeys((prev) =>
      prev.includes(columnName) ? prev.filter((pk) => pk !== columnName) : [...prev, columnName]
    );
  };

  const updateColumnField = (id, field, value) => {
    setColumns(prev => prev.map(col => {
      if (col.id === id && col.editable !== false) {
        const updatedCol = { ...col, [field]: value };
        if (field === 'columnName') {
          const error = validateColumnName(value);
          setColumnErrors(prevErrors => ({
            ...prevErrors,
            [id]: error
          }));
          if (!error && col.columnName) {
            if (primaryKeys.includes(col.columnName)) {
              setPrimaryKeys(pks => pks.map(pk => pk === col.columnName ? value : pk));
            }
            if (referenceColumn === col.columnName) {
              setReferenceColumn(value);
            }
          }
        }
        return updatedCol;
      }
      return col;
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.tableName.trim()) {
      newErrors.tableName = 'Table name is required';
    } else {
      const tableNameError = validateColumnName(formData.tableName);
      if (tableNameError) newErrors.tableName = tableNameError;
    }

    if (columns.length === 0) newErrors.columns = 'At least one column is required';
    else {
      const hasInvalidColumns = columns.some(col => !col.columnName.trim() || columnErrors[col.id]);
      if (hasInvalidColumns) newErrors.columns = 'Some columns have invalid names. Please fix all column errors before submitting.';
      const names = columns.map((c) => c.columnName?.toLowerCase().trim());
      if (new Set(names).size !== names.length) newErrors.columns = 'Column names must be unique. Please ensure all column names are distinct.';
    }

    if (primaryKeys.length === 0) newErrors.primaryKeys = 'At least one primary key must be selected.';

    if (currentTableType === 'REFERENCE' && !referenceColumn) newErrors.referenceColumn = 'Reference column is required for Reference Tables.';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const tableData = {
        ...formData,
        tableType: currentTableType,
        columns: columns.map((c, i) => ({
          userField: `USERFIELD${i + 1}`,
          columnName: c.columnName,
          dataType: c.dataType,
          nullable: c.nullable,
          displayOrder: i,
        })),
        primaryKeys,
        referenceColumn,
        referenceTable: currentTableType === 'OPERATIONAL' ? selectedReferenceTable : ''
      };

      await axios.post(
        `${baseURL}/fyntrac/custom-table/create-with-physical`,
        tableData,
        { headers }
      );

      await new Promise((res) => setTimeout(res, 1000));
      onSuccess(tableData);
      handleClose();
    } catch (err) {
      console.error(err);
      setErrors(prev => ({
        ...prev,
        submit: 'Failed to create table. Please try again.'
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({ tableName: '', description: '' });
    setColumns([]);
    setPrimaryKeys([]);
    setReferenceColumn('');
    setSelectedReferenceTable(null);
    setErrors({});
    setColumnErrors({});
    setLoading(false);
    onClose();
  };

  const canSubmit = () => {
    if (loading || columns.length === 0 || primaryKeys.length === 0) return false;
    if (currentTableType === 'REFERENCE' && !referenceColumn) return false;
    const hasInvalidColumns = columns.some(col => !col.columnName.trim() || columnErrors[col.id]);
    return !hasInvalidColumns;
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth
      slotProps={{ sx: { borderRadius: 2, boxShadow: '0 8px 32px rgba(0,0,0,0.08)', height: '90vh', maxHeight: '900px', display: 'flex', flexDirection: 'column' } }}>

      <DialogTitle sx={{ flexShrink: 0, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'start',
          }}
        >
          {/* Top Left: Image */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',  // Change 'left' to 'flex-start'
              gap: 1,
              width: 'fit-content' // Ensures the Box doesn't take more space than needed
            }}
          >
            <img
              src="fyntrac.png"
              alt="Logo"
              style={{
                width: '100px',
                height: 'auto',  // Maintain aspect ratio
                maxWidth: '100%' // Ensures responsiveness
              }}
            />
            <Box display="flex" alignItems="flex-start" gap={0.5}>
              <Typography variant="h6">
                Create {currentTableType === 'REFERENCE' ? 'Reference' : 'Operational'} Table
              </Typography>
              <Tooltip
                title={
                  currentTableType === 'REFERENCE'
                    ? 'Reference tables store lookup data and require a reference column'
                    : 'Operational tables store transactional data and can link to reference tables'
                }
                arrow
              >
                <InfoIcon
                  color="action"
                  fontSize="small"
                  sx={{
                    mt: 0.3, // Fine-tuned vertical alignment
                    cursor: 'pointer'
                  }}
                />
              </Tooltip>
            </Box>
          </Box>
          <Tooltip title='Close'>
            <IconButton
              onClick={handleClose}
              edge="end"
              aria-label="close"
              sx={{
                color: 'grey.500',
                '&:hover': { color: 'black' },
              }}
            >
              <HighlightOffOutlinedIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', gap: 3, p: 3 }}>
        {errors.submit && <Alert severity="error" icon={<ErrorIcon />} sx={{ flexShrink: 0 }}>{errors.submit}</Alert>}

        <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' }, flexShrink: 0 }}>
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
          <TextField
            fullWidth
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            size="small"
          />
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: 0, flex: 1, gap: 1 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ flexShrink: 0 }}>
            <Typography variant="subtitle2" fontWeight={600} display="flex" alignItems="center" gap={1}>
              Table Columns
              <Tooltip title="Define your table structure. Ensure column names are unique and valid SQL identifiers." arrow>
                <InfoIcon color="action" fontSize="small" sx={{ fontSize: '1rem' }} />
              </Tooltip>
            </Typography>
            <Button
              size="small"
              startIcon={<AddIcon />}
              onClick={addColumn}
              variant="contained"
              sx={{ textTransform: 'none' }}
            >
              Add Column
            </Button>
          </Box>

          {errors.columns && <Alert severity="error" icon={<ErrorIcon />} sx={{ flexShrink: 0 }}>{errors.columns}</Alert>}

          <TableContainer component={Paper} variant="outlined" sx={{ flex: 1, overflowY: 'auto' }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell width="35%" sx={{ backgroundColor: 'background.paper' }}>Column Name</TableCell>
                  <TableCell width="25%" sx={{ backgroundColor: 'background.paper' }}>Data Type</TableCell>
                  <TableCell width="15%" sx={{ backgroundColor: 'background.paper' }}>Nullable</TableCell>
                  <TableCell width="15%" align="center" sx={{ backgroundColor: 'background.paper' }}>Primary Key</TableCell>
                  <TableCell width="10%" align="right" sx={{ backgroundColor: 'background.paper' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {columns.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ height: 100 }}>
                      <Typography color="text.secondary">No columns defined. Click "Add Column" to start.</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  columns.map((col) => {
                    const hasError = !!columnErrors[col.id];
                    const isPrimaryKey = primaryKeys.includes(col.columnName);
                    const canBePrimaryKey = col.columnName && !hasError;

                    return (
                      <TableRow key={col.id} hover>
                        <TableCell>
                          <TextField
                            value={col.columnName}
                            onChange={(e) => updateColumnField(col.id, 'columnName', e.target.value)}
                            error={hasError}
                            helperText={hasError ? columnErrors[col.id] : ''}
                            size="small"
                            fullWidth
                            placeholder="e.g. user_id"
                            variant="standard"
                            disabled={col.editable === false}
                            slotProps={{ disableUnderline: !hasError }}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            select
                            value={col.dataType}
                            onChange={(e) => updateColumnField(col.id, 'dataType', e.target.value)}
                            size="small"
                            fullWidth
                            variant="standard"
                            disabled={col.editable === false}
                            slotProps={{ disableUnderline: true }}
                          >
                            <MenuItem value="STRING">STRING</MenuItem>
                            <MenuItem value="NUMBER">NUMBER</MenuItem>
                            <MenuItem value="DATE">DATE</MenuItem>
                            <MenuItem value="BOOLEAN">BOOLEAN</MenuItem>
                          </TextField>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={col.nullable ? 'NULL' : 'NOT NULL'}
                            size="small"
                            onClick={() => col.editable !== false && updateColumnField(col.id, 'nullable', !col.nullable)}
                            color={col.nullable ? 'default' : 'primary'}
                            variant={col.nullable ? 'outlined' : 'filled'}
                            sx={{ cursor: col.editable !== false ? 'pointer' : 'default', width: 80 }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title={!canBePrimaryKey ? "Fix column name first" : (isPrimaryKey ? "Remove PK" : "Set PK")}>
                            <span>
                              <IconButton
                                size="small"
                                disabled={!canBePrimaryKey || col.editable === false}
                                onClick={() => handleTogglePrimaryKey(col.columnName)}
                                color={isPrimaryKey ? 'warning' : 'default'}
                              >
                                {isPrimaryKey ? <KeyIcon fontSize="small" /> : <KeyOutlineIcon fontSize="small" />}
                              </IconButton>
                            </span>
                          </Tooltip>
                        </TableCell>
                        <TableCell align="right">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteColumn(col.id)}
                            disabled={col.editable === false}
                          >
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        <Box sx={{ display: 'flex', gap: 3, pt: 2, borderTop: '1px dashed', borderColor: 'divider', flexShrink: 0 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle2" gutterBottom sx={{ color: 'text.secondary', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>
              Selected Primary Keys
            </Typography>
            {primaryKeys.length > 0 ? (
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {primaryKeys.map((pk) => (
                  <Chip
                    key={pk}
                    icon={<KeyIcon sx={{ fontSize: '14px !important' }} />}
                    label={pk}
                    onDelete={() => handleTogglePrimaryKey(pk)}
                    color="warning"
                    variant="outlined"
                    size="small"
                  />
                ))}
              </Box>
            ) : (
              <Typography variant="body2" color="text.disabled" sx={{ fontStyle: 'italic' }}>
                No primary keys selected. Use the key icon in the table above.
              </Typography>
            )}
            {errors.primaryKeys && (
              <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                {errors.primaryKeys}
              </Typography>
            )}
          </Box>

          {currentTableType === 'REFERENCE' && (
            <Box sx={{ width: '40%' }}>
              <TextField
                select
                label="Reference Column"
                value={referenceColumn}
                onChange={(e) => setReferenceColumn(e.target.value)}
                error={!!errors.referenceColumn}
                helperText={errors.referenceColumn || "Select the column used for lookups"}
                size="small"
                fullWidth
                required
              >
                <MenuItem value="" disabled>Select Reference Column</MenuItem>
                {columns.map((col) => (
                  <MenuItem
                    key={col.id}
                    value={col.columnName}
                    disabled={!col.columnName || !!columnErrors[col.id]}
                  >
                    {col.columnName || '(Unnamed)'}
                  </MenuItem>
                ))}
              </TextField>
            </Box>
          )}

          {currentTableType === 'OPERATIONAL' && (
            <ReferenceColumnAutocomplete
              tables={referenceTables}
              value={selectedReferenceTable}
              onSelect={onReferenceColumnSelect}
            />
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider', justifyContent: 'center' }}>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!canSubmit()}
          startIcon={loading && <CircularProgress size={18} />}
          sx={{
            minWidth: 120,
            bgcolor: '#14213d',
            color: 'white',
            '&:hover': {
              color: '#E6E6EF', // Prevent text color from changing on hover
            },
          }}
        >
          Create Table
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateTableDialog;
