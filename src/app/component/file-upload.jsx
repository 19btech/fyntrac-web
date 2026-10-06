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
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Slide,
  Tooltip,
} from "@mui/material";
import {
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  DescriptionOutlined as DescriptionIcon,
  Check as CheckIcon,
  WarningAmber as WarningAmberIcon,
  HighlightOffOutlined as HighlightOffOutlinedIcon,
} from "@mui/icons-material";
import { alpha, useTheme } from "@mui/material/styles";
import { useTenant } from "../tenant-context";
import { dataloaderApi } from "../services/api-client";
import { checkActivityFiles } from "./activity-file-check";

const ACTIVITY_TYPES = {
  STANDARD: "Standard Activity",
  CUSTOM: "Custom Activity",
};

const FONT = '"Inter", "Helvetica Neue", Arial, sans-serif';

export default function FileUploadComponent({
  onDrop,
  onBusyChange,
  filesLimit,
  showActivitySelector = false,
  showLoadModeSelector = false,
  headerMessage = "Upload reference data files for secure validation, ingestion, and processing"
}) {
  const theme = useTheme();
  const { tenant, user } = useTenant();

  const [activityType, setActivityType] = useState(ACTIVITY_TYPES.STANDARD);
  const activityTypeRef = useRef(activityType);
  const [loadMode, setLoadMode] = useState('APPEND');
  const loadModeRef = useRef(loadMode);

  const [files, setFiles] = useState([]);
  const [status, setStatus] = useState("idle");
  const [uploadProgress, setUploadProgress] = useState({});
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // ✅ Lock to prevent double-loading
  const uploadLock = useRef(false);

  // Overwrite replaces activity data, so it waits for the user to confirm.
  const [pendingOverwrite, setPendingOverwrite] = useState(null); // { files, activityType }

  // The success countdown before the parent closes the dialog. If the dialog is closed first, the
  // countdown is dropped (so it can't close a dialog opened later) and the parent refreshes now.
  const successTimer = useRef(null);
  const onDropRef = useRef(onDrop);
  onDropRef.current = onDrop;
  useEffect(() => () => {
    if (successTimer.current) {
      clearTimeout(successTimer.current);
      successTimer.current = null;
      onDropRef.current?.();
    }
  }, []);

  // The parent keeps the dialog open while files are uploading.
  useEffect(() => { onBusyChange?.(status === "uploading"); }, [status, onBusyChange]);
  useEffect(() => () => onBusyChange?.(false), [onBusyChange]);

  // #3: after an error the type / mode can be changed again; changing them starts over.
  const resetAfterError = () => {
    if (status !== "error") return;
    setStatus("idle");
    setErrorMessage(null);
    setFiles([]);
    setUploadProgress({});
  };

  useEffect(() => {
    activityTypeRef.current = activityType;
  }, [activityType]);

  useEffect(() => {
    loadModeRef.current = loadMode;
  }, [loadMode]);

  const activity_overwriteURL = `/accounting/rule/upload-overwrite`;
  const activity_appendURL = `/accounting/rule/upload`;
  const custom_overwriteURL = `/fyntrac/custom-table/data-upload-overwrite`;
  const custom_appendURL = `/fyntrac/custom-table/data-upload`;

  const handleDrop = async (acceptedFiles, fileRejections) => {
    // 🔒 Prevent double upload
    if (uploadLock.current) return;
    uploadLock.current = true;

    setErrorMessage(null);
    setSuccessMessage(null);

    if (fileRejections.length > 0) {
      const tooMany = fileRejections.some((r) => r.errors?.some((e) => e.code === "too-many-files"));
      setErrorMessage(tooMany
        ? `Too many files — upload at most ${filesLimit} at a time.`
        : "Invalid file type or size. Please check your files.");
      uploadLock.current = false;
      return;
    }

    const currentActivityType = showActivitySelector
      ? activityTypeRef.current
      : ACTIVITY_TYPES.STANDARD;

    if (showActivitySelector) {
      const problem = await checkActivityFiles(acceptedFiles, currentActivityType === ACTIVITY_TYPES.STANDARD);
      if (problem) {
        setStatus("error");
        setErrorMessage(problem);
        uploadLock.current = false;
        return;
      }
    }

    if (acceptedFiles.length === 0) {
      uploadLock.current = false;
      return;
    }

    const currentMode = showLoadModeSelector ? loadModeRef.current : "APPEND";
    if (currentMode === "OVERWRITE") {
      // Hold the files (lock stays on) until the user confirms or cancels.
      setPendingOverwrite({ files: acceptedFiles, activityType: currentActivityType });
      return;
    }

    await uploadFiles(acceptedFiles, currentActivityType, currentMode);
  };

  const cancelOverwrite = () => {
    setPendingOverwrite(null);
    uploadLock.current = false; // 🔓 Release lock
  };

  const confirmOverwrite = () => {
    const pending = pendingOverwrite;
    setPendingOverwrite(null);
    if (pending) uploadFiles(pending.files, pending.activityType, "OVERWRITE");
  };

  const uploadFiles = async (acceptedFiles, currentActivityType, currentMode) => {
    const targetUrl = (() => {
      console.log("Mode:", currentMode, "Activity Type:", currentActivityType);
      if (!showLoadModeSelector) {
        return activity_appendURL;
      } else if (currentMode === "OVERWRITE" && currentActivityType === ACTIVITY_TYPES.CUSTOM) {
        return custom_overwriteURL;
      } else if (currentMode === "APPEND" && currentActivityType === ACTIVITY_TYPES.CUSTOM) {
        return custom_appendURL;
      } else if (currentMode === "OVERWRITE" && currentActivityType === ACTIVITY_TYPES.STANDARD) {
        return activity_overwriteURL;
      } else if (currentMode === "APPEND" && currentActivityType === ACTIVITY_TYPES.STANDARD) {
        return activity_appendURL;
      }

      return null;
    })();


    const newFiles = acceptedFiles;

    setFiles(newFiles);
    setStatus("uploading");

    const formData = new FormData();
    newFiles.forEach((file) => formData.append("files", file));
    if (showLoadModeSelector) {
      formData.append("loadMode", currentMode);
    }

    try {

      console.log("Activity upload targetUrl", targetUrl);
      const response = await dataloaderApi.post(targetUrl, formData, {
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

      setStatus("success");
      setSuccessMessage("Upload Successful!");

      successTimer.current = setTimeout(() => {
        successTimer.current = null;
        setSuccessMessage(null);
        setStatus("idle");
        setFiles([]);
        setUploadProgress({});
        uploadLock.current = false; // 🔓 Release lock
        onDropRef.current?.();
      }, 5000);

    } catch (err) {
      let displayMessage = "An unexpected error occurred.";

      if (err.response) {
        const { data, status } = err.response;
        if (typeof data === "string") {
          const cleanText = data.replace(/<[^>]*>/g, "").trim();
          displayMessage = cleanText.split("\n")[0].substring(0, 150) || `Server Error (${status})`;
        } else if (data && typeof data === "object") {
          displayMessage = data.message || data.error || `Server Error (${status})`;
        } else {
          displayMessage = `Server Error (${status})`;
        }
      } else if (err.request) {
        displayMessage = "Network error. Please check your internet connection.";
      } else {
        displayMessage = err.message;
      }

      setStatus("error");
      setErrorMessage(displayMessage);
      uploadLock.current = false; // 🔓 Release lock
    }
  };

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop: handleDrop,
    disabled: status === "uploading" || status === "success",
    noClick: false, // ✅ enable click
    maxFiles: filesLimit || 0, // 0 = no limit
    accept: {
      "text/csv": [".csv"],
      "application/vnd.ms-excel": [".xls", ".xlsx"],
      "application/zip": [".zip"],
    },
  });

  /* -------------------- RENDER SUCCESS -------------------- */
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
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <LinearProgress
                sx={{ width: 200, borderRadius: 2, height: 6 }}
                color="success"
              />
            </Box>
            <Typography variant="caption" color="text.disabled" sx={{ mt: 1.5, display: "block", fontWeight: 500 }}>
              Closing window in 5 seconds...
            </Typography>
          </Box>
        </Fade>
      </Paper>
    );
  }

  const fileCount = pendingOverwrite?.files.length ?? 0;
  const overwriteDialog = (
    <Dialog
      open={Boolean(pendingOverwrite)}
      onClose={cancelOverwrite}
      maxWidth="xs" fullWidth
      slots={{ transition: Slide }}
      slotProps={{
        transition: { direction: 'up' },
        paper: { sx: { borderRadius: 4, overflow: 'hidden', border: '1px solid', borderColor: 'divider' } },
      }}
    >
      <DialogTitle sx={{ p: 0, flexShrink: 0 }}>
        <Box sx={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          px: 3, pt: 3, pb: 2.5,
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
          borderBottom: '1px solid', borderColor: 'divider',
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <img src="/fyntrac.png" alt="Fyntrac" style={{ width: 72, height: 'auto' }} />
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <Chip
                  icon={<WarningAmberIcon sx={{ fontSize: '12px !important' }} />}
                  label="Overwrite"
                  size="small"
                  sx={{
                    height: 20, fontSize: '0.6rem', fontWeight: 700,
                    letterSpacing: 0.8, textTransform: 'uppercase',
                    bgcolor: alpha(theme.palette.warning.main, 0.1),
                    color: theme.palette.warning.dark, borderRadius: 1,
                  }}
                />
              </Box>
              <Typography variant="h6" fontWeight={700} sx={{ lineHeight: 1.2, color: 'text.primary', fontFamily: FONT }}>
                Overwrite Activity Data
              </Typography>
            </Box>
          </Box>
          <Tooltip title="Close" placement="left">
            <IconButton onClick={cancelOverwrite} size="small" aria-label="Close" sx={{
              color: 'text.secondary', bgcolor: 'action.hover', borderRadius: 2,
              '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.12), color: 'error.main' },
            }}>
              <HighlightOffOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ pt: 5, px: 3 }}>
        <Typography sx={{ fontFamily: FONT, fontSize: '0.88rem', color: 'text.secondary', lineHeight: 1.7, mt: 3 }}>
          Loading with <strong>Overwrite</strong> will <strong>replace all existing{' '}
          {pendingOverwrite?.activityType === ACTIVITY_TYPES.CUSTOM ? 'custom' : 'standard'} activity data</strong> for the current posting date with the {fileCount === 1 ? 'file' : `${fileCount} files`} below. This cannot be undone.
        </Typography>
        {fileCount > 0 && (
          <Box sx={{ mt: 2, p: 1.5, borderRadius: 2, bgcolor: alpha(theme.palette.grey[500], 0.06), border: '1px solid', borderColor: 'divider', maxHeight: 140, overflow: 'auto' }}>
            {pendingOverwrite.files.map((f) => (
              <Typography key={f.name} noWrap sx={{ fontFamily: FONT, fontSize: '0.78rem', fontWeight: 600, color: 'text.primary' }}>
                {f.name}
              </Typography>
            ))}
          </Box>
        )}
        <Typography sx={{ fontFamily: FONT, fontSize: '0.88rem', color: 'text.secondary', lineHeight: 1.7, mt: 2 }}>
          Are you sure you want to continue? Choose <strong>Append</strong> instead to add to the existing data.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button onClick={cancelOverwrite} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, color: 'text.secondary', fontFamily: FONT }}>
          Cancel
        </Button>
        <Button onClick={confirmOverwrite} variant="contained" sx={{
          borderRadius: 2, textTransform: 'none', fontWeight: 700,
          fontFamily: FONT, px: 2.5,
          background: '#14213d', color: '#fff',
          boxShadow: '0 4px 12px rgba(20,33,61,0.28)',
          transition: 'all 0.2s ease-in-out',
          '&:hover': { background: '#1e3057', boxShadow: '0 6px 18px rgba(20,33,61,0.4)', transform: 'translateY(-1px)' },
          '&.Mui-disabled': { background: 'rgba(20,33,61,0.4)', color: '#fff' },
        }}>
          Overwrite &amp; Load
        </Button>
      </DialogActions>
    </Dialog>
  );

  /* -------------------- RENDER UPLOAD -------------------- */
  return (
    <>
    {overwriteDialog}
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

        {/* Main Outer Container - Forces a vertical stack top-to-bottom */}
        <Stack direction="column" spacing={2} sx={{ width: '100%' }}>

          {/* TOP ROW: Header Title Message */}
          <Box>
            <Typography variant="body2" color="text.secondary">
              {headerMessage}
            </Typography>
          </Box>

          {/* MIDDLE ROW: Full-Width Error Alert (breaks to its own clean line completely) */}
          {errorMessage && (
            <Box sx={{ width: '100%' }}>
              <Alert severity="error" variant="outlined" sx={{ borderRadius: 2 }}>
                {errorMessage}
              </Alert>
            </Box>
          )}

          {/* BOTTOM ROW: Controls Bar - Selectors align side-by-side or stack on mobile */}
          {(showActivitySelector || showLoadModeSelector) && (
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              justifyContent="flex-start"
              alignItems={{ sm: 'center' }}
              spacing={2}
              sx={{ mt: errorMessage ? 0 : 1 }} // Fine-tunes spacing if alert is missing
            >
              {showActivitySelector && (
                <FormControl size="small" sx={{ minWidth: 240 }}>
                  <InputLabel>Activity Type</InputLabel>
                  <Select
                    value={activityType}
                    label="Activity Type"
                    disabled={status === "uploading" || status === "success"}
                    onChange={(e) => { setActivityType(e.target.value); resetAfterError(); }}
                    sx={{ bgcolor: 'background.paper' }}
                  >
                    <MenuItem value={ACTIVITY_TYPES.STANDARD}>Standard Activity</MenuItem>
                    <MenuItem value={ACTIVITY_TYPES.CUSTOM}>Custom Activity</MenuItem>
                  </Select>
                </FormControl>
              )}

              {showLoadModeSelector && (
                <Stack direction="row" spacing={1} alignItems="center">
                  {['OVERWRITE', 'APPEND'].map((mode) => {
                    const selected = loadMode === mode;
                    const label = mode === 'OVERWRITE' ? 'Overwrite' : 'Append';
                    return (
                      <Chip
                        key={mode}
                        label={label}
                        icon={selected ? <CheckIcon sx={{ fontSize: '13px !important' }} /> : undefined}
                        onClick={() => { setLoadMode(mode); resetAfterError(); }}
                        size="small"
                        disabled={status === 'uploading' || status === 'success'}
                        sx={{
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif',
                          letterSpacing: 0.2,
                          height: 28,
                          borderRadius: 2,
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                          bgcolor: selected ? alpha('#16a34a', 0.12) : alpha(theme.palette.grey[500], 0.08),
                          color: selected ? '#16a34a' : 'text.secondary',
                          border: '1.5px solid',
                          borderColor: selected ? '#16a34a' : alpha(theme.palette.text.secondary, 0.2),
                          '& .MuiChip-icon': { color: '#16a34a' },
                          '&:hover': {
                            bgcolor: selected ? alpha('#16a34a', 0.18) : alpha('#16a34a', 0.06),
                            borderColor: '#16a34a',
                            color: '#16a34a',
                          },
                        }}
                      />
                    );
                  })}
                </Stack>
              )}
            </Stack>
          )}
        </Stack>
      </Box>

      {/* CONTENT SECTION */}
      <Box sx={{ p: 4 }}>
        <Stack spacing={3}>

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
              cursor: (status === "idle" || status === "error") ? "pointer" : "default",
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
    </>
  );
}
