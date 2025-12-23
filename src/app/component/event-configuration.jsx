"use client"
import React, { useState, useEffect, useCallback } from 'react';
import {
    Card,
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
    Grid2 as Grid,
    Alert,
    Snackbar,
} from '@mui/material';
import { useTenant } from "../tenant-context";
import HighlightOffOutlinedIcon from '@mui/icons-material/HighlightOffOutlined';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import axios from 'axios';

export default function EventConfiguration({ open, onClose, editData }) {
    const { tenant, user } = useTenant();

    // Debug environment variables
    const baseURL = process.env.NEXT_PUBLIC_SUBLEDGER_SERVICE_URI;
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

    const sourceColumnsOptions = {
        Attribute: attributeList,
        Transactions: [
            { label: 'All items are selected', value: 'all' },
            { label: 'Amount', value: 'Amount' },
            { label: 'Transaction Date', value: 'TransactionDate' },
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
        axios.get(`${baseURL}/attribute/get/all/options`, {
            headers: {
                'X-Tenant': tenant,
                Accept: '*/*',
            }
        })
            .then(response => {
                setAttributeList(response.data);
            })
            .catch(error => {
                console.error('Error fetching attribute metadata:', error);
            });
    };

    const fetchTransactionMetadata = () => {
        axios.get(`${baseURL}/transaction/get/all/options`, {
            headers: {
                'X-Tenant': tenant,
                Accept: '*/*',
            }
        })
            .then(response => {
                setTransactionList(response.data);
            })
            .catch(error => {
                console.error('Error fetching transaction metadata:', error);
            });
    };

    const fetchMetricsMetadata = () => {
        axios.get(`${baseURL}/aggregation/get/all/options`, {
            headers: {
                'X-Tenant': tenant,
                Accept: '*/*',
            }
        })
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
        axios.get(`${baseURL}/fyntrac/custom-table/get/all/reference-tables/options`, {
            headers: {
                'X-Tenant': tenant,
                Accept: '*/*',
            }
        })
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
        axios.get(`${baseURL}/fyntrac/custom-table/get/all/operational-tables/options`, {
            headers: {
                'X-Tenant': tenant,
                Accept: '*/*',
            }
        })
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

        axios.get(uri, {
            headers: {
                'X-Tenant': tenant,
                Accept: '*/*',
            }
        })
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
    };

    const showTriggerSource = ['ON_ATTRIBUTE_CHANGE', 'ON_TRANSACTION_POST', 'ON_CUSTOM_DATA_TRIGGER'].includes(eventData.triggerType);


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
            sourceTable: availableSources[0],
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
    const handleSaveRow = (rowId) => setEditingRow(null);
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
        console.log('🚀 SAVE FUNCTION STARTED');

        if (!eventData.eventId || !eventData.eventName || !eventData.priority) {
            showAlert("Please fill in all required fields: Event ID, Event Name, and Priority", 'error');
            return;
        }

        if (sourceMappings.length === 0) {
            showAlert("Please add at least one source mapping", 'error');
            return;
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
                response = await axios.put(
                    `${baseURL}/fyntrac/event-configurations/update/${editData.id}`,
                    requestData,
                    { headers }
                );
            } else {
                console.log('🆕 CREATE Operation');
                response = await axios.post(
                    `${baseURL}/fyntrac/event-configurations/create`,
                    requestData,
                    { headers }
                );
            }

            console.log('✅ SUCCESS - API Response:', response.data);

            const successMessage = editData
                ? "Event configuration updated successfully!"
                : "Event configuration created successfully!";

            showAlert(successMessage, 'success');
            setLoading(false);

            setTimeout(() => {
                if (onClose) onClose(true);
            }, 1000);

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
                    sourceTable: availableSources[0],
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
            setNewSource({
                sourceTable: availableSources[0],
                sourceColumns: [],
                versionType: [],
                fieldType: '',
                dataMapping: [],
            });
            setIsAddingNew(true);
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


    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="xl"
            fullWidth
            slotProps={{
                sx: {
                    width: '95vw',
                    maxWidth: '1800px',
                    minWidth: '1600px',
                    borderRadius: 2,
                    boxShadow: 10,
                    bgcolor: 'background.paper',
                    overflow: 'hidden',
                },
            }}
        >
            <DialogTitle
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    py: 1.5,
                    px: 3,
                    fontWeight: 'bold',
                    fontSize: '1.25rem',
                    backgroundColor: '#f5f5f5',
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <img src="fyntrac.png" alt="Logo" style={{ width: '150px', height: 'auto' }} />
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#333' }}>
                        {editData ? 'Edit Event Configuration' : 'Create Event Configuration'}
                    </Typography>
                </Box>

                <Tooltip title="Close">
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
            </DialogTitle>

            <DialogContent
                sx={{
                    p: 0,
                    backgroundColor: '#fafafa',
                    maxHeight: '80vh',
                    overflowY: 'auto',
                    minHeight: '600px',
                }}
            >
                <Box sx={{ p: 3 }}>
                    {/* Event Details Card */}
                    <Card sx={{ p: 3, mb: 3, backgroundColor: 'white' }}>
                        <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold', color: '#333' }}>
                            Event Details
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid size={6}>
                                <TextField
                                    label="Event ID *"
                                    fullWidth
                                    size="small"
                                    value={eventData.eventId}
                                    onChange={(e) => handleChange('eventId', e.target.value)}
                                    required
                                    error={!eventData.eventId}
                                    helperText={!eventData.eventId ? "Event ID is required" : ""}
                                />
                            </Grid>
                            <Grid size={6}>
                                <TextField
                                    label="Event Name *"
                                    fullWidth
                                    size="small"
                                    value={eventData.eventName}
                                    onChange={(e) => handleChange('eventName', e.target.value)}
                                    required
                                    error={!eventData.eventName}
                                    helperText={!eventData.eventName ? "Event Name is required" : ""}
                                />
                            </Grid>
                            <Grid size={6}>
                                <TextField
                                    label="Event Priority *"
                                    fullWidth
                                    type="number"
                                    size="small"
                                    value={eventData.priority}
                                    onChange={(e) => handleChange('priority', e.target.value)}
                                    required
                                    error={!eventData.priority}
                                    helperText={!eventData.priority ? "Priority is required" : ""}
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
                                />
                            </Grid>
                        </Grid>
                    </Card>

                    {/* Trigger Setup Card */}
                    <Card sx={{ p: 3, mb: 3, backgroundColor: 'white' }}>
                        <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold', color: '#333' }}>
                            Trigger Setup
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid size={6}>
                                <FormControl fullWidth size="small" required error={!eventData.triggerType}>
                                    <InputLabel>Trigger Type *</InputLabel>
                                    <Select
                                        value={eventData.triggerType}
                                        onChange={(e) => handleChange('triggerType', e.target.value)}
                                        label="Trigger Type *"
                                    >
                                        <MenuItem value="ON_MODEL_EXECUTION">On Model Execution</MenuItem>
                                        <MenuItem value="ON_INSTRUMENT_ADD">On Instrument Add</MenuItem>
                                        <MenuItem value="ON_TRANSACTION_POST">On Transaction Post</MenuItem>
                                        <MenuItem value="ON_ATTRIBUTE_CHANGE">On Attribute Change</MenuItem>
                                        <MenuItem value="ON_CUSTOM_DATA_TRIGGER">On Custom Data Trigger</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                        </Grid>

                        {showTriggerSource && (
                            <Box sx={{ mt: 2 }}>
                                <Autocomplete
                                    multiple={eventData.triggerType != 'ON_CUSTOM_DATA_TRIGGER'}
                                    size="small"
                                    options={triggerSourceOptions[eventData.triggerType] || []}
                                    getOptionLabel={(option) => option.label || option}
                                    value={
                                        eventData.triggerType != 'ON_CUSTOM_DATA_TRIGGER'
                                            ? Array.isArray(eventData.triggerSource) ? eventData.triggerSource : []
                                            : Array.isArray(eventData.triggerSource) && eventData.triggerSource.length > 0
                                                ? eventData.triggerSource[0]
                                                : null
                                    }
                                    onChange={(event, newValue) => {
                                        console.log('🎯 Trigger Source Changed:', newValue);

                                        // Handle both single and multiple values properly
                                        let valueToSet;
                                        if (eventData.triggerType != 'ON_CUSTOM_DATA_TRIGGER') {
                                            // For multiple selection, ensure it's always an array
                                            valueToSet = Array.isArray(newValue) ? newValue : [];
                                            if (eventData.triggerType === 'ON_TRANSACTION_POST') {
                                                setAvailableSources(['Transaction']);
                                            } else if (eventData.triggerType === 'ON_ATTRIBUTE_CHANGE') {
                                                setAvailableSources(['Attribute']);
                                            } else {
                                                setAvailableSources(ALL_SOURCES);
                                            }
                                        } else {
                                            // For single selection, wrap in array to maintain consistent structure
                                            valueToSet = newValue ? [newValue] : [];
                                            console.log('🎯 Single Selection:', valueToSet);
                                            if (valueToSet[0].value === 'reference_table') {
                                                setAvailableSources(referenceTables);
                                            } else if (valueToSet[0].value === 'operational_table') {
                                                setAvailableSources(operationalTables);
                                            } else {
                                                setAvailableSources([]);
                                            }
                                        }

                                        handleChange('triggerSource', valueToSet);
                                    }}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="Trigger Source"
                                            required
                                            error={
                                                eventData.triggerType != 'ON_CUSTOM_DATA_TRIGGER'
                                                    ? !Array.isArray(eventData.triggerSource) || eventData.triggerSource.length === 0
                                                    : !eventData.triggerSource || !Array.isArray(eventData.triggerSource) || eventData.triggerSource.length === 0
                                            }
                                            helperText={
                                                (!Array.isArray(eventData.triggerSource) || eventData.triggerSource.length === 0)
                                                    ? "Trigger Source is required"
                                                    : ""
                                            }
                                        />
                                    )}
                                />
                            </Box>
                        )}
                    </Card>

                    {/* Source Mapping Configuration Card */}
                    <Card sx={{ p: 3, backgroundColor: 'white' }}>
                        {/* UPDATE: Hide this header for both Custom Data Trigger AND Transaction Post */}
                        {eventData.triggerType !== 'ON_CUSTOM_DATA_TRIGGER' && eventData.triggerType !== 'ON_TRANSACTION_POST' && (
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#333' }}>
                                    Source Mapping Configuration
                                </Typography>
                                <Tooltip title={getAddSourceTooltip()}>
                                    <span>
                                        <IconButton
                                            onClick={handleAddNew}
                                            disabled={!canAddSource()}
                                            sx={{
                                                '&:hover': {
                                                    backgroundColor: 'darkgrey',
                                                },
                                                '&.Mui-disabled': {
                                                    color: '#9e9e9e',
                                                },
                                            }}
                                        >
                                            <AddOutlinedIcon />
                                        </IconButton>
                                    </span>
                                </Tooltip>
                            </Box>
                        )}

                        {/* Source Mapping Table */}
                        <TableContainer component={Paper} variant="outlined">
                            <Table sx={{ minWidth: 1400, tableLayout: 'fixed' }} size="small">
                                <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 'bold', width: '60px' }}>#</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', width: '200px' }}>Source Table</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', width: '300px' }}>Source Columns</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', width: '200px' }}>Version Type</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', width: '300px' }}>Map Fields</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', width: '140px' }}>Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {sourceMappings.map((row, index) => (
                                        <TableRow key={row.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                            <TableCell>{index + 1}</TableCell>
                                            <TableCell>
                                                {editingRow === row.id ? (
                                                    <FormControl fullWidth size="small">
                                                        <Select
                                                            value={row.sourceTable}
                                                            onChange={(e) => {
                                                                handleCellChange(row.id, 'sourceTable', e.target.value);
                                                            }
                                                            }
                                                        >
                                                            {availableSources.concat(row.sourceTable)
                                                                .filter((src, index, array) => array.indexOf(src) === index)
                                                                .map((src) => (
                                                                    <MenuItem key={src} value={src}>
                                                                        {src}
                                                                    </MenuItem>
                                                                ))}
                                                        </Select>
                                                    </FormControl>
                                                ) : (
                                                    <Chip label={row.sourceTable} size="small" variant="outlined" sx={{ fontWeight: 'medium' }} />
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {editingRow === row.id ? (
                                                    <Autocomplete
                                                        multiple
                                                        size="small"
                                                        options={resolveSourceColumnOptions(row, eventData)}
                                                        getOptionLabel={(option) => option.label}
                                                        value={row.sourceColumns.map(value => {
                                                            const option =
                                                                resolveSourceColumnOptions(row, eventData)
                                                                    .find(opt => opt.value === value);

                                                            return option || { label: value, value: value };
                                                        })}

                                                        onChange={(event, newValue) =>
                                                            handleCellChange(row.id, 'sourceColumns', newValue)
                                                        }
                                                        renderInput={(params) => <TextField {...params} placeholder="Select columns" />}
                                                    />
                                                ) : (
                                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                        {getOptionLabels(row.sourceColumns, sourceColumnsOptions[row.sourceTable] || []).map((label, idx) => (
                                                            <Chip
                                                                key={idx}
                                                                label={label}
                                                                size="small"
                                                                variant="filled"
                                                                sx={{ backgroundColor: '#38B6FF', color: 'white' }}
                                                            />
                                                        ))}
                                                    </Box>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {editingRow === row.id ? (
                                                    <Autocomplete
                                                        multiple
                                                        size="small"
                                                        options={versionTypeOptions}
                                                        getOptionLabel={(option) => option.label}
                                                        value={row.versionType.map(value => {
                                                            const option = versionTypeOptions.find(opt => opt.value === value);
                                                            return option || { label: value, value: value };
                                                        })}
                                                        onChange={(event, newValue) =>
                                                            handleCellChange(row.id, 'versionType', newValue)
                                                        }
                                                        renderInput={(params) => (
                                                            <TextField
                                                                {...params}
                                                                placeholder="Select versions"
                                                                disabled={!isVersionTypeEnabled(row.sourceTable)}
                                                            />
                                                        )}
                                                        disabled={!isVersionTypeEnabled(row.sourceTable)}
                                                        sx={{ '& .MuiInputBase-root.Mui-disabled': { backgroundColor: '#f5f5f5' } }}
                                                    />
                                                ) : (
                                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                        {getOptionLabels(row.versionType, versionTypeOptions).map((label, idx) => (
                                                            <Chip
                                                                key={idx}
                                                                label={label}
                                                                size="small"
                                                                variant="filled"
                                                                sx={{ backgroundColor: '#FCA311', color: 'white' }}
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
                                                {editingRow === row.id ? (
                                                    <Autocomplete
                                                        multiple
                                                        size="small"
                                                        options={dataMappingOptions[row.sourceTable] || []}
                                                        getOptionLabel={(option) => option.label}
                                                        value={row.dataMapping.map(value => {
                                                            const option = dataMappingOptions[row.sourceTable]?.find(opt => opt.value === value);
                                                            return option || { label: value, value: value };
                                                        })}
                                                        onChange={(event, newValue) =>
                                                            handleCellChange(row.id, 'dataMapping', newValue)
                                                        }
                                                        renderInput={(params) => (
                                                            <TextField
                                                                {...params}
                                                                placeholder="Select mappings"
                                                                disabled={!isDataMappingEnabled(row.sourceTable)}
                                                            />
                                                        )}
                                                        disabled={!isDataMappingEnabled(row.sourceTable)}
                                                        sx={{ '& .MuiInputBase-root.Mui-disabled': { backgroundColor: '#f5f5f5' } }}
                                                    />
                                                ) : (
                                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                        {getOptionLabels(row.dataMapping, dataMappingOptions[row.sourceTable] || []).map((label, idx) => (
                                                            <Chip
                                                                key={idx}
                                                                label={label}
                                                                size="small"
                                                                variant="filled"
                                                                sx={{ backgroundColor: '#0097B2', color: 'white' }}
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
                                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                                        <Tooltip title="Save">
                                                            <IconButton size="small" onClick={() => handleSaveRow(row.id)} sx={{ color: '#2e7d32' }}>
                                                                <SaveIcon fontSize="medium" />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="Cancel">
                                                            <IconButton size="medium" onClick={handleCancelEdit}>
                                                                <CancelIcon fontSize="medium" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </Box>
                                                ) : (
                                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                                        <Tooltip title="Edit">
                                                            <IconButton size="medium" onClick={() => handleEditRow(row)}>
                                                                <EditOutlinedIcon fontSize="medium" />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="Delete">
                                                            <IconButton size="medium" onClick={() => handleDeleteSource(row.id)}>
                                                                <DeleteOutlineIcon fontSize="medium" />
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
                                                <FormControl fullWidth size="small">
                                                    <Select
                                                        value={newSource.sourceTable}
                                                        onChange={(e) => setNewSource(prev => ({ ...prev, sourceTable: e.target.value }))}
                                                    >
                                                        {availableSources.map((src) => (
                                                            <MenuItem key={src} value={src}>
                                                                {src}
                                                            </MenuItem>
                                                        ))}
                                                    </Select>
                                                </FormControl>
                                            </TableCell>
                                            <TableCell>
                                                <Autocomplete
                                                    multiple
                                                    size="small"
                                                    // ✅ FIX: Call the dynamic resolution function here
                                                    options={resolveSourceColumnOptions(newSource, eventData)}
                                                    getOptionLabel={(option) => option.label || option}
                                                    value={newSource.sourceColumns}
                                                    onChange={(event, newValue) => setNewSource(prev => ({ ...prev, sourceColumns: newValue }))}
                                                    renderInput={(params) => <TextField {...params} placeholder="Select columns" />}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Autocomplete
                                                    multiple
                                                    size="small"
                                                    options={versionTypeOptions}
                                                    getOptionLabel={(option) => option.label}
                                                    value={newSource.versionType}
                                                    onChange={(event, newValue) => setNewSource(prev => ({ ...prev, versionType: newValue }))}
                                                    renderInput={(params) => (
                                                        <TextField
                                                            {...params}
                                                            placeholder="Select versions"
                                                            disabled={!isVersionTypeEnabled(newSource.sourceTable)}
                                                        />
                                                    )}
                                                    disabled={!isVersionTypeEnabled(newSource.sourceTable)}
                                                    sx={{ '& .MuiInputBase-root.Mui-disabled': { backgroundColor: '#f5f5f5' } }}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Autocomplete
                                                    multiple
                                                    size="small"
                                                    // ✅ CONDITIONAL LOGIC HERE
                                                    options={
                                                        eventData.triggerType === 'ON_CUSTOM_DATA_TRIGGER'
                                                            ? customTableMappings
                                                            : (dataMappingOptions[newSource.sourceTable] || [])
                                                    }
                                                    getOptionLabel={(option) => option.label || option}
                                                    value={newSource.dataMapping}
                                                    onChange={(event, newValue) => setNewSource(prev => ({ ...prev, dataMapping: newValue }))}
                                                    renderInput={(params) => (
                                                        <TextField
                                                            {...params}
                                                            placeholder="Select mappings"
                                                            disabled={!isDataMappingEnabled(newSource.sourceTable)}
                                                        />
                                                    )}
                                                    disabled={!isDataMappingEnabled(newSource.sourceTable)}
                                                    sx={{ '& .MuiInputBase-root.Mui-disabled': { backgroundColor: '#f5f5f5' } }}
                                                />
                                            </TableCell>

                                            <TableCell>
                                                <Box sx={{ display: 'flex', gap: 1 }}>
                                                    <Tooltip title="Save">
                                                        <IconButton size="large" onClick={handleSaveNew}>
                                                            <SaveIcon fontSize="medium" />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Cancel">
                                                        <IconButton size="large" onClick={handleCancelNew}>
                                                            <CancelIcon fontSize="medium" />
                                                        </IconButton>
                                                    </Tooltip>
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Card>
                </Box>
            </DialogContent>

            <DialogActions sx={{ justifyContent: 'center', py: 2, backgroundColor: '#f5f5f5' }}>
                <Tooltip title={loading ? 'Saving...' : 'Save Configuration'}>
                    <span>
                        <Button
                            onClick={handleSaveConfiguration}
                            disabled={loading}
                            sx={{
                                bgcolor: '#14213d',
                                color: 'white',
                                '&:hover': { bgcolor: '#1a2a4a' },
                                '&.Mui-disabled': { bgcolor: '#e0e0e0', color: '#9e9e9e' },
                            }}
                        >
                            {loading ? 'Saving...' : 'Save'}
                        </Button>
                    </span>
                </Tooltip>
            </DialogActions>

            {/* Alert Snackbar */}
            <Snackbar
                open={alert.open}
                autoHideDuration={6000}
                onClose={closeAlert}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <Alert onClose={closeAlert} severity={alert.severity} sx={{ width: '100%' }} variant="filled">
                    {alert.message}
                </Alert>
            </Snackbar>
        </Dialog>
    );
}