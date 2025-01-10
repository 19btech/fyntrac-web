import React, { useState } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { IconButton, Tooltip } from '@mui/material';
import { Edit } from '@mui/icons-material';
import AddChartOfAccountDialog from '../component/add-chart-of-account'
import axios from 'axios';
import { Alert, AlertTitle } from '@mui/material';
import SuccessAlert from '../component/success-alert'
import ErrorAlert from '../component/error-alert'

function ChartOfAccount({ refreshData }) {
  
  const initialRows = [];
  
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(0);
  const [isDataFetched, setIsDataFetched] = useState(false);
  const [rows, setRows] = useState(initialRows);

  const [open, setOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(true);

  

  React.useEffect(() => {
    // Check if attribute metadata exists in localStorage
    const cachedMetadata = localStorage.getItem('attributeMetadata');
    if (cachedMetadata) {
      const attributeMetadata = JSON.parse(cachedMetadata);
      generateColumns(attributeMetadata);
    } else {
      // Fetch attribute metadata from backend if not cached
      fetchAttributeMetadata();
    }
  }, []);

  const fetchAttributeMetadata = () => {
    axios.get(process.env.NEXT_PUBLIC_SUBLEDGER_SERVICE_URI + '/attribute/get/isreclassable/attributes', {
      headers: {
        'X-Tenant': process.env.NEXT_PUBLIC_TENANT,
        Accept: '*/*',
        'Postman-Token': '091bd74b-e836-4185-896a-008fd64b4f46',
      }
    })
      .then(response => {
        const attributeMetadata = response.data;
        localStorage.setItem('attributeMetadata', JSON.stringify(attributeMetadata));
        generateColumns(attributeMetadata);
      })
      .catch(error => {
        console.error('Error fetching attribute metadata:', error);
        setLoading(false);
      });
  };

  const generateColumns = (attributeMetadata) => {
    const gridColumns = [
      { field: 'accountNumber', headerName: 'Account Number', width: 200, editable: false },
      { field: 'accountName', headerName: 'Account Name', width: 200, editable: false },
      { field: 'accountSubtype', headerName: 'Account Subtype', width: 200, editable: false },
    ];
    
    const isReclassableColumns = attributeMetadata.map(attribute => ({
      field: attribute.attributeName,
      headerName: attribute.attributeName,
      type: getColumnType(attribute.dataType),
      width: 200,
      editable: false
      // You can add more column properties here, e.g., width, sortable, etc.
    }));

    const editColumn = {
      field: 'edit',
      headerName: 'Edit',
      width: 100,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <IconButton onClick={() => handleEdit(params.row)}>
          <Tooltip title='Edit'>
          <Edit />
          </Tooltip>
        </IconButton>
      ),
    };

    const updatedColumns = [...gridColumns,...isReclassableColumns, editColumn];

    setColumns(updatedColumns);
    setLoading(false);
  };

  const getColumnType = (dataType) => {
    // Determine column type based on DataType
    switch (dataType) {
      case 'STRING':
        return 'string';
      case 'Number':
        return 'NUMBER';
      case 'Date':
        return 'DATE';
      case 'BOOLEAN':
        return 'boolean';
      default:
        return 'string'; // Default to string type
    }
  };

  const handleEdit = (rowData) => {
    setEditData(rowData); // Set the data to be edited
    setOpen(true); // Open the dialog
  };

  
  const fetchChartOfAccountData = () => {
    
    const fetchTransactionDataCall = process.env.NEXT_PUBLIC_SUBLEDGER_SERVICE_URI + '/chartofaccount/get/all';

    axios.get(fetchTransactionDataCall, {
      headers: {
        'X-Tenant': process.env.NEXT_PUBLIC_TENANT,
        Accept: '*/*',
        'Postman-Token': '091bd74b-e836-4185-896a-008fd64b4f46',
      }
    })
      .then(response => {
        setRows(response.data);
        // Handle success response if needed
      })
      .catch(error => {
        // Handle error if needed
      });
  };

  // Fetch data when the component mounts
  React.useEffect(() => {
    fetchChartOfAccountData();
    setIsDataFetched(true);
  }, [isDataFetched || refreshData]);

  const handleAddRow = () => {
    const newRow = { id: rows.length + 1, name: '', exclusive: '', isGL: '' };
    setRows([newRow, ...rows]);
  };

  const handleRowsPerPageChange = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setCurrentPage(0);
  };

  const handleCellEditCommit = (params) => {
    const updatedRows = rows.map((row) =>
      row.id === params.id ? { ...row, [params.field]: params.props.value } : row
    );
    setRows(updatedRows);
  };

  const handlePageSizeChange = (newPageSize) => {
    setRowsPerPage(newPageSize);
    setCurrentPage(0); // Reset to the first page when page size changes
  };

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
                      onCellEditCommit={handleCellEditCommit}
                    />
                  </div>
      <><AddChartOfAccountDialog open={open} onClose={setOpen} editData={editData} /></>
    </div>
    
  );
}

export default ChartOfAccount;
