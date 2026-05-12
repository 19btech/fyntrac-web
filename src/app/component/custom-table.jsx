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
  Divider,
  Slide,
  Stack,
  Switch,
  Select,
  FormControl,
  InputLabel,
  InputAdornment,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import {
  Add as AddIcon,
  DeleteOutline as DeleteOutlineIcon,
  VpnKeyOutlined as KeyOutlineIcon,
  InfoOutlined as InfoIcon,
  ErrorOutline as ErrorIcon,
  Key as KeyIcon,
  TableChartOutlined as TableIcon,
  ViewColumnOutlined as ColumnsIcon,
  TuneOutlined as TuneIcon,
  LockOutlined as LockIcon,
} from '@mui/icons-material';
import { dataloaderApi } from '../services/api-client';
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

// Section wrapper for the dialog body — gives each block a numbered badge,
// icon, title, optional description and a slot for an action button.
const SectionCard = ({ theme, step, icon, title, description, action, children }) => (
  <Box
    sx={{
      borderRadius: 3,
      border: '1px solid',
      borderColor: alpha(theme.palette.divider, 0.7),
      bgcolor: 'background.paper',
      overflow: 'hidden',
      boxShadow: '0 1px 2px rgba(15,23,42,0.04)',
    }}
  >
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        px: 2.5,
        py: 1.5,
        borderBottom: '1px solid',
        borderColor: alpha(theme.palette.divider, 0.6),
        bgcolor: alpha(theme.palette.primary.main, 0.025),
      }}
    >
      <Box
        sx={{
          width: 28,
          height: 28,
          borderRadius: '50%',
          bgcolor: alpha(theme.palette.primary.main, 0.12),
          color: theme.palette.primary.main,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.75rem',
          fontWeight: 700,
          flexShrink: 0,
          border: `1.5px solid ${alpha(theme.palette.primary.main, 0.25)}`,
        }}
      >
        {step}
      </Box>
      <Box sx={{ color: theme.palette.primary.main, display: 'flex' }}>{icon}</Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
          {title}
        </Typography>
        {description && (
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.72rem' }}>
            {description}
          </Typography>
        )}
      </Box>
      {action}
    </Box>
    <Box sx={{ p: 2.5 }}>{children}</Box>
  </Box>
);

const CreateTableDialog = ({ open, onClose, onSuccess, tableType, tables = [], editData = null }) => {
  // Debug: Log received props
  const theme = useTheme();

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
  const baseURL = "";
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
        await dataloaderApi.put(
          `${baseURL}/fyntrac/custom-table/${tableId}`,
          tableData,
          { headers }
        );
      } else {
        await dataloaderApi.post(
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
      const response = await dataloaderApi.get(`${baseURL}/fyntrac/custom-table/get/all-tables`, {
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
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      slots={{ transition: Slide }}
      slotProps={{ transition: { direction: 'up' } }}
      PaperProps={{
        sx: {
          borderRadius: 4,
          boxShadow: '0 32px 64px rgba(15,23,42,0.18)',
          overflow: 'hidden',
          border: '1px solid',
          borderColor: 'divider',
          height: '90vh',
          maxHeight: '900px',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif',
          '& .MuiTypography-root, & .MuiInputBase-root, & .MuiButton-root, & .MuiChip-root, & .MuiMenuItem-root, & .MuiInputLabel-root, & .MuiFormHelperText-root, & .MuiSelect-root, & .MuiAlert-root': {
            fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif',
          },
        }
      }}
    >
      {/* ── HEADER ── */}
      <DialogTitle sx={{ p: 0, flexShrink: 0 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            px: 3,
            pt: 3,
            pb: 2.5,
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <img src="fyntrac.png" alt="Fyntrac" style={{ width: 72, height: 'auto' }} />
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <Chip
                  label={currentTableType === 'REFERENCE' ? 'Reference Table' : 'Operational Table'}
                  size="small"
                  sx={{
                    height: 18,
                    fontSize: '0.6rem',
                    fontWeight: 700,
                    letterSpacing: 0.8,
                    textTransform: 'uppercase',
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    color: theme.palette.primary.main,
                    borderRadius: 1,
                  }}
                />
                {isEditMode && (
                  <Chip
                    label="Edit Mode"
                    size="small"
                    sx={{
                      height: 18,
                      fontSize: '0.6rem',
                      fontWeight: 700,
                      letterSpacing: 0.8,
                      textTransform: 'uppercase',
                      bgcolor: alpha(theme.palette.warning.main, 0.1),
                      color: theme.palette.warning.dark,
                      borderRadius: 1,
                    }}
                  />
                )}
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography variant="h6" fontWeight={700} sx={{ lineHeight: 1.2, color: 'text.primary' }}>
                  {isEditMode ? 'Edit' : 'Create'} {currentTableType === 'REFERENCE' ? 'Reference' : 'Operational'} Table
                </Typography>
                <Tooltip
                  title={
                    currentTableType === 'REFERENCE'
                      ? 'A user-defined table for static or slowly changing data used as reference inputs in calculations.'
                      : 'A user-defined activity table designed to record dynamic, period-by-period operational data.'
                  }
                  arrow
                >
                  <InfoIcon sx={{ fontSize: 16, color: 'text.disabled', cursor: 'pointer', mt: 0.2 }} />
                </Tooltip>
              </Box>
            </Box>
          </Box>

          <Tooltip title="Close" placement="left">
            <IconButton
              onClick={handleClose}
              size="small"
              sx={{
                color: 'text.secondary',
                bgcolor: 'action.hover',
                borderRadius: 2,
                '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.12), color: 'error.main' },
              }}
            >
              <HighlightOffOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </DialogTitle>

      {/* ── BODY ── */}
      <DialogContent
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'auto',
          p: 0,
          bgcolor: alpha(theme.palette.grey[500], 0.03),
        }}
      >
        <Box sx={{ px: 4, py: 3.5, display: 'flex', flexDirection: 'column', gap: 3.5 }}>

          {errors.submit && (
            <Alert
              severity="error"
              variant="outlined"
              sx={{ borderRadius: 2.5, '.MuiAlert-message': { fontWeight: 500 } }}
            >
              {errors.submit}
            </Alert>
          )}

          {/* ─── SECTION 1: TABLE INFO ─── */}
          <SectionCard
            theme={theme}
            step="1"
            icon={<TableIcon fontSize="small" />}
            title="Table Identity"
            description="Give your table a unique name and a short description."
          >
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                fullWidth
                label="Table Name"
                placeholder="e.g. customer_accounts"
                value={formData.tableName}
                onChange={(e) => setFormData({ ...formData, tableName: e.target.value })}
                error={!!errors.tableName}
                helperText={errors.tableName || ' '}
                size="small"
                required
                disabled={isEditMode}
                InputProps={{
                  endAdornment: isEditMode ? (
                    <InputAdornment position="end">
                      <LockIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
                    </InputAdornment>
                  ) : null,
                }}
                inputProps={{ style: { fontSize: '0.9rem', fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif' } }}
                InputLabelProps={{ style: { fontSize: '0.9rem', fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif' } }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5, bgcolor: 'background.paper' } }}
              />
              <TextField
                fullWidth
                label="Description"
                placeholder="Optional"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                size="small"
                helperText=" "
                inputProps={{ style: { fontSize: '0.9rem', fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif' } }}
                InputLabelProps={{ style: { fontSize: '0.9rem', fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif' } }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5, bgcolor: 'background.paper' } }}
              />
            </Stack>
          </SectionCard>

          {/* ─── SECTION 2: COLUMNS ─── */}
          <SectionCard
            theme={theme}
            step="2"
            icon={<ColumnsIcon fontSize="small" />}
            title="Columns"
            description="Define the schema. Locked rows are system-managed and cannot be edited."
            action={
              <Tooltip title="Add Column">
                <IconButton
                  onClick={addColumn}
                  size="small"
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: theme.palette.primary.main,
                    color: '#fff',
                    boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.35)}`,
                    '&:hover': {
                      background: theme.palette.primary.dark,
                      boxShadow: `0 6px 16px ${alpha(theme.palette.primary.dark, 0.4)}`,
                      transform: 'scale(1.1)',
                    },
                    transition: 'all 0.18s ease',
                  }}
                >
                  <AddIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
            }
          >
            {errors.columns && (
              <Alert
                severity="error"
                variant="outlined"
                sx={{ borderRadius: 2, mb: 1.5, py: 0.25 }}
              >
                {errors.columns}
              </Alert>
            )}

            {columns.length === 0 ? (
              <Box
                sx={{
                  py: 6,
                  textAlign: 'center',
                  borderRadius: 2.5,
                  border: '1.5px dashed',
                  borderColor: alpha(theme.palette.text.secondary, 0.2),
                  bgcolor: alpha(theme.palette.background.paper, 0.5),
                }}
              >
                <ColumnsIcon sx={{ fontSize: 36, color: 'text.disabled', mb: 1 }} />
                <Typography variant="body2" color="text.secondary" fontWeight={600}>
                  No columns yet
                </Typography>
                <Typography variant="caption" color="text.disabled">
                  Click "Add Column" above to define your first column.
                </Typography>
              </Box>
            ) : (
              <Stack spacing={1.25}>
                {/* Column-row header */}
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: '1.7fr 1fr 110px 60px 60px',
                    columnGap: 1.5,
                    px: 2,
                    py: 0.5,
                  }}
                >
                  {['Column Name', 'Data Type', 'Nullable', 'PK', ''].map((h, i) => (
                    <Typography
                      key={h + i}
                      variant="caption"
                      sx={{
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: 0.6,
                        color: 'text.disabled',
                        fontSize: '0.65rem',
                        textAlign: i >= 3 ? 'center' : 'left',
                      }}
                    >
                      {h}
                    </Typography>
                  ))}
                </Box>

                {columns.map((col) => {
                  const hasError = !!columnErrors[col.id];
                  const isPrimaryKey = primaryKeys.includes(col.columnName);
                  const canBePrimaryKey = col.canBePrimaryKey === true;
                  const isLocked = col.editable === false;

                  return (
                    <Paper
                      key={col.id}
                      elevation={0}
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: '1.7fr 1fr 110px 60px 60px',
                        columnGap: 1.5,
                        alignItems: 'center',
                        px: 2,
                        py: 1,
                        borderRadius: 2.5,
                        border: '1px solid',
                        borderColor: hasError
                          ? 'error.light'
                          : isPrimaryKey
                            ? alpha(theme.palette.warning.main, 0.4)
                            : alpha(theme.palette.divider, 0.8),
                        bgcolor: isLocked
                          ? alpha(theme.palette.grey[500], 0.04)
                          : 'background.paper',
                        transition: 'all 0.18s ease',
                        '&:hover': {
                          borderColor: hasError
                            ? 'error.main'
                            : isLocked
                              ? alpha(theme.palette.divider, 0.8)
                              : alpha(theme.palette.primary.main, 0.4),
                          boxShadow: isLocked
                            ? 'none'
                            : `0 2px 8px ${alpha(theme.palette.primary.main, 0.06)}`,
                        },
                      }}
                    >
                      {/* Column name */}
                      <TextField
                        value={col.columnName}
                        onChange={(e) => updateColumnField(col.id, 'columnName', e.target.value)}
                        error={hasError}
                        helperText={hasError ? columnErrors[col.id] : ''}
                        size="small"
                        fullWidth
                        placeholder="column_name"
                        disabled={isLocked}
                        InputProps={{
                          endAdornment: isLocked ? (
                            <InputAdornment position="end">
                              <LockIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
                            </InputAdornment>
                          ) : null,
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                            fontSize: '0.9rem',
                            bgcolor: isLocked ? 'transparent' : 'background.paper',
                            '& fieldset': { borderColor: 'transparent' },
                            '&:hover fieldset': { borderColor: isLocked ? 'transparent' : alpha(theme.palette.primary.main, 0.3) },
                            '&.Mui-focused fieldset': { borderColor: 'primary.main' },
                          },
                          '& .MuiFormHelperText-root': { mt: 0.25, ml: 0.5, fontSize: '0.7rem' },
                        }}
                      />

                      {/* Data type */}
                      <FormControl size="small" fullWidth disabled={col.typeEditable === false}>
                        <Select
                          value={col.dataType}
                          onChange={(e) => updateColumnField(col.id, 'dataType', e.target.value)}
                          sx={{
                            borderRadius: 2,
                            fontSize: '0.9rem',
                            fontWeight: 600,
                            bgcolor: alpha(theme.palette.primary.main, 0.06),
                            color: theme.palette.primary.main,
                            '& fieldset': { borderColor: 'transparent' },
                            '&:hover fieldset': { borderColor: 'transparent' },
                            '&.Mui-focused fieldset': { borderColor: 'primary.main' },
                            '&.Mui-disabled': { bgcolor: alpha(theme.palette.grey[500], 0.06), color: 'text.secondary' },
                          }}
                        >
                          <MenuItem value="STRING">STRING</MenuItem>
                          <MenuItem value="NUMBER">NUMBER</MenuItem>
                          <MenuItem value="DATE">DATE</MenuItem>
                          <MenuItem value="BOOLEAN">BOOLEAN</MenuItem>
                        </Select>
                      </FormControl>

                      {/* Nullable switch */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        <Switch
                          size="small"
                          checked={!col.nullable}
                          disabled={col.nullableEditable === false}
                          onChange={() => updateColumnField(col.id, 'nullable', !col.nullable)}
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': { color: '#14213d' },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#14213d' },
                            '& .MuiSwitch-switchBase.Mui-checked.Mui-disabled': { color: '#94a3b8' },
                            '& .MuiSwitch-switchBase.Mui-checked.Mui-disabled + .MuiSwitch-track': { bgcolor: '#94a3b8', opacity: 0.5 },
                          }}
                        />
                        <Typography
                          variant="caption"
                          sx={{
                            fontWeight: 700,
                            fontSize: '0.65rem',
                            color: !col.nullable ? '#14213d' : 'text.disabled',
                            letterSpacing: 0.4,
                          }}
                        >
                          {col.nullable ? 'NULL' : 'NOT NULL'}
                        </Typography>
                      </Box>

                      {/* PK toggle */}
                      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <Tooltip title={!canBePrimaryKey ? 'Cannot be PK' : isPrimaryKey ? 'Remove PK' : 'Set as PK'}>
                          <span>
                            <IconButton
                              size="small"
                              disabled={!canBePrimaryKey}
                              onClick={() => handleTogglePrimaryKey(col.columnName)}
                              sx={{
                                width: 32,
                                height: 32,
                                borderRadius: 2,
                                color: isPrimaryKey ? '#fff' : 'text.disabled',
                                bgcolor: isPrimaryKey ? theme.palette.warning.main : 'transparent',
                                border: '1.5px solid',
                                borderColor: isPrimaryKey ? theme.palette.warning.main : alpha(theme.palette.text.secondary, 0.2),
                                opacity: canBePrimaryKey ? 1 : 0.35,
                                transition: 'all 0.15s',
                                '&:hover': {
                                  bgcolor: isPrimaryKey ? theme.palette.warning.dark : alpha(theme.palette.warning.main, 0.1),
                                  borderColor: theme.palette.warning.main,
                                  color: isPrimaryKey ? '#fff' : theme.palette.warning.main,
                                },
                              }}
                            >
                              {isPrimaryKey ? <KeyIcon sx={{ fontSize: 16 }} /> : <KeyOutlineIcon sx={{ fontSize: 16 }} />}
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Box>

                      {/* Delete */}
                      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <Tooltip title={col.deletable === false ? 'Locked column' : 'Delete column'}>
                          <span>
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteColumn(col.id)}
                              disabled={col.deletable === false}
                              sx={{
                                width: 32,
                                height: 32,
                                borderRadius: 2,
                                color: 'text.disabled',
                                opacity: col.deletable === false ? 0.3 : 1,
                                '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.12), color: 'error.main' },
                              }}
                            >
                              <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Box>
                    </Paper>
                  );
                })}
              </Stack>
            )}
          </SectionCard>

          {/* ─── SECTION 3: CONFIGURATION ─── */}
          <SectionCard
            theme={theme}
            step="3"
            icon={<TuneIcon fontSize="small" />}
            title="Configuration"
            description={
              currentTableType === 'REFERENCE'
                ? 'Pick the column used to look up records from this reference table.'
                : 'Link a reference table to enrich this operational dataset.'
            }
          >
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems="flex-start">
              {/* Primary keys */}
              <Box sx={{ flex: 1, width: '100%' }}>
                <Typography
                  variant="caption"
                  sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6, color: 'text.secondary', display: 'block', mb: 1 }}
                >
                  Primary Keys
                </Typography>
                {primaryKeys.length > 0 ? (
                  <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                    {primaryKeys.map((pk) => (
                      <Chip
                        key={pk}
                        icon={<KeyIcon sx={{ fontSize: '13px !important' }} />}
                        label={pk}
                        onDelete={() => handleTogglePrimaryKey(pk)}
                        size="small"
                        sx={{
                          fontWeight: 600,
                          fontSize: '0.72rem',
                          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                          borderRadius: 1.5,
                          bgcolor: alpha(theme.palette.warning.main, 0.12),
                          color: theme.palette.warning.dark,
                          border: `1px solid ${alpha(theme.palette.warning.main, 0.3)}`,
                          '& .MuiChip-deleteIcon': {
                            color: theme.palette.warning.dark,
                            '&:hover': { color: theme.palette.warning.main },
                          },
                        }}
                      />
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.disabled" sx={{ fontStyle: 'italic', fontSize: '0.8rem' }}>
                    No primary key selected — toggle the key icon on a column above.
                  </Typography>
                )}
                {errors.primaryKeys && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                    {errors.primaryKeys}
                  </Typography>
                )}
              </Box>

              {/* Reference column / autocomplete */}
              {currentTableType === 'REFERENCE' && (
                <Box sx={{ width: { xs: '100%', md: 320 } }}>
                  <FormControl size="small" fullWidth required error={!!errors.referenceColumn}>
                    <InputLabel>Reference Column</InputLabel>
                    <Select
                      label="Reference Column"
                      value={referenceColumn}
                      onChange={(e) => setReferenceColumn(e.target.value)}
                      sx={{
                        borderRadius: 2.5,
                        bgcolor: 'background.paper',
                        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                        fontSize: '0.9rem',
                      }}
                    >
                      <MenuItem value="" disabled>Select Reference Column</MenuItem>
                      {columns.map((col) => (
                        <MenuItem
                          key={col.id}
                          value={col.columnName}
                          disabled={!col.columnName || !!columnErrors[col.id]}
                          sx={{ fontFamily: 'ui-monospace, monospace', fontSize: '0.9rem' }}
                        >
                          {col.columnName || '(Unnamed)'}
                        </MenuItem>
                      ))}
                    </Select>
                    <Typography variant="caption" sx={{ mt: 0.5, ml: 1.5, color: errors.referenceColumn ? 'error.main' : 'text.disabled' }}>
                      {errors.referenceColumn || 'Used by other tables for lookups.'}
                    </Typography>
                  </FormControl>
                </Box>
              )}

              {currentTableType === 'OPERATIONAL' && (
                <Box sx={{ width: { xs: '100%', md: 320 } }}>
                  <ReferenceColumnAutocomplete
                    tables={referenceTables}
                    value={selectedReferenceTable}
                    onSelect={onReferenceColumnSelect}
                  />
                </Box>
              )}
            </Stack>
          </SectionCard>

        </Box>
      </DialogContent>

      {/* ── FOOTER ── */}
      <DialogActions
        sx={{
          px: 4,
          py: 2.25,
          borderTop: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
          justifyContent: 'space-between',
          gap: 1.5,
        }}
      >
        <Typography variant="caption" color="text.disabled" sx={{ fontWeight: 500 }}>
          {columns.length} column{columns.length !== 1 ? 's' : ''} · {primaryKeys.length} primary key{primaryKeys.length !== 1 ? 's' : ''}
        </Typography>
        <Stack direction="row" spacing={1.25}>
          <Button
            onClick={handleClose}
            variant="text"
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              color: 'text.secondary',
              px: 2.5,
              '&:hover': { bgcolor: 'action.hover' },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={!canSubmit() || loading}
            startIcon={loading ? <CircularProgress size={14} color="inherit" /> : null}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 700,
              minWidth: 150,
              px: 3,
              background: '#14213d',
              color: '#fff',
              boxShadow: `0 6px 16px ${alpha('#14213d', 0.35)}`,
              '&:hover': {
                background: '#0d1628',
                boxShadow: `0 8px 22px ${alpha('#14213d', 0.45)}`,
              },
              '&.Mui-disabled': {
                background: alpha('#14213d', 0.4),
                color: '#fff',
                boxShadow: 'none',
              },
            }}
          >
            {loading
              ? (isEditMode ? 'Updating…' : 'Creating…')
              : (isEditMode ? 'Update Table' : 'Create Table')}
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
};

export default CreateTableDialog;
