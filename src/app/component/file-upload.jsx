"use client";

import React, { useState, useEffect, useRef } from "react";
import { useDropzone } from "react-dropzone";
import {
  Box,
  Typography,
  LinearProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Alert,
  Stack,
  Fade,
  Avatar,
  Divider
} from "@mui/material";
import {
  CloudUpload as CloudUploadIcon,
  InsertDriveFile as FileIcon,
  Delete as DeleteIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  DescriptionOutlined as DescriptionIcon
} from "@mui/icons-material";
import { alpha, useTheme } from "@mui/material/styles";
import axios from "axios";
import { useTenant } from "../tenant-context";

const ACTIVITY_TYPES = {
  STANDARD: "Standard Activity",
  CUSTOM: "Custom Activity",
};

export default function FileUploadComponent({ onDrop }) {
  const theme = useTheme();
  const { tenant, user } = useTenant();

  /* -------------------- STATE -------------------- */
  const [activityType, setActivityType] = useState(ACTIVITY_TYPES.STANDARD);
  
  // Ref helps avoid stale closure issues inside async functions
  const activityTypeRef = useRef(activityType);

  const [files, setFiles] = useState([]);
  const [status, setStatus] = useState("idle"); // idle | uploading | success | error
  const [uploadProgress, setUploadProgress] = useState({});
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  /* -------------------- SYNC REF -------------------- */
  useEffect(() => {
    activityTypeRef.current = activityType;
  }, [activityType]);

  /* -------------------- ENDPOINTS -------------------- */
  const standardURL = `${process.env.NEXT_PUBLIC_SUBLEDGER_SERVICE_URI}/accounting/rule/upload`;
  const customURL = `${process.env.NEXT_PUBLIC_SUBLEDGER_SERVICE_URI}/fyntrac/custom-table/data-upload`;

  /* -------------------- DROP HANDLER -------------------- */
  const handleDrop = async (acceptedFiles, fileRejections) => {
    setErrorMessage(null);
    setSuccessMessage(null);

    // 1. Handle Invalid Files immediately
    if (fileRejections.length > 0) {
      setErrorMessage("Invalid file type or size. Please check your files.");
      return;
    }

    // 2. Determine URL
    const currentActivityType = activityTypeRef.current;
    const targetUrl =
      currentActivityType === ACTIVITY_TYPES.CUSTOM
        ? customURL
        : standardURL;

    console.log("🚀 Starting upload to:", targetUrl);

    // 3. Prepare Files
    const newFiles = acceptedFiles.map((file) =>
      Object.assign(file, { preview: URL.createObjectURL(file) })
    );

    setFiles(newFiles);
    setStatus("uploading");

    const formData = new FormData();
    newFiles.forEach((file) => formData.append("files", file));

    try {
      // 4. Send Request
      const response = await axios.post(targetUrl, formData, {
        headers: {
          "X-Tenant": tenant || "",
          "X-User-Id": user?.id || "",
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (e) => {
          const percent = Math.floor((e.loaded / (e.total || 1)) * 100);
          const progressMap = {};
          newFiles.forEach((f) => (progressMap[f.name] = percent));
          setUploadProgress(progressMap);
        },
      });

      console.log("✅ Upload success:", response.data);
      
      // 5. Success State
      setStatus("success");
      setSuccessMessage("Upload Successful!");

      // 6. DELAY CLOSING
      setTimeout(() => {
        setSuccessMessage(null);
        setStatus("idle");
        setFiles([]);
        setUploadProgress({});
        
        if (onDrop) {
            onDrop(newFiles, targetUrl, currentActivityType, response.data);
        }
      }, 5000);

    } catch (err) {
      console.error("❌ Upload failed:", err);

      let displayMessage = "An unexpected error occurred.";

      if (err.response) {
        // --- The server responded with a status code (e.g. 500, 400, 403) ---
        const { data, status } = err.response;

        if (typeof data === "string") {
          // Case A: Server returned an HTML Error Page (common for 500s)
          // We strip the HTML tags to show just the text text
          const cleanText = data.replace(/<[^>]*>/g, "").trim();
          // Take the first line or a max of 100 chars to avoid showing a massive stack trace
          displayMessage = cleanText.split("\n")[0].substring(0, 150) || `Server Error (${status})`;
        } else if (data && typeof data === "object") {
          // Case B: Server returned JSON (Standard Spring Boot error)
          // Look for common fields: 'message', 'error', 'detail'
          displayMessage = data.message || data.error || `Server Error (${status})`;
        } else {
           // Case C: Empty response body
           displayMessage = `Server Error (${status})`;
        }
      } else if (err.request) {
        // --- The request was made but no response was received ---
        displayMessage = "Network error. Please check your internet connection.";
      } else {
        // --- Something happened in setting up the request ---
        displayMessage = err.message;
      }

      setStatus("error");
      setErrorMessage(displayMessage);
    }
  };
  
  /* -------------------- DROPZONE HOOK -------------------- */
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleDrop,
    disabled: status === "uploading" || status === "success",
    accept: {
      "text/csv": [".csv"],
      "application/vnd.ms-excel": [".xls", ".xlsx"],
      "application/zip": [".zip"],
    },
  });

  /* -------------------- RENDER -------------------- */
  
  // SUCCESS VIEW
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
              Your files have been successfully processed and added to the queue.
            </Typography>
            <LinearProgress 
                sx={{ mt: 4, width: '100%', maxWidth: 200, borderRadius: 2, height: 6 }} 
                color="success" 
            />
            <Typography
              variant="caption"
              color="text.disabled"
              sx={{ mt: 1.5, display: "block", fontWeight: 500 }}
            >
              Closing window in 5 seconds...
            </Typography>
          </Box>
        </Fade>
      </Paper>
    );
  }

  // STANDARD UPLOAD VIEW
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
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={2}>
            <Box>
                <Typography variant="body2" color="text.secondary">
                Select an activity type and upload your activity file.
                </Typography>
            </Box>

            <FormControl size="small" sx={{ minWidth: 240 }}>
                <InputLabel>Activity Type</InputLabel>
                <Select
                    value={activityType}
                    label="Activity Type"
                    disabled={status !== "idle"}
                    onChange={(e) => setActivityType(e.target.value)}
                    sx={{ bgcolor: 'background.paper' }}
                >
                <MenuItem value={ACTIVITY_TYPES.STANDARD}>
                    Standard Activity
                </MenuItem>
                <MenuItem value={ACTIVITY_TYPES.CUSTOM}>
                    Custom Activity
                </MenuItem>
                </Select>
            </FormControl>
        </Stack>
      </Box>

      {/* CONTENT SECTION */}
      <Box sx={{ p: 4 }}>
        <Stack spacing={3}>
            
            {/* ERROR MESSAGE */}
            {errorMessage && (
            <Alert 
                severity="error" 
                variant="outlined"
                sx={{ borderRadius: 2 }}
            >
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
                cursor: status === "idle" ? "pointer" : "default",
                bgcolor: isDragActive
                ? alpha(theme.palette.primary.main, 0.04)
                : alpha(theme.palette.background.default, 0.5),
                transition: "all 0.3s ease",
                opacity: status === "uploading" ? 0.6 : 1,
                "&:hover": {
                    borderColor: status === "idle" ? theme.palette.primary.main : undefined,
                    bgcolor: status === "idle" ? alpha(theme.palette.primary.main, 0.02) : undefined
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
                {isDragActive ? "Drop files here" : "Click or drag files to upload"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
                Supported formats: CSV, Excel (.xls, .xlsx), ZIP
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
                                borderColor: status === 'idle' ? 'primary.main' : 'divider',
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
                        secondaryTypographyProps={{ component: "div" }} // ✅ FIX HYDRATION ERROR
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
                    {status === "idle" && (
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