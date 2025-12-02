"use client"
import React, { useState, useEffect, useMemo } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import axios from 'axios';
import {
    Typography,
    Box,
    Switch,
    IconButton,
    Tooltip,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Chip
} from '@mui/material';
import SuccessAlert from '../component/success-alert';
import ErrorAlert from '../component/error-alert';
import { styled } from '@mui/material/styles';
import { useTenant } from "../tenant-context";
import { DeleteOutlineOutlined, Edit, Add, DataArray } from '@mui/icons-material';
import dynamic from 'next/dynamic';

// Dynamically import the CustomTableModal component
const CreateTableDialog = dynamic(() => import('./custom-table'), {
    ssr: false
});

function CustomTablesList({ refreshData, tableType, referenceTables }) {
    const { tenant, user } = useTenant();
    const baseURL = process.env.NEXT_PUBLIC_SUBLEDGER_SERVICE_URI;

    const apiClient = useMemo(() => {
        if (!user?.id) return null;
        return axios.create({
            baseURL: baseURL,
            headers: {
                'X-Tenant': tenant,
                'X-User-Id': user.id,
                Accept: '*/*',
            },
        });
    }, [user, tenant, baseURL]);

    const initialRows = [];

    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(0);
    const [isDataFetched, setIsDataFetched] = useState(false);
    const [rows, setRows] = useState(initialRows);
    const [showSuccessMessage, setShowSuccessMessage] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [showErrorMessage, setShowErrorMessage] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [open, setOpen] = useState(false);
    const [editData, setEditData] = useState(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Delete confirmation dialog state
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [tableToDelete, setTableToDelete] = useState(null);

    const Android12Switch = styled(Switch)(({ theme }) => ({
        padding: 8,
        '& .MuiSwitch-track': {
            borderRadius: 22 / 2,
            '&::before, &::after': {
                content: '""',
                position: 'absolute',
                top: '50%',
                transform: 'translateY(-50%)',
                width: 16,
                height: 16,
            },
            '&::before': {
                backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" height="16" width="16" viewBox="0 0 24 24"><path fill="${encodeURIComponent(
                    theme.palette.getContrastText(theme.palette.primary.main),
                )}" d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z"/></svg>')`,
                left: 12,
            },
            '&::after': {
                backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" height="16" width="16" viewBox="0 0 24 24"><path fill="${encodeURIComponent(
                    theme.palette.getContrastText(theme.palette.primary.main),
                )}" d="M19,13H5V11H19V13Z" /></svg>')`,
                right: 12,
            },
        },
        '& .MuiSwitch-thumb': {
            boxShadow: 'none',
            width: 16,
            height: 16,
            margin: 2,
        },
    }));

    const fetchCustomTable = (tableId) => {
        const fullUrl = `${baseURL}/fyntrac/custom-table/get/${tableId}`;
        console.log('Attempting to fetch from:', fullUrl);
        axios.get(fullUrl, {
            headers: {
                'X-Tenant': tenant,
                Accept: '*/*',
            }
        })
            .then(response => {
                const metadata = response.data;
                console.log('Custom table [TableId]:', tableId, metadata.data);
                setEditData(metadata);
                setOpen(true);
            })
            .catch(error => {
                console.error('Error fetching Custom table [TableId]:', tableId, error);
            });
    };

    async function updateCustomTableStatus(id, isActive) {
        if (!apiClient) {
            console.error('API client not ready');
            throw new Error('API client not ready');
        }
        try {
            const response = await apiClient.put(`/fyntrac/custom-table/update/status/${id}/${isActive}`);
            return response.data;
        } catch (error) {
            console.error('Error updating status:', error.response?.data || error.message || error);
            throw error;
        }
    }

    async function deleteCustomTable(tableId) {
        if (!apiClient) {
            console.error('API client not ready');
            throw new Error('API client not ready');
        }
        try {
            const response = await apiClient.delete(`/fyntrac/custom-table/delete/${tableId}`);
            return response.data;
        } catch (error) {
            console.error('Error deleting table:', error.response?.data || error.message || error);
            throw error;
        }
    }

    const handleCustomTableAction = async (row, isActive) => {
        try {
            const response = await updateCustomTableStatus(row.id, isActive);
            row.isActive = response.isActive;
            setRows(prevRows =>
                prevRows.map(r =>
                    r.id === row.id ? { ...r, isActive: isActive } : r
                )
            );

            setSuccessMessage('Status updated successfully!');
            setShowSuccessMessage(true);
        } catch (error) {
            console.error('Error in handleCustomTableAction:', error);
            setErrorMessage(error.response?.data?.message || error.message || 'An error occurred');
            setShowErrorMessage(true);
        }
    };

    // Open delete confirmation dialog
    const handleDeleteClick = (row) => {
        setTableToDelete(row);
        setDeleteDialogOpen(true);
    };

    // Handle confirmed delete
    const handleConfirmDelete = async () => {
        if (!tableToDelete) return;

        try {
            const response = await deleteCustomTable(tableToDelete.id);
            tableToDelete.isDeleted = response.isDeleted;
            setRows(prevRows =>
                prevRows.map(r =>
                    r.id === tableToDelete.id ? { ...r, isDeleted: true } : r
                )
            );

            setSuccessMessage('Custom table deleted successfully!');
            setShowSuccessMessage(true);
            refreshGridData();

            // Close the confirmation dialog
            setDeleteDialogOpen(false);
            setTableToDelete(null);
        } catch (error) {
            console.error('Error in handleConfirmDelete:', error);
            setErrorMessage(error.response?.data?.message || error.message || 'An error occurred while deleting');
            setShowErrorMessage(true);
            // Close the confirmation dialog even on error
            setDeleteDialogOpen(false);
            setTableToDelete(null);
        }
    };

    // Handle cancel delete
    const handleCancelDelete = () => {
        setDeleteDialogOpen(false);
        setTableToDelete(null);
    };

    // Function to refresh the grid data
    const refreshGridData = () => {
        fetchCustomTables();
        setRefreshTrigger(prev => prev + 1);
    };

    const handleViewData = (tableId) => {
        console.log('View data for table:', tableId);
        // Navigate to data view page
    };

    const handleEdit = (rowData) => {
        fetchCustomTable(rowData.id);
    };

    const columns = [
        {
            field: 'tableName',
            headerName: 'Table Name',
            width: 200,
            editable: false,
            renderCell: (params) => (
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",        // **vertical centering**
                        height: "100%",
                        width: "100%"
                    }}
                >
                    <Typography
                        variant="subtitle2"
                        fontWeight="bold"
                        color="primary"
                        sx={{ lineHeight: 1 }}         // keeps text cleanly centered
                    >
                        {params.value}
                    </Typography>
                </Box>
            )
        },
        {
            field: 'description',
            headerName: 'Description',
            width: 250,
            editable: false,
        },
        {
            field: 'tableType',
            headerName: 'Type',
            width: 150,
            editable: false,
            renderCell: (params) => (
                <Chip
                    label={params.value}
                    sx={{
                        backgroundColor: params.value === 'OPERATIONAL' ? '#14213D' : '#0097B2',
                        color: 'white',
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        minWidth: 100,
                        '& .MuiChip-label': {
                            px: 1,
                        }
                    }}
                    variant="filled"
                    size="small"
                />
            ),
        },
        {
            field: 'referenceColumn',
            headerName: 'Reference Field',
            width: 150,
            editable: false,
            renderCell: (params) => (
                <Chip
                    label={params.value}
                    color="success"
                    variant="outlined"
                    size="small"
                />
            ),
        },
        {
            field: 'columns',
            headerName: 'Columns',
            width: 120,
            editable: false,
            renderCell: (params) => (
                <Chip
                    label={`${params.value.length} columns`}
                    variant="outlined"
                    size="small"
                />
            ),
        },
        {
            field: 'primaryKeys',
            headerName: 'Primary Keys',
            width: 200,
            editable: false,
            renderCell: (params) => (
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',   // ✅ vertical centering
                        height: '100%',
                        width: '100%',
                        gap: 0.5,
                        flexWrap: 'wrap',
                    }}
                >
                    {params.value.slice(0, 2).map((pk, idx) => (
                        <Chip
                            key={idx}
                            label={pk}
                            color="primary"
                            size="small"
                            sx={{
                                alignItems: 'center',
                                lineHeight: 1,       // cleaner vertical alignment inside chip
                            }}
                        />
                    ))}

                    {params.value.length > 2 && (
                        <Chip
                            label={`+${params.value.length - 2}`}
                            size="small"
                            sx={{ lineHeight: 1 }}
                        />
                    )}
                </Box>
            ),
        }
        ,
        {
            field: 'action',
            headerName: 'Action',
            headerAlign: 'center',
            width: 100,
            sortable: false,
            filterable: false,
            renderCell: (params) => (
                <div>

                    <Tooltip title='Edit Custom Table'>
                        <IconButton onClick={() => handleEdit(params.row)} >
                            <Edit />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title='Delete Custom Table'>
                        <IconButton onClick={() => handleDeleteClick(params.row)} >
                            <DeleteOutlineOutlined />
                        </IconButton>
                    </Tooltip>
                </div>
            ),
        },
    ];

    const fetchCustomTables = () => {
        let fetchCustomTablesCall = `${baseURL}/fyntrac/custom-table/reference-tables`;
        if (tableType === 'OPERATIONAL') {
            fetchCustomTablesCall = `${baseURL}/fyntrac/custom-table/operational-tables`;
        }

        console.log('Attempting to fetch from:', fetchCustomTablesCall);
        axios.get(fetchCustomTablesCall, {
            headers: {
                'X-Tenant': tenant,
                Accept: '*/*',
            }
        })
            .then(response => {
                console.log('Custom Tables', response.data.data);
                setRows(response.data.data);
            })
            .catch(error => {
                console.error('Error fetching custom tables:', error);
            });
    };

    // Fetch data when the component mounts or when refreshTrigger changes
    useEffect(() => {
        if (tableType === 'REFERENCE' && referenceTables.length > 0) {
            setRows(referenceTables);
        } else {
            console.log('tableType', tableType);
            fetchCustomTables();
        }
        setIsDataFetched(true);
    }, [isDataFetched, refreshData, refreshTrigger]);

    return (
        <div>
            <div style={{ height: 'auto', width: '100%' }}>
                <DataGrid
                    rows={rows}
                    columns={columns}
                    initialState={{
                        pagination: { paginationModel: { pageSize: rowsPerPage } },
                    }}
                    pageSize={rowsPerPage}
                    page={currentPage}
                    onPageChange={(newPage) => setCurrentPage(newPage)}
                    pageSizeOptions={[5, 10, 20]}
                    pagination
                    paginationMode='client'
                    disableSelectionOnClick
                    editMode="row"
                    key={refreshTrigger}
                />
            </div>

            {/* Custom Table Modal */}
            {tableType === 'REFERENCE' && (<CreateTableDialog
                open={open}
                onClose={(result) => {
                    console.log('Parent: Modal onClose called with result:', result);
                    setOpen(false);
                    setEditData(null);

                    if (result === true) {
                        console.log('Parent: Refreshing grid data...');
                        refreshGridData();
                    }
                }}
                tableType={'REFERENCE'}
                tables={rows}
                editData={editData}
            />)}

            {tableType === 'OPERATIONAL' && (<CreateTableDialog
                open={open}
                onClose={(result) => {
                    console.log('Parent: Modal onClose called with result:', result);
                    setOpen(false);
                    setEditData(null);

                    if (result === true) {
                        console.log('Parent: Refreshing grid data...');
                        refreshGridData();
                    }
                }}
                tableType={'OPERATIONAL'}
                tables={referenceTables}
                 editData={editData}
               
            />)}

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={deleteDialogOpen}
                onClose={handleCancelDelete}
                aria-labelledby="delete-dialog-title"
                aria-describedby="delete-dialog-description"
            >
                <DialogTitle id="delete-dialog-title">
                    Confirm Delete
                </DialogTitle>
                <DialogContent>
                    <DialogContentText id="delete-dialog-description">
                        Are you sure you want to delete the custom table "{tableToDelete?.tableName}"?
                        This action cannot be undone and will also delete all associated data.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCancelDelete} color="primary">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleConfirmDelete}
                        color="error"
                        variant="contained"
                        autoFocus
                    >
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Alerts */}
            {showSuccessMessage && (
                <SuccessAlert
                    title="Success!"
                    message={successMessage}
                    open={showSuccessMessage}
                    onClose={() => setShowSuccessMessage(false)}
                />
            )}
            {showErrorMessage && (
                <ErrorAlert
                    title="Error!"
                    message={errorMessage}
                    open={showErrorMessage}
                    onClose={() => setShowErrorMessage(false)}
                />
            )}
        </div>
    );
}

export default CustomTablesList;