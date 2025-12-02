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

const CreateTableDialog = ({ open, onClose, onSuccess, tableType, tables = [], editData = null }) => {
  // Debug: Log received props

  const [isEditMode, setIsEditMode] = useState(false);
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

  // Default operational columns configuration - ALL fields disabled except PK for accountingPeriod
  const defaultOperationalColumns = [
    {
      id: 'op_instrumentId',
      columnName: 'instrumentId',
      dataType: 'STRING',
      nullable: false,
      editable: false,    // Column name field disabled
      typeEditable: false, // Data type field disabled
      nullableEditable: false, // Nullable field disabled
      deletable: false,    // Delete button disabled
      canBePrimaryKey: true // Primary Key button disabled
    },
    {
      id: 'op_attributeId',
      columnName: 'attributeId',
      dataType: 'STRING',
      nullable: false,
      editable: false,
      typeEditable: false,
      nullableEditable: false,
      deletable: false,
      canBePrimaryKey: true
    },
    {
      id: 'op_postingDate',
      columnName: 'postingDate',
      dataType: 'DATE',
      nullable: false,
      editable: false,
      typeEditable: false,
      nullableEditable: false,
      deletable: false,
      canBePrimaryKey: true
    },
    {
      id: 'op_effectiveDate',
      columnName: 'effectiveDate',
      dataType: 'DATE',
      nullable: false,
      editable: false,
      typeEditable: false,
      nullableEditable: false,
      deletable: false,
      canBePrimaryKey: true
    },
    {
      id: 'op_accountingPeriod',
      columnName: 'accountingPeriod',
      dataType: 'NUMBER',
      nullable: false,
      editable: false,        // Column name field disabled
      typeEditable: false,    // Data type field disabled  
      nullableEditable: false, // Nullable field disabled
      deletable: false,       // Delete button disabled
      canBePrimaryKey: true   // ONLY Primary Key button enabled!
    },
  ];

  // Helper function to ensure column IDs
  const ensureColumnIds = (columnsArray) => {
    return columnsArray.map((col, index) => ({
      ...col,
      id: col.id || `col_${Date.now()}_${index}`
    }));
  };

  // Handle editData when component opens or editData changes
  useEffect(() => {
    console.log('🔄 useEffect triggered:', { open, editData: !!editData, editData });

    if (editData && open) {
      console.log('📝 Setting up EDIT mode with data:', editData);

      setIsEditMode(true);
      const data = editData.data || editData;

      setFormData({
        tableName: data.tableName || '',
        description: data.description || ''
      });
      setReferenceTables(tables);
      setReferenceColumn(data.referenceColumn || '');
      setSelectedReferenceTable(data.referenceTable || null);

      console.log('📝 Form data set:', {
        tableName: data.tableName,
        description: data.description,
        referenceColumn: data.referenceColumn
      });

      // Convert columns from editData to match component's format
      const convertedColumns = data.columns?.map((col, index) => {
        // Check if this is a default operational column
        const isDefaultOpColumn = tableType === 'OPERATIONAL' &&
          (['instrumentId', 'attributeId', 'postingDate', 'effectiveDate', 'accountingPeriod']
            .includes(col.columnName) || (col.columnName === data.referenceColumn));
        console.log('📝 Form data set:', {
          tableName: data.tableName,
          description: data.description,
          referenceColumn: data.referenceColumn,
          isDefaultOpColumn: isDefaultOpColumn
        });

        return {
          id: `col_${Date.now()}_${index}`,
          columnName: col.columnName,
          dataType: col.dataType,
          nullable: col.nullable,
          editable: !isDefaultOpColumn, // Default columns are not editable
          typeEditable: !isDefaultOpColumn, // Default columns data type not editable
          nullableEditable: !isDefaultOpColumn, // Default columns nullable not editable
          deletable: !isDefaultOpColumn, // Default columns cannot be deleted
          // Only accountingPeriod can be primary key for operational tables
          canBePrimaryKey: col.columnName === 'accountingPeriod'
        };
      }) || [];

      console.log('📋 Converted columns:', convertedColumns);

      setColumns(ensureColumnIds(convertedColumns));
      setPrimaryKeys(data.primaryKeys || []);
      setReferenceColumn(data.referenceColumn || '');
      setSelectedReferenceTable(data.referenceTable || null);
      setCurrentTableType(data.tableType || tableType);

      console.log('✅ Edit mode state set:', {
        columnsCount: convertedColumns.length,
        primaryKeys: data.primaryKeys,
        referenceColumn: data.referenceColumn,
        tableType: data.tableType,
        selectedReferenceTable: data.referenceTable
      });
    } else if (open && !editData) {
      console.log('🆕 Setting up CREATE mode');
      // Reset to create mode
      setIsEditMode(false);
      setFormData({ tableName: '', description: '' });
      setColumns([]);
      setPrimaryKeys([]);
      setReferenceColumn('');
      setSelectedReferenceTable(null);
      setCurrentTableType(tableType);

      // Inject default OPERATIONAL columns for create mode
      if (tableType === 'OPERATIONAL') {
        setColumns(defaultOperationalColumns);
      }
    }
  }, [editData, tableType, open]);



  const headers = {
    'X-Tenant': tenant,
    'X-User-Id': user?.id || '',
    'Content-Type': 'application/json',
  };

  const addColumn = () => {
    setColumns((prev) => [
      ...prev,
      {
        id: `col_${Date.now()}`,
        columnName: '',
        dataType: 'STRING',
        nullable: true,
        editable: true,      // User-added columns: editable
        typeEditable: true,  // User-added columns: data type editable
        nullableEditable: true, // User-added columns: nullable editable
        deletable: true,     // User-added columns: deletable
        canBePrimaryKey: true
      },
    ]);
  };

  const handleDeleteColumn = (id) => {
    const col = columns.find((c) => c.id === id);
    if (col && col.deletable === false) return; // Prevent deletion of non-deletable columns
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

  const onReferenceColumnSelect = (referenceTable, columnObj) => {
    console.log('📊 Reference table selected:', referenceTable);
    console.log('📊 Column object received:', columnObj);

    if (referenceTable) {
      setSelectedReferenceTable(referenceTable.tableName);
      setReferenceColumn(columnObj.columnName);
      // If we have the column object, you can use its properties
      if (columnObj) {
        console.log('Column details:', {
          name: columnObj.columnName,
          type: columnObj.dataType,
          nullable: columnObj.nullable,
          displayOrder: columnObj.displayOrder
        });
        setColumns(prevCols => {
          const ref = {
            id: `op_${columnObj.columnName}`,
            columnName: columnObj.columnName,
            dataType: columnObj.dataType,
            nullable: columnObj.nullable,
            editable: false,
            typeEditable: false,
            nullableEditable: false,
            deletable: false,
            canBePrimaryKey: true // Reference table columns cannot be primary keys
          };

          const exists = prevCols.some(c => c.id === ref.id);

          // If already exists → return as is
          if (exists) return prevCols;

          // Add at the top
          return [ref, ...prevCols];
        });

        console.log('Columns after adding reference column:', columns);

        // You can use the column object as needed
        // For example, you might want to set some state based on it
        // setReferenceColumn(columnObj.columnName);
      }
    } else {
      // Handle clear/removal
      setSelectedReferenceTable(null);
    }
  };

  const handleTogglePrimaryKey = (columnName) => {
    if (!columnName) return;

    // Find the column
    const column = columns.find(col => col.columnName === columnName);

    // Check if this column can be a primary key
    if (column && column.canBePrimaryKey !== true) {
      console.log('⛔ Column cannot be set as primary key:', columnName);
      return;
    }

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

    // Validate that all primary keys still exist in columns
    const existingColumnNames = columns.map(col => col.columnName);
    const missingPrimaryKeys = primaryKeys.filter(pk => !existingColumnNames.includes(pk));
    if (missingPrimaryKeys.length > 0) {
      newErrors.primaryKeys = `Primary key(s) "${missingPrimaryKeys.join(', ')}" no longer exist in columns.`;
    }


    if (currentTableType === 'REFERENCE' && !referenceColumn) newErrors.referenceColumn = 'Reference column is required for Reference Tables.';

    if (currentTableType === 'REFERENCE' && referenceColumn && !existingColumnNames.includes(referenceColumn)) {
      newErrors.referenceColumn = 'Reference column must exist in the table columns.';
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

      const tableId = editData?.id;

      console.log('🚀 Submitting table:', {
        isEditMode,
        tableId,
        tableData
      });

      if (isEditMode && tableId) {
        await axios.put(
          `${baseURL}/fyntrac/custom-table/${tableId}`,
          tableData,
          { headers }
        );
      } else {
        await axios.post(
          `${baseURL}/fyntrac/custom-table/create-with-physical`,
          tableData,
          { headers }
        );
      }

      await new Promise((res) => setTimeout(res, 1000));
      onSuccess(tableData);
      handleClose();
    } catch (err) {
      console.error('❌ Error details:', err);
      console.error('📡 Error response:', err.response?.data);
      setErrors(prev => ({
        ...prev,
        submit: err.response?.data?.error ||
          `Failed to ${isEditMode ? 'update' : 'create'} table. Please try again.`
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
    setIsEditMode(false);
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 1, width: 'fit-content' }}>
            <img src="fyntrac.png" alt="Logo" style={{ width: '100px', height: 'auto', maxWidth: '100%' }} />
            <Box display="flex" alignItems="flex-start" gap={0.5}>
              <Typography variant="h6">
                {isEditMode ? 'Edit' : 'Create'} {currentTableType === 'REFERENCE' ? 'Reference' : 'Operational'} Table
                {isEditMode && <Chip label="Edit Mode" size="small" color="primary" sx={{ ml: 1 }} />}
              </Typography>
              <Tooltip
                title={
                  currentTableType === 'REFERENCE'
                    ? 'Reference tables store lookup data and require a reference column'
                    : 'Operational tables store transactional data and can link to reference tables'
                }
                arrow
              >
                <InfoIcon color="action" fontSize="small" sx={{ mt: 0.3, cursor: 'pointer' }} />
              </Tooltip>
            </Box>
          </Box>
          <Tooltip title='Close'>
            <IconButton onClick={handleClose} edge="end" aria-label="close" sx={{ color: 'grey.500', '&:hover': { color: 'black' } }}>
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
            disabled={isEditMode}
            InputProps={{
              readOnly: isEditMode,
            }}
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
              Table Columns {isEditMode && <Chip label="Edit Mode" size="small" color="primary" />}
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
                    // For default columns, PK button is enabled only if canBePrimaryKey is true
                    const canBePrimaryKey = col.canBePrimaryKey === true;

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
                            disabled={col.editable === false} // Disabled for default columns
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
                            disabled={col.typeEditable === false} // Disabled for default columns
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
                            onClick={() => col.nullableEditable !== false && updateColumnField(col.id, 'nullable', !col.nullable)}
                            color={col.nullable ? 'default' : 'primary'}
                            variant={col.nullable ? 'outlined' : 'filled'}
                            sx={{
                              cursor: col.nullableEditable !== false ? 'pointer' : 'default',
                              width: 80,
                              opacity: col.nullableEditable === false ? 0.6 : 1
                            }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title={
                            !canBePrimaryKey ? "This column cannot be a primary key" :
                              isPrimaryKey ? "Remove PK" : "Set PK"
                          }>
                            <span>
                              <IconButton
                                size="small"
                                disabled={!canBePrimaryKey} // Only enabled for accountingPeriod
                                onClick={() => handleTogglePrimaryKey(col.columnName)}
                                color={isPrimaryKey ? 'warning' : 'default'}
                                sx={{
                                  opacity: canBePrimaryKey ? 1 : 0.5,
                                }}
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
                            disabled={col.deletable === false} // Disabled for default columns
                            sx={{ opacity: col.deletable === false ? 0.5 : 1 }}
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
              {currentTableType === 'OPERATIONAL' && (
                <Typography variant="caption" color="text.secondary" sx={{ ml: 1, fontStyle: 'italic' }}>
                  (Only accountingPeriod allowed for operational tables)
                </Typography>
              )}
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
                {currentTableType === 'OPERATIONAL' && ' (Only accountingPeriod can be selected)'}
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
          {loading ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Table' : 'Create Table')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateTableDialog;