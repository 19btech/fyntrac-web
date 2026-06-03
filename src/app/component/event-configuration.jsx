"use client"
import React, { useState, useEffect, useCallback } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Box,
    Typography,
    TextField,
    Button,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Autocomplete,
    IconButton,
    Tooltip,
    Chip,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Grid,
    Alert,
    Slide,
    useTheme,
    Popover,
    List,
    ListItemButton,
    ListItemText,
    InputAdornment,
    Checkbox,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useTenant } from "../tenant-context";
import HighlightOffOutlinedIcon from '@mui/icons-material/HighlightOffOutlined';
import SearchIcon from '@mui/icons-material/Search';
import CheckIcon from '@mui/icons-material/Check';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { dataloaderApi } from '../services/api-client';

const TRIGGER_TYPES = [
  { value: 'ON_MODEL_EXECUTION',   label: 'On Model Execution' },
  { value: 'ON_INSTRUMENT_ADD',    label: 'On Instrument Add' },
  { value: 'ON_TRANSACTION_POST',  label: 'On Transaction Post' },
  { value: 'ON_ATTRIBUTE_CHANGE',  label: 'On Attribute Change' },
  { value: 'ON_CUSTOM_DATA_TRIGGER', label: 'On Custom Data Trigger' },
  { value: 'ON_REPLAY',            label: 'On Replay' },
];

const validateEventId = (value) => {
  if (!value || value.trim() === '') return 'Event ID cannot be empty.';
  if (/\s/.test(value)) return 'Event ID cannot have leading, in-between or trailing spaces.';
  if (!/^[A-Za-z0-9_]+$/.test(value)) return 'Event ID cannot have special characters (only letters, numbers and underscores are allowed).';
  if (value.length > 63) return 'Event ID cannot exceed 63 characters.';
  return null;
};

export default function EventConfiguration({ open, onClose, editData }) {
    const { tenant, user } = useTenant();
    const theme = useTheme();

    // Debug environment variables
    const baseURL = "";
    console.log('🔧 Environment Variables:', {
        baseURL,
        tenant,
        userId: user?.id
    });

    const [eventData, setEventData] = useState({
        eventId: '',
        eventName: '',
        priority: '',
        description: '',
        triggerType: '',
        triggerCondition: '',
        triggerSource: [],
    });

    // === Source management state ===
    const ALL_SOURCES = ["Attribute", "Transactions", "Balances"];
    const [availableSources, setAvailableSources] = useState([...ALL_SOURCES]);
    const [sourceMappings, setSourceMappings] = useState([]);
    const [editingRow, setEditingRow] = useState(null);
    const [isAddingNew, setIsAddingNew] = useState(false);
    const [loading, setLoading] = useState(false);
    const [eventIdError, setEventIdError] = useState(null);
    const [submitted, setSubmitted] = useState(false);

    const [newSource, setNewSource] = useState({
        sourceTable: '',
        sourceColumns: [],
        versionType: [],
        fieldType: '',
        dataMapping: [],
    });

    // === Alert states ===
    const [alert, setAlert] = useState({
        open: false,
        message: '',
        severity: 'success',
    });

    const [attributeList, setAttributeList] = useState([]);
    const [transactionList, setTransactionList] = useState([]);
    const [metricList, setMetricList] = useState([]);
    const [customReferenceTables, setCustomReferenceTables] = useState([]);
    const [customOperationalTables, setCustomOperationalTables] = useState([]);
    const [customTableColumns, setCustomTableColumns] = useState([]);
    const [customTableMappings, setCustomTableMappings] = useState([]);
    const [referenceTables, setReferenceTables] = useState([]);
    const [operationalTables, setOperationalTables] = useState([]);
    const [triggerTypePickerAnchor, setTriggerTypePickerAnchor] = useState(null);
    const [triggerTypePickerSearch, setTriggerTypePickerSearch] = useState('');
    const [editSourcePickerAnchor, setEditSourcePickerAnchor] = useState(null);
    const [editSourcePickerSearch, setEditSourcePickerSearch] = useState('');
    const [editSourcePickerRowId, setEditSourcePickerRowId] = useState(null);
    const [newSourcePickerAnchor, setNewSourcePickerAnchor] = useState(null);
    const [newSourcePickerSearch, setNewSourcePickerSearch] = useState('');
    const [tsPickerAnchor, setTsPickerAnchor] = useState(null);
    const [tsPickerSearch, setTsPickerSearch] = useState('');
    const [ecPickerAnchor, setEcPickerAnchor] = useState(null);
    const [ecPickerSearch, setEcPickerSearch] = useState('');
    const [ecPickerRowId, setEcPickerRowId] = useState(null);
    const [evPickerAnchor, setEvPickerAnchor] = useState(null);
    const [evPickerSearch, setEvPickerSearch] = useState('');
    const [evPickerRowId, setEvPickerRowId] = useState(null);
    const [emPickerAnchor, setEmPickerAnchor] = useState(null);
    const [emPickerSearch, setEmPickerSearch] = useState('');
    const [emPickerRowId, setEmPickerRowId] = useState(null);
    const [ncPickerAnchor, setNcPickerAnchor] = useState(null);
    const [ncPickerSearch, setNcPickerSearch] = useState('');
    const [nvPickerAnchor, setNvPickerAnchor] = useState(null);
    const [nvPickerSearch, setNvPickerSearch] = useState('');
    const [nmPickerAnchor, setNmPickerAnchor] = useState(null);
    const [nmPickerSearch, setNmPickerSearch] = useState('');

    const sourceColumnsOptions = {
        Attribute: attributeList,
        Transactions: [
            { label: 'Amount', value: 'Amount' },
        ],
        Balances: [
            { label: 'Beginning Balance', value: 'BeginningBalance' },
            { label: 'Activity', value: 'Activity' },
            { label: 'Ending Balance', value: 'EndingBalance' },
        ],
        ExecutionState: [
            { label: 'ExecutionDate', value: 'ExecutionDate' },
            { label: 'LastExecutionDate', value: 'LastExecutionDate' },
            { label: 'ReplayDate', value: 'ReplayDate' },
        ],
    };


    useEffect(() => {
        if (tenant) {
            fetchAttributeMetadata();
            fetchTransactionMetadata();
            fetchMetricsMetadata();
            fetchOperationalableMetadata();
            fetchReferenceTableMetadata();
        }
    }, [tenant]);

    const fetchAttributeMetadata = () => {
        dataloaderApi.get(`${baseURL}/attribute/get/all/options`)
            .then(response => {
                setAttributeList(response.data);
            })
            .catch(error => {
                console.error('Error fetching attribute metadata:', error);
            });
    };

    const fetchTransactionMetadata = () => {
        dataloaderApi.get(`${baseURL}/transaction/get/all/options`)
            .then(response => {
                setTransactionList(response.data);
            })
            .catch(error => {
                console.error('Error fetching transaction metadata:', error);
            });
    };

    const fetchMetricsMetadata = () => {
        dataloaderApi.get(`${baseURL}/aggregation/get/all/options`)
            .then(response => {
                const metadata = response.data;
                const formattedMetrics = Array.isArray(metadata)
                    ? metadata.map(item => ({
                        label: item.metricName || item.name || item.label || item.id || JSON.stringify(item),
                        value: item.metricName || item.name || item.label || item.id || JSON.stringify(item)
                    }))
                    : [];
                setMetricList(formattedMetrics);
            })
            .catch(error => {
                console.error('Error fetching metric metadata:', error);
                setMetricList([]);
            });
    };

    const fetchReferenceTableMetadata = () => {
        dataloaderApi.get(`${baseURL}/fyntrac/custom-table/get/all/reference-tables/options`)
            .then(response => {
                const metadata = Array.isArray(response.data?.data)
                    ? response.data.data
                    : [];

                // ✅ 1. Keep FULL response as-is (for column lookup later)
                setCustomReferenceTables(metadata);

                // ✅ 2. Keep ONLY table names in a separate variable
                const formattedTables = metadata.map(item => item.tableName);

                setReferenceTables(formattedTables);

                console.log('📋 Full Reference Metadata:', metadata);
                console.log('📋 Reference Table Names:', formattedTables);
            })
            .catch(error => {
                console.error('Error fetching reference table metadata:', error);
                setCustomReferenceTables([]);   // full response
                setReferenceTables([]);         // table names only
            });
    };


    const fetchOperationalableMetadata = () => {
        dataloaderApi.get(`${baseURL}/fyntrac/custom-table/get/all/operational-tables/options`)
            .then(response => {
                const metadata = Array.isArray(response.data?.data)
                    ? response.data.data
                    : [];

                // ✅ 1. Keep FULL response as-is (for column lookup later)
                setCustomOperationalTables(metadata);

                // ✅ 2. Keep ONLY table names in a separate variable
                const formattedTables = metadata.map(item => item.tableName);

                setOperationalTables(formattedTables);

                console.log('📋 Full Reference Metadata:', metadata);
                console.log('📋 Reference Table Names:', formattedTables);
            })
            .catch(error => {
                console.error('Error fetching reference table metadata:', error);
                setCustomOperationalTables([]);   // full response
                setOperationalTables([]);         // table names only
            });
    };


    const fetchCustomSourceMapping = useCallback((reference, referenceType) => {
        let uri = `${baseURL}/fyntrac/custom-table/get/values/reference_table/${reference}`;
        if (referenceType === 'operational_table') {
            uri = `${baseURL}/fyntrac/custom-table/get/values/operational_table/${reference}`;
        }

        dataloaderApi.get(uri)
            .then(response => {
                const metadata = Array.isArray(response.data?.data)
                    ? response.data.data
                    : [];

                console.log('📋 Full Reference Metadata:', metadata);
                // ✅ 1. Keep FULL response as-is (for column lookup later)
                setCustomTableMappings(metadata);

                // ✅ 2. Keep ONLY table names in a separate variable
                console.log('📋 Reference Table Names:', metadata);
            })
            .catch(error => {
                console.error('Error fetching custom source mapping:', error);
                setCustomTableMappings([]);
            });
    }, [baseURL, tenant]);

    // Load edit data when component opens
    useEffect(() => {
        if (open && editData && user) {
            setEventData({
                eventId: editData.eventId || '',
                eventName: editData.eventName || '',
                priority: editData.priority || '',
                description: editData.description || '',
                triggerType: editData.triggerSetup?.triggerType || '',
                triggerCondition: editData.triggerSetup?.triggerCondition || '',
                triggerSource: editData.triggerSetup?.triggerSource || [],
            });

            if (editData.sourceMappings) {
                const transformedMappings = editData.sourceMappings.map((mapping, index) => ({
                    id: index + 1,
                    sourceTable: mapping.sourceTable,
                    sourceColumns: mapping.sourceColumns?.map(col => typeof col === 'object' ? col.value : col) || [],
                    versionType: mapping.versionType?.map(ver => typeof ver === 'object' ? ver.value : ver) || [],
                    fieldType: mapping.fieldType || '',
                    dataMapping: mapping.dataMapping?.map(map => typeof map === 'object' ? map.value : map) || [],
                }));

                setSourceMappings(transformedMappings);
                const usedSources = transformedMappings.map(mapping => mapping.sourceTable.toLowerCase());
                setAvailableSources(ALL_SOURCES.filter(source => !usedSources.includes(source.toLowerCase())));
            }
        } else if (open) {
            resetForm();
        }
    }, [open, editData, user]);

    // Debug effects
    useEffect(() => {
        console.log('🔄 Trigger Source Updated:', {
            triggerSource: eventData.triggerSource,
            triggerType: eventData.triggerType,
            showTriggerSource: showTriggerSource
        });
    }, [eventData.triggerSource, eventData.triggerType]);

    useEffect(() => {
        console.log('🔄 Source Mappings Updated:', sourceMappings);
    }, [sourceMappings]);

    useEffect(() => {
        console.log('🔄 New Source Updated:', newSource);
    }, [newSource]);

    useEffect(() => {
        // 1. Define variables in the outer scope of the effect
        let selectedSource = null;
        let determinedTable = null; // <--- Define a variable to hold the table name

        if (eventData.triggerSource && eventData.triggerSource.length > 0) {
            // 2. Assign value safely
            selectedSource = eventData.triggerSource[0]?.value;

            console.log('🔄 Trigger Source Changed:', selectedSource);

            if (eventData.triggerType === 'ON_CUSTOM_DATA_TRIGGER') {

                // Determine which table list to use based on selection
                if (selectedSource === 'operational_table') {
                    determinedTable = operationalTables[0]; // Assign local variable
                    // Assuming fetchCustomSourceMapping takes (TableName, SourceType)
                    fetchCustomSourceMapping(determinedTable, 'operational_table');



                } else if (selectedSource === 'reference_table') {
                    setCustomTableMappings([]);
                }
            }

            // Update State if needed (using the local variable)
            if (determinedTable && newSource.sourceTable !== determinedTable) {
                setNewSource(prev => ({ ...prev, sourceTable: determinedTable }));
            }
        }

    }, [eventData.triggerSource, eventData.triggerType, referenceTables, operationalTables, newSource.sourceTable, fetchCustomSourceMapping]);

    const resetForm = () => {
        setEventData({
            eventId: '',
            eventName: '',
            priority: '',
            description: '',
            triggerType: '',
            triggerCondition: '',
            triggerSource: [],
        });
        setSourceMappings([]);
        setAvailableSources([...ALL_SOURCES]);
        setEditingRow(null);
        setIsAddingNew(false);
        setNewSource({
            sourceTable: '',
            sourceColumns: [],
            versionType: [],
            fieldType: '',
            dataMapping: [],
        });
        setAlert({ open: false, message: '', severity: 'success' });
        setCustomTableMappings([]);
        setSubmitted(false);
    };

    const showAlert = (message, severity = 'success') => {
        setAlert({ open: true, message, severity });
    };

    const closeAlert = () => {
        setAlert(prev => ({ ...prev, open: false }));
    };

    const handleChange = (key, value) => {
        console.log(`📝 Event Data Change: ${key}`, value);


        setEventData((prev) => ({ ...prev, [key]: value }));
        setEventData((prev) => ({ ...prev, ['triggerSource']: value }));

        if (key === 'triggerType' && value === 'ON_CUSTOM_DATA_TRIGGER') {
            {
                if (referenceTables.length > 0)
                    setAvailableSources(referenceTables);
                else
                    setAvailableSources([]);

            }
        }


    };

    const [versionTypeOptions, setVersionTypeOptions] = useState([
        { label: 'Current', value: 'Current' },
        { label: 'Prior', value: 'Prior' },
        { label: 'First', value: 'First' },
    ]);

    const fieldTypeOptions = [
        { label: 'Aggregated', value: 'Aggregated' },
        { label: 'Array', value: 'Array' },
        { label: 'None', value: 'None' },
    ];

    const dataMappingOptions = {
        Transactions: transactionList,
        Balances: metricList.length > 0 ? metricList : [
            { label: 'Balance Metric 1', value: 'metric1' },
            { label: 'Balance Metric 2', value: 'metric2' },
            { label: 'Balance Metric 3', value: 'metric3' },
        ],
        Attribute: attributeList,
        ExecutionState: [
            { label: 'Select Mapping', value: '' },
            { label: 'Execution Date Mapping', value: 'execution_date_mapping' },
        ],
        CustomDataSource: [
            { label: 'Reference Table', value: 'reference_table' },
            { label: 'Operational Table', value: 'operational_table' },
        ],
        CustomTableColumns: customTableColumns,
        CustomTableMappings: customTableMappings,
    };

    const triggerSourceOptions = {
        ON_ATTRIBUTE_CHANGE: sourceColumnsOptions.Attribute || [],
        ON_TRANSACTION_POST: dataMappingOptions.Transactions || [],
        ON_CUSTOM_DATA_TRIGGER: dataMappingOptions.CustomDataSource || [],
        ON_CUSTOM_DATA_SOURCE: dataMappingOptions.CustomTableColumns || [],
        ON_REPLAY: dataMappingOptions.Transactions || [],
    };

    const showTriggerSource = ['ON_ATTRIBUTE_CHANGE', 'ON_TRANSACTION_POST', 'ON_CUSTOM_DATA_TRIGGER', 'ON_REPLAY'].includes(eventData.triggerType);


    const getColumnsByReferenceTableName = (tableName) => {
        const table = customReferenceTables.find(
            t => t.tableName === tableName
        );

        return (table?.columns || []).map(col => ({
            label: col,
            value: col
        }));
    };


    const getReferenceSourceMapping = (refrence, referenceType) => {
        return referenceTables.map(table => ({
            sourceTable: table,
            sourceColumns: getColumnsByReferenceTableName(table),
            versionType: versionTypeOptions,
            fieldType: fieldTypeOptions,
            dataMapping: dataMappingOptions,
        }));
    };

    const getColumnsByOperationalTableName = (tableName) => {
        const table = customOperationalTables.find(
            t => t.tableName === tableName
        );

        const excludedColumns = ['instrumentid', 'attributeid', 'postingdate', 'effectivedate', 'periodid'];

        return (table?.columns || [])
            .filter(col => !excludedColumns.includes(col.toLowerCase()))
            .map(col => ({
                label: col,
                value: col
            }));
    };

    const resolveSourceColumnOptions = (row, eventData) => {
        console.log('📝 Resolving Source Column Options:', {
            sourceTable: row.sourceTable,
            triggerType: eventData.triggerType,
            triggerSource: eventData.triggerSource
        });

        // ✅ NORMAL SOURCES (Attribute, Transactions, Balances)
        if (sourceColumnsOptions[row.sourceTable]) {
            return sourceColumnsOptions[row.sourceTable];
        }

        // ✅ CUSTOM DATA TRIGGER
        if (eventData.triggerType === 'ON_CUSTOM_DATA_TRIGGER') {
            const selectedSource = eventData.triggerSource?.[0]?.value;

            console.log('✅ Custom Trigger Source Selected:', selectedSource);

            if (selectedSource === 'reference_table') {
                return getColumnsByReferenceTableName(row.sourceTable);
            }

            if (selectedSource === 'operational_table') {
                return getColumnsByOperationalTableName(row.sourceTable);
            }
        }

        return [];
    };


    // === Helper Functions ===
    const isVersionTypeEnabled = (sourceTable) => sourceTable === 'Attribute';
    const isFieldTypeEnabled = (sourceTable) => sourceTable === 'Transactions';
    const isDataMappingEnabled = (sourceTable) => sourceTable === 'Transactions' || sourceTable === 'Balances' || (eventData.triggerSource?.[0]?.value === 'operational_table');

    const canAddSource = () => {
        if (!eventData.triggerType) return false;
        if (showTriggerSource && (!eventData.triggerSource || eventData.triggerSource.length === 0)) return false;
        return availableSources.length > 0;
    };

    const getAddSourceTooltip = () => {
        if (!eventData.triggerType) return "Please select a Trigger Type first";
        if (showTriggerSource && (!eventData.triggerSource || eventData.triggerSource.length === 0)) return "Please select Trigger Source first";
        if (availableSources.length === 0) return "No more sources available to add";
        return "Add Source";
    };

    const getOptionLabels = (values, options) => {
        return values.map(value => {
            const option = options.find(opt => opt.value === value);
            return option ? option.label : value;
        });
    };

    // === Source Management Functions ===
    const updateAvailableSources = (oldSourceTable, newSourceTable) => {
        setAvailableSources(prevSources => {
            let updated = [...prevSources].filter(src => src !== newSourceTable);
            if (oldSourceTable && oldSourceTable !== newSourceTable && !updated.includes(oldSourceTable)) {
                updated.push(oldSourceTable);
            }
            return updated.sort();
        });
    };

    const handleAddNew = () => {
        if (!canAddSource()) {
            if (!eventData.triggerType) {
                showAlert("Please select a Trigger Type first", 'error');
            } else if (showTriggerSource && (!eventData.triggerSource || eventData.triggerSource.length === 0)) {
                showAlert("Please select Trigger Source first", 'error');
            } else if (eventData?.triggerType === 'ON_CUSTOM_DATA_TRIGGER' && sourceMappings.length > 0) {
                showAlert("Custom Data Trigger already has at least one source", 'error');
            }
            else {
                showAlert("No more sources available to add", 'error');
            }
            return;
        }
        setNewSource({
            sourceTable: '',
            sourceColumns: [],
            versionType: [],
            fieldType: '',
            dataMapping: [],
        });
        setIsAddingNew(true);
    };

    const handleSaveNew = () => {
        if (!newSource.sourceTable) {
            showAlert("Please select a source table", 'error');
            return;
        }

        // All enabled fields are mandatory. Source Columns is always enabled,
        // Version Type is required when applicable to the selected source,
        // and Map Fields is required when applicable to the selected source.
        if (!Array.isArray(newSource.sourceColumns) || newSource.sourceColumns.length === 0) {
            showAlert("Please select at least one Source Column", 'error');
            return;
        }
        if (isVersionTypeEnabled(newSource.sourceTable) &&
            (!Array.isArray(newSource.versionType) || newSource.versionType.length === 0)) {
            showAlert("Please select at least one Version Type", 'error');
            return;
        }
        if (isDataMappingEnabled(newSource.sourceTable) &&
            (!Array.isArray(newSource.dataMapping) || newSource.dataMapping.length === 0)) {
            showAlert("Please select at least one Map Field", 'error');
            return;
        }

        console.log('➕ Adding New Source:', newSource);

        const newRow = {
            id: Date.now(),
            sourceTable: newSource.sourceTable,
            sourceColumns: newSource.sourceColumns.map(item => {
                console.log('📝 Source Column Item:', item);
                return item.value || item;
            }),
            versionType: newSource.versionType.map(item => {
                console.log('📝 Version Type Item:', item);
                return item.value || item;
            }),
            fieldType: newSource.fieldType,
            dataMapping: newSource.dataMapping.map(item => {
                console.log('📝 Data Mapping Item:', item);
                return item.value || item;
            }),
        };

        console.log('✅ New Row Created:', newRow);

        setSourceMappings(prev => [...prev, newRow]);
        setAvailableSources(prev => prev.filter(s => s !== newSource.sourceTable));
        setNewSource({ sourceTable: '', sourceColumns: [], versionType: [], fieldType: '', dataMapping: [] });
        setIsAddingNew(false);
    };

    const handleCancelNew = () => {
        setNewSource({ sourceTable: '', sourceColumns: [], versionType: [], fieldType: '', dataMapping: [] });
        setIsAddingNew(false);
    };

    const handleEditRow = (row) => setEditingRow(row.id);
    // Validate a mapping row before exiting edit mode. Enabled fields are mandatory.
    const validateMappingRow = (row) => {
        if (!row?.sourceTable) return "Please select a source table";
        if (!Array.isArray(row.sourceColumns) || row.sourceColumns.length === 0) {
            return "Please select at least one Source Column";
        }
        if (isVersionTypeEnabled(row.sourceTable) &&
            (!Array.isArray(row.versionType) || row.versionType.length === 0)) {
            return "Please select at least one Version Type";
        }
        if (isDataMappingEnabled(row.sourceTable) &&
            (!Array.isArray(row.dataMapping) || row.dataMapping.length === 0)) {
            return "Please select at least one Map Field";
        }
        return null;
    };
    const handleSaveRow = (rowId) => {
        const row = sourceMappings.find(r => r.id === rowId);
        const error = validateMappingRow(row);
        if (error) {
            showAlert(error, 'error');
            return;
        }
        setEditingRow(null);
    };
    const handleCancelEdit = () => setEditingRow(null);

    const handleCellChange = (rowId, field, value) => {
        console.log(`✏️ Cell Change: row ${rowId}, field ${field}, value:`, value);

        if (field === 'sourceTable') {
            const rowToUpdate = sourceMappings.find(row => row.id === rowId);

            if (eventData.triggerType === 'ON_CUSTOM_DATA_TRIGGER') {
                const custTableSourceMapping = {
                    sourceTable: value,
                    sourceType: eventData.triggerSource[0].value,
                }

                console.log('✅ Custom Data Trigger Source Mapping:', custTableSourceMapping);

            }

            if (rowToUpdate) {
                const oldSourceTable = rowToUpdate.sourceTable;
                updateAvailableSources(oldSourceTable, value);
                setSourceMappings(prev =>
                    prev.map(row =>
                        row.id === rowId
                            ? { ...row, [field]: value, sourceColumns: [], versionType: [], fieldType: '', dataMapping: [] }
                            : row
                    )
                );

            }
        } else {
            // For array fields (sourceColumns, versionType, dataMapping), store the actual values
            let processedValue = value;

            if (eventData.triggerType === 'ON_CUSTOM_DATA_TRIGGER') {
                const custTableSourceMapping = {
                    sourceTable: value,
                    sourceType: eventData.triggerSource[0].value,
                }

                console.log('✅ Custom Data Trigger Source Mapping:', custTableSourceMapping);
            }

            if (['sourceColumns', 'versionType', 'dataMapping'].includes(field)) {
                // Extract values from Autocomplete objects
                processedValue = Array.isArray(value)
                    ? value.map(item => item.value || item)
                    : value;
            }

            console.log(`✅ Processed ${field}:`, processedValue);

            setSourceMappings(prev =>
                prev.map(row =>
                    row.id === rowId ? { ...row, [field]: processedValue } : row
                )
            );
        }
    };

    const handleDeleteSource = (rowId) => {
        const rowToDelete = sourceMappings.find(row => row.id === rowId);
        if (rowToDelete && !availableSources.includes(rowToDelete.sourceTable)) {
            setAvailableSources(prev => [...prev, rowToDelete.sourceTable].sort());
        }
        setSourceMappings(prev => prev.filter(row => row.id !== rowId));
    };

    // === Fixed Save Function ===
    const handleSaveConfiguration = async () => {
        if (loading) return;
        console.log('🚀 SAVE FUNCTION STARTED');
        setSubmitted(true);

        const idValidationError = validateEventId(eventData.eventId);
        if (idValidationError) {
            setEventIdError(idValidationError);
            showAlert(idValidationError, 'error');
            return;
        }
        if (!eventData.eventName || !eventData.priority) {
            showAlert("Please fill in all required fields: Event Name and Priority", 'error');
            return;
        }

        if (sourceMappings.length === 0) {
            showAlert("Please add at least one source mapping", 'error');
            return;
        }

        // Re-validate every saved mapping row so enabled fields are mandatory.
        for (let i = 0; i < sourceMappings.length; i++) {
            const rowError = validateMappingRow(sourceMappings[i]);
            if (rowError) {
                showAlert(`Source mapping #${i + 1}: ${rowError}`, 'error');
                return;
            }
        }

        setLoading(true);

        try {
            // DEBUG: Log the current data
            console.log('📋 Current Event Data:', eventData);
            console.log('📋 Current Source Mappings:', sourceMappings);
            console.log('🔍 Trigger Source Data:', {
                triggerSource: eventData.triggerSource,
                triggerType: eventData.triggerType,
                showTriggerSource: showTriggerSource
            });

            // Helper function to transform array data for API
            const transformArrayData = (array, defaultValue = []) => {
                if (!Array.isArray(array)) return defaultValue;

                return array.map(item => {
                    if (typeof item === 'object' && item !== null) {
                        return {
                            label: item.label || item.value || String(item),
                            value: item.value || item.label || String(item)
                        };
                    }
                    return {
                        label: String(item),
                        value: String(item)
                    };
                });
            };

            // Transform data for API - FIXED data handling
            const requestData = {
                eventId: eventData.eventId,
                eventName: eventData.eventName,
                priority: parseInt(eventData.priority),
                description: eventData.description || "",
                triggerSetup: {
                    triggerType: eventData.triggerType || "",
                    triggerCondition: eventData.triggerCondition || "",
                    triggerSource: transformArrayData(eventData.triggerSource)
                },
                sourceMappings: sourceMappings.map((mapping, index) => {
                    console.log(`🔍 Processing Source Mapping ${index + 1}:`, mapping);

                    const transformedMapping = {
                        sourceTable: mapping.sourceTable || "",
                        sourceColumns: transformArrayData(mapping.sourceColumns),
                        versionType: transformArrayData(mapping.versionType),
                        fieldType: mapping.fieldType || "",
                        dataMapping: transformArrayData(mapping.dataMapping)
                    };

                    console.log(`✅ Transformed Mapping ${index + 1}:`, transformedMapping);
                    return transformedMapping;
                })
            };

            console.log('📤 Sending Request Data:', JSON.stringify(requestData, null, 2));
            console.log('🔗 Request URL:', `${baseURL}/fyntrac/event-configurations/create`);

            const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
            const headers = {
                'X-Tenant': tenant,
                'X-User-Id': user?.id || '',
                'Content-Type': 'application/json',
            };

            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            console.log('📋 Request Headers:', headers);

            let response;
            if (editData && editData.id) {
                console.log(`🔄 UPDATE Operation for ID: ${editData.id}`);
                response = await dataloaderApi.put(
                    `${baseURL}/fyntrac/event-configurations/update/${editData.id}`,
                    requestData,
                    { headers }
                );
            } else {
                console.log('🆕 CREATE Operation');
                response = await dataloaderApi.post(
                    `${baseURL}/fyntrac/event-configurations/create`,
                    requestData,
                    { headers }
                );
            }

            console.log('✅ SUCCESS - API Response:', response.data);

            const successMessage = editData
                ? "Event configuration updated successfully!"
                : "Event configuration created successfully!";

            setLoading(false);

            // Close the modal and signal the parent to refresh the grid and show the
            // success toast (parent owns the snackbar so it remains visible after unmount).
            if (onClose) onClose(true, successMessage);

        } catch (error) {
            console.error('❌ ERROR in save function:');
            console.error('Error object:', error);
            console.error('Error response:', error.response);
            console.error('Error status:', error.response?.status);
            console.error('Error data:', error.response?.data);

            setLoading(false);

            let errorMessage = 'An unexpected error occurred while saving';

            if (error.response?.status === 500) {
                errorMessage = 'Server Error (500): Please check backend logs for details';
                if (error.response?.data) {
                    errorMessage += ` - ${JSON.stringify(error.response.data)}`;
                }
            } else if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.message) {
                errorMessage = error.message;
            }

            showAlert(errorMessage, 'error');
        }
    };

    const handleClose = () => {
        resetForm();
        if (onClose) onClose(false);
    };

    useEffect(() => {
        if (eventData?.triggerType === 'ON_CUSTOM_DATA_TRIGGER') {
            if (!editData) {
                setNewSource({
                    sourceTable: '',
                    sourceColumns: [],
                    versionType: [],
                    fieldType: '',
                    dataMapping: [],
                });
                setIsAddingNew(true);
            }
        }
        else if (eventData?.triggerType === 'ON_TRANSACTION_POST') {
            setAvailableSources([]);
            setAvailableSources(['Transactions']);
            if (!editData) {
                setNewSource({
                    sourceTable: '',
                    sourceColumns: [],
                    versionType: [],
                    fieldType: '',
                    dataMapping: [],
                });
                setIsAddingNew(true);
            }
        }
        else if (eventData?.triggerType === 'ON_INSTRUMENT_ADD') {
            setAvailableSources([]);
            setAvailableSources(['Attribute', 'Balances']);
            setVersionTypeOptions([{ label: 'Current', value: 'Current' }]);


        }
        else if (eventData?.triggerType === 'ON_ATTRIBUTE_CHANGE') {
            setAvailableSources([]);
            setVersionTypeOptions([
                { label: 'Current', value: 'Current' },
                { label: 'Prior', value: 'Prior' },
                { label: 'First', value: 'First' },
            ]);
            setAvailableSources(['Attribute']);

        }
        else {
            setAvailableSources([]);
            setAvailableSources(["Attribute", "Balances"]);

        }
    }, [eventData?.triggerType]);

    // When editing an existing event only the source mappings should be editable.
    // Event Details and Trigger Setup fields are locked in edit mode.
    const isEditMode = Boolean(editData);

    const cbUnchecked = <Box sx={{ width: 16, height: 16, borderRadius: '3px', border: '1.5px solid', borderColor: 'action.disabled', flexShrink: 0 }} />;
    const cbChecked = (color) => <Box sx={{ width: 16, height: 16, borderRadius: '3px', bgcolor: color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><CheckIcon sx={{ fontSize: 11, color: '#fff' }} /></Box>;
    const cbIndeterminate = (color) => <Box sx={{ width: 16, height: 16, borderRadius: '3px', bgcolor: color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Box sx={{ width: 8, height: 1.5, bgcolor: '#fff', borderRadius: '1px' }} /></Box>;

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="xl"
            fullWidth
            slots={{ transition: Slide }}
            slotProps={{
                transition: { direction: 'up' },
                paper: {
                    sx: {
                        width: '95vw',
                        maxWidth: '1800px',
                        borderRadius: 4,
                        boxShadow: '0 32px 64px rgba(15,23,42,0.18)',
                        overflow: 'hidden',
                        border: '1px solid',
                        borderColor: 'divider',
                        fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif',
                        '& .MuiTypography-root, & .MuiInputBase-root, & .MuiButton-root, & .MuiChip-root, & *': {
                            fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif',
                        },
                    },
                },
            }}
        >
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
                                    label={editData ? 'Edit Mode' : 'Setup Event'}
                                    size="small"
                                    sx={{
                                        height: 18,
                                        fontSize: '0.6rem',
                                        fontWeight: 700,
                                        letterSpacing: 0.8,
                                        textTransform: 'uppercase',
                                        bgcolor: editData
                                            ? alpha(theme.palette.warning.main, 0.1)
                                            : alpha(theme.palette.primary.main, 0.1),
                                        color: editData
                                            ? theme.palette.warning.dark
                                            : theme.palette.primary.main,
                                        borderRadius: 1,
                                    }}
                                />
                            </Box>
                            <Typography variant="h6" fontWeight={700} sx={{ lineHeight: 1.2, color: 'text.primary' }}>
                                {editData ? 'Edit Event' : 'Create Event'}
                            </Typography>
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

            <DialogContent sx={{ p: 0, bgcolor: alpha(theme.palette.grey[500], 0.03), maxHeight: '80vh', overflowY: 'auto' }}>
                <Box sx={{ px: 3.5, pt: 3, pb: 2.5, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                  {alert.open && (
                    <Alert
                      severity={alert.severity}
                      variant="outlined"
                      onClose={closeAlert}
                      sx={{
                        borderRadius: 2.5, py: 0.5, fontSize: '0.8rem',
                        bgcolor: alert.severity === 'success' ? 'rgba(22,163,74,0.08)' : 'rgba(220,38,38,0.08)',
                        borderColor: alert.severity === 'success' ? 'rgba(22,163,74,0.35)' : 'rgba(220,38,38,0.35)',
                      }}
                    >
                      {alert.message}
                    </Alert>
                  )}
                    {/* Event Details Card */}
                    <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: alpha(theme.palette.divider, 0.7), bgcolor: 'background.paper', overflow: 'hidden' }}>
                        <Box sx={{ px: 2.5, py: 1.25, borderBottom: '1px solid', borderColor: alpha(theme.palette.divider, 0.6), bgcolor: alpha(theme.palette.primary.main, 0.025) }}>
                            <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.7, color: 'text.secondary', fontSize: '0.67rem' }}>
                                Event Details
                            </Typography>
                        </Box>
                        <Box sx={{ p: 2.5 }}>
                        <Grid container spacing={2}>
                            <Grid size={6}>
                                <TextField
                                    label="Event ID"
                                    fullWidth
                                    size="small"
                                    value={eventData.eventId}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        handleChange('eventId', val);
                                        setEventIdError(validateEventId(val));
                                    }}
                                    disabled={isEditMode}
                                    error={!isEditMode && !!eventIdError}
                                    helperText={!isEditMode ? (eventIdError || ' ') : ' '}
                                />
                            </Grid>
                            <Grid size={6}>
                                <TextField
                                    label="Event Name"
                                    fullWidth
                                    size="small"
                                    value={eventData.eventName}
                                    onChange={(e) => handleChange('eventName', e.target.value)}
                                    disabled={isEditMode}
                                    error={!isEditMode && submitted && !eventData.eventName}
                                    helperText={!isEditMode && submitted && !eventData.eventName ? "Event Name is required" : ""}
                                />
                            </Grid>
                            <Grid size={6}>
                                <TextField
                                    label="Event Priority"
                                    fullWidth
                                    type="number"
                                    size="small"
                                    value={eventData.priority}
                                    onChange={(e) => handleChange('priority', e.target.value)}
                                    disabled={isEditMode}
                                    error={!isEditMode && submitted && !eventData.priority}
                                    helperText={!isEditMode && submitted && !eventData.priority ? "Priority is required" : ""}
                                    slotProps={{ min: 1 }}
                                />
                            </Grid>
                            <Grid size={6}>
                                <TextField
                                    label="Description"
                                    fullWidth
                                    multiline
                                    rows={2}
                                    size="small"
                                    value={eventData.description}
                                    onChange={(e) => handleChange('description', e.target.value)}
                                    disabled={isEditMode}
                                />
                            </Grid>
                        </Grid>
                        </Box>
                    </Paper>

                    {/* Trigger Setup Card */}
                    <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: alpha(theme.palette.divider, 0.7), bgcolor: 'background.paper', overflow: 'hidden' }}>
                        <Box sx={{ px: 2.5, py: 1.25, borderBottom: '1px solid', borderColor: alpha(theme.palette.divider, 0.6), bgcolor: alpha(theme.palette.primary.main, 0.025) }}>
                            <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.7, color: 'text.secondary', fontSize: '0.67rem' }}>
                                Trigger Setup
                            </Typography>
                        </Box>
                        <Box sx={{ p: 2.5 }}>
                        <Grid container spacing={2}>
                            <Grid size={6}>
                                <TextField
                                    fullWidth size="small" label="Trigger Type"
                                    value={TRIGGER_TYPES.find(t => t.value === eventData.triggerType)?.label || ''}
                                    onClick={(e) => { if (!isEditMode) { setTriggerTypePickerAnchor(e.currentTarget); setTriggerTypePickerSearch(''); } }}
                                    inputProps={{ readOnly: true, style: { cursor: isEditMode ? 'default' : 'pointer' } }}
                                    disabled={isEditMode}
                                    error={!isEditMode && submitted && !eventData.triggerType}
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" sx={{ color: 'text.disabled' }} /></InputAdornment>,
                                        endAdornment: eventData.triggerType && !isEditMode ? (
                                            <InputAdornment position="end">
                                                <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleChange('triggerType', ''); }} sx={{ color: 'text.disabled', '&:hover': { color: 'error.main' } }}>
                                                    <HighlightOffOutlinedIcon sx={{ fontSize: '0.95rem' }} />
                                                </IconButton>
                                            </InputAdornment>
                                        ) : null,
                                    }}
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                />
                                <Popover
                                    open={Boolean(triggerTypePickerAnchor)} anchorEl={triggerTypePickerAnchor}
                                    onClose={() => setTriggerTypePickerAnchor(null)}
                                    anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                                    transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                                    slotProps={{ paper: { sx: { mt: 0.75, width: triggerTypePickerAnchor?.offsetWidth, borderRadius: 3, boxShadow: '0 8px 32px rgba(15,23,42,0.16)', border: '1px solid', borderColor: 'divider', overflow: 'hidden' } } }}
                                >
                                    <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: alpha(theme.palette.divider, 0.6) }}>
                                        <TextField autoFocus fullWidth size="small" placeholder="Search trigger types..."
                                            value={triggerTypePickerSearch} onChange={(e) => setTriggerTypePickerSearch(e.target.value)}
                                            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" sx={{ color: 'text.disabled' }} /></InputAdornment> }}
                                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                        />
                                    </Box>
                                    <List dense disablePadding>
                                        {TRIGGER_TYPES.filter(t => t.label.toLowerCase().includes(triggerTypePickerSearch.toLowerCase())).map((t) => (
                                            <ListItemButton key={t.value} selected={t.value === eventData.triggerType}
                                                onClick={() => { handleChange('triggerType', t.value); setTriggerTypePickerAnchor(null); }}
                                                sx={{ py: 1, px: 2, '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.06) }, '&.Mui-selected': { bgcolor: alpha(theme.palette.primary.main, 0.1) } }}
                                            >
                                                <ListItemText primary={t.label} primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: 500 }} />
                                            </ListItemButton>
                                        ))}
                                    </List>
                                </Popover>
                            </Grid>
                        </Grid>

                        {showTriggerSource && (() => {
                            const isMultiple = eventData.triggerType !== 'ON_CUSTOM_DATA_TRIGGER';
                            const tsLabel = eventData.triggerType === 'ON_REPLAY' ? 'TimeLine Driver' : 'Trigger Source';
                            const tsOptions = triggerSourceOptions[eventData.triggerType] || [];
                            const tsSelected = Array.isArray(eventData.triggerSource) ? eventData.triggerSource : [];
                            const tsFiltered = tsOptions.filter(o => (o.label || o).toLowerCase().includes(tsPickerSearch.toLowerCase()));
                            const isTsSelected = (opt) => tsSelected.some(v => (v.value || v) === (opt.value || opt));
                            const tsError = submitted && !tsSelected.length;
                            const handleTsToggle = (opt) => {
                                if (isMultiple) {
                                    const newVal = isTsSelected(opt) ? tsSelected.filter(v => (v.value || v) !== (opt.value || opt)) : [...tsSelected, opt];
                                    if (eventData.triggerType === 'ON_TRANSACTION_POST') setAvailableSources(['Transactions']);
                                    else if (eventData.triggerType === 'ON_ATTRIBUTE_CHANGE') setAvailableSources(['Attribute']);
                                    else setAvailableSources(ALL_SOURCES);
                                    handleChange('triggerSource', newVal);
                                } else {
                                    const newVal = [opt];
                                    if (opt.value === 'reference_table') setAvailableSources(referenceTables);
                                    else if (opt.value === 'operational_table') setAvailableSources(operationalTables);
                                    else setAvailableSources([]);
                                    handleChange('triggerSource', newVal);
                                    setTsPickerAnchor(null);
                                }
                            };
                            return (
                                <Box sx={{ mt: 2 }}>
                                    <TextField
                                        fullWidth size="small"
                                        label={tsLabel}
                                        required
                                        disabled={isEditMode}
                                        value=""
                                        error={tsError}
                                        helperText={tsError ? `${tsLabel} is required` : ''}
                                        onClick={(e) => { if (!isEditMode) { setTsPickerAnchor(e.currentTarget); setTsPickerSearch(''); } }}
                                        inputProps={{ readOnly: true, style: { width: tsSelected.length > 0 ? 0 : undefined, padding: tsSelected.length > 0 ? 0 : undefined, cursor: isEditMode ? 'default' : 'pointer' } }}
                                        InputLabelProps={{ shrink: true }}
                                        InputProps={{
                                            startAdornment: tsSelected.length > 0
                                                ? tsSelected.map((item, i) => (
                                                    <Chip key={i} label={item.label || item} size="small"
                                                        onDelete={isEditMode ? undefined : (e) => { e.stopPropagation(); handleChange('triggerSource', tsSelected.filter((_, idx) => idx !== i)); }}
                                                        sx={{ height: 22, fontSize: '0.72rem', fontWeight: 600, borderRadius: 1.5, bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', border: `1px solid ${alpha(theme.palette.primary.main, 0.25)}`, '& .MuiChip-deleteIcon': { fontSize: '14px', color: alpha(theme.palette.primary.main, 0.5), '&:hover': { color: 'primary.main' } } }}
                                                    />
                                                ))
                                                : <InputAdornment position="start"><SearchIcon fontSize="small" sx={{ color: 'text.disabled' }} /></InputAdornment>,
                                        }}
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, ...(tsSelected.length > 0 && { flexWrap: 'wrap', gap: 0.5, pt: 2.5, pb: 0.75 }) } }}
                                    />
                                    <Popover
                                        open={Boolean(tsPickerAnchor)} anchorEl={tsPickerAnchor}
                                        onClose={() => setTsPickerAnchor(null)}
                                        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                                        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                                        slotProps={{ paper: { sx: { mt: 0.75, width: tsPickerAnchor?.offsetWidth, borderRadius: 3, boxShadow: '0 8px 32px rgba(15,23,42,0.16)', border: '1px solid', borderColor: 'divider', overflow: 'hidden' } } }}
                                    >
                                        <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: alpha(theme.palette.divider, 0.6) }}>
                                            <TextField autoFocus fullWidth size="small" placeholder={`Search ${tsLabel.toLowerCase()}…`}
                                                value={tsPickerSearch} onChange={(e) => setTsPickerSearch(e.target.value)}
                                                InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" sx={{ color: 'text.disabled' }} /></InputAdornment> }}
                                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                            />
                                        </Box>
                                        <List dense disablePadding sx={{ maxHeight: 240, overflow: 'auto' }}>
                                            {isMultiple && tsFiltered.length > 0 && (
                                                <ListItemButton onClick={() => { const allSel = tsFiltered.every(o => isTsSelected(o)); const newVal = allSel ? tsSelected.filter(v => !tsFiltered.some(o => (o.value || o) === (v.value || v))) : [...tsSelected, ...tsFiltered.filter(o => !isTsSelected(o))]; if (eventData.triggerType === 'ON_TRANSACTION_POST') setAvailableSources(['Transactions']); else if (eventData.triggerType === 'ON_ATTRIBUTE_CHANGE') setAvailableSources(['Attribute']); else setAvailableSources(ALL_SOURCES); handleChange('triggerSource', newVal); }} sx={{ py: 0.75, px: 1, borderBottom: '1px solid', borderColor: alpha(theme.palette.divider, 0.5), bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
                                                    <Checkbox checked={tsFiltered.length > 0 && tsFiltered.every(o => isTsSelected(o))} indeterminate={tsFiltered.some(o => isTsSelected(o)) && !tsFiltered.every(o => isTsSelected(o))} size="small" disableRipple icon={cbUnchecked} checkedIcon={cbChecked('primary.main')} indeterminateIcon={cbIndeterminate('primary.main')} sx={{ p: 0.5 }} />
                                                    <ListItemText primary="Select All" primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: 700 }} />
                                                </ListItemButton>
                                            )}
                                            {tsFiltered.length === 0 ? (
                                                <ListItemButton disabled sx={{ justifyContent: 'center', py: 2.5 }}>
                                                    <Typography variant="caption" color="text.disabled">No options found.</Typography>
                                                </ListItemButton>
                                            ) : tsFiltered.map((opt) => {
                                                const sel = isTsSelected(opt);
                                                return (
                                                    <ListItemButton key={opt.value || opt} onClick={() => handleTsToggle(opt)}
                                                        sx={{ py: 0.5, px: 1, '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.06) } }}
                                                    >
                                                        {isMultiple && <Checkbox checked={sel} size="small" disableRipple icon={cbUnchecked} checkedIcon={cbChecked('primary.main')} sx={{ p: 0.5 }} />}
                                                        <ListItemText primary={opt.label || opt} primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: sel ? 600 : 400, color: sel ? 'primary.main' : 'text.primary' }} />
                                                    </ListItemButton>
                                                );
                                            })}
                                        </List>
                                    </Popover>
                                </Box>
                            );
                        })()}
                        </Box>
                    </Paper>

                    {/* Source Mapping Configuration Card */}
                    <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: alpha(theme.palette.divider, 0.7), bgcolor: 'background.paper', overflow: 'hidden' }}>
                        <Box sx={{ px: 2.5, py: 1.25, borderBottom: '1px solid', borderColor: alpha(theme.palette.divider, 0.6), bgcolor: alpha(theme.palette.primary.main, 0.025), display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.7, color: 'text.secondary', fontSize: '0.67rem' }}>
                                Source Mapping
                            </Typography>
                            {/* UPDATE: Hide add button for both Custom Data Trigger AND Transaction Post */}
                            {eventData.triggerType !== 'ON_CUSTOM_DATA_TRIGGER' && eventData.triggerType !== 'ON_TRANSACTION_POST' && (
                                <Tooltip title={getAddSourceTooltip()}>
                                    <span>
                                        <IconButton
                                            onClick={handleAddNew}
                                            disabled={!canAddSource()}
                                            size="small"
                                            sx={{
                                                width: 28, height: 28, borderRadius: '50%',
                                                background: theme.palette.primary.main,
                                                color: '#fff',
                                                boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.35)}`,
                                                transition: 'all 0.18s ease',
                                                '&:hover': { background: theme.palette.primary.dark, transform: 'scale(1.1)' },
                                                '&.Mui-disabled': { bgcolor: 'grey.200', boxShadow: 0, color: 'grey.400' },
                                            }}
                                        >
                                            <AddOutlinedIcon sx={{ fontSize: 16 }} />
                                        </IconButton>
                                    </span>
                                </Tooltip>
                            )}
                        </Box>
                        <Box sx={{ p: 2.5 }}>
                        {/* Source Mapping Table */}
                        <TableContainer component={Paper} variant="outlined">
                            <Table sx={{ minWidth: 1400, tableLayout: 'fixed' }} size="small">
                                <TableHead>
                                    <TableRow sx={{ bgcolor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                                        {['#', 'Source Table', 'Source Columns', 'Version Type', 'Map Fields', 'Actions'].map((label, i) => (
                                            <TableCell key={label} sx={{ width: [60, 200, 300, 200, 300, 140][i], color: '#475569', fontSize: '0.72rem', fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif', borderBottom: '2px solid #e2e8f0', bgcolor: '#f8fafc' }}>
                                                {label}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {sourceMappings.map((row, index) => (
                                        <TableRow key={row.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                            <TableCell>{index + 1}</TableCell>
                                            <TableCell>
                                                {editingRow === row.id ? (
                                                    <>
                                                        <TextField
                                                            fullWidth size="small"
                                                            value={row.sourceTable}
                                                            onClick={(e) => { setEditSourcePickerAnchor(e.currentTarget); setEditSourcePickerSearch(''); setEditSourcePickerRowId(row.id); }}
                                                            inputProps={{ readOnly: true, style: { cursor: 'pointer' } }}
                                                            InputProps={{
                                                                startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" sx={{ color: 'text.disabled' }} /></InputAdornment>,
                                                            }}
                                                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                                        />
                                                        <Popover
                                                            open={Boolean(editSourcePickerAnchor) && editSourcePickerRowId === row.id}
                                                            anchorEl={editSourcePickerAnchor}
                                                            onClose={() => setEditSourcePickerAnchor(null)}
                                                            anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                                                            transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                                                            slotProps={{ paper: { sx: { mt: 0.75, width: editSourcePickerAnchor?.offsetWidth, borderRadius: 3, boxShadow: '0 8px 32px rgba(15,23,42,0.16)', border: '1px solid', borderColor: 'divider', overflow: 'hidden' } } }}
                                                        >
                                                            <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: alpha(theme.palette.divider, 0.6) }}>
                                                                <TextField autoFocus fullWidth size="small" placeholder="Search tables..."
                                                                    value={editSourcePickerSearch} onChange={(e) => setEditSourcePickerSearch(e.target.value)}
                                                                    InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" sx={{ color: 'text.disabled' }} /></InputAdornment> }}
                                                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                                                />
                                                            </Box>
                                                            <List dense disablePadding sx={{ maxHeight: 240, overflow: 'auto' }}>
                                                                {availableSources.concat(row.sourceTable)
                                                                    .filter((src, i, arr) => arr.indexOf(src) === i)
                                                                    .filter(src => src.toLowerCase().includes(editSourcePickerSearch.toLowerCase()))
                                                                    .map((src) => (
                                                                        <ListItemButton key={src} selected={src === row.sourceTable}
                                                                            onClick={() => { handleCellChange(row.id, 'sourceTable', src); setEditSourcePickerAnchor(null); }}
                                                                            sx={{ py: 1, px: 2, '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.06) }, '&.Mui-selected': { bgcolor: alpha(theme.palette.primary.main, 0.1) } }}
                                                                        >
                                                                            <ListItemText primary={src} primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: 500 }} />
                                                                        </ListItemButton>
                                                                    ))}
                                                            </List>
                                                        </Popover>
                                                    </>
                                                ) : (
                                                    <Chip
                                                        label={row.sourceTable}
                                                        size="small"
                                                        sx={{
                                                            fontWeight: 600,
                                                            bgcolor: alpha(theme.palette.primary.main, 0.08),
                                                            color: theme.palette.primary.main,
                                                            border: `1px solid ${alpha(theme.palette.primary.main, 0.25)}`,
                                                        }}
                                                    />
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {editingRow === row.id ? (() => {
                                                    const colOpts = resolveSourceColumnOptions(row, eventData);
                                                    const filtCols = colOpts.filter(o => o.label.toLowerCase().includes(ecPickerSearch.toLowerCase()));
                                                    const chipSx = { height: 22, fontSize: '0.72rem', fontWeight: 600, borderRadius: 1.5, bgcolor: alpha(theme.palette.primary.main, 0.12), color: theme.palette.primary.dark, border: `1px solid ${alpha(theme.palette.primary.main, 0.25)}`, '& .MuiChip-deleteIcon': { fontSize: '14px', color: alpha(theme.palette.primary.main, 0.5), '&:hover': { color: theme.palette.primary.dark } } };
                                                    return (
                                                        <>
                                                            <TextField fullWidth size="small"
                                                                value=""
                                                                onClick={(e) => { setEcPickerAnchor(e.currentTarget); setEcPickerSearch(''); setEcPickerRowId(row.id); }}
                                                                inputProps={{ readOnly: true, style: { width: row.sourceColumns.length > 0 ? 0 : undefined, padding: row.sourceColumns.length > 0 ? 0 : undefined, cursor: 'pointer' } }}
                                                                InputLabelProps={{ shrink: row.sourceColumns.length > 0 }}
                                                                InputProps={{ startAdornment: row.sourceColumns.length > 0
                                                                    ? row.sourceColumns.map(v => { const o = colOpts.find(x => x.value === v) || { label: v, value: v }; return <Chip key={v} label={o.label} size="small" sx={chipSx} onDelete={(e) => { e.stopPropagation(); handleCellChange(row.id, 'sourceColumns', row.sourceColumns.filter(s => s !== v).map(s => colOpts.find(x => x.value === s) || { label: s, value: s })); }} />; })
                                                                    : <InputAdornment position="start"><SearchIcon fontSize="small" sx={{ color: 'text.disabled' }} /></InputAdornment> }}
                                                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, ...(row.sourceColumns.length > 0 && { flexWrap: 'wrap', gap: 0.5, py: 0.75 }) } }}
                                                                placeholder="Search and select columns…"
                                                            />
                                                            <Popover open={Boolean(ecPickerAnchor) && ecPickerRowId === row.id} anchorEl={ecPickerAnchor} onClose={() => setEcPickerAnchor(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }} transformOrigin={{ vertical: 'top', horizontal: 'left' }} slotProps={{ paper: { sx: { mt: 0.75, minWidth: 240, borderRadius: 3, boxShadow: '0 8px 32px rgba(15,23,42,0.16)', border: '1px solid', borderColor: 'divider', overflow: 'hidden' } } }}>
                                                                <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: alpha(theme.palette.divider, 0.6) }}>
                                                                    <TextField autoFocus fullWidth size="small" placeholder="Search columns…" value={ecPickerSearch} onChange={(e) => setEcPickerSearch(e.target.value)} InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" sx={{ color: 'text.disabled' }} /></InputAdornment> }} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                                                                </Box>
                                                                <List dense disablePadding sx={{ maxHeight: 220, overflow: 'auto' }}>
                                                                    {filtCols.length > 0 && <ListItemButton onClick={() => { const allSel = filtCols.every(o => row.sourceColumns.includes(o.value)); const cur = row.sourceColumns.map(v => colOpts.find(x => x.value === v) || { label: v, value: v }); handleCellChange(row.id, 'sourceColumns', allSel ? cur.filter(o => !filtCols.some(f => f.value === o.value)) : [...cur, ...filtCols.filter(o => !row.sourceColumns.includes(o.value))]); }} sx={{ py: 0.75, px: 1, borderBottom: '1px solid', borderColor: alpha(theme.palette.divider, 0.5), bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
                                                                        <Checkbox checked={filtCols.length > 0 && filtCols.every(o => row.sourceColumns.includes(o.value))} indeterminate={filtCols.some(o => row.sourceColumns.includes(o.value)) && !filtCols.every(o => row.sourceColumns.includes(o.value))} size="small" disableRipple icon={cbUnchecked} checkedIcon={cbChecked('primary.main')} indeterminateIcon={cbIndeterminate('primary.main')} sx={{ p: 0.5 }} />
                                                                        <ListItemText primary="Select All" primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: 700 }} />
                                                                    </ListItemButton>}
                                                                    {filtCols.length === 0 ? <ListItemButton disabled sx={{ justifyContent: 'center', py: 2 }}><Typography variant="caption" color="text.disabled">No columns found.</Typography></ListItemButton>
                                                                    : filtCols.map(opt => {
                                                                        const sel = row.sourceColumns.includes(opt.value);
                                                                        return <ListItemButton key={opt.value} onClick={() => { const cur = row.sourceColumns.map(v => colOpts.find(x => x.value === v) || { label: v, value: v }); handleCellChange(row.id, 'sourceColumns', sel ? cur.filter(o => o.value !== opt.value) : [...cur, opt]); }} sx={{ py: 0.5, px: 1, '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.06) } }}>
                                                                            <Checkbox checked={sel} size="small" disableRipple icon={cbUnchecked} checkedIcon={cbChecked('primary.main')} sx={{ p: 0.5 }} />
                                                                            <ListItemText primary={opt.label} primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: sel ? 600 : 400, color: sel ? theme.palette.primary.dark : 'text.primary' }} />
                                                                        </ListItemButton>;
                                                                    })}
                                                                </List>
                                                            </Popover>
                                                        </>
                                                    );
                                                })() : (
                                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                        {getOptionLabels(row.sourceColumns, sourceColumnsOptions[row.sourceTable] || []).map((label, idx) => (
                                                            <Chip
                                                                key={idx}
                                                                label={label}
                                                                size="small"
                                                                sx={{
                                                                    bgcolor: alpha(theme.palette.primary.main, 0.12),
                                                                    color: theme.palette.primary.dark,
                                                                    fontWeight: 500,
                                                                }}
                                                            />
                                                        ))}
                                                    </Box>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {editingRow === row.id ? (() => {
                                                    const vtEnabled = isVersionTypeEnabled(row.sourceTable);
                                                    const filtVT = versionTypeOptions.filter(o => o.label.toLowerCase().includes(evPickerSearch.toLowerCase()));
                                                    const chipSx = { height: 22, fontSize: '0.72rem', fontWeight: 600, borderRadius: 1.5, bgcolor: alpha(theme.palette.warning.main, 0.12), color: theme.palette.warning.dark, border: `1px solid ${alpha(theme.palette.warning.main, 0.25)}`, '& .MuiChip-deleteIcon': { fontSize: '14px', color: alpha(theme.palette.warning.main, 0.5), '&:hover': { color: theme.palette.warning.dark } } };
                                                    return (
                                                        <>
                                                            <TextField fullWidth size="small"
                                                                value=""
                                                                onClick={(e) => { if (vtEnabled) { setEvPickerAnchor(e.currentTarget); setEvPickerSearch(''); setEvPickerRowId(row.id); } }}
                                                                inputProps={{ readOnly: true, style: { width: row.versionType.length > 0 ? 0 : undefined, padding: row.versionType.length > 0 ? 0 : undefined, cursor: vtEnabled ? 'pointer' : 'default' } }}
                                                                InputLabelProps={{ shrink: row.versionType.length > 0 }}
                                                                disabled={!vtEnabled}
                                                                InputProps={{ startAdornment: row.versionType.length > 0
                                                                    ? row.versionType.map(v => { const o = versionTypeOptions.find(x => x.value === v) || { label: v, value: v }; return <Chip key={v} label={o.label} size="small" sx={chipSx} onDelete={(e) => { e.stopPropagation(); handleCellChange(row.id, 'versionType', row.versionType.filter(s => s !== v).map(s => versionTypeOptions.find(x => x.value === s) || { label: s, value: s })); }} />; })
                                                                    : <InputAdornment position="start"><SearchIcon fontSize="small" sx={{ color: 'text.disabled' }} /></InputAdornment> }}
                                                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, ...(row.versionType.length > 0 && { flexWrap: 'wrap', gap: 0.5, py: 0.75 }) }, '& .MuiInputBase-root.Mui-disabled': { backgroundColor: '#f5f5f5' } }}
                                                                placeholder="Search and select versions…"
                                                            />
                                                            <Popover open={Boolean(evPickerAnchor) && evPickerRowId === row.id} anchorEl={evPickerAnchor} onClose={() => setEvPickerAnchor(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }} transformOrigin={{ vertical: 'top', horizontal: 'left' }} slotProps={{ paper: { sx: { mt: 0.75, minWidth: 240, borderRadius: 3, boxShadow: '0 8px 32px rgba(15,23,42,0.16)', border: '1px solid', borderColor: 'divider', overflow: 'hidden' } } }}>
                                                                <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: alpha(theme.palette.divider, 0.6) }}>
                                                                    <TextField autoFocus fullWidth size="small" placeholder="Search versions…" value={evPickerSearch} onChange={(e) => setEvPickerSearch(e.target.value)} InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" sx={{ color: 'text.disabled' }} /></InputAdornment> }} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                                                                </Box>
                                                                <List dense disablePadding sx={{ maxHeight: 220, overflow: 'auto' }}>
                                                                    {filtVT.length > 0 && <ListItemButton onClick={() => { const allSel = filtVT.every(o => row.versionType.includes(o.value)); const cur = row.versionType.map(v => versionTypeOptions.find(x => x.value === v) || { label: v, value: v }); handleCellChange(row.id, 'versionType', allSel ? cur.filter(o => !filtVT.some(f => f.value === o.value)) : [...cur, ...filtVT.filter(o => !row.versionType.includes(o.value))]); }} sx={{ py: 0.75, px: 1, borderBottom: '1px solid', borderColor: alpha(theme.palette.divider, 0.5), bgcolor: alpha(theme.palette.warning.main, 0.02) }}>
                                                                        <Checkbox checked={filtVT.length > 0 && filtVT.every(o => row.versionType.includes(o.value))} indeterminate={filtVT.some(o => row.versionType.includes(o.value)) && !filtVT.every(o => row.versionType.includes(o.value))} size="small" disableRipple icon={cbUnchecked} checkedIcon={cbChecked('warning.main')} indeterminateIcon={cbIndeterminate('warning.main')} sx={{ p: 0.5 }} />
                                                                        <ListItemText primary="Select All" primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: 700 }} />
                                                                    </ListItemButton>}
                                                                    {filtVT.length === 0 ? <ListItemButton disabled sx={{ justifyContent: 'center', py: 2 }}><Typography variant="caption" color="text.disabled">No versions found.</Typography></ListItemButton>
                                                                    : filtVT.map(opt => {
                                                                        const sel = row.versionType.includes(opt.value);
                                                                        return <ListItemButton key={opt.value} onClick={() => { const cur = row.versionType.map(v => versionTypeOptions.find(x => x.value === v) || { label: v, value: v }); handleCellChange(row.id, 'versionType', sel ? cur.filter(o => o.value !== opt.value) : [...cur, opt]); }} sx={{ py: 0.5, px: 1, '&:hover': { bgcolor: alpha(theme.palette.warning.main, 0.06) } }}>
                                                                            <Checkbox checked={sel} size="small" disableRipple icon={cbUnchecked} checkedIcon={cbChecked('warning.main')} sx={{ p: 0.5 }} />
                                                                            <ListItemText primary={opt.label} primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: sel ? 600 : 400, color: sel ? theme.palette.warning.dark : 'text.primary' }} />
                                                                        </ListItemButton>;
                                                                    })}
                                                                </List>
                                                            </Popover>
                                                        </>
                                                    );
                                                })() : (
                                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                        {getOptionLabels(row.versionType, versionTypeOptions).map((label, idx) => (
                                                            <Chip
                                                                key={idx}
                                                                label={label}
                                                                size="small"
                                                                variant="filled"
                                                                sx={{
                                                                    bgcolor: alpha(theme.palette.warning.main, 0.12),
                                                                    color: theme.palette.warning.dark,
                                                                    fontWeight: 500,
                                                                }}
                                                            />
                                                        ))}
                                                        {!isVersionTypeEnabled(row.sourceTable) && row.versionType.length === 0 && (
                                                            <Typography variant="body2" color="textSecondary" sx={{ fontStyle: 'italic' }}>
                                                                Not applicable
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {editingRow === row.id ? (() => {
                                                    const dmOpts = dataMappingOptions[row.sourceTable] || [];
                                                    const dmEnabled = isDataMappingEnabled(row.sourceTable);
                                                    const filtDM = dmOpts.filter(o => o.label.toLowerCase().includes(emPickerSearch.toLowerCase()));
                                                    const chipSx = { height: 22, fontSize: '0.72rem', fontWeight: 600, borderRadius: 1.5, bgcolor: alpha(theme.palette.secondary.main, 0.12), color: theme.palette.secondary.dark, border: `1px solid ${alpha(theme.palette.secondary.main, 0.25)}`, '& .MuiChip-deleteIcon': { fontSize: '14px', color: alpha(theme.palette.secondary.main, 0.5), '&:hover': { color: theme.palette.secondary.dark } } };
                                                    return (
                                                        <>
                                                            <TextField fullWidth size="small"
                                                                value=""
                                                                onClick={(e) => { if (dmEnabled) { setEmPickerAnchor(e.currentTarget); setEmPickerSearch(''); setEmPickerRowId(row.id); } }}
                                                                inputProps={{ readOnly: true, style: { width: row.dataMapping.length > 0 ? 0 : undefined, padding: row.dataMapping.length > 0 ? 0 : undefined, cursor: dmEnabled ? 'pointer' : 'default' } }}
                                                                InputLabelProps={{ shrink: row.dataMapping.length > 0 }}
                                                                disabled={!dmEnabled}
                                                                InputProps={{ startAdornment: row.dataMapping.length > 0
                                                                    ? row.dataMapping.map(v => { const o = dmOpts.find(x => x.value === v) || { label: v, value: v }; return <Chip key={v} label={o.label} size="small" sx={chipSx} onDelete={(e) => { e.stopPropagation(); handleCellChange(row.id, 'dataMapping', row.dataMapping.filter(s => s !== v).map(s => dmOpts.find(x => x.value === s) || { label: s, value: s })); }} />; })
                                                                    : <InputAdornment position="start"><SearchIcon fontSize="small" sx={{ color: 'text.disabled' }} /></InputAdornment> }}
                                                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, ...(row.dataMapping.length > 0 && { flexWrap: 'wrap', gap: 0.5, py: 0.75 }) }, '& .MuiInputBase-root.Mui-disabled': { backgroundColor: '#f5f5f5' } }}
                                                                placeholder="Search and select mappings…"
                                                            />
                                                            <Popover open={Boolean(emPickerAnchor) && emPickerRowId === row.id} anchorEl={emPickerAnchor} onClose={() => setEmPickerAnchor(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }} transformOrigin={{ vertical: 'top', horizontal: 'left' }} slotProps={{ paper: { sx: { mt: 0.75, minWidth: 240, borderRadius: 3, boxShadow: '0 8px 32px rgba(15,23,42,0.16)', border: '1px solid', borderColor: 'divider', overflow: 'hidden' } } }}>
                                                                <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: alpha(theme.palette.divider, 0.6) }}>
                                                                    <TextField autoFocus fullWidth size="small" placeholder="Search mappings…" value={emPickerSearch} onChange={(e) => setEmPickerSearch(e.target.value)} InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" sx={{ color: 'text.disabled' }} /></InputAdornment> }} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                                                                </Box>
                                                                <List dense disablePadding sx={{ maxHeight: 220, overflow: 'auto' }}>
                                                                    {filtDM.length > 0 && <ListItemButton onClick={() => { const allSel = filtDM.every(o => row.dataMapping.includes(o.value)); const cur = row.dataMapping.map(v => dmOpts.find(x => x.value === v) || { label: v, value: v }); handleCellChange(row.id, 'dataMapping', allSel ? cur.filter(o => !filtDM.some(f => f.value === o.value)) : [...cur, ...filtDM.filter(o => !row.dataMapping.includes(o.value))]); }} sx={{ py: 0.75, px: 1, borderBottom: '1px solid', borderColor: alpha(theme.palette.divider, 0.5), bgcolor: alpha(theme.palette.secondary.main, 0.02) }}>
                                                                        <Checkbox checked={filtDM.length > 0 && filtDM.every(o => row.dataMapping.includes(o.value))} indeterminate={filtDM.some(o => row.dataMapping.includes(o.value)) && !filtDM.every(o => row.dataMapping.includes(o.value))} size="small" disableRipple icon={cbUnchecked} checkedIcon={cbChecked('secondary.main')} indeterminateIcon={cbIndeterminate('secondary.main')} sx={{ p: 0.5 }} />
                                                                        <ListItemText primary="Select All" primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: 700 }} />
                                                                    </ListItemButton>}
                                                                    {filtDM.length === 0 ? <ListItemButton disabled sx={{ justifyContent: 'center', py: 2 }}><Typography variant="caption" color="text.disabled">No mappings found.</Typography></ListItemButton>
                                                                    : filtDM.map(opt => {
                                                                        const sel = row.dataMapping.includes(opt.value);
                                                                        return <ListItemButton key={opt.value} onClick={() => { const cur = row.dataMapping.map(v => dmOpts.find(x => x.value === v) || { label: v, value: v }); handleCellChange(row.id, 'dataMapping', sel ? cur.filter(o => o.value !== opt.value) : [...cur, opt]); }} sx={{ py: 0.5, px: 1, '&:hover': { bgcolor: alpha(theme.palette.secondary.main, 0.06) } }}>
                                                                            <Checkbox checked={sel} size="small" disableRipple icon={cbUnchecked} checkedIcon={cbChecked('secondary.main')} sx={{ p: 0.5 }} />
                                                                            <ListItemText primary={opt.label} primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: sel ? 600 : 400, color: sel ? theme.palette.secondary.dark : 'text.primary' }} />
                                                                        </ListItemButton>;
                                                                    })}
                                                                </List>
                                                            </Popover>
                                                        </>
                                                    );
                                                })() : (
                                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                        {getOptionLabels(row.dataMapping, dataMappingOptions[row.sourceTable] || []).map((label, idx) => (
                                                            <Chip
                                                                key={idx}
                                                                label={label}
                                                                size="small"
                                                                variant="filled"
                                                                sx={{
                                                                    bgcolor: alpha(theme.palette.secondary.main, 0.12),
                                                                    color: theme.palette.secondary.dark,
                                                                    fontWeight: 500,
                                                                }}
                                                            />
                                                        ))}
                                                        {!isDataMappingEnabled(row.sourceTable) && row.dataMapping.length === 0 && (
                                                            <Typography variant="body2" color="textSecondary" sx={{ fontStyle: 'italic' }}>
                                                                Not applicable
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                )}
                                            </TableCell>

                                            <TableCell>
                                                {editingRow === row.id ? (
                                                    <Box sx={{ display: 'flex', gap: 0.75 }}>
                                                        <Tooltip title="Save">
                                                            <IconButton size="small" onClick={() => handleSaveRow(row.id)} sx={{ color: '#16a34a', bgcolor: 'rgba(22,163,74,0.06)', borderRadius: 1.5, '&:hover': { bgcolor: 'rgba(22,163,74,0.14)' } }}>
                                                                <CheckCircleOutlineIcon sx={{ fontSize: 18 }} />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="Cancel">
                                                            <IconButton size="small" onClick={handleCancelEdit} sx={{ color: '#64748B', bgcolor: 'rgba(100,116,139,0.06)', borderRadius: 1.5, '&:hover': { bgcolor: 'rgba(100,116,139,0.14)' } }}>
                                                                <HighlightOffOutlinedIcon sx={{ fontSize: 16 }} />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </Box>
                                                ) : (
                                                    <Box sx={{ display: 'flex', gap: 0.75 }}>
                                                        <Tooltip title="Edit">
                                                            <IconButton size="small" onClick={() => handleEditRow(row)} sx={{ color: '#14213d', bgcolor: alpha('#14213d', 0.06), borderRadius: 1.5, '&:hover': { bgcolor: alpha('#14213d', 0.14) } }}>
                                                                <EditOutlinedIcon sx={{ fontSize: 16 }} />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="Delete">
                                                            <IconButton size="small" onClick={() => handleDeleteSource(row.id)} sx={{ color: '#dc2626', bgcolor: 'rgba(220,38,38,0.06)', borderRadius: 1.5, '&:hover': { bgcolor: 'rgba(220,38,38,0.14)' } }}>
                                                                <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </Box>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}

                                    {isAddingNew && (
                                        <TableRow sx={{ backgroundColor: '#f8f9fa' }}>
                                            <TableCell>{sourceMappings.length + 1}</TableCell>
                                            <TableCell>
                                                <TextField
                                                    fullWidth size="small"
                                                    value={newSource.sourceTable}
                                                    onClick={(e) => { setNewSourcePickerAnchor(e.currentTarget); setNewSourcePickerSearch(''); }}
                                                    inputProps={{ readOnly: true, style: { cursor: 'pointer' } }}
                                                    InputProps={{
                                                        startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" sx={{ color: 'text.disabled' }} /></InputAdornment>,
                                                    }}
                                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                                />
                                                <Popover
                                                    open={Boolean(newSourcePickerAnchor)} anchorEl={newSourcePickerAnchor}
                                                    onClose={() => setNewSourcePickerAnchor(null)}
                                                    anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                                                    transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                                                    slotProps={{ paper: { sx: { mt: 0.75, width: newSourcePickerAnchor?.offsetWidth, borderRadius: 3, boxShadow: '0 8px 32px rgba(15,23,42,0.16)', border: '1px solid', borderColor: 'divider', overflow: 'hidden' } } }}
                                                >
                                                    <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: alpha(theme.palette.divider, 0.6) }}>
                                                        <TextField autoFocus fullWidth size="small" placeholder="Search tables..."
                                                            value={newSourcePickerSearch} onChange={(e) => setNewSourcePickerSearch(e.target.value)}
                                                            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" sx={{ color: 'text.disabled' }} /></InputAdornment> }}
                                                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                                                        />
                                                    </Box>
                                                    <List dense disablePadding sx={{ maxHeight: 240, overflow: 'auto' }}>
                                                        {availableSources.filter(src => src.toLowerCase().includes(newSourcePickerSearch.toLowerCase())).map((src) => (
                                                            <ListItemButton key={src} selected={src === newSource.sourceTable}
                                                                onClick={() => { setNewSource(prev => ({ ...prev, sourceTable: src })); setNewSourcePickerAnchor(null); }}
                                                                sx={{ py: 1, px: 2, '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.06) }, '&.Mui-selected': { bgcolor: alpha(theme.palette.primary.main, 0.1) } }}
                                                            >
                                                                <ListItemText primary={src} primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: 500 }} />
                                                            </ListItemButton>
                                                        ))}
                                                    </List>
                                                </Popover>
                                            </TableCell>
                                            <TableCell>
                                                {(() => {
                                                    const colOpts = resolveSourceColumnOptions(newSource, eventData);
                                                    const filtNC = colOpts.filter(o => (o.label || o).toLowerCase().includes(ncPickerSearch.toLowerCase()));
                                                    const chipSx = { height: 22, fontSize: '0.72rem', fontWeight: 600, borderRadius: 1.5, bgcolor: alpha(theme.palette.primary.main, 0.12), color: theme.palette.primary.dark, border: `1px solid ${alpha(theme.palette.primary.main, 0.25)}`, '& .MuiChip-deleteIcon': { fontSize: '14px', color: alpha(theme.palette.primary.main, 0.5), '&:hover': { color: theme.palette.primary.dark } } };
                                                    return (
                                                        <>
                                                            <TextField fullWidth size="small"
                                                                value=""
                                                                onClick={(e) => { setNcPickerAnchor(e.currentTarget); setNcPickerSearch(''); }}
                                                                inputProps={{ readOnly: true, style: { width: newSource.sourceColumns.length > 0 ? 0 : undefined, padding: newSource.sourceColumns.length > 0 ? 0 : undefined, cursor: 'pointer' } }}
                                                                InputLabelProps={{ shrink: newSource.sourceColumns.length > 0 }}
                                                                InputProps={{ startAdornment: newSource.sourceColumns.length > 0
                                                                    ? newSource.sourceColumns.map((o, i) => <Chip key={i} label={o.label || o} size="small" sx={chipSx} onDelete={(e) => { e.stopPropagation(); setNewSource(prev => ({ ...prev, sourceColumns: prev.sourceColumns.filter((_, idx) => idx !== i) })); }} />)
                                                                    : <InputAdornment position="start"><SearchIcon fontSize="small" sx={{ color: 'text.disabled' }} /></InputAdornment> }}
                                                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, ...(newSource.sourceColumns.length > 0 && { flexWrap: 'wrap', gap: 0.5, py: 0.75 }) } }}
                                                                placeholder="Search and select columns…"
                                                            />
                                                            <Popover open={Boolean(ncPickerAnchor)} anchorEl={ncPickerAnchor} onClose={() => setNcPickerAnchor(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }} transformOrigin={{ vertical: 'top', horizontal: 'left' }} slotProps={{ paper: { sx: { mt: 0.75, minWidth: 240, borderRadius: 3, boxShadow: '0 8px 32px rgba(15,23,42,0.16)', border: '1px solid', borderColor: 'divider', overflow: 'hidden' } } }}>
                                                                <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: alpha(theme.palette.divider, 0.6) }}>
                                                                    <TextField autoFocus fullWidth size="small" placeholder="Search columns…" value={ncPickerSearch} onChange={(e) => setNcPickerSearch(e.target.value)} InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" sx={{ color: 'text.disabled' }} /></InputAdornment> }} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                                                                </Box>
                                                                <List dense disablePadding sx={{ maxHeight: 220, overflow: 'auto' }}>
                                                                    {filtNC.length > 0 && <ListItemButton onClick={() => { const allSel = filtNC.every(o => newSource.sourceColumns.some(s => (s.value || s) === (o.value || o))); setNewSource(prev => ({ ...prev, sourceColumns: allSel ? prev.sourceColumns.filter(s => !filtNC.some(o => (o.value || o) === (s.value || s))) : [...prev.sourceColumns, ...filtNC.filter(o => !prev.sourceColumns.some(s => (s.value || s) === (o.value || o)))] })); }} sx={{ py: 0.75, px: 1, borderBottom: '1px solid', borderColor: alpha(theme.palette.divider, 0.5), bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
                                                                        <Checkbox checked={filtNC.length > 0 && filtNC.every(o => newSource.sourceColumns.some(s => (s.value || s) === (o.value || o)))} indeterminate={filtNC.some(o => newSource.sourceColumns.some(s => (s.value || s) === (o.value || o))) && !filtNC.every(o => newSource.sourceColumns.some(s => (s.value || s) === (o.value || o)))} size="small" disableRipple icon={cbUnchecked} checkedIcon={cbChecked('primary.main')} indeterminateIcon={cbIndeterminate('primary.main')} sx={{ p: 0.5 }} />
                                                                        <ListItemText primary="Select All" primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: 700 }} />
                                                                    </ListItemButton>}
                                                                    {filtNC.length === 0 ? <ListItemButton disabled sx={{ justifyContent: 'center', py: 2 }}><Typography variant="caption" color="text.disabled">No columns found.</Typography></ListItemButton>
                                                                    : filtNC.map(opt => {
                                                                        const sel = newSource.sourceColumns.some(o => (o.value || o) === (opt.value || opt));
                                                                        return <ListItemButton key={opt.value || opt} onClick={() => setNewSource(prev => ({ ...prev, sourceColumns: sel ? prev.sourceColumns.filter(o => (o.value || o) !== (opt.value || opt)) : [...prev.sourceColumns, opt] }))} sx={{ py: 0.5, px: 1, '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.06) } }}>
                                                                            <Checkbox checked={sel} size="small" disableRipple icon={cbUnchecked} checkedIcon={cbChecked('primary.main')} sx={{ p: 0.5 }} />
                                                                            <ListItemText primary={opt.label || opt} primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: sel ? 600 : 400, color: sel ? theme.palette.primary.dark : 'text.primary' }} />
                                                                        </ListItemButton>;
                                                                    })}
                                                                </List>
                                                            </Popover>
                                                        </>
                                                    );
                                                })()}
                                            </TableCell>
                                            <TableCell>
                                                {(() => {
                                                    const nvEnabled = isVersionTypeEnabled(newSource.sourceTable);
                                                    const filtNV = versionTypeOptions.filter(o => o.label.toLowerCase().includes(nvPickerSearch.toLowerCase()));
                                                    const chipSx = { height: 22, fontSize: '0.72rem', fontWeight: 600, borderRadius: 1.5, bgcolor: alpha(theme.palette.warning.main, 0.12), color: theme.palette.warning.dark, border: `1px solid ${alpha(theme.palette.warning.main, 0.25)}`, '& .MuiChip-deleteIcon': { fontSize: '14px', color: alpha(theme.palette.warning.main, 0.5), '&:hover': { color: theme.palette.warning.dark } } };
                                                    return (
                                                        <>
                                                            <TextField fullWidth size="small"
                                                                value=""
                                                                onClick={(e) => { if (nvEnabled) { setNvPickerAnchor(e.currentTarget); setNvPickerSearch(''); } }}
                                                                inputProps={{ readOnly: true, style: { width: newSource.versionType.length > 0 ? 0 : undefined, padding: newSource.versionType.length > 0 ? 0 : undefined, cursor: nvEnabled ? 'pointer' : 'default' } }}
                                                                InputLabelProps={{ shrink: newSource.versionType.length > 0 }}
                                                                disabled={!nvEnabled}
                                                                InputProps={{ startAdornment: newSource.versionType.length > 0
                                                                    ? newSource.versionType.map((o, i) => <Chip key={i} label={o.label || o} size="small" sx={chipSx} onDelete={(e) => { e.stopPropagation(); setNewSource(prev => ({ ...prev, versionType: prev.versionType.filter((_, idx) => idx !== i) })); }} />)
                                                                    : <InputAdornment position="start"><SearchIcon fontSize="small" sx={{ color: 'text.disabled' }} /></InputAdornment> }}
                                                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, ...(newSource.versionType.length > 0 && { flexWrap: 'wrap', gap: 0.5, py: 0.75 }) }, '& .MuiInputBase-root.Mui-disabled': { backgroundColor: '#f5f5f5' } }}
                                                                placeholder="Search and select versions…"
                                                            />
                                                            <Popover open={Boolean(nvPickerAnchor)} anchorEl={nvPickerAnchor} onClose={() => setNvPickerAnchor(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }} transformOrigin={{ vertical: 'top', horizontal: 'left' }} slotProps={{ paper: { sx: { mt: 0.75, minWidth: 240, borderRadius: 3, boxShadow: '0 8px 32px rgba(15,23,42,0.16)', border: '1px solid', borderColor: 'divider', overflow: 'hidden' } } }}>
                                                                <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: alpha(theme.palette.divider, 0.6) }}>
                                                                    <TextField autoFocus fullWidth size="small" placeholder="Search versions…" value={nvPickerSearch} onChange={(e) => setNvPickerSearch(e.target.value)} InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" sx={{ color: 'text.disabled' }} /></InputAdornment> }} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                                                                </Box>
                                                                <List dense disablePadding sx={{ maxHeight: 220, overflow: 'auto' }}>
                                                                    {filtNV.length > 0 && <ListItemButton onClick={() => { const allSel = filtNV.every(o => newSource.versionType.some(s => (s.value || s) === o.value)); setNewSource(prev => ({ ...prev, versionType: allSel ? prev.versionType.filter(s => !filtNV.some(o => o.value === (s.value || s))) : [...prev.versionType, ...filtNV.filter(o => !prev.versionType.some(s => (s.value || s) === o.value))] })); }} sx={{ py: 0.75, px: 1, borderBottom: '1px solid', borderColor: alpha(theme.palette.divider, 0.5), bgcolor: alpha(theme.palette.warning.main, 0.02) }}>
                                                                        <Checkbox checked={filtNV.length > 0 && filtNV.every(o => newSource.versionType.some(s => (s.value || s) === o.value))} indeterminate={filtNV.some(o => newSource.versionType.some(s => (s.value || s) === o.value)) && !filtNV.every(o => newSource.versionType.some(s => (s.value || s) === o.value))} size="small" disableRipple icon={cbUnchecked} checkedIcon={cbChecked('warning.main')} indeterminateIcon={cbIndeterminate('warning.main')} sx={{ p: 0.5 }} />
                                                                        <ListItemText primary="Select All" primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: 700 }} />
                                                                    </ListItemButton>}
                                                                    {filtNV.length === 0 ? <ListItemButton disabled sx={{ justifyContent: 'center', py: 2 }}><Typography variant="caption" color="text.disabled">No versions found.</Typography></ListItemButton>
                                                                    : filtNV.map(opt => {
                                                                        const sel = newSource.versionType.some(o => (o.value || o) === opt.value);
                                                                        return <ListItemButton key={opt.value} onClick={() => setNewSource(prev => ({ ...prev, versionType: sel ? prev.versionType.filter(o => (o.value || o) !== opt.value) : [...prev.versionType, opt] }))} sx={{ py: 0.5, px: 1, '&:hover': { bgcolor: alpha(theme.palette.warning.main, 0.06) } }}>
                                                                            <Checkbox checked={sel} size="small" disableRipple icon={cbUnchecked} checkedIcon={cbChecked('warning.main')} sx={{ p: 0.5 }} />
                                                                            <ListItemText primary={opt.label} primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: sel ? 600 : 400, color: sel ? theme.palette.warning.dark : 'text.primary' }} />
                                                                        </ListItemButton>;
                                                                    })}
                                                                </List>
                                                            </Popover>
                                                        </>
                                                    );
                                                })()}
                                            </TableCell>
                                            <TableCell>
                                                {(() => {
                                                    const nmOpts = eventData.triggerType === 'ON_CUSTOM_DATA_TRIGGER' ? customTableMappings : (dataMappingOptions[newSource.sourceTable] || []);
                                                    const nmEnabled = isDataMappingEnabled(newSource.sourceTable);
                                                    const filtNM = nmOpts.filter(o => (o.label || o).toLowerCase().includes(nmPickerSearch.toLowerCase()));
                                                    const chipSx = { height: 22, fontSize: '0.72rem', fontWeight: 600, borderRadius: 1.5, bgcolor: alpha(theme.palette.secondary.main, 0.12), color: theme.palette.secondary.dark, border: `1px solid ${alpha(theme.palette.secondary.main, 0.25)}`, '& .MuiChip-deleteIcon': { fontSize: '14px', color: alpha(theme.palette.secondary.main, 0.5), '&:hover': { color: theme.palette.secondary.dark } } };
                                                    return (
                                                        <>
                                                            <TextField fullWidth size="small"
                                                                value=""
                                                                onClick={(e) => { if (nmEnabled) { setNmPickerAnchor(e.currentTarget); setNmPickerSearch(''); } }}
                                                                inputProps={{ readOnly: true, style: { width: newSource.dataMapping.length > 0 ? 0 : undefined, padding: newSource.dataMapping.length > 0 ? 0 : undefined, cursor: nmEnabled ? 'pointer' : 'default' } }}
                                                                InputLabelProps={{ shrink: newSource.dataMapping.length > 0 }}
                                                                disabled={!nmEnabled}
                                                                InputProps={{ startAdornment: newSource.dataMapping.length > 0
                                                                    ? newSource.dataMapping.map((o, i) => <Chip key={i} label={o.label || o} size="small" sx={chipSx} onDelete={(e) => { e.stopPropagation(); setNewSource(prev => ({ ...prev, dataMapping: prev.dataMapping.filter((_, idx) => idx !== i) })); }} />)
                                                                    : <InputAdornment position="start"><SearchIcon fontSize="small" sx={{ color: 'text.disabled' }} /></InputAdornment> }}
                                                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, ...(newSource.dataMapping.length > 0 && { flexWrap: 'wrap', gap: 0.5, py: 0.75 }) }, '& .MuiInputBase-root.Mui-disabled': { backgroundColor: '#f5f5f5' } }}
                                                                placeholder="Search and select mappings…"
                                                            />
                                                            <Popover open={Boolean(nmPickerAnchor)} anchorEl={nmPickerAnchor} onClose={() => setNmPickerAnchor(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }} transformOrigin={{ vertical: 'top', horizontal: 'left' }} slotProps={{ paper: { sx: { mt: 0.75, minWidth: 240, borderRadius: 3, boxShadow: '0 8px 32px rgba(15,23,42,0.16)', border: '1px solid', borderColor: 'divider', overflow: 'hidden' } } }}>
                                                                <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: alpha(theme.palette.divider, 0.6) }}>
                                                                    <TextField autoFocus fullWidth size="small" placeholder="Search mappings…" value={nmPickerSearch} onChange={(e) => setNmPickerSearch(e.target.value)} InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" sx={{ color: 'text.disabled' }} /></InputAdornment> }} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                                                                </Box>
                                                                <List dense disablePadding sx={{ maxHeight: 220, overflow: 'auto' }}>
                                                                    {filtNM.length > 0 && <ListItemButton onClick={() => { const allSel = filtNM.every(o => newSource.dataMapping.some(s => (s.value || s) === (o.value || o))); setNewSource(prev => ({ ...prev, dataMapping: allSel ? prev.dataMapping.filter(s => !filtNM.some(o => (o.value || o) === (s.value || s))) : [...prev.dataMapping, ...filtNM.filter(o => !prev.dataMapping.some(s => (s.value || s) === (o.value || o)))] })); }} sx={{ py: 0.75, px: 1, borderBottom: '1px solid', borderColor: alpha(theme.palette.divider, 0.5), bgcolor: alpha(theme.palette.secondary.main, 0.02) }}>
                                                                        <Checkbox checked={filtNM.length > 0 && filtNM.every(o => newSource.dataMapping.some(s => (s.value || s) === (o.value || o)))} indeterminate={filtNM.some(o => newSource.dataMapping.some(s => (s.value || s) === (o.value || o))) && !filtNM.every(o => newSource.dataMapping.some(s => (s.value || s) === (o.value || o)))} size="small" disableRipple icon={cbUnchecked} checkedIcon={cbChecked('secondary.main')} indeterminateIcon={cbIndeterminate('secondary.main')} sx={{ p: 0.5 }} />
                                                                        <ListItemText primary="Select All" primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: 700 }} />
                                                                    </ListItemButton>}
                                                                    {filtNM.length === 0 ? <ListItemButton disabled sx={{ justifyContent: 'center', py: 2 }}><Typography variant="caption" color="text.disabled">No mappings found.</Typography></ListItemButton>
                                                                    : filtNM.map(opt => {
                                                                        const sel = newSource.dataMapping.some(o => (o.value || o) === (opt.value || opt));
                                                                        return <ListItemButton key={opt.value || opt} onClick={() => setNewSource(prev => ({ ...prev, dataMapping: sel ? prev.dataMapping.filter(o => (o.value || o) !== (opt.value || opt)) : [...prev.dataMapping, opt] }))} sx={{ py: 0.5, px: 1, '&:hover': { bgcolor: alpha(theme.palette.secondary.main, 0.06) } }}>
                                                                            <Checkbox checked={sel} size="small" disableRipple icon={cbUnchecked} checkedIcon={cbChecked('secondary.main')} sx={{ p: 0.5 }} />
                                                                            <ListItemText primary={opt.label || opt} primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: sel ? 600 : 400, color: sel ? theme.palette.secondary.dark : 'text.primary' }} />
                                                                        </ListItemButton>;
                                                                    })}
                                                                </List>
                                                            </Popover>
                                                        </>
                                                    );
                                                })()}
                                            </TableCell>

                                            <TableCell>
                                                <Box sx={{ display: 'flex', gap: 0.75 }}>
                                                    <Tooltip title="Save">
                                                        <IconButton size="small" onClick={handleSaveNew} sx={{ color: '#16a34a', bgcolor: 'rgba(22,163,74,0.06)', borderRadius: 1.5, '&:hover': { bgcolor: 'rgba(22,163,74,0.14)' } }}>
                                                            <CheckCircleOutlineIcon sx={{ fontSize: 18 }} />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Cancel">
                                                        <IconButton size="small" onClick={handleCancelNew} sx={{ color: '#64748B', bgcolor: 'rgba(100,116,139,0.06)', borderRadius: 1.5, '&:hover': { bgcolor: 'rgba(100,116,139,0.14)' } }}>
                                                            <HighlightOffOutlinedIcon sx={{ fontSize: 16 }} />
                                                        </IconButton>
                                                    </Tooltip>
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        </Box>
                    </Paper>
                </Box>
            </DialogContent>

            <DialogActions sx={{ px: 3.5, py: 2, borderTop: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', justifyContent: 'flex-end', gap: 1.25 }}>
                <Tooltip title={(isAddingNew || editingRow !== null) ? 'Save the source mapping row first' : ''}>
                    <span>
                        <Button
                            onClick={handleSaveConfiguration}
                            variant="contained"
                            disabled={loading || isAddingNew || editingRow !== null}
                            sx={{
                                borderRadius: 2, textTransform: 'none', fontWeight: 700, minWidth: 150, px: 3,
                                background: '#14213d', color: '#fff', boxShadow: '0 6px 16px rgba(20,33,61,0.35)',
                                '&:hover': { background: '#0d1628', boxShadow: '0 8px 22px rgba(20,33,61,0.45)' },
                                '&.Mui-disabled': { background: 'rgba(20,33,61,0.4)', color: '#fff' },
                            }}
                        >
                            {loading ? 'Saving…' : (editData ? 'Update Event' : 'Save Event')}
                        </Button>
                    </span>
                </Tooltip>
            </DialogActions>

        </Dialog>
    );
}
