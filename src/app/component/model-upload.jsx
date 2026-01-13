import React, { useState } from 'react';
import axios from 'axios';
import { useDropzone } from 'react-dropzone';
import { TextField, Divider, DialogContent, Box, Typography, LinearProgress, Alert, Snackbar } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import SuccessAlert from '../component/success-alert'
import ErrorAlert from '../component/error-alert'
import { useTenant } from "../tenant-context";

function ModelUploadComponent({ onDrop, text, iconColor, borderColor, backgroundColor, filesLimit }) {
  const { tenant } = useTenant();
  const [uploading, setUploading] = useState(false);
  const [progressMap, setProgressMap] = useState({});
  const [modelName, setModelName] = useState('');
  const [modelOrderId, setModelOrderId] = useState('');
  const [modelNameError, setModelNameError] = useState(false);
  const [orderIdError, setOrderIdError] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [openSuccess, setOpenSuccess] = React.useState(false);

  const handleSuccessClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }

    setOpenSuccess(false);
  };

  const validateFile = (file) => {
    const allowedTypes = ['application/vnd.ms-excel', 'text/csv', 'application/zip'];
    return allowedTypes.includes(file.type);
  };

  const validateFields = () => {
    let isValid = true;

    if (!modelName.trim()) {
      setModelNameError(true);
      isValid = false;
    } else {
      const regex = /^[A-Za-z][A-Za-z0-9]*$/; // Starts with an alphabet, followed by alphanumeric characters
      if (!regex.test(modelName)) {
        setModelNameError(true);
        setErrorMessage('Input must start with an alphabet and afterwards may contain number(s).');
        isValid = false;
        return false;
      }
      setModelNameError(false);
      setErrorMessage('');
    }

    if (!modelOrderId.trim()) {
      setOrderIdError(true);
      isValid = false;
    } else {
      // Regular expression to match the desired pattern
      const regex = /^[0-9]+[A-Za-z]*$/;

      if (!regex.test(modelOrderId)) {
        setErrorMessage('Input must start with a number and may end with letters.');
        setOrderIdError(true);
        isValid = false;
        return false;
      }
      setOrderIdError(false);
      setErrorMessage('');
    }

    if (!isValid) {
      setErrorMessage('Please fill in all required fields correctly.');
    } else {
      setErrorMessage('');
    }

    return isValid;
  };

  const handleFileUpload = (file) => {
    const reader = new FileReader();

    reader.onprogress = (event) => {
      const loaded = event.loaded;
      const total = event.total;
      const progress = Math.round((loaded / total) * 100);

      setProgressMap((prevMap) => ({
        ...prevMap,
        [file.name]: progress,
      }));
    };

    reader.onload = () => {
      // Handle the file here if needed
      // Example: console.log(`File "${file.name}" processed`);
    };

    reader.readAsBinaryString(file);
  };

  const handleDrop = (acceptedFiles) => {

    if (!validateFields()) {
      return;
    }

    setUploading(true);
    setProgressMap({});

    acceptedFiles.forEach((file) => {
      handleFileUpload(file);
    });

    // Simulate upload completion after 2 seconds
    setTimeout(() => {
      setUploading(false);
      handleFileDrop(acceptedFiles, modelName, modelOrderId);
      onDrop(acceptedFiles, modelName, modelOrderId);
    }, 5000);
  };

  const handleFileDrop = (acceptedFiles, modelName, modelOrderId) => {
    const serviceURL = process.env.NEXT_PUBLIC_SUBLEDGER_SERVICE_URI + '/model/upload';

    const formData = new FormData();
    formData.append('modelName', modelName);
    formData.append('modelOrderId', modelOrderId);
    formData.append('files', acceptedFiles[0]);   // backend expects ONE file

    axios.post(serviceURL, formData, {
      headers: {
        'X-Tenant': tenant
      }
    })
      .then(response => {
        console.log('success response', response.data);
        setSuccessMessage(response.data);
        setOpenSuccess(true);
      })
      .catch(error => {
        const err = error.response?.data || "Upload failed";
        console.error('Upload data:', err);
        setModelNameError(true);
        setErrorMessage(err);
      });
  };


  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleDrop,
    multiple: false,
    // validator: validateFields,
    accept: {
      'application/vnd.ms-excel': ['.xls', '.xlsx']
    },
    maxFiles: filesLimit || Infinity,
  });

  return (
    <div>
      <img src="fyntrac.png" alt="Sample Image" width="100" height="30" />
      <p>Upload model</p>
      <Box>
        <Divider />
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <TextField
            sx={{ width: 500 }}
            label="Model Name"
            fullWidth
            value={modelName}
            onChange={(e) => { setModelName(e.target.value) }}
            required
            error={modelNameError}
            helperText={modelNameError ? errorMessage : ''}
          />
          <TextField
            sx={{ width: 500 }}
            label="Model Order Id"
            fullWidth
            value={modelOrderId}
            onChange={(e) => { setModelOrderId(e.target.value) }}
            required
            error={orderIdError}
            helperText={orderIdError ? errorMessage : ''}
          />
        </DialogContent>
      </Box>

      {/* Show Alert if there's an error message */}
      {errorMessage && (
        <Alert severity="error" sx={{ margin: '16px 0' }}>
          {errorMessage}
        </Alert>
      )}

      <Box
        {...getRootProps()}
        sx={{
          border: `2px dashed ${borderColor || '#ccc'}`,
          borderRadius: '8px',
          padding: '20px',
          textAlign: 'center',
          backgroundColor: isDragActive ? (backgroundColor || '#f5f5f5') : 'transparent',
          cursor: 'pointer',
        }}
      >


        <input {...getInputProps()} />
        <CloudUploadIcon sx={{ fontSize: 48, color: iconColor || '#757575', marginBottom: '10px' }} />
        <Typography variant="body1" sx={{ color: iconColor || '#757575' }}>
          {uploading ? 'Uploading...' : isDragActive ? 'Drop the files here' : text || 'Drag and drop files here or click to browse'}
        </Typography>
        {uploading && (
          <>
            {Object.entries(progressMap).map(([fileName, progress]) => (
              <Box key={fileName} sx={{ marginTop: '10px' }}>
                <Typography variant="body2">{fileName}</Typography>
                <LinearProgress variant="determinate" value={progress} />
              </Box>
            ))}
          </>
        )}
      </Box>

      <div>
        <Snackbar
          open={openSuccess}
          autoHideDuration={6000}
          onClose={handleSuccessClose}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
          <Alert
            onClose={handleSuccessClose}
            severity="success"
            variant="filled"
            sx={{ width: '100%' }}
          >
            {JSON.stringify(successMessage)}
          </Alert>
        </Snackbar>
      </div>

    </div>
  );
}

export default ModelUploadComponent;
