import React, { useState, useEffect } from 'react';
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
    Divider,
    Chip,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Grid2 as Grid,
} from '@mui/material';
import { useTenant } from "../tenant-context";
import HighlightOffOutlinedIcon from '@mui/icons-material/HighlightOffOutlined';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import SuccessAlert from '../component/success-alert';
import ErrorAlert from '../component/error-alert';
import axios from 'axios';

export default function EventConfiguration({ open, onClose, editData }) {
    const { tenant, user } = useTenant();

    // Create axios instance with base configuration
    const serviceURL = process.env.NEXT_PUBLIC_SUBLEDGER_SERVICE_URI + '/fyntrac/event-configurations';
    const apiClient = axios.create({
        baseURL: serviceURL,
        headers: {
            'X-Tenant': tenant,
            'X-User-Id': user.id,
            'Content-Type': 'application/json',
        },
    });

    // Add request interceptor for auth headers
    apiClient.interceptors.request.use(
        (config) => {
            const token = localStorage.getItem('authToken');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        },
        (error) => {
            return Promise.reject(error);
        }
    );

    // Add response interceptor for error handling
    apiClient.interceptors.response.use(
        (response) => {
            return response.data;
        },
        (error) => {
            if (error.response?.status === 401) {
                localStorage.removeItem('authToken');
                window.location.href = '/login';
            }

            // Improved error handling
            console.error('API Error Details:', {
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data,
                url: error.config?.url,
                method: error.config?.method,
            });

            const errorMessage = error.response?.data?.message ||
                error.response?.data?.error ||
                error.response?.statusText ||
                error.message ||
                'An unexpected error occurred';

            return Promise.reject(new Error(errorMessage));
        }
    );

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
    const ALL_SOURCES = ["Attribute", "Transactions", "Balances", "ExecutionState"];
    const [availableSources, setAvailableSources] = useState([...ALL_SOURCES]);
    const [sourceMappings, setSourceMappings] = useState([]);
    const [editingRow, setEditingRow] = useState(null);
    const [isAddingNew, setIsAddingNew] = useState(false);
    const [loading, setLoading] = useState(false);

    const [newSource, setNewSource] = useState({
        sourceTable: '',
        sourceColumns: [],
        versionType: [],
        dataMapping: [],
    });

    const [showSuccessMessage, setShowSuccessMessage] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [showErrorMessage, setShowErrorMessage] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [attributeList, setAttributeList] = useState([]);
    const [transactionList, setTransactionList] = useState([]);
    const [metricList, setMetricList] = useState([]);

    const sourceColumnsOptions = {
        Attribute: attributeList,
        Transactions: [
            { label: 'All items are selected', value: 'all' },
            { label: 'Amount', value: 'Amount' },
            { label: 'Transaction Date', value: 'TransactionDate' },
        ],
        Balances: [
            { label: 'Beginning Balance', value: 'Beginning Balance' },
            { label: 'Activity', value: 'Activity' },
            { label: 'Ending Balance', value: 'Ending Balance' },
        ],
        ExecutionState: [
            { label: 'ExecutionDate', value: 'ExecutionDate' },
            { label: 'LastExecutionDate', value: 'LastExecutionDate' },
            { label: 'ReplayDate', value: 'ReplayDate' },
        ],
    };

    useEffect(() => {
        // Fetch attribute metadata from backend on component mount
        fetchAttributeMetadata();
        fetchTransactionMetadata();
        fetchMetricsMetadata();
    }, []);

    const fetchAttributeMetadata = () => {
        axios.get(process.env.NEXT_PUBLIC_SUBLEDGER_SERVICE_URI + '/attribute/get/all/options', {
            headers: {
                'X-Tenant': tenant,
                Accept: '*/*',
                'Postman-Token': '091bd74b-e836-4185-896a-008fd64b4f46',
            }
        })
            .then(response => {
                const metadata = response.data;
                setAttributeList(metadata);
            })
            .catch(error => {
                console.error('Error fetching attribute metadata:', error);
            });
    };

    const fetchTransactionMetadata = () => {
        axios.get(process.env.NEXT_PUBLIC_SUBLEDGER_SERVICE_URI + '/transaction/get/all/options', {
            headers: {
                'X-Tenant': tenant,
                Accept: '*/*',
                'Postman-Token': '091bd74b-e836-4185-896a-008fd64b4f46',
            }
        })
            .then(response => {
                const metadata = response.data;
                setTransactionList(metadata);
            })
            .catch(error => {
                console.error('Error fetching transaction metadata:', error);
            });
    };

    const fetchMetricsMetadata = () => {
        axios.get(process.env.NEXT_PUBLIC_SUBLEDGER_SERVICE_URI + '/aggregation/get/all/options', {
            headers: {
                'X-Tenant': tenant,
                Accept: '*/*',
                'Postman-Token': '091bd74b-e836-4185-896a-008fd64b4f46',
            }
        })
            .then(response => {
                const metadata = response.data;
                console.log('Full API Response:', response);
                console.log('Metric Data Structure:', metadata);

                // Transform based on actual property names
                const formattedMetrics = Array.isArray(metadata)
                    ? metadata.map(item => {
                        const metricName = item.metricName || item.name || item.label || item.id || JSON.stringify(item);
                        return {
                            label: metricName,
                            value: metricName
                        };
                    })
                    : [];

                setMetricList(formattedMetrics);
            })
            .catch(error => {
                console.error('Error fetching metric metadata:', error);
                setMetricList([]);
            });
    };

    // Load edit data when component opens
    useEffect(() => {
        if (open && editData) {
            setEventData({
                eventId: editData.eventId || '',
                eventName: editData.eventName || '',
                priority: editData.priority || '',
                description: editData.description || '',
                triggerType: editData.triggerSetup?.triggerType || '',
                triggerCondition: editData.triggerSetup?.triggerCondition || '',
                triggerSource: editData.triggerSetup?.triggerSource || [],
            });

            // Transform source mappings from editData
            if (editData.sourceMappings) {
                const transformedMappings = editData.sourceMappings.map((mapping, index) => ({
                    id: index + 1,
                    sourceTable: mapping.sourceTable, // Keep original case for display
                    sourceColumns: mapping.sourceColumns?.map(col => col.value || col) || [],
                    versionType: mapping.versionType?.map(ver => ver.value || ver) || [],
                    dataMapping: mapping.dataMapping?.map(map => map.value || map) || [],
                }));
                setSourceMappings(transformedMappings);

                // Update available sources with case-insensitive filtering
                const usedSources = transformedMappings.map(mapping =>
                    mapping.sourceTable.toLowerCase()
                );
                const newAvailableSources = ALL_SOURCES.filter(source =>
                    !usedSources.includes(source.toLowerCase())
                );

                setAvailableSources(newAvailableSources);

                console.log('Edit Data Loaded:');
                console.log('Used Sources (case-insensitive):', usedSources);
                console.log('Available Sources:', newAvailableSources);
            }
        } else if (open) {
            // Reset form when opening for new configuration
            resetForm();
        }
    }, [open, editData]);

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
            dataMapping: [],
        });
    };

    const handleChange = (key, value) => {
        setEventData((prev) => ({ ...prev, [key]: value }));
    };

    const versionTypeOptions = [
        { label: 'Current', value: 'Current' },
        { label: 'Prior', value: 'Prior' },
        { label: 'First', value: 'First' },
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
    };

    const triggerSourceOptions = {
        ON_ATTRIBUTE_CHANGE: sourceColumnsOptions.Attribute,
        ON_TRANSACTION_POST: dataMappingOptions.Transactions,
    };

    const showTriggerSource = ['ON_ATTRIBUTE_CHANGE', 'ON_TRANSACTION_POST'].includes(eventData.triggerType);
    const showTriggerCondition = ['ON_MODEL_EXECUTION', 'ON_CONDITION_MATCH'].includes(eventData.triggerType);

    // === Helper Functions ===
    const isVersionTypeEnabled = (sourceTable) => {
        return sourceTable === 'Attribute';
    };

    const isDataMappingEnabled = (sourceTable) => {
        return sourceTable === 'Transactions' || sourceTable === 'Balances';
    };

    const canAddSource = () => {
        if (!eventData.triggerType) return false;
        if (showTriggerSource && (!eventData.triggerSource || eventData.triggerSource.length === 0)) {
            return false;
        }
        return availableSources.length > 0;
    };

    const getAddSourceTooltip = () => {
        if (!eventData.triggerType) {
            return "Please select a Trigger Type first";
        }
        if (showTriggerSource && (!eventData.triggerSource || eventData.triggerSource.length === 0)) {
            return "Please select Trigger Source first";
        }
        if (availableSources.length === 0) {
            return "No more sources available to add";
        }
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
            let updated = [...prevSources];

            // Remove the new source table if it exists
            updated = updated.filter(src => src !== newSourceTable);

            // Add back the old source table if it's not the same as new and not already there
            if (oldSourceTable && oldSourceTable !== newSourceTable && !updated.includes(oldSourceTable)) {
                updated.push(oldSourceTable);
            }

            return updated.sort();
        });
    };

    const handleAddNew = () => {
        if (!canAddSource()) {
            if (!eventData.triggerType) {
                setErrorMessage("Please select a Trigger Type first");
            } else if (showTriggerSource && (!eventData.triggerSource || eventData.triggerSource.length === 0)) {
                setErrorMessage("Please select Trigger Source first");
            } else {
                setErrorMessage("No more sources available to add");
            }
            setShowErrorMessage(true);
            return;
        }
        setNewSource({
            sourceTable: availableSources[0],
            sourceColumns: [],
            versionType: [],
            dataMapping: [],
        });
        setIsAddingNew(true);
    };

    const handleSaveNew = () => {
        if (!newSource.sourceTable) {
            setErrorMessage("Please select a source table");
            setShowErrorMessage(true);
            return;
        }

        const newRow = {
            id: Date.now(),
            sourceTable: newSource.sourceTable,
            sourceColumns: newSource.sourceColumns.map(item => item.value || item),
            versionType: newSource.versionType.map(item => item.value || item),
            dataMapping: newSource.dataMapping.map(item => item.value || item),
        };

        setSourceMappings(prev => [...prev, newRow]);
        setAvailableSources(prev => prev.filter(s => s !== newSource.sourceTable));
        setNewSource({ sourceTable: '', sourceColumns: [], versionType: [], dataMapping: [] });
        setIsAddingNew(false);
    };

    const handleCancelNew = () => {
        setNewSource({ sourceTable: '', sourceColumns: [], versionType: [], dataMapping: [] });
        setIsAddingNew(false);
    };

    const handleEditRow = (row) => {
        setEditingRow(row.id);
    };

    const handleSaveRow = (rowId) => {
        setEditingRow(null);
    };

    const handleCancelEdit = () => {
        setEditingRow(null);
    };

    const handleCellChange = (rowId, field, value) => {
        if (field === 'sourceTable') {
            const rowToUpdate = sourceMappings.find(row => row.id === rowId);
            if (rowToUpdate) {
                const oldSourceTable = rowToUpdate.sourceTable;
                const newSourceTable = value;

                // Update available sources
                updateAvailableSources(oldSourceTable, newSourceTable);

                // Update the row and reset dependent fields
                setSourceMappings(prev =>
                    prev.map(row =>
                        row.id === rowId
                            ? { ...row, [field]: value, sourceColumns: [], versionType: [], dataMapping: [] }
                            : row
                    )
                );
            }
        } else {
            setSourceMappings(prev =>
                prev.map(row =>
                    row.id === rowId ? { ...row, [field]: value } : row
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

    // === Axios API Calls ===
    const handleSaveConfiguration = async () => {
        if (!eventData.eventId || !eventData.eventName || !eventData.priority) {
            setErrorMessage("Please fill in all required fields: Event ID, Event Name, and Priority");
            setShowErrorMessage(true);
            return;
        }

        if (sourceMappings.length === 0) {
            setErrorMessage("Please add at least one source mapping");
            setShowErrorMessage(true);
            return;
        }

        setLoading(true);
        setShowErrorMessage(false);

        let requestData;

        try {
            // Transform data for API
            requestData = {
                eventId: eventData.eventId,
                eventName: eventData.eventName,
                priority: parseInt(eventData.priority),
                description: eventData.description,
                triggerSetup: {
                    triggerType: eventData.triggerType,
                    triggerCondition: eventData.triggerCondition,
                    triggerSource: eventData.triggerSource.map(item => ({
                        label: item.label,
                        value: item.value
                    }))
                },
                sourceMappings: sourceMappings.map(mapping => ({
                    sourceTable: mapping.sourceTable,
                    sourceColumns: mapping.sourceColumns.map(col => {
                        const option = sourceColumnsOptions[mapping.sourceTable]?.find(opt => opt.value === col);
                        return {
                            label: option?.label || col,
                            value: col
                        };
                    }),
                    versionType: mapping.versionType.map(ver => {
                        const option = versionTypeOptions.find(opt => opt.value === ver);
                        return {
                            label: option?.label || ver,
                            value: ver
                        };
                    }),
                    dataMapping: mapping.dataMapping.map(map => {
                        const option = dataMappingOptions[mapping.sourceTable]?.find(opt => opt.value === map);
                        return {
                            label: option?.label || map,
                            value: map
                        };
                    })
                }))
            };

            console.log('Sending request data:', JSON.stringify(requestData, null, 2));

            let response;
            if (editData?.id) {
                // Use the PUT endpoint for update
                response = await apiClient.put(`/update/${editData.id}`, requestData);
            } else {
                // Use POST for create
                response = await apiClient.post('/create', requestData);
            }

            console.log('Save successful:', response);
            setSuccessMessage("Event configuration saved successfully!");
            setShowSuccessMessage(true);

            setTimeout(() => {
                onClose();
                if (onClose) onClose(true);
            }, 1500);

        } catch (error) {
            console.error('Detailed save error:', {
                message: error.message,
                stack: error.stack,
                requestData: requestData
            });
            setErrorMessage(error.message);
            setShowErrorMessage(true);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

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
                    {/* === Event Details === */}
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

                    {/* === Trigger Setup === */}
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
                                        <MenuItem value="ON_ATTRIBUTE_ADD">On Attribute Add</MenuItem>
                                        <MenuItem value="ON_TRANSACTION_POST">On Transaction Post</MenuItem>
                                        <MenuItem value="ON_ATTRIBUTE_CHANGE">On Attribute Change</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                        </Grid>

                        {showTriggerSource && (
                            <Box sx={{ mt: 2 }}>
                                <Autocomplete
                                    multiple
                                    size="small"
                                    options={triggerSourceOptions[eventData.triggerType] || []}
                                    getOptionLabel={(option) => option.label}
                                    value={eventData.triggerSource}
                                    onChange={(event, newValue) => handleChange('triggerSource', newValue)}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="Trigger Source"
                                            required
                                            error={eventData.triggerSource.length === 0}
                                            helperText={eventData.triggerSource.length === 0 ? "Trigger Source is required" : ""}
                                        />
                                    )}
                                />
                            </Box>
                        )}
                    </Card>

                    {/* === Source Mapping Configuration === */}
                    <Card sx={{ p: 3, backgroundColor: 'white' }}>
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

                        {/* Source Mapping Table */}
                        <TableContainer component={Paper} variant="outlined">
                            <Table sx={{ minWidth: 1200, tableLayout: 'fixed' }} size="small">
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
                                    {/* Existing Rows */}
                                    {sourceMappings.map((row, index) => (
                                        <TableRow key={row.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                            <TableCell>{index + 1}</TableCell>

                                            {/* Source Table - Select */}
                                            <TableCell>
                                                {editingRow === row.id ? (
                                                    <FormControl fullWidth size="small">
                                                        <Select
                                                            value={row.sourceTable}
                                                            onChange={(e) => handleCellChange(row.id, 'sourceTable', e.target.value)}
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
                                                    <Chip
                                                        label={row.sourceTable}
                                                        size="small"
                                                        variant="outlined"
                                                        sx={{ fontWeight: 'medium' }}
                                                    />
                                                )}
                                            </TableCell>

                                            {/* Source Columns - MultiSelect */}
                                            <TableCell>
                                                {editingRow === row.id ? (
                                                    <Autocomplete
                                                        multiple
                                                        size="small"
                                                        options={sourceColumnsOptions[row.sourceTable] || []}
                                                        getOptionLabel={(option) => option.label}
                                                        value={row.sourceColumns.map(value => {
                                                            const option = sourceColumnsOptions[row.sourceTable]?.find(opt => opt.value === value);
                                                            return option || { label: value, value };
                                                        })}
                                                        onChange={(event, newValue) =>
                                                            handleCellChange(row.id, 'sourceColumns', newValue.map(item => item.value))
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
                                                                sx={{
                                                                    backgroundColor: '#38B6FF',
                                                                    color: 'white',
                                                                }}
                                                            />
                                                        ))}
                                                    </Box>
                                                )}
                                            </TableCell>

                                            {/* Version Type - MultiSelect (Only enabled for Attribute) */}
                                            <TableCell>
                                                {editingRow === row.id ? (
                                                    <Autocomplete
                                                        multiple
                                                        size="small"
                                                        options={versionTypeOptions}
                                                        getOptionLabel={(option) => option.label}
                                                        value={row.versionType.map(value => {
                                                            const option = versionTypeOptions.find(opt => opt.value === value);
                                                            return option || { label: value, value };
                                                        })}
                                                        onChange={(event, newValue) =>
                                                            handleCellChange(row.id, 'versionType', newValue.map(item => item.value))
                                                        }
                                                        renderInput={(params) => (
                                                            <TextField
                                                                {...params}
                                                                placeholder="Select versions"
                                                                disabled={!isVersionTypeEnabled(row.sourceTable)}
                                                            />
                                                        )}
                                                        disabled={!isVersionTypeEnabled(row.sourceTable)}
                                                        sx={{
                                                            '& .MuiInputBase-root.Mui-disabled': {
                                                                backgroundColor: '#f5f5f5',
                                                            }
                                                        }}
                                                    />
                                                ) : (
                                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                        {getOptionLabels(row.versionType, versionTypeOptions).map((label, idx) => (
                                                            <Chip
                                                                key={idx}
                                                                label={label}
                                                                size="small"
                                                                variant="filled"
                                                                sx={{
                                                                    backgroundColor: '#FCA311',
                                                                    color: 'white',
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

                                            {/* Source Mapping - MultiSelect (Only enabled for Transactions and Balances) */}
                                            <TableCell>
                                                {editingRow === row.id ? (
                                                    <Autocomplete
                                                        multiple
                                                        size="small"
                                                        options={dataMappingOptions[row.sourceTable] || []}
                                                        getOptionLabel={(option) => option.label}
                                                        value={row.dataMapping.map(value => {
                                                            const option = dataMappingOptions[row.sourceTable]?.find(opt => opt.value === value);
                                                            return option || { label: value, value };
                                                        })}
                                                        onChange={(event, newValue) =>
                                                            handleCellChange(row.id, 'dataMapping', newValue.map(item => item.value))
                                                        }
                                                        renderInput={(params) => (
                                                            <TextField
                                                                {...params}
                                                                placeholder="Select mappings"
                                                                disabled={!isDataMappingEnabled(row.sourceTable)}
                                                            />
                                                        )}
                                                        disabled={!isDataMappingEnabled(row.sourceTable)}
                                                        sx={{
                                                            '& .MuiInputBase-root.Mui-disabled': {
                                                                backgroundColor: '#f5f5f5',
                                                            }
                                                        }}
                                                    />
                                                ) : (
                                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                        {getOptionLabels(row.dataMapping, dataMappingOptions[row.sourceTable] || []).map((label, idx) => (
                                                            <Chip
                                                                key={idx}
                                                                label={label}
                                                                size="small"
                                                                variant="filled"
                                                                sx={{
                                                                    backgroundColor: '#0097B2',
                                                                    color: 'white',
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

                                            {/* Actions */}
                                            <TableCell>
                                                {editingRow === row.id ? (
                                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                                        <Tooltip title="Save">
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => handleSaveRow(row.id)}
                                                                sx={{ color: '#2e7d32' }}
                                                            >
                                                                <SaveIcon fontSize="medium" />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="Cancel">
                                                            <IconButton
                                                                size="medium"
                                                                onClick={handleCancelEdit}
                                                            >
                                                                <CancelIcon fontSize="medium" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </Box>
                                                ) : (
                                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                                        <Tooltip title="Edit">
                                                            <IconButton
                                                                size="medium"
                                                                onClick={() => handleEditRow(row)}
                                                            >
                                                                <EditOutlinedIcon fontSize="medium" />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="Delete">
                                                            <IconButton
                                                                size="medium"
                                                                onClick={() => handleDeleteSource(row.id)}
                                                            >
                                                                <DeleteOutlineIcon fontSize="medium" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </Box>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}

                                    {/* Add New Row */}
                                    {isAddingNew && (
                                        <TableRow sx={{ backgroundColor: '#f8f9fa' }}>
                                            <TableCell>{sourceMappings.length + 1}</TableCell>

                                            {/* Source Table - Select */}
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

                                            {/* Source Columns - MultiSelect */}
                                            <TableCell>
                                                <Autocomplete
                                                    multiple
                                                    size="small"
                                                    options={sourceColumnsOptions[newSource.sourceTable] || []}
                                                    getOptionLabel={(option) => option.label}
                                                    value={newSource.sourceColumns}
                                                    onChange={(event, newValue) =>
                                                        setNewSource(prev => ({ ...prev, sourceColumns: newValue }))
                                                    }
                                                    renderInput={(params) => <TextField {...params} placeholder="Select columns" />}
                                                />
                                            </TableCell>

                                            {/* Version Type - MultiSelect (Only enabled for Attribute) */}
                                            <TableCell>
                                                <Autocomplete
                                                    multiple
                                                    size="small"
                                                    options={versionTypeOptions}
                                                    getOptionLabel={(option) => option.label}
                                                    value={newSource.versionType}
                                                    onChange={(event, newValue) =>
                                                        setNewSource(prev => ({ ...prev, versionType: newValue }))
                                                    }
                                                    renderInput={(params) => (
                                                        <TextField
                                                            {...params}
                                                            placeholder="Select versions"
                                                            disabled={!isVersionTypeEnabled(newSource.sourceTable)}
                                                        />
                                                    )}
                                                    disabled={!isVersionTypeEnabled(newSource.sourceTable)}
                                                    sx={{
                                                        '& .MuiInputBase-root.Mui-disabled': {
                                                            backgroundColor: '#f5f5f5',
                                                        }
                                                    }}
                                                />
                                            </TableCell>

                                            {/* Source Mapping - MultiSelect (Only enabled for Transactions and Balances) */}
                                            <TableCell>
                                                <Autocomplete
                                                    multiple
                                                    size="small"
                                                    options={dataMappingOptions[newSource.sourceTable] || []}
                                                    getOptionLabel={(option) => option.label}
                                                    value={newSource.dataMapping}
                                                    onChange={(event, newValue) =>
                                                        setNewSource(prev => ({ ...prev, dataMapping: newValue }))
                                                    }
                                                    renderInput={(params) => (
                                                        <TextField
                                                            {...params}
                                                            placeholder="Select mappings"
                                                            disabled={!isDataMappingEnabled(newSource.sourceTable)}
                                                        />
                                                    )}
                                                    disabled={!isDataMappingEnabled(newSource.sourceTable)}
                                                    sx={{
                                                        '& .MuiInputBase-root.Mui-disabled': {
                                                            backgroundColor: '#f5f5f5',
                                                        }
                                                    }}
                                                />
                                            </TableCell>

                                            {/* Actions for New Row */}
                                            <TableCell>
                                                <Box sx={{ display: 'flex', gap: 1 }}>
                                                    <Tooltip title="Save">
                                                        <IconButton
                                                            size="large"
                                                            onClick={handleSaveNew}
                                                        >
                                                            <SaveIcon fontSize="medium" />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Cancel">
                                                        <IconButton
                                                            size="large"
                                                            onClick={handleCancelNew}
                                                        >
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
                                '&:hover': {
                                    bgcolor: '#1a2a4a',
                                },
                                '&.Mui-disabled': {
                                    bgcolor: '#e0e0e0',
                                    color: '#9e9e9e',
                                },
                            }}
                        >
                            {loading ? 'Saving...' : 'Save'}
                        </Button>
                    </span>
                </Tooltip>
            </DialogActions>

            <Box>
                {showSuccessMessage && (
                    <SuccessAlert
                        title="Success"
                        message={successMessage}
                        onClose={() => setShowSuccessMessage(false)}
                    />
                )}
                {showErrorMessage && (
                    <ErrorAlert
                        title="Error"
                        message={errorMessage}
                        onClose={() => setShowErrorMessage(false)}
                    />
                )}
            </Box>
        </Dialog>
    );
}