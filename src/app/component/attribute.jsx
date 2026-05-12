import React, { useState } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { IconButton, Tooltip, Checkbox, Box } from '@mui/material';
import { EditOutlined } from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import AddAttributeDialog from '../component/add-attribute';
import { dataloaderApi } from '../services/api-client';
import { useTenant } from "../tenant-context";

function Attribute({ refreshData }) {
  const { tenant } = useTenant();
  const [rowsPerPage] = useState(10);
  const [isDataFetched, setIsDataFetched] = useState(false);
  const [rows, setRows] = useState([]);
  const [open, setOpen] = useState(false);
  const [editData, setEditData] = useState(null);

  const handleEdit = (rowData) => {
    setEditData(rowData);
    setOpen(true);
  };

  const handleToggle = (id, field) => {
    setRows(prev => prev.map(row => row.id === id ? { ...row, [field]: !row[field] } : row));
  };

  const boolCell = (field) => (params) => (
    <Checkbox
      checked={!!params.value}
      onChange={() => handleToggle(params.row.id, field)}
      size="small"
      sx={{ color: '#14213d', '&.Mui-checked': { color: '#14213d' } }}
    />
  );

  const columns = [
    {
      field: 'userField',
      headerName: 'User Field',
      flex: 1.5,
      minWidth: 150,
      renderCell: (params) => (
        <Box sx={{ fontWeight: 500, fontSize: '0.85rem', fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif' }}>{params.value}</Box>
      ),
    },
    {
      field: 'attributeName',
      headerName: 'Attribute Name',
      flex: 1.5,
      minWidth: 150,
      renderCell: (params) => (
        <Box sx={{ fontSize: '0.85rem', fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif' }}>{params.value}</Box>
      ),
    },
    {
      field: 'dataType',
      headerName: 'Data Type',
      flex: 1,
      minWidth: 110,
      renderCell: (params) => (
        <Box sx={{ fontSize: '0.85rem', fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif', color: 'text.secondary' }}>{params.value}</Box>
      ),
    },
    { field: 'isNullable', headerName: 'Nullable', flex: 0.8, minWidth: 100, align: 'center', headerAlign: 'center', renderCell: boolCell('isNullable') },
    { field: 'isReclassable', headerName: 'Reclassable', flex: 0.8, minWidth: 110, align: 'center', headerAlign: 'center', renderCell: boolCell('isReclassable') },
    { field: 'isVersionable', headerName: 'Versionable', flex: 0.8, minWidth: 110, align: 'center', headerAlign: 'center', renderCell: boolCell('isVersionable') },
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
  ];

  const fetchAttributeData = () => {
    dataloaderApi.get('/attribute/get/all')
      .then(response => setRows(response.data))
      .catch(() => {});
  };

  React.useEffect(() => {
    fetchAttributeData();
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
      <AddAttributeDialog open={open} onClose={setOpen} editData={editData} />
    </>
  );
}

export default Attribute;
// legacy removed
