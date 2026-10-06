import React, { useState, useEffect } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { IconButton, Tooltip, Box, Chip, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from '@mui/material';
import { EditOutlined, DeleteOutlineOutlined } from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import AddAccountTypeDialog from '../component/add-account-type';
import { dataloaderApi } from '../services/api-client';
import { useTenant } from "../tenant-context";
import { apiErrorMessage, countOf } from './rules-shared';

function AccountType({ refreshData, onToast }) {
  const { tenant } = useTenant();
  const [rowsPerPage] = useState(10);
  const [isDataFetched, setIsDataFetched] = useState(false);
  const [rows, setRows] = useState([]);
  const [open, setOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [rowToDelete, setRowToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  // What still uses the item being deleted (shown in the confirmation), or null.
  const [deleteRefs, setDeleteRefs] = useState(null);
  const [loading, setLoading] = useState(true);

  const handleEdit = (rowData) => {
    setEditData(rowData);
    setOpen(true);
  };

  const handleDeleteClick = (row) => {
    setRowToDelete(row);
    setDeleteRefs(null);
    setDeleteDialogOpen(true);
    // Subledger mappings and chart of accounts entries that use this subtype.
    const subtype = String(row.accountSubType || '').toLowerCase();
    Promise.all([
      dataloaderApi.get('/subledgermapping/get/all').catch(() => ({ data: [] })),
      dataloaderApi.get('/chartofaccount/get/all').catch(() => ({ data: [] })),
    ]).then(([sml, coa]) => {
      const mappings = (sml.data || []).filter(m => m.accountSubType?.toLowerCase() === subtype).length;
      const accounts = (coa.data || []).filter(c => c.accountSubtype?.toLowerCase() === subtype).length;
      const refs = [];
      if (mappings) refs.push(countOf(mappings, 'subledger mapping'));
      if (accounts) refs.push(countOf(accounts, 'chart of account entry', 'chart of account entries'));
      setDeleteRefs(refs);
    });
  };

  const handleConfirmDelete = async () => {
    if (!rowToDelete || deleting) return;
    setDeleting(true);
    try {
      await dataloaderApi.delete(`/accounttype/delete/${rowToDelete.id}`);
      
      onToast?.(`${rowToDelete.accountSubType} deleted successfully.`);
      setDeleteDialogOpen(false);
      setRowToDelete(null);
      setDeleteRefs(null);
      fetchAccountTypeData();
    } catch (error) {
      console.error('Delete failed:', error);
      // Keep the dialog open: the item still exists, and the reason is shown.
      onToast?.(apiErrorMessage(error, `${rowToDelete.accountSubType} could not be deleted. Please try again.`), 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    if (deleting) return;
    setDeleteDialogOpen(false);
    setRowToDelete(null);
    setDeleteRefs(null);
  };

  const columns = [
    {
      field: 'accountSubType',
      headerName: 'Account Subtype',
      flex: 1.5,
      minWidth: 180,
      renderCell: (params) => (
        <Box sx={{ fontWeight: 500, fontSize: '0.85rem', fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif' }}>{params.value}</Box>
      ),
    },
    {
      field: 'accountType',
      headerName: 'Account Type',
      flex: 1.5,
      minWidth: 180,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          sx={{
            height: 22, fontSize: '0.72rem', fontWeight: 700,
            bgcolor: 'rgba(22,163,74,0.1)', color: '#15803d',
            border: '1px solid rgba(22,163,74,0.28)', borderRadius: 1.5,
            fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif',
          }}
        />
      ),
    },
    {
      field: 'edit',
      headerName: '',
      width: 64,
      sortable: false,
      filterable: false,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <Tooltip title="Edit" placement="left">
          <IconButton
            size="small"
            onClick={() => handleEdit(params.row)}
            sx={{
              color: '#14213d',
              bgcolor: alpha('#14213d', 0.06),
              borderRadius: 1.5,
              '&:hover': { bgcolor: alpha('#14213d', 0.14) },
            }}
          >
            <EditOutlined sx={{ fontSize: 16 }} />
          </IconButton>
        </Tooltip>
      ),
    },
    {
      field: 'delete',
      headerName: '',
      width: 64,
      sortable: false,
      filterable: false,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <Tooltip title="Delete" placement="left">
          <IconButton
            size="small"
            onClick={() => handleDeleteClick(params.row)}
            sx={{
              color: '#dc2626',
              bgcolor: 'rgba(220,38,38,0.06)',
              borderRadius: 1.5,
              '&:hover': { bgcolor: 'rgba(220,38,38,0.14)' },
            }}
          >
            <DeleteOutlineOutlined sx={{ fontSize: 16 }} />
          </IconButton>
        </Tooltip>
      ),
    },
  ];

  const fetchAccountTypeData = () => {
    setLoading(true);
    dataloaderApi.get('/accounttype/get/all', {
      headers: { 'X-Tenant': tenant, Accept: '*/*' },
    })
      .then(response => setRows(response.data))
      .catch(error => console.error('Error fetching account type data:', error))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAccountTypeData();
    setIsDataFetched(true);
  }, [isDataFetched || refreshData]);

  return (
    <>
      <Box
        sx={{
          width: '100%',
          borderRadius: 3,
          overflow: 'hidden',
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: '0 1px 4px rgba(15,23,42,0.06)',
          animation: 'fadeInUp 0.35s ease both',
          '@keyframes fadeInUp': {
            from: { opacity: 0, transform: 'translateY(12px)' },
            to: { opacity: 1, transform: 'translateY(0)' },
          },
        }}
      >
        <DataGrid
          rows={rows}
          columns={columns}
          loading={loading}
          pageSizeOptions={[5, 10, 20]}
          initialState={{ pagination: { paginationModel: { pageSize: rowsPerPage } } }}
          paginationMode="client"
          disableRowSelectionOnClick
          autoHeight
          sx={{
            border: 0,
            fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif',
            fontSize: '0.85rem',
            '& *': { fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif' },
            '& .MuiDataGrid-columnHeaders': {
              bgcolor: '#f8fafc',
              color: '#475569',
              fontSize: '0.72rem',
              fontWeight: 700,
              fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif',
              letterSpacing: 0.5,
              textTransform: 'uppercase',
              borderBottom: '2px solid #e2e8f0',
            },
            '& .MuiDataGrid-columnHeader': { bgcolor: '#f8fafc' },
            '& .MuiDataGrid-columnSeparator': { display: 'none' },
            '& .MuiDataGrid-scrollbarFiller': { bgcolor: '#f8fafc', borderBottom: '2px solid #e2e8f0' },
            '& .MuiDataGrid-filler': { bgcolor: '#f8fafc', borderBottom: '2px solid #e2e8f0' },
            '& .MuiDataGrid-sortIcon, & .MuiDataGrid-menuIconButton': { color: '#94a3b8' },
            '& .MuiDataGrid-row': {
              transition: 'background 0.15s',
              '&:hover': { bgcolor: alpha('#14213d', 0.03) },
              '&.Mui-selected': { bgcolor: alpha('#14213d', 0.06) },
            },
            '& .MuiDataGrid-cell': {
              borderBottom: '1px solid',
              borderColor: 'divider',
              display: 'flex',
              alignItems: 'center',
            },
            '& .MuiDataGrid-footerContainer': {
              borderTop: '1px solid',
              borderColor: 'divider',
              bgcolor: alpha('#14213d', 0.02),
            },
            '& .MuiTablePagination-root': {
              fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif',
              fontSize: '0.8rem',
            },
          }}
        />
      </Box>
      <AddAccountTypeDialog
        open={open}
        onClose={(didSave) => {
          setOpen(false);
          if (didSave) {
            fetchAccountTypeData();
            onToast?.('Account type saved successfully.');
          }
        }}
        editData={editData}
      />
      <Dialog open={deleteDialogOpen} onClose={handleCancelDelete} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Account Type</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete account subtype <strong>{rowToDelete?.accountSubType}</strong>? This action cannot be undone.
            {deleteRefs?.length > 0 && (
              <Box component="span" sx={{ display: 'block', mt: 1.5, color: '#b45309' }}>
                Still used by {deleteRefs.join('; ')}. Those references will point at a deleted item — update them as well.
              </Box>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button onClick={handleCancelDelete} disabled={deleting} variant="text" sx={{ textTransform: 'none', borderRadius: 2 }}>No</Button>
          <Button onClick={handleConfirmDelete} disabled={deleting} variant="contained" color="error" sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 700 }}>{deleting ? 'Deleting…' : 'Delete'}</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default AccountType;
