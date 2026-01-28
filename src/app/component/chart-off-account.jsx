'use client';

import React, { useEffect, useState } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { IconButton, Tooltip } from '@mui/material';
import { Edit } from '@mui/icons-material';
import AddChartOfAccountDialog from '../component/add-chart-of-account';
import axios from 'axios';
import { useTenant } from "../tenant-context";

function ChartOfAccount({ refreshData }) {
  const { tenant } = useTenant();
  const [rows, setRows] = useState([]);
  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(true);

  const [open, setOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(0);

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
    axios.get(`${process.env.NEXT_PUBLIC_SUBLEDGER_SERVICE_URI}/attribute/get/isreclassable/attributes`, {
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
      headerName: 'Edit',
      width: 100,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Tooltip title="Edit">
          <IconButton onClick={() => handleEdit(params.row)}>
            <Edit />
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
    axios.get(`${process.env.NEXT_PUBLIC_SUBLEDGER_SERVICE_URI}/chartofaccount/get/all`, {
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

  const handleCellEditCommit = (params) => {
    const updatedRows = rows.map(row =>
      row.id === params.id ? { ...row, [params.field]: params.value } : row
    );
    setRows(updatedRows);
  };

  return (
    <div>
      <div style={{ height: 'auto', width: '100%' }}>
        <DataGrid
          rows={rows}
          columns={columns}
          pageSize={rowsPerPage}
          onPageSizeChange={(newPageSize) => setRowsPerPage(newPageSize)}
          page={currentPage}
          onPageChange={(newPage) => setCurrentPage(newPage)}
          pageSizeOptions={[5, 10, 20]}
          pagination
          paginationMode="client"
          disableSelectionOnClick
          editMode="row"
          onCellEditCommit={handleCellEditCommit}
          loading={loading}
        />
      </div>
      <AddChartOfAccountDialog open={open} onClose={() => setOpen(false)} editData={editData} />
    </div>
  );
}

export default ChartOfAccount;
