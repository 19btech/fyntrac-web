import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Autocomplete,
  IconButton, Typography, Tooltip, Box, Chip, Alert, Slide, Paper,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import HighlightOffOutlinedIcon from '@mui/icons-material/HighlightOffOutlined';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import { dataloaderApi } from '../services/api-client';
import { useTenant } from "../tenant-context";

const AddDashboardConfiguration = ({ open, onClose, editData }) => {
    const { tenant } = useTenant();
    const theme = useTheme();
    const [id, setId] = useState(null);
    const [widgetOne, setWidgetOne] = useState('');
    const [widgetTwo, setWidgetTwo] = useState('');
    const [widgetThree, setWidgetThree] = useState('');
    const [widgetFour, setWidgetFour] = useState('');
    const [trendAnalysisGraph, setTrendAnalysisGraph] = useState('');
    const [activityGraphMetrics, setActivityGraphMetrics] = useState([]);
    const [showSuccessMessage, setShowSuccessMessage] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [showErrorMessage, setShowErrorMessage] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [availableMetrics, setAvailableMetrics] = useState([]);
    const [isMetricssError, setIsMetricsError] = React.useState(false);
    const serviceGetMetricsURL = '/aggregation/get/metrics'


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

        dataloaderApi.get(serviceGetMetricsURL)
            .then(response => {
                console.log('Metrics:', response.data);
                setAvailableMetrics(response.data);
            })
            .catch(error => {
                // Handle error if needed
            });
    };


    const handleSaveDashboardConfiguration = async () => {
        const serviceURL = '/setting/dashboard-configuration/save';
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
            const response = await dataloaderApi.post(serviceURL, {
                widgetOneMetric: widgetOne,
                widgetTwoMetric: widgetTwo,
                widgetThreeMetric: widgetThree,
                widgetFourMetric: widgetFour,
                trendAnalysisGraphMetric: trendAnalysisGraph,
                activityGraphMetrics: metricNames,
                id: id
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

    const isEditMode = !!editData;
    const autocompleteFieldSx = {
      '& .MuiOutlinedInput-root': { borderRadius: 2.5, bgcolor: 'background.paper' },
    };
    const hintSx = { fontSize: '0.7rem', color: 'text.secondary', mt: 0.5 };

    const makeAutocompleteValue = (val) =>
      typeof val === 'string' ? val : val?.metricName || '';

    const makeMetricHandler = (setter) => (_, newValue) =>
      setter(typeof newValue === 'string' ? newValue : newValue?.metricName || '');

    return (
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        slots={{ transition: Slide }}
        slotProps={{ transition: { direction: 'up' } }}
        PaperProps={{
          sx: {
            borderRadius: 4,
            boxShadow: '0 32px 64px rgba(15,23,42,0.18)',
            overflow: 'hidden',
            border: '1px solid',
            borderColor: 'divider',
            fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif',
            '& .MuiTypography-root, & .MuiInputBase-root, & .MuiButton-root, & .MuiChip-root, & .MuiFormHelperText-root, & *': {
              fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif',
            },
          },
        }}
      >
        {/* ── Header ── */}
        <DialogTitle sx={{ p: 0, flexShrink: 0 }}>
          <Box sx={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            px: 3, pt: 3, pb: 2.5,
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
            borderBottom: '1px solid', borderColor: 'divider',
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <img src="fyntrac.png" alt="Fyntrac" style={{ width: 72, height: 'auto' }} />
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <Chip
                    icon={<DashboardOutlinedIcon sx={{ fontSize: '12px !important' }} />}
                    label="Dashboard"
                    size="small"
                    sx={{
                      height: 20, fontSize: '0.6rem', fontWeight: 700,
                      letterSpacing: 0.8, textTransform: 'uppercase',
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      color: theme.palette.primary.main, borderRadius: 1,
                    }}
                  />
                  {isEditMode && (
                    <Chip label="Edit Mode" size="small" sx={{
                      height: 20, fontSize: '0.6rem', fontWeight: 700,
                      letterSpacing: 0.8, textTransform: 'uppercase',
                      bgcolor: alpha(theme.palette.warning.main, 0.1),
                      color: theme.palette.warning.dark, borderRadius: 1,
                    }} />
                  )}
                </Box>
                <Typography variant="h6" fontWeight={700} sx={{ lineHeight: 1.2, color: 'text.primary' }}>
                  {isEditMode ? 'Edit' : 'Configure'} Dashboard
                </Typography>
              </Box>
            </Box>
            <Tooltip title="Close" placement="left">
              <IconButton onClick={handleClose} size="small" sx={{
                color: 'text.secondary', bgcolor: 'action.hover', borderRadius: 2,
                '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.12), color: 'error.main' },
              }}>
                <HighlightOffOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </DialogTitle>

        {/* ── Body ── */}
        <DialogContent sx={{ p: 0, bgcolor: alpha(theme.palette.grey[500], 0.03) }}>
          <Box sx={{ px: 3.5, pt: 3, pb: 2.5, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {showSuccessMessage && (
              <Alert severity="success" variant="outlined" sx={{ borderRadius: 2.5, py: 0.5, fontSize: '0.8rem', bgcolor: 'rgba(22,163,74,0.08)', borderColor: 'rgba(22,163,74,0.35)' }}>
                {successMessage || 'Dashboard configuration saved successfully.'}
              </Alert>
            )}
            {showErrorMessage && (
              <Alert severity="error" variant="outlined" sx={{ borderRadius: 2.5, py: 0.5, fontSize: '0.8rem', bgcolor: 'rgba(220,38,38,0.08)', borderColor: 'rgba(220,38,38,0.35)' }}>
                {String(errorMessage) || 'An error occurred.'}
              </Alert>
            )}

            {/* Metric widgets */}
            <Paper elevation={0} sx={{
              borderRadius: 3, border: '1px solid', borderColor: alpha(theme.palette.divider, 0.7),
              bgcolor: 'background.paper', overflow: 'hidden',
            }}>
              <Box sx={{
                px: 2.5, py: 1.25,
                borderBottom: '1px solid', borderColor: alpha(theme.palette.divider, 0.6),
                bgcolor: alpha(theme.palette.primary.main, 0.025),
              }}>
                <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.7, color: 'text.secondary', fontSize: '0.67rem' }}>
                  Metric Widgets
                </Typography>
              </Box>
              <Box sx={{ px: 2.5, py: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                {[
                  { id: 'widget-1', label: 'Widget 1', value: widgetOne, setter: setWidgetOne },
                  { id: 'widget-2', label: 'Widget 2', value: widgetTwo, setter: setWidgetTwo },
                  { id: 'widget-3', label: 'Widget 3', value: widgetThree, setter: setWidgetThree },
                  { id: 'widget-4', label: 'Widget 4', value: widgetFour, setter: setWidgetFour },
                ].map(({ id, label, value, setter }) => (
                  <Box key={id}>
                    <Autocomplete
                      fullWidth
                      disablePortal
                      id={id}
                      options={availableMetrics}
                      getOptionLabel={(option) => typeof option === 'string' ? option : option?.metricName || ''}
                      value={makeAutocompleteValue(value)}
                      onChange={makeMetricHandler(setter)}
                      size="small"
                      renderInput={(params) => (
                        <TextField {...params} label={label} sx={autocompleteFieldSx}
                          inputProps={{ ...params.inputProps, style: { fontSize: '0.9rem', fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif' } }}
                          InputLabelProps={{ style: { fontSize: '0.9rem', fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif' } }}
                        />
                      )}
                    />
                    <Typography sx={hintSx}>Define a metric to display in this widget.</Typography>
                  </Box>
                ))}
              </Box>
            </Paper>

            {/* Trend Analysis Graph */}
            <Paper elevation={0} sx={{
              borderRadius: 3, border: '1px solid', borderColor: alpha(theme.palette.divider, 0.7),
              bgcolor: 'background.paper', overflow: 'hidden',
            }}>
              <Box sx={{
                px: 2.5, py: 1.25,
                borderBottom: '1px solid', borderColor: alpha(theme.palette.divider, 0.6),
                bgcolor: alpha(theme.palette.primary.main, 0.025),
              }}>
                <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.7, color: 'text.secondary', fontSize: '0.67rem' }}>
                  Trend Analysis Graph
                </Typography>
              </Box>
              <Box sx={{ px: 2.5, py: 2 }}>
                <Autocomplete
                  fullWidth
                  disablePortal
                  id="trend-analysis-graph"
                  options={availableMetrics}
                  getOptionLabel={(option) => typeof option === 'string' ? option : option?.metricName || ''}
                  value={makeAutocompleteValue(trendAnalysisGraph)}
                  onChange={makeMetricHandler(setTrendAnalysisGraph)}
                  size="small"
                  renderInput={(params) => (
                    <TextField {...params} label="Trend Analysis Graph" sx={autocompleteFieldSx}
                      inputProps={{ ...params.inputProps, style: { fontSize: '0.9rem', fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif' } }}
                      InputLabelProps={{ style: { fontSize: '0.9rem', fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif' } }}
                    />
                  )}
                />
                <Typography sx={hintSx}>Define a metric to display in the trend analysis graph.</Typography>
              </Box>
            </Paper>

            {/* Activity Graph Metrics */}
            <Paper elevation={0} sx={{
              borderRadius: 3, border: '1px solid', borderColor: alpha(theme.palette.divider, 0.7),
              bgcolor: 'background.paper', overflow: 'hidden',
            }}>
              <Box sx={{
                px: 2.5, py: 1.25,
                borderBottom: '1px solid', borderColor: alpha(theme.palette.divider, 0.6),
                bgcolor: alpha(theme.palette.primary.main, 0.025),
              }}>
                <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.7, color: 'text.secondary', fontSize: '0.67rem' }}>
                  Activity Graph Metrics
                </Typography>
              </Box>
              <Box sx={{ px: 2.5, py: 2 }}>
                <Autocomplete
                  multiple
                  fullWidth
                  id="activity-graph"
                  value={activityGraphMetrics}
                  onChange={(_, newValue) => setActivityGraphMetrics(newValue)}
                  options={availableMetrics}
                  getOptionLabel={(option) => option.metricName}
                  isOptionEqualToValue={(option, value) => option.metricName === value.metricName}
                  size="small"
                  renderTags={(tagValue, getTagProps) =>
                    tagValue.map((option, index) => {
                      const { key, ...tagProps } = getTagProps({ index });
                      return (
                        <Chip
                          key={key}
                          label={option.metricName}
                          {...tagProps}
                          size="small"
                          sx={{
                            fontSize: '0.78rem', fontWeight: 600,
                            fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif', height: 24, borderRadius: 1.5,
                          }}
                        />
                      );
                    })
                  }
                  renderInput={(params) => (
                    <TextField {...params} label="Metrics" placeholder="Select metrics..."
                      error={isMetricssError}
                      helperText={isMetricssError ? errorMessage : ''}
                      sx={autocompleteFieldSx}
                      inputProps={{ ...params.inputProps, style: { fontSize: '0.9rem', fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif' } }}
                      InputLabelProps={{ style: { fontSize: '0.9rem', fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif' } }}
                    />
                  )}
                />
                <Typography sx={hintSx}>Define metrics to include in the month-over-month activity graph.</Typography>
              </Box>
            </Paper>
          </Box>
        </DialogContent>

        {/* ── Footer ── */}
        <DialogActions sx={{
          px: 3.5, py: 2, borderTop: '1px solid', borderColor: 'divider',
          bgcolor: 'background.paper', justifyContent: 'flex-end', gap: 1.25,
        }}>
          <Button onClick={handleClose} variant="text" sx={{
            borderRadius: 2, textTransform: 'none', fontWeight: 600,
            color: 'text.secondary', px: 2.5, '&:hover': { bgcolor: 'action.hover' },
          }}>
            Cancel
          </Button>
          <Button onClick={handleSaveDashboardConfiguration} variant="contained" sx={{
            borderRadius: 2, textTransform: 'none', fontWeight: 700, minWidth: 150, px: 3,
            background: '#14213d', color: '#fff', boxShadow: '0 6px 16px rgba(20,33,61,0.35)',
            '&:hover': { background: '#0d1628', boxShadow: '0 8px 22px rgba(20,33,61,0.45)' },
          }}>
            {isEditMode ? 'Update Dashboard' : 'Save Dashboard'}
          </Button>
        </DialogActions>
      </Dialog>
    );
};

export default AddDashboardConfiguration;