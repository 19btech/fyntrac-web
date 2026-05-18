import React, { useState, useEffect } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { IconButton, Tooltip, Box, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from '@mui/material';
import { EditOutlined, DeleteOutlineOutlined } from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import AddAccountTypeDialog from '../component/add-account-type';
import { dataloaderApi } from '../services/api-client';
import { useTenant } from "../tenant-context";

function AccountType({ refreshData, onToast }) {
  const { tenant } = useTenant();
  const [rowsPerPage] = useState(10);
  const [isDataFetched, setIsDataFetched] = useState(false);
  const [rows, setRows] = useState([]);
  const [open, setOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [rowToDelete, setRowToDelete] = useState(null);

  const handleEdit = (rowData) => {
    setEditData(rowData);
    setOpen(true);
  };

  const handleDeleteClick = (row) => {
    setRowToDelete(row);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!rowToDelete) return;
    try {
      await dataloaderApi.delete(`/accounttype/delete/${rowToDelete.id}`);
      setDeleteDialogOpen(false);
      setRowToDelete(null);
      fetchAccountTypeData();
      onToast?.('Account type deleted successfully.');
    } catch (error) {
      console.error('Error deleting account type:', error);
      setDeleteDialogOpen(false);
      setRowToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setRowToDelete(null);
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
        <Box sx={{ fontSize: '0.85rem', fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif', color: 'text.secondary' }}>{params.value}</Box>
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
    dataloaderApi.get('/accounttype/get/all', {
      headers: { 'X-Tenant': tenant, Accept: '*/*' },
    })
      .then(response => setRows(response.data))
      .catch(error => console.error('Error fetching account type data:', error));
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
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button onClick={handleCancelDelete} variant="text" sx={{ textTransform: 'none', borderRadius: 2 }}>No</Button>
          <Button onClick={handleConfirmDelete} variant="contained" color="error" sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 700 }}>Delete</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default AccountType;
