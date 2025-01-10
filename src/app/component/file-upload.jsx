import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Box, Typography, LinearProgress } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

function FileUploadComponent({ onDrop, text, iconColor, borderColor, backgroundColor, filesLimit }) {
  const [uploading, setUploading] = useState(false);
  const [progressMap, setProgressMap] = useState({});

  const validateFile = (file) => {
    console.log('File MIME type:', file.type);
    const allowedTypes = ['application/vnd.ms-excel', 'text/csv', 'application/zip'];
    return allowedTypes.includes(file.type);
  };

  const handleFileUpload = (file) => {
    console.log('file Name', file.name);
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
    setUploading(true);
    setProgressMap({});

    acceptedFiles.forEach((file) => {
      handleFileUpload(file);
    });

    // Simulate upload completion after 2 seconds
    setTimeout(() => {
      setUploading(false);
      onDrop(acceptedFiles);
    }, 2000);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleDrop,
    multiple: true,
    // validator: validateFile,
    accept: {
      'application/vnd.ms-excel': ['.xls','.xlsx'],
      'text/csv': ['.csv'],
      'application/zip': ['.zip'],
    },
    maxFiles: filesLimit || Infinity,
  });

  return (
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
  );
}

export default FileUploadComponent;
