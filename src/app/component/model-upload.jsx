import React, { useState, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Box,
  Typography,
  LinearProgress,
  TextField,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Alert,
  Stack,
  Fade,
  Avatar
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import {
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  DescriptionOutlined as DescriptionIcon
} from "@mui/icons-material";
import { dataloaderApi } from '../services/api-client';
import { useTenant } from "../tenant-context";

export default function ModelUploadComponent({ onDrop, text, headerMessage = "Upload model files for processing" }) {
  const theme = useTheme();
  const { tenant } = useTenant();

  const [modelName, setModelName] = useState('');
  const [modelOrderId, setModelOrderId] = useState('');
  const [modelNameError, setModelNameError] = useState(false);
  const [orderIdError, setOrderIdError] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  
  const [files, setFiles] = useState([]);
  const [status, setStatus] = useState("idle"); // idle, uploading, success, error
  const [uploadProgress, setUploadProgress] = useState({});
  const [successMessage, setSuccessMessage] = useState(null);

  const uploadLock = useRef(false);

  const validateFields = () => {
    let isValid = true;

    if (!modelName.trim()) {
      setModelNameError(true);
      isValid = false;
    } else {
      const regex = /^[A-Za-z][A-Za-z0-9]*$/;
      if (!regex.test(modelName)) {
        setModelNameError(true);
        setErrorMessage('Model Name must start with an alphabet and afterwards may contain number(s).');
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
      const regex = /^[0-9]+[A-Za-z]*$/;
      if (!regex.test(modelOrderId)) {
        setErrorMessage('Model Order Id must start with a number and may end with letters.');
        setOrderIdError(true);
        isValid = false;
        return false;
      }
      setOrderIdError(false);
      setErrorMessage('');
    }

    if (!isValid && !errorMessage) {
      setErrorMessage('Please fill in all required fields correctly.');
    } else if (isValid) {
      setErrorMessage('');
    }

    return isValid;
  };

  const handleDrop = async (acceptedFiles, fileRejections) => {
    if (uploadLock.current) return;
    uploadLock.current = true;

    setErrorMessage(null);
    setSuccessMessage(null);

    if (!validateFields()) {
      uploadLock.current = false;
      return;
    }

    if (fileRejections.length > 0) {
      setErrorMessage("Invalid file type or size. Please check your files.");
      uploadLock.current = false;
      return;
    }

    const newFiles = acceptedFiles.map((file) =>
      Object.assign(file, { preview: URL.createObjectURL(file) })
    );

    setFiles(newFiles);
    setStatus("uploading");

    const serviceURL = '/model/upload';
    const formData = new FormData();
    formData.append('modelName', modelName);
    formData.append('modelOrderId', modelOrderId);
    formData.append('files', newFiles[0]); // backend expects ONE file

    try {
      const response = await dataloaderApi.post(serviceURL, formData, {
        headers: {
          'X-Tenant': tenant,
          'Content-Type': 'multipart/form-data' // updated to handle FormData correctly via axios
        },
        onUploadProgress: (e) => {
          const percent = Math.floor((e.loaded / (e.total || 1)) * 100);
          const progressMap = {};
          newFiles.forEach((f) => (progressMap[f.name] = percent));
          setUploadProgress(progressMap);
        },
      });

      setStatus("success");
      setSuccessMessage(response.data || "Upload Successful!");

      setTimeout(() => {
        setSuccessMessage(null);
        setStatus("idle");
        setFiles([]);
        setUploadProgress({});
        setModelName('');
        setModelOrderId('');
        uploadLock.current = false;
        if (onDrop) onDrop(acceptedFiles, modelName, modelOrderId);
      }, 5000);

    } catch (error) {
      const errData = error.response?.data;
      let errMsg = "Upload failed";
      if (typeof errData === 'string') {
        errMsg = errData;
      } else if (errData && typeof errData === 'object') {
        errMsg = errData.message || JSON.stringify(errData);
      }
      
      setModelNameError(true);
      setStatus("error");
      setErrorMessage(errMsg);
      uploadLock.current = false;
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleDrop,
    multiple: false,
    disabled: status === "uploading" || status === "success",
    noClick: false,
    accept: {
      'application/vnd.ms-excel': ['.xls', '.xlsx'],
      'text/csv': ['.csv'],
      'application/zip': ['.zip']
    },
    maxFiles: 1,
  });

  if (status === "success") {
    return (
      <Paper
        elevation={0}
        variant="outlined"
        sx={{
          p: 6,
          borderRadius: 4,
          borderColor: alpha(theme.palette.success.main, 0.3),
          bgcolor: alpha(theme.palette.success.main, 0.04),
          textAlign: "center",
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 300
        }}
      >
        <Fade in={true} timeout={600}>
          <Box>
            <Avatar
              sx={{
                bgcolor: alpha(theme.palette.success.main, 0.15),
                color: "success.main",
                width: 80,
                height: 80,
                mb: 3,
                mx: 'auto'
              }}
            >
              <SuccessIcon sx={{ fontSize: 48 }} />
            </Avatar>
            <Typography variant="h5" fontWeight={700} gutterBottom sx={{ color: 'text.primary' }}>
              Upload Successful
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 400, mx: 'auto' }}>
              Your model has been successfully uploaded and processed.
            </Typography>
            <LinearProgress
              sx={{ mt: 4, width: '100%', maxWidth: 200, borderRadius: 2, height: 6 }}
              color="success"
            />
            <Typography variant="caption" color="text.disabled" sx={{ mt: 1.5, display: "block", fontWeight: 500 }}>
              Closing window in 5 seconds...
            </Typography>
          </Box>
        </Fade>
      </Paper>
    );
  }

  return (
    <Paper
      elevation={0}
      variant="outlined"
      sx={{
        borderRadius: 4,
        borderColor: 'divider',
        overflow: 'hidden'
      }}
    >
      {/* HEADER SECTION */}
      <Box sx={{ p: 3, bgcolor: alpha(theme.palette.primary.main, 0.02), borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography variant="body2" color="text.secondary">
          {headerMessage}
        </Typography>
      </Box>

      {/* CONTENT SECTION */}
      <Box sx={{ p: 4 }}>
        <Stack spacing={3}>

          <Stack spacing={2} direction={{ xs: 'column', sm: 'row' }}>
            <TextField
              label="Model Name"
              fullWidth
              value={modelName}
              onChange={(e) => { 
                setModelName(e.target.value);
                if (modelNameError) setModelNameError(false);
              }}
              required
              error={modelNameError}
              disabled={status !== "idle" && status !== "error"}
            />
            <TextField
              label="Model Order Id"
              fullWidth
              value={modelOrderId}
              onChange={(e) => { 
                setModelOrderId(e.target.value);
                if (orderIdError) setOrderIdError(false);
              }}
              required
              error={orderIdError}
              disabled={status !== "idle" && status !== "error"}
            />
          </Stack>

          {errorMessage && (
            <Alert severity="error" variant="outlined" sx={{ borderRadius: 2 }}>
              {errorMessage}
            </Alert>
          )}

          {/* DROPZONE */}
          <Box
            {...getRootProps()}
            sx={{
              p: 5,
              border: "2px dashed",
              borderColor: isDragActive
                ? theme.palette.primary.main
                : alpha(theme.palette.text.secondary, 0.2),
              borderRadius: 3,
              textAlign: "center",
              cursor: status === "idle" || status === "error" ? "pointer" : "default",
              bgcolor: isDragActive
                ? alpha(theme.palette.primary.main, 0.04)
                : alpha(theme.palette.background.default, 0.5),
              transition: "all 0.3s ease",
              opacity: status === "uploading" ? 0.6 : 1,
              "&:hover": {
                borderColor: (status === "idle" || status === "error") ? theme.palette.primary.main : undefined,
                bgcolor: (status === "idle" || status === "error") ? alpha(theme.palette.primary.main, 0.02) : undefined
              }
            }}
          >
            <input {...getInputProps()} />

            <Avatar
              sx={{
                width: 64,
                height: 64,
                bgcolor: isDragActive ? alpha(theme.palette.primary.main, 0.1) : alpha(theme.palette.text.secondary, 0.05),
                color: isDragActive ? "primary.main" : "text.secondary",
                mx: 'auto',
                mb: 2,
                transition: 'all 0.3s ease'
              }}
            >
              <CloudUploadIcon sx={{ fontSize: 32 }} />
            </Avatar>

            <Typography variant="h6" gutterBottom fontWeight={600} color={isDragActive ? "primary.main" : "text.primary"}>
              {isDragActive ? "Drop model file here" : text || "Click or drag model file to upload"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Supported formats: Excel (.xls, .xlsx), CSV, ZIP
            </Typography>
          </Box>

          {/* FILE LIST */}
          {files.length > 0 && (
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1.5, ml: 1, fontWeight: 600, color: 'text.secondary' }}>
                Files Queue ({files.length})
              </Typography>
              <List disablePadding>
                {files.map((file) => (
                  <ListItem
                    key={file.name}
                    sx={{
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 2,
                      mb: 1.5,
                      bgcolor: 'background.paper',
                      transition: 'all 0.2s',
                      '&:hover': {
                        borderColor: (status === 'idle' || status === 'error') ? 'primary.main' : 'divider',
                        bgcolor: alpha(theme.palette.background.paper, 0.8)
                      }
                    }}
                  >
                    <ListItemIcon>
                      <Avatar
                        variant="rounded"
                        sx={{
                          bgcolor: status === "error" ? alpha(theme.palette.error.main, 0.1) : alpha(theme.palette.primary.main, 0.1),
                          color: status === "error" ? "error.main" : "primary.main"
                        }}
                      >
                        {status === "error" ? <ErrorIcon /> : <DescriptionIcon />}
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography variant="body2" fontWeight={600} noWrap>
                          {file.name}
                        </Typography>
                      }
                      slotProps={{ secondary: { component: "div" } }}
                      secondary={
                        status === "uploading" ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                            <Box sx={{ width: '100%', mr: 2 }}>
                              <LinearProgress
                                variant="determinate"
                                value={uploadProgress[file.name] || 0}
                                sx={{ height: 6, borderRadius: 3 }}
                              />
                            </Box>
                            <Box sx={{ minWidth: 35 }}>
                              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                {`${uploadProgress[file.name] || 0}%`}
                              </Typography>
                            </Box>
                          </Box>
                        ) : (
                          <Typography variant="caption" color="text.secondary">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </Typography>
                        )
                      }
                    />
                    {(status === "idle" || status === "error") && (
                      <IconButton
                        size="small"
                        onClick={() =>
                          setFiles((prev) => prev.filter((f) => f.name !== file.name))
                        }
                        sx={{ color: 'text.secondary', '&:hover': { color: 'error.main' } }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    )}
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </Stack>
      </Box>
    </Paper>
  );
}
