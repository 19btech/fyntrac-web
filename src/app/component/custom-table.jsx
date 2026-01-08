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
  const [existingTables, setExistingTables] = useState(['']);

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
    let newErrors = {};
    let isValid = true;
    console.log('🔍 Starting validation...');
    console.log('Current form data:', formData);
    console.log('Existing tables:', existingTables);
    console.log('Columns:', columns);
    console.log('Primary keys:', primaryKeys);
    console.log('Reference column:', referenceColumn);

    /* ---------------------------------------------
       TABLE NAME VALIDATION
    ---------------------------------------------- */
    if (!formData.tableName.trim()) {
      newErrors.tableName = 'Table name is required';
      console.log('❌ Table name empty');
      isValid = false;
    } {
      console.log('✓ Table name not empty:', formData.tableName);

      const tableNameError = validateColumnName(formData.tableName);
      if (tableNameError) {
        newErrors.tableName = tableNameError;
        console.log('❌ Table name invalid:', tableNameError);
        isValid = false;
      } else {
        console.log('✓ Table name format valid');

        if (existingTables) {
          // Check if existingTables is the full response object
          let tablesArray = [];

          if (existingTables && Array.isArray(existingTables)) {
            // It's an object with data array (your current structure)
            tablesArray = existingTables;
            console.log('🔍 Tables array for duplicate check:', tablesArray);

            if (Array.isArray(tablesArray) && tablesArray.length > 0) {
              // Extract table names from the objects in the array
              const tableNames = tablesArray.map(item => {
                if (typeof item === 'string') return item;
                if (item?.tableName) return item.tableName;
                if (item?.name) return item.name;
                return '';
              }).filter(name => name && name.trim() !== '');

              console.log('📋 Table names extracted:', tableNames);

              const duplicateFound = tableNames
                .map(t => t.toLowerCase())
                .includes(formData.tableName.toLowerCase());

              if (duplicateFound) {
                newErrors.tableName = `Table "${formData.tableName}" already exists.`;
                console.log('❌ Duplicate table found!');
                isValid = false;
              } else {
                console.log('✓ No duplicate table found');
              }
            } else {
              console.log('⚠ No tables array found or array is empty');
            }
          }
        }
        else {
          console.log('⚠ existingTables is null or undefined');
        }
      }
    }

    /* ---------------------------------------------
       COLUMNS VALIDATION
    ---------------------------------------------- */
    if (columns.length === 0) {
      newErrors.columns = 'At least one column is required';
      console.log('❌ No columns');
      isValid = false; // Stop validations
    } else {
      console.log(`✓ ${columns.length} column(s)`);

      const hasInvalidColumns = columns.some(
        col => !col.columnName.trim() || columnErrors[col.id]
      );
      if (hasInvalidColumns) {
        newErrors.columns =
          'Some columns have invalid names. Please fix all column errors before submitting.';
        console.log('❌ Invalid columns found');
        isValid = false;
      }

      const names = columns.map(c => c.columnName?.toLowerCase().trim());
      const uniqueNames = new Set(names);

      if (uniqueNames.size !== names.length) {
        newErrors.columns =
          'Column names must be unique. Please ensure all column names are distinct.';
        console.log('❌ Duplicate column names');
        isValid = false;
      } else {
        console.log('✓ Column names are unique');
      }
    }

    /* ---------------------------------------------
       PRIMARY KEYS VALIDATION
    ---------------------------------------------- */
    if (primaryKeys.length === 0) {
      newErrors.primaryKeys = 'At least one primary key must be selected.';
      console.log('❌ No primary keys');
      isValid = false;
    } else {
      console.log(`✓ ${primaryKeys.length} primary key(s):`, primaryKeys);

      const existingColumnNames = columns.map(col => col.columnName);
      const missingPrimaryKeys = primaryKeys.filter(
        pk => !existingColumnNames.includes(pk)
      );

      if (missingPrimaryKeys.length > 0) {
        newErrors.primaryKeys = `Primary key(s) "${missingPrimaryKeys.join(', ')}" no longer exist in columns.`;
        console.log('❌ Missing primary keys:', missingPrimaryKeys);
        isValid = false;
      }

    }

    /* ---------------------------------------------
       REFERENCE COLUMN VALIDATION
    ---------------------------------------------- */
    if (currentTableType === 'REFERENCE') {
      if (!referenceColumn) {
        newErrors.referenceColumn =
          'Reference column is required for Reference Tables.';
        console.log('❌ No reference column');
        isValid = false;
      } else {
        console.log('✓ Reference column:', referenceColumn);

        const existingColumnNames = columns.map(col => col.columnName);
        if (!existingColumnNames.includes(referenceColumn)) {
          newErrors.referenceColumn =
            'Reference column must exist in the table columns.';
          console.log('❌ Reference column not in columns');
          isValid = false;
        }
      }
    }

    /* ---------------------------------------------
       FINAL RESULT
    ---------------------------------------------- */
    console.log('📊 Validation result - newErrors:', newErrors);
    console.log('📊 Validation result - error count:', Object.keys(newErrors).length);
    console.log('📊 Validation result - isValid?', Object.keys(newErrors).length === 0);
    console.log('📊 Validation result - isValid?', isValid);

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async () => {
    // Validate first
    const isValid = validateForm();

    // Check errors state after validation
    const hasErrors = Object.keys(errors).length > 0;

    console.log('Validation result:', {
      isValid,
      errorCount: Object.keys(errors).length,
      errors: errors
    });

    // Double-check: if validation failed OR there are existing errors
    if (!isValid || hasErrors) {
      console.log('❌ Validation failed, stopping submission');
      return;
    }

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

      console.log('✅ Validation passed, submitting:', tableData);

      const tableId = editData?.id;

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

  useEffect(() => {
    console.log('🔄 useEffect for tables triggered');
    console.log('Dialog open:', open);

    if (open) {
      console.log('📞 Calling fetchExistingTables...');
      fetchExistingTables();
    }
  }, [open]); // Only fetch when dialog opens

  const fetchExistingTables = async () => {
    console.log('🚀 fetchExistingTables called');
    try {
      console.log('🌐 Making API call to:', `${baseURL}/fyntrac/custom-table/get/all-tables`);
      const response = await axios.get(`${baseURL}/fyntrac/custom-table/get/all-tables`, {
        headers: headers
      });
      console.log('📡 Raw API Response:', response);
      console.log('📡 Response data:', response.data);

      // Handle different API response structures
      let tableNames = [];

      // Structure 1: { success: true, data: [...] }
      if (response.data?.success && Array.isArray(response.data?.data)) {
        console.log('✅ Found structure 1: success=true with data array');
        tableNames = response.data.data.map(item =>
          item?.tableName || item?.name || String(item)
        );
      }
      // Structure 2: Direct array response
      else if (Array.isArray(response.data)) {
        console.log('✅ Found structure 2: direct array response');
        tableNames = response.data.map(item =>
          item?.tableName || item?.name || String(item)
        );
      }
      // Structure 3: { data: [...] } without success field
      else if (Array.isArray(response.data?.data)) {
        console.log('✅ Found structure 3: data array without success field');
        tableNames = response.data.data.map(item =>
          item?.tableName || item?.name || String(item)
        );
      } else {
        console.warn('⚠️ Unexpected response structure:', response.data);
      }

      // Clean up: remove empty/null/undefined
      tableNames = tableNames
        .filter(name => name && name.trim() !== '')
        .map(name => name.trim());

      console.log('✅ Processed table names:', tableNames);
      console.log('✅ Setting existingTables to:', tableNames);
      setExistingTables(tableNames);

    } catch (error) {
      console.error('❌ Failed to fetch tables:', error);
      console.error('❌ Error response:', error.response?.data);
      setExistingTables([]); // Set to empty array on error
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
                    ? 'A user-defined table for static or slowly changing data used as reference inputs in calculations.'
                    : 'A user-defined activity table designed to record dynamic, period-by-period operational data.'
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
            slotProps={{
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
                This table needs a primary key. Select one using the key icon above.
                
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
                helperText={errors.referenceColumn || "Select the reference column used for lookups"}
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
          // 1. Use your main form submit function, not the column update function
          onClick={handleSubmit}

          // 2. Standard Primary style for a main action button
          variant="contained"
          color="primary"

          // 3. Disable based on form validity or loading state
          disabled={!canSubmit() || loading}

          // 4. Custom Styling (Lighter shade on disable)
          sx={{
            minWidth: 120,
            // Fix: Override the default grey disabled style
            '&.Mui-disabled': {
              // This is the lighter version of your primary color
              bgcolor: 'rgba(20, 33, 61, 0.5)',
              color: '#ffffff'
            }
          }}
        >
          {loading
            ? (isEditMode ? 'Updating...' : 'Creating...')
            : (isEditMode ? 'Update Table' : 'Create Table')
          }
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateTableDialog;