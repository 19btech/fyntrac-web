import React, { useState } from 'react';
import { dataloaderApi } from '../services/api-client';
import { useDropzone } from 'react-dropzone';
import {
  TextField, Box, Typography, LinearProgress, Alert, Snackbar,
  Avatar, Stack, Paper, Fade
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useTenant } from "../tenant-context";

function ModelUploadComponent({ onDrop, text, iconColor, borderColor, backgroundColor, filesLimit }) {
  const theme = useTheme();
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
    const serviceURL = '/model/upload';

    const formData = new FormData();
    formData.append('modelName', modelName);
    formData.append('modelOrderId', modelOrderId);
    formData.append('files', acceptedFiles[0]);   // backend expects ONE file

    dataloaderApi.post(serviceURL, formData, {
      headers: {
        'X-Tenant': tenant,
        'Content-Type': undefined
      }
    })
      .then(response => {
        console.log('success response', response.data);
        setSuccessMessage(response.data);
        setOpenSuccess(true);
      })
      .catch(error => {
        const errData = error.response?.data;
        let errMsg = "Upload failed";
        if (typeof errData === 'string') {
           errMsg = errData;
        } else if (errData && typeof errData === 'object') {
           errMsg = errData.message || JSON.stringify(errData);
        }
        console.error('Upload data:', errMsg);
        setModelNameError(true);
        setErrorMessage(errMsg);
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
    <Box sx={{ p: 3 }}>
      {/* Success state */}
      {openSuccess ? (
        <Fade in timeout={500}>
          <Paper
            elevation={0}
            variant="outlined"
            sx={{
              p: 6,
              borderRadius: 4,
              borderColor: alpha('#22c55e', 0.3),
              bgcolor: alpha('#22c55e', 0.04),
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <Avatar
              sx={{
                bgcolor: alpha('#22c55e', 0.15),
                color: 'success.main',
                width: 72,
                height: 72,
                mb: 2,
              }}
            >
              <CheckCircleIcon sx={{ fontSize: 40 }} />
            </Avatar>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Upload Successful
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Your model has been uploaded and queued for processing.
            </Typography>
          </Paper>
        </Fade>
      ) : (
        <Stack spacing={3}>
          {/* Fields row */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="Model Name"
              fullWidth
              size="small"
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              required
              error={modelNameError}
              helperText={modelNameError ? errorMessage : 'Must start with a letter, alphanumeric only'}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            <TextField
              label="Model Order ID"
              fullWidth
              size="small"
              value={modelOrderId}
              onChange={(e) => setModelOrderId(e.target.value)}
              required
              error={orderIdError}
              helperText={orderIdError ? errorMessage : 'Must start with a number'}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          </Stack>

          {/* Error alert */}
          {errorMessage && !modelNameError && !orderIdError && (
            <Alert severity="error" variant="outlined" sx={{ borderRadius: 2 }}>
              {errorMessage}
            </Alert>
          )}

          {/* Dropzone */}
          <Box
            {...getRootProps()}
            sx={{
              p: 5,
              border: '2px dashed',
              borderColor: isDragActive
                ? 'primary.main'
                : alpha(theme.palette.text.secondary, 0.2),
              borderRadius: 3,
              textAlign: 'center',
              cursor: uploading ? 'default' : 'pointer',
              bgcolor: isDragActive
                ? alpha(theme.palette.primary.main, 0.04)
                : alpha(theme.palette.background.default, 0.5),
              transition: 'all 0.3s ease',
              opacity: uploading ? 0.7 : 1,
              '&:hover': {
                borderColor: !uploading ? 'primary.main' : undefined,
                bgcolor: !uploading ? alpha(theme.palette.primary.main, 0.02) : undefined,
              },
            }}
          >
            <input {...getInputProps()} />
            <Avatar
              sx={{
                width: 64,
                height: 64,
                bgcolor: isDragActive
                  ? alpha(theme.palette.primary.main, 0.1)
                  : alpha(theme.palette.text.secondary, 0.06),
                color: isDragActive ? 'primary.main' : 'text.secondary',
                mx: 'auto',
                mb: 2,
                transition: 'all 0.3s ease',
              }}
            >
              <CloudUploadIcon sx={{ fontSize: 32 }} />
            </Avatar>
            <Typography variant="h6" fontWeight={600} gutterBottom color={isDragActive ? 'primary.main' : 'text.primary'}>
              {uploading ? 'Uploading…' : isDragActive ? 'Drop your model file here' : 'Click or drag model file to upload'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Supported formats: Excel (.xls, .xlsx)
            </Typography>

            {/* Progress bars */}
            {uploading && Object.entries(progressMap).length > 0 && (
              <Stack spacing={1} sx={{ mt: 3, textAlign: 'left' }}>
                {Object.entries(progressMap).map(([fileName, progress]) => (
                  <Box key={fileName}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      {fileName}
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={progress}
                      sx={{ height: 6, borderRadius: 3, mt: 0.5 }}
                    />
                  </Box>
                ))}
              </Stack>
            )}
          </Box>
        </Stack>
      )}

      {/* Success snackbar */}
      <Snackbar
        open={openSuccess}
        autoHideDuration={6000}
        onClose={handleSuccessClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={handleSuccessClose} severity="success" variant="standard" sx={{ width: '100%', bgcolor: 'rgba(22,163,74,0.12)', color: '#15803d', border: '1px solid rgba(22,163,74,0.3)', '& .MuiAlert-icon': { color: '#16a34a' } }}>
          Model uploaded successfully.
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default ModelUploadComponent;
