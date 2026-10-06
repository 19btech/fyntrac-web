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
  const [modelNameError, setModelNameError] = useState('');
  const [orderIdError, setOrderIdError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const fieldRegex = /^[A-Za-z0-9_]+$/;

  const validateField = (value) => {
    if (!value) return '';
    if (/\s/.test(value)) return 'Spaces are not allowed.';
    if (!fieldRegex.test(value)) return 'Only letters, numbers, and underscores are allowed.';
    return '';
  };
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
    const nameErr = modelName ? validateField(modelName) : 'Model Name is required.';
    const idErr = modelOrderId ? validateField(modelOrderId) : 'Model Order ID is required.';
    setModelNameError(nameErr);
    setOrderIdError(idErr);
    const isValid = !nameErr && !idErr;
    if (!isValid) {
      setErrorMessage('');
    }

    return isValid;
  };

  // One upload at a time: a second drop/click while uploading (or after success) is ignored.
  const uploadLock = React.useRef(false);

  const handleDrop = (acceptedFiles, fileRejections = []) => {
    if (uploadLock.current) return;

    if (!acceptedFiles || acceptedFiles.length === 0) {
      // Wrong type (or several files) — say so instead of uploading nothing.
      setErrorMessage(fileRejections.length > 1
        ? 'Please drop a single model file.'
        : 'Only Excel model files (.xls, .xlsx) can be uploaded.');
      return;
    }

    if (!validateFields()) {
      return;
    }

    setErrorMessage('');
    uploadFile(acceptedFiles[0]);
  };

  const uploadFile = (file) => {
    uploadLock.current = true;
    setUploading(true);
    setProgressMap({ [file.name]: 0 });

    const formData = new FormData();
    formData.append('modelName', modelName);
    formData.append('modelOrderId', modelOrderId);
    formData.append('files', file);   // backend expects ONE file

    dataloaderApi.post('/model/upload', formData, {
      headers: {
        'X-Tenant': tenant,
        'Content-Type': undefined
      },
      // Real upload progress (bytes sent to the server).
      onUploadProgress: (e) => {
        const percent = e.total ? Math.min(100, Math.round((e.loaded / e.total) * 100)) : 0;
        setProgressMap({ [file.name]: percent });
      },
    })
      .then(response => {
        setSuccessMessage(response.data);
        setOpenSuccess(true);
        // Notify parent so it can close the dialog after the user sees the success state.
        // The lock stays on: this upload is done and the dialog is closing.
        setTimeout(() => {
          onDrop([file], modelName, modelOrderId);
        }, 1500);
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
        setErrorMessage(errMsg);
        uploadLock.current = false; // let the user fix and retry
        // Do NOT call onDrop — keep the modal open so the user can see the error and retry
      })
      .finally(() => {
        setUploading(false);
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
    disabled: uploading || openSuccess,
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
              onChange={(e) => { setModelName(e.target.value); setModelNameError(validateField(e.target.value)); }}
              required
              error={!!modelNameError}
              helperText={modelNameError || 'Letters, numbers, and underscores only — no spaces'}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            <TextField
              label="Model Order ID"
              fullWidth
              size="small"
              value={modelOrderId}
              onChange={(e) => { setModelOrderId(e.target.value); setOrderIdError(validateField(e.target.value)); }}
              required
              error={!!orderIdError}
              helperText={orderIdError || 'Letters, numbers, and underscores only — no spaces'}
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
        sx={{ top: '55px', '@media (min-width:600px)': { top: '55px' } }}
      >
        <Alert onClose={handleSuccessClose} severity="success" variant="standard" sx={{ width: '100%', bgcolor: 'rgba(22,163,74,0.12)', color: '#15803d', border: '1px solid rgba(22,163,74,0.3)', '& .MuiAlert-icon': { color: '#16a34a' } }}>
          Model uploaded successfully.
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default ModelUploadComponent;
