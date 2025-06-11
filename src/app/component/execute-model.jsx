import React, { useState } from 'react';
import axios from 'axios';
import {
    Box,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    Divider,
    TextField,
    Typography,
    IconButton,
} from '@mui/material';
import HighlightOffOutlinedIcon from '@mui/icons-material/HighlightOffOutlined';
import SuccessAlert from '../component/success-alert'
import ErrorAlert from '../component/error-alert'

const ExecuteModel = ({ open, onClose }) => {
    const [showSuccessMessage, setShowSuccessMessage] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [showErrorMessage, setShowErrorMessage] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [date, setDate] = useState('');
    const [error, setError] = useState(false);



    const handleChange = (event) => {
        const value = event.target.value;
        setDate(value);


        // Validate input format: MM/dd/yyyy
        const regex = /^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/\d{4}$/;
        setError(!regex.test(value));
    };


    const handleClose = () => {
        setShowErrorMessage(false);
        setShowSuccessMessage(false);
        onClose(false);
    };


    const handleModeExecution = async () => {
        if (error) {
            return;
        } else if (date.length === 0) {
            setError(true);
            return;
        }

        const serviceURL = process.env.NEXT_PUBLIC_SUBLEDGER_SERVICE_URI + '/model/execute';

        try {
            console.log('Model to execute:', date);
            const payload = { date: date };
            const response = await axios.post(serviceURL, payload, {
                headers: {
                    'X-Tenant': process.env.NEXT_PUBLIC_TENANT,
                    Accept: '*/*',
                    'Postman-Token': '091bd74b-e836-4185-896a-008fd64b4f46',
                },
            });

            // Handle successful response
            setSuccessMessage(response.data);
            setShowSuccessMessage(true);

            setTimeout(() => {
                setShowSuccessMessage(false);
                setShowErrorMessage(false);
                onClose(false);
            }, 3000);

        } catch (error) {
            // Handle Axios error
            if (axios.isAxiosError(error)) {
                console.error('Axios Error:', error);

                if (error.response) {
                    // The request was made and the server responded with a status code
                    // that falls out of the range of 2xx
                    console.error('Response Data:', error.response.data);
                    console.error('Response Status:', error.response.status);
                    console.error('Response Headers:', error.response.headers);

                    // Set a user-friendly error message based on the status code
                    if (error.response.status === 500) {
                        setErrorMessage(`Internal Server Error: ${error.response.data.message || '.Please try again later.'}`);
                    } else {
                        setErrorMessage(`Error: ${error.response.data.message || 'Something went wrong.'}`);
                    }
                } else if (error.request) {
                    // The request was made but no response was received
                    console.error('No response received:', error.request);
                    setErrorMessage('Network Error: Please check your internet connection.');
                } else {
                    // Something happened in setting up the request that triggered an error
                    console.error('Request setup error:', error.message);
                    setErrorMessage('Request Error: Please try again.');
                }
            } else {
                // Handle non-Axios errors
                console.error('Non-Axios Error:', error);
                setErrorMessage('An unexpected error occurred.');
            }

            // Show error message to the user
            setShowErrorMessage(true);
        }
    };

    return (
        <Dialog sx={{
            '& .MuiDialog-paper': {
                width: '600px', // Set the width
            },
        }} open={open} onClose={onClose}>
            <DialogTitle>
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'start',
                    }}
                >
                    {/* Top Left: Image */}
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'flex-start',  // Change 'left' to 'flex-start'
                            gap: 1,
                            width: 'fit-content' // Ensures the Box doesn't take more space than needed
                        }}
                    >
                        <img
                            src="fyntrac.png"
                            alt="Logo"
                            style={{
                                width: '100px',
                                height: 'auto',  // Maintain aspect ratio
                                maxWidth: '100%' // Ensures responsiveness
                            }}
                        />
                        <Typography variant="h6">Model Execution</Typography>
                    </Box>
                    <IconButton
                        onClick={handleClose}
                        edge="end"
                        aria-label="close"
                        sx={{
                            color: 'grey.500',
                            '&:hover': { color: 'black' },
                        }}
                    >
                        <HighlightOffOutlinedIcon />
                    </IconButton>
                </Box>
            </DialogTitle>
            <Divider />
            <DialogContent>

                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'left',
                        flexDirection: 'column',
                        gap: 1,
                    }}
                >
                    {/* add date field here */}

                    <TextField
                        label="Execution Date"
                        value={date}
                        onChange={handleChange}
                        error={error}
                        helperText={error ? "Invalid date format. Use dd/mm/yyyy." : ""}
                        placeholder="MM/dd/yyyy"
                    />
                    <Typography style={{ align: 'left', alignContent: 'left', fontSize: '12px', color: 'gray' }}>
                        Execution date of Mode in 'MM/dd/yyyy' format.
                    </Typography>
                </Box>
                <Divider sx={{ marginTop: 3, marginBottom: 2 }} />
                <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    flexDirection: 'column',
                    gap: 1,
                }} >
                    <Button onClick={handleModeExecution} sx={{
                        bgcolor: '#39B6FF',
                        color: 'white',
                        '&:hover': {
                            color: '#E6E6EF', // Prevent text color from changing on hover
                        },
                    }}>
                        Execute Model
                    </Button>
                </Box>
            </DialogContent>
            <div>
                {showSuccessMessage && <SuccessAlert title={'Model executed successfully.'} message={successMessage} onClose={() => onClose(false)} />}
                {showErrorMessage && <ErrorAlert title={'Error!'} message={errorMessage} onClose={() => onClose(false)} />}
            </div>
        </Dialog>
    );
};

export default ExecuteModel;
