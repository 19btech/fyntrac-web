import React, { useState } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import AddTransactionDialog from '../component/add-transaction'
import axios from 'axios';
import { green, orange, red } from '@mui/material/colors';
import { Chip, Switch, IconButton, Tooltip } from '@mui/material';
import SuccessAlert from '../component/success-alert'
import ErrorAlert from '../component/error-alert'
import { TuneOutlined, DeleteOutlineOutlined, FileDownloadOutlined } from '@mui/icons-material';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import AddModelConfiguration from '../component/add-model-configuration'
import { styled } from '@mui/material/styles';
import GridHeader from './gridHeader';

function Models({ refreshData }) {

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
  const [isModelActive, setIsModelActive] = useState(false);

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

  const setModelStatus = (param) => {
    // handleCellEditCommit(param);
    if (param.row.modelStatus === 'ACTIVE') {
      setIsModelActive(true);
    } else {
      setIsModelActive(false);
    }
  }

  const handleActiveModelAction = async (editData) => {
    const serviceURL = process.env.NEXT_PUBLIC_SUBLEDGER_SERVICE_URI + '/model/save';
    try {
      if (editData.row.modelStatus === 'INACTIVE') {
        editData.row.modelStatus = 'ACTIVE';
      } else {
        editData.row.modelStatus = 'INACTIVE';
      }
      const model = {
        "id": editData.row.id,
        "orderId": editData.row.orderId,
        "modelName": editData.row.modelName,
        "uploadDate": editData.row.uploadDate,
        "uploadStatus": editData.row.uploadStatus,
        "modelStatus": editData.row.modelStatus,
        "uploadedBy": editData.row.uploadedBy,
        "isDeleted": editData.row.isDeleted,
        "lastModifiedDate": editData.row.lastModifiedDate,
        "modifiedBy": editData.row.modifiedBy,
        "modelConfig": {
          "transactions": editData.row.modelConfig.transactions,
          "metrics": editData.row.modelConfig.metrics,
          "aggregationLevel": editData.row.modelConfig.aggregationLevel,
          "currentVersion": editData.row.modelConfig.currentVersion,
          "lastOpenVersion": editData.row.modelConfig.lastOpenVersion,
          "firstVersion": editData.row.modelConfig.firstVersion
        },
        "modelFileId": editData.row.modelFileId
      };
      console.log('Model to Save:', model);
      const response = await axios.post(serviceURL, model,
        {
          headers: {
            'X-Tenant': process.env.NEXT_PUBLIC_TENANT,
            Accept: '*/*',
            'Postman-Token': '091bd74b-e836-4185-896a-008fd64b4f46',
          }
        }
      );
      setSuccessMessage(response.data);
      setShowSuccessMessage(true);

      setTimeout(() => {
        const updatedRows = rows.map((row) =>
          row.id === editData.id ? { ...row, [editData.field]: editData.value } : row
        );
        setRows(updatedRows);
        setShowSuccessMessage(false);
        setShowErrorMessage(false);
        setOpen(false);
      }, 3000);
    } catch (error) {
      // Handle error if needed
      setErrorMessage(error);
      setShowErrorMessage(true);

    }
  }

  const getStatusColor = (status) => {
    // Check if status is COMPLETED and return the appropriate color
    if (status === 'CONFIGURE') {
      return '#fca311';

    } else if (status === 'ACTIVE') {
      return '#8ac92e';
    } else {
      return '#ff5757';
    }

  };
  const columns = [
    { field: 'orderId', headerName: 'Execution Order Id', width: 200, editable: false },
    {
      field: 'modelName',
      headerName: 'Name',
      width: 250,
      editable: false,
    },
        {
      field: 'modelType',
      headerName: 'Model Type',
      width: 250,
      editable: false,
    },
    {
      field: 'uploadDate',
      headerName: 'Upload Date',
      width: 250,
      editable: false,
    },
    {
      field: 'modelStatus',
      headerName: 'Model Status',
      width: 150,
      renderCell: (params) => {
        return (
          <Chip
            label={params.value} // Use params.value to get the modelStatus
            style={{
              backgroundColor: getStatusColor(params.value), // Pass params.value to getStatusColor
              color: '#fff',
              fontWeight: 'bold',
              width: '120px', // Set a constant width for the Chip
              overflow: 'hidden', // Prevent text overflow
              textOverflow: 'ellipsis', // Display ellipsis for overflow text
              whiteSpace: 'nowrap', // Ensure the text does not wrap

            }}
          />
        );
      },
    },
    {
      field: 'uploadedBy',
      headerName: 'User',
      width: 150,
      editable: false,
    },
    {
      field: 'action',
      headerName: 'Action',
      headerAlign: 'center',
      width: 200,  // Increased width to accommodate all three buttons
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <div>
          <Tooltip title='Download File'>
            <IconButton aria-label="download" >
              <FileDownloadOutlinedIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title='Configure model'>
            <IconButton onClick={() => handleEdit(params.row)} >
              <TuneOutlined />
            </IconButton>
          </Tooltip>
          <Tooltip title='Active/Inactive'>
            <IconButton onClick={() => handleActiveModelAction(params)} >
              <Android12Switch checked={params.row.modelStatus === 'ACTIVE'} // Set defaultChecked based on condition
              />
            </IconButton>
          </Tooltip>
          <Tooltip title='Move to trash'>
            <IconButton onClick={() => handleDelete(params.row)} >
              <DeleteOutlineOutlined />
            </IconButton>
          </Tooltip>
        </div>
      ),
    },
  ];


  const handleEdit = (rowData) => {
    setEditData(rowData); // Set the data to be edited
    setOpen(true); // Open the dialog
  };


  const fetchModels = () => {

    const fetchTransactionDataCall = process.env.NEXT_PUBLIC_SUBLEDGER_SERVICE_URI + '/model/get/all';

    axios.get(fetchTransactionDataCall, {
      headers: {
        'X-Tenant': process.env.NEXT_PUBLIC_TENANT,
        Accept: '*/*',
        'Postman-Token': '091bd74b-e836-4185-896a-008fd64b4f46',
      }
    })
      .then(response => {
        console.log('Models', response.data);
        setRows(response.data);
        // Handle success response if needed
      })
      .catch(error => {
        // Handle error if needed
      });
  };

  // Fetch data when the component mounts
  React.useEffect(() => {
    fetchModels();
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
      <><AddModelConfiguration open={open} onClose={setOpen} editData={editData} /></>

      <>
        {showSuccessMessage && <SuccessAlert title={'Data saved successfully.'} message={successMessage} onClose={() => onClose(false)} />}
        {showErrorMessage && <ErrorAlert title={'Error!'} message={errorMessage} onClose={() => onClose(false)} />}
      </>
    </div>


  );
}

export default Models;
