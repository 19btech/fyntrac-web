import React, { use, useState } from 'react';
import {
    Dialog
    , DialogTitle
    , DialogContent
    , DialogActions
    , Button
    , TextField
    , Autocomplete
    , IconButton
    , Typography
    , Tooltip
    , Box
    , Divider
    , Chip
} from '@mui/material';
import HighlightOffOutlinedIcon from '@mui/icons-material/HighlightOffOutlined';
import axios from 'axios';
import SuccessAlert from '../component/success-alert'
import ErrorAlert from '../component/error-alert'


function sleep(duration) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve();
        }, duration);
    });
}

const AddDashboardConfiguration = ({ open, onClose, editData }) => {
    var fixedMetrics = [];
    const [id, setId] = useState(null);
    const [widgetOne, setWidgetOne] = useState('');
    const [widgetTwo, setWidgetTwo] = useState('');
    const [widgetThree, setWidgetThree] = useState('');
    const [widgetFour, setWidgetFour] = useState('');
    const [trendAnalysisGraph, setTrendAnalysisGraph] = useState('');
    const [activityGraphMetrics, setActivityGraphMetrics] = useState([...fixedMetrics]);;
    const [showSuccessMessage, setShowSuccessMessage] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [showErrorMessage, setShowErrorMessage] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [availableMetrics, setAvailableMetrics] = useState([]);
    const [isMetricssError, setIsMetricsError] = React.useState(false);
    const serviceGetMetricsURL = process.env.NEXT_PUBLIC_SUBLEDGER_SERVICE_URI + '/aggregation/get/metrics'


    React.useEffect(() => {
        if (availableMetrics.length === 0) {
            fetchMetricNames();
        }

        if (editData) {
            const graphMetrics = editData.activityGraphMetrics.map(name => ({ metricName: name }));
            // Populate form fields with editData if provided
            setWidgetOne(editData.widgetOneMetric);
            setWidgetTwo(editData.widgetTwoMetric);
            setWidgetThree(editData.widgetThreeMetric);
            setWidgetFour(editData.widgetFourMetric);
            setTrendAnalysisGraph(editData.trendAnalysisGraphMetric);
            setActivityGraphMetrics(graphMetrics);
            setId(editData.id);
        } else {
            // Clear form fields if no editData (eaccountSubtypes.g., for adding new transaction)
            setWidgetOne('');
            setWidgetTwo('');
            setWidgetThree('');
            setWidgetFour('');
            setTrendAnalysisGraph('');
            setActivityGraphMetrics([]);
        }
    }, [editData]);


    const fetchMetricNames = () => {

        axios.get(serviceGetMetricsURL, {
            headers: {
                'X-Tenant': process.env.NEXT_PUBLIC_TENANT,
                Accept: '*/*',
                'Postman-Token': '091bd74b-e836-4185-896a-008fd64b4f46',
            }
        })
            .then(response => {
                console.log('Metrics:', response.data);
                setAvailableMetrics(response.data);
            })
            .catch(error => {
                // Handle error if needed
            });
    };


    const handleSaveDashboardConfiguration = async () => {
        const serviceURL = process.env.NEXT_PUBLIC_SUBLEDGER_SERVICE_URI + '/setting/dashboard-configuration/save';
        try {
            const metricNames = activityGraphMetrics.map(item => item.metricName);
            console.log("Dashboard Configuration:", {
                widgetOneMetric: widgetOne,
                widgetTwoMetric: widgetTwo,
                widgetThreeMetric: widgetThree,
                widgetFourMetric: widgetFour,
                trendAnalysisGraphMetric: trendAnalysisGraph,
                activityGraphMetrics: metricNames,
                id: id
            });
            const response = await axios.post(serviceURL, {
                widgetOneMetric: widgetOne,
                widgetTwoMetric: widgetTwo,
                widgetThreeMetric: widgetThree,
                widgetFourMetric: widgetFour,
                trendAnalysisGraphMetric: trendAnalysisGraph,
                activityGraphMetrics: metricNames,
                id: id
            },
                {
                    headers: {
                        'X-Tenant': process.env.NEXT_PUBLIC_TENANT,
                        Accept: '*/*',
                        'Postman-Token': '091bd74b-e836-4185-896a-008fd64b4f46',
                    }
                }
            );
            setSuccessMessage(JSON.stringify(response.data));
            setShowSuccessMessage(true);

            setTimeout(() => {
                setShowSuccessMessage(false);
                setShowErrorMessage(false);
                onClose(false);
            }, 3000);
        } catch (error) {
            console.error("Save Dashboard Configuration Error:", error); // for debugging

            let userFriendlyMessage = 'An unexpected error occurred';

            if (error.response?.data?.message) {
                // Your backend explicitly sent a message
                userFriendlyMessage = error.response.data.message;
            } else if (error.message) {
                // Axios error message
                userFriendlyMessage = error.message;
            }

            setErrorMessage(userFriendlyMessage); // Pass a string
            setShowErrorMessage(true);
        }
    };


    const handleClose = () => {
        setShowErrorMessage(false);
        setShowSuccessMessage(false);
        onClose(false);
    };

    return (
        <Dialog open={open} onClose={onClose}>
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
                        <Typography variant="h6">Configure Dashboard</Typography>
                    </Box>
                    <Tooltip title='Close'>
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
                    </Tooltip>
                </Box>
            </DialogTitle>

            <Divider />
            <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                <Box sx={{ width: '500px' }}>
                    <Autocomplete
                        sx={{ width: '500px' }}
                        disablePortal
                        id="widget-1"
                        options={availableMetrics}
                        getOptionLabel={(option) =>
                            typeof option === 'string' ? option : option?.metricName || ''
                        }
                        value={
                            typeof widgetOne === 'string'
                                ? widgetOne
                                : widgetOne?.metricName || ''
                        }
                        onChange={(event, newValue) =>
                            setWidgetOne(
                                typeof newValue === 'string'
                                    ? newValue
                                    : newValue?.metricName || ''
                            )
                        }
                        renderInput={(params) => <TextField {...params} label="Widget 1" />}
                    />
                    <Typography
                        sx={{
                            fontSize: '0.7rem',
                            textAlign: 'left',
                            color: '#14213d',
                            mt: 0.5, // Adds a small margin-top
                        }}
                    >
                        Define a Metric to be included in this widget.
                    </Typography>
                </Box>

                <Box sx={{ width: '500px' }}>
                    <Autocomplete
                        sx={{ width: '500px' }}
                        disablePortal
                        id="widget-2"
                        options={availableMetrics}
                        getOptionLabel={(option) =>
                            typeof option === 'string' ? option : option?.metricName || ''
                        }
                        value={
                            typeof widgetTwo === 'string'
                                ? widgetTwo
                                : widgetTwo?.metricName || ''
                        }
                        onChange={(event, newValue) =>
                            setWidgetTwo(
                                typeof newValue === 'string'
                                    ? newValue
                                    : newValue?.metricName || ''
                            )
                        }
                        renderInput={(params) => <TextField {...params} label="Widget 2" />}
                    />
                    <Typography
                        sx={{
                            fontSize: '0.7rem',
                            textAlign: 'left',
                            color: '#14213d',
                            mt: 0.5, // Adds a small margin-top
                        }}
                    >
                        Define a Metric to be included in this widget.
                    </Typography>
                </Box>

                <Box sx={{ width: '500px' }}>
                    <Autocomplete
                        sx={{ width: '500px' }}
                        disablePortal
                        id="widget-3"
                        options={availableMetrics}
                        getOptionLabel={(option) =>
                            typeof option === 'string' ? option : option?.metricName || ''
                        }
                        value={
                            typeof widgetThree === 'string'
                                ? widgetThree
                                : widgetThree?.metricName || ''
                        }
                        onChange={(event, newValue) =>
                            setWidgetThree(
                                typeof newValue === 'string'
                                    ? newValue
                                    : newValue?.metricName || ''
                            )
                        }
                        renderInput={(params) => <TextField {...params} label="Widget 3" />}
                    />
                    <Typography
                        sx={{
                            fontSize: '0.7rem',
                            textAlign: 'left',
                            color: '#14213d',
                            mt: 0.5, // Adds a small margin-top
                        }}
                    >
                        Define a Metric to be included in this widget.
                    </Typography>
                </Box>

                <Box sx={{ width: '500px' }}>
                    <Autocomplete
                        sx={{ width: '500px' }}
                        disablePortal
                        id="widget-3"
                        options={availableMetrics}
                        getOptionLabel={(option) =>
                            typeof option === 'string' ? option : option?.metricName || ''
                        }
                        value={
                            typeof widgetFour === 'string'
                                ? widgetFour
                                : widgetFour?.metricName || ''
                        }
                        onChange={(event, newValue) =>
                            setWidgetFour(
                                typeof newValue === 'string'
                                    ? newValue
                                    : newValue?.metricName || ''
                            )
                        }
                        renderInput={(params) => <TextField {...params} label="Widget 4" />}
                    />
                    <Typography
                        sx={{
                            fontSize: '0.7rem',
                            textAlign: 'left',
                            color: '#14213d',
                            mt: 0.5, // Adds a small margin-top
                        }}
                    >
                        Define a Metric to be included in this widget.
                    </Typography>
                </Box>

                <Box sx={{ width: '500px' }}>
                    <Autocomplete
                        sx={{ width: '500px' }}
                        disablePortal
                        id="trend-analysis-graph"
                        options={availableMetrics}
                        getOptionLabel={(option) =>
                            typeof option === 'string' ? option : option?.metricName || ''
                        }

                        value={
                            typeof trendAnalysisGraph === 'string'
                                ? trendAnalysisGraph
                                : trendAnalysisGraph?.metricName || ''
                        }
                        onChange={(event, newValue) =>
                            setTrendAnalysisGraph(
                                typeof newValue === 'string'
                                    ? newValue
                                    : newValue?.metricName || ''
                            )
                        }
                        renderInput={(params) => <TextField {...params} label="Trend Analysis Graph" />}
                    />

                    <Typography
                        sx={{
                            fontSize: '0.7rem',
                            textAlign: 'left',
                            color: '#14213d',
                            mt: 0.5, // Adds a small margin-top
                        }}
                    >
                        Define a Metric to be included in this widget.
                    </Typography>
                </Box>


                <Box sx={{ width: '500px' }}>
                    <Autocomplete
                        multiple
                        id="activity-graph"
                        value={activityGraphMetrics}
                        onChange={(event, newValue) => {
                            setActivityGraphMetrics([
                                ...fixedMetrics,
                                ...newValue.filter((option) => !fixedMetrics.includes(option)),
                            ]);
                        }}
                        options={availableMetrics}
                        getOptionLabel={(option) => option.metricName}
                        isOptionEqualToValue={(option, value) => option.metricName === value.metricName}
                        renderTags={(tagValue, getTagProps) =>
                            tagValue.map((option, index) => {
                                const { key, ...tagProps } = getTagProps({ index });
                                return (
                                    <Chip
                                        key={key}
                                        label={option.metricName}
                                        {...tagProps}
                                        disabled={fixedMetrics.includes(option)}
                                    />
                                );
                            })
                        }
                        style={{ width: 500 }}
                        renderInput={(params) => (
                            <TextField {...params} label="Metrics" placeholder="Select Metrics"
                                error={isMetricssError}
                                helperText={isMetricssError ? errorMessage : ''} />

                        )}
                    />

                    <Typography
                        sx={{
                            fontSize: '0.7rem',
                            textAlign: 'left',
                            color: '#14213d',
                            mt: 0.5, // Adds a small margin-top
                        }}
                    >
                        Define Metric(s) to be included in month over month activity graph.
                    </Typography>
                </Box>

            </DialogContent>
            <DialogActions sx={{ justifyContent: "center" }}>
                <Tooltip title='Save'>
                    <Button
                        onClick={handleSaveDashboardConfiguration}
                        sx={{
                            bgcolor: '#14213d',
                            color: 'white',
                            '&:hover': {
                                color: '#E6E6EF', // Prevent text color from changing on hover
                            },
                        }}
                    >
                        Save
                    </Button>
                </Tooltip>
            </DialogActions>

            <Divider />
            <div>
                {showSuccessMessage && <SuccessAlert title={'Data saved successfully.'} message={successMessage} onClose={() => setOpen(false)} />}
                {showErrorMessage && <ErrorAlert title={'Error!'} message={errorMessage} onClose={() => setOpen(false)} />}
            </div>
        </Dialog>
    );
};

export default AddDashboardConfiguration;