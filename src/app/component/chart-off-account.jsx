'use client';

import React, { useEffect, useState } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { IconButton, Tooltip, Box } from '@mui/material';
import { EditOutlined } from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import AddChartOfAccountDialog from '../component/add-chart-of-account';
import { dataloaderApi } from '../services/api-client';
import { useTenant } from "../tenant-context";

function ChartOfAccount({ refreshData }) {
  const { tenant } = useTenant();
  const [rows, setRows] = useState([]);
  const [columns, setColumns] = useState([
    { field: 'accountNumber', headerName: 'Account Number', width: 200 },
    { field: 'accountName', headerName: 'Account Name', width: 200 },
    { field: 'accountSubtype', headerName: 'Account Subtype', width: 200 },
  ]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [rowsPerPage] = useState(10);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const cachedMetadata = localStorage.getItem('attributeMetadata');
      if (cachedMetadata) {
        generateColumns(JSON.parse(cachedMetadata));
      } else {
        fetchAttributeMetadata();
      }
    }
  }, []);

  useEffect(() => {
    fetchChartOfAccountData();
  }, [refreshData]);

  const fetchAttributeMetadata = () => {
    dataloaderApi.get(`/attribute/get/isreclassable/attributes`, {
      headers: {
        'X-Tenant': tenant,
        Accept: '*/*',
      },
    })
      .then(response => {
        const metadata = response.data;
        if (typeof window !== 'undefined') {
          localStorage.setItem('attributeMetadata', JSON.stringify(metadata));
        }
        generateColumns(metadata);
      })
      .catch(error => {
        console.error('Error fetching attribute metadata:', error);
        setLoading(false);
      });
  };

  const generateColumns = (metadata) => {
    const baseColumns = [
      { field: 'accountNumber', headerName: 'Account Number', width: 200 },
      { field: 'accountName', headerName: 'Account Name', width: 200 },
      { field: 'accountSubtype', headerName: 'Account Subtype', width: 200 },
    ];

    const dynamicColumns = metadata.map(attr => {
      let colType = getColumnType(attr.dataType);

      // 🛑 EMERGENCY FIX: Force PORTFOLIO to be a string
      // The backend says it's a Date, but the data ("ABC") proves it is a String.
      if (attr.attributeName === 'PORTFOLIO') {
        colType = 'string';
      }

      return {
        field: attr.attributeName,
        headerName: toProperCase(attr.attributeName),
        type: colType,
        width: 200,
        valueGetter: (params) => {
          // MUI v6+ passes an object, older versions pass the value directly.
          // We handle both safely:
          const value = params.value !== undefined ? params.value : params;

          if (!value) return null;

          // Only convert to Date if it is TRULY a date column
          if (colType === 'date') {
            const date = new Date(value);
            // Safety check: If "ABC" somehow gets here, treat it as null to prevent crash
            return isNaN(date.getTime()) ? null : date;
          }
          return value;
        },
      };
    });

    const editColumn = {
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
    };

    setColumns([...baseColumns, ...dynamicColumns, editColumn]);
    setLoading(false);
  };

  const toProperCase = (str) =>
    str
      .replace(/_/g, ' ')
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

  const getColumnType = (type) => {
    switch (type?.toUpperCase()) {
      case 'STRING': return 'string';
      case 'NUMBER': return 'number';
      case 'DATE': return 'date';
      case 'BOOLEAN': return 'boolean';
      default: return 'string';
    }
  };

  const handleEdit = (rowData) => {
    setEditData(rowData);
    setOpen(true);
  };

  const fetchChartOfAccountData = () => {
    dataloaderApi.get(`/chartofaccount/get/all`, {
      headers: {
        'X-Tenant': tenant,
        Accept: '*/*',
      },
    })
      .then(response => {
        console.log('Fetched chart of account data:', response.data);
        const dataWithIds = response.data.map((item, index) => ({
          ...item,
          // 👇 THIS IS THE FIX: Spread the attributes to the top level
          ...(item.attributes || {}),
          id: item.id || index + 1,
        }));
        setRows(dataWithIds);
      })
      .catch(error => {
        console.error('Error fetching chart of account:', error);
      });
  };

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
          loading={loading}
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
      <AddChartOfAccountDialog open={open} onClose={() => setOpen(false)} editData={editData} />
    </>
  );
}

export default ChartOfAccount;
