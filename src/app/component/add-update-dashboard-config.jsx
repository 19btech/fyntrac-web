import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Autocomplete,
  IconButton, Typography, Tooltip, Box, Chip, Alert, Slide, Paper,
  Popover, List, ListItemButton, ListItemText, InputAdornment, Checkbox,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import HighlightOffOutlinedIcon from '@mui/icons-material/HighlightOffOutlined';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import SearchIcon from '@mui/icons-material/Search';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import CheckIcon from '@mui/icons-material/Check';
import { FixedSizeList } from 'react-window';
import { dataloaderApi } from '../services/api-client';
import { useTenant } from "../tenant-context";

const LISTBOX_ITEM_HEIGHT = 38;
const LISTBOX_MAX_VISIBLE = 9;

// Virtualized listbox — only renders visible rows regardless of option count
const VirtualizedListbox = React.forwardRef(function VirtualizedListbox({ children, ...other }, ref) {
  const items = React.Children.toArray(children);
  const height = Math.max(1, Math.min(items.length, LISTBOX_MAX_VISIBLE)) * LISTBOX_ITEM_HEIGHT;
  return (
    <Box ref={ref} {...other}>
      <FixedSizeList
        height={height}
        width="100%"
        itemSize={LISTBOX_ITEM_HEIGHT}
        itemCount={items.length}
        overscanCount={6}
      >
        {({ index, style }) => <div style={style}>{items[index]}</div>}
      </FixedSizeList>
    </Box>
  );
});

const formatMetricLabel = (name) =>
  (name || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

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
    const [isSaving, setIsSaving] = useState(false);
    const serviceGetMetricsURL = '/aggregation/get/metrics'

    // Shared metric picker popover
    const [pickerAnchor, setPickerAnchor] = useState(null);
    const [activeSlotSetter, setActiveSlotSetter] = useState(null);
    const [pickerSearch, setPickerSearch] = useState('');

    // Activity graph multi-select picker
    const [activityPickerAnchor, setActivityPickerAnchor] = useState(null);
    const [activityPickerSearch, setActivityPickerSearch] = useState('');

    const openPicker = (event, setter) => {
        setPickerAnchor(event.currentTarget);
        setActiveSlotSetter(() => setter);
        setPickerSearch('');
    };
    const closePicker = () => { setPickerAnchor(null); setActiveSlotSetter(null); };
    const selectMetric = (metricName) => { if (activeSlotSetter) activeSlotSetter(metricName); closePicker(); };

    const filteredPickerMetrics = availableMetrics.filter(m =>
        m.metricName.toLowerCase().includes(pickerSearch.toLowerCase())
    );


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
        if (isSaving) return;
        setIsSaving(true);
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
            setSuccessMessage('Dashboard configuration saved successfully.');
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

            setErrorMessage('Failed to save dashboard configuration.');
            setShowErrorMessage(true);
        } finally {
            setIsSaving(false);
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


    return (
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        slots={{ transition: Slide }}
        slotProps={{
          transition: { direction: 'up' },
          paper: {
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
              <Box sx={{ px: 2.5, py: 2 }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
                  {[
                    { label: 'Widget 1', badge: 'W1', value: widgetOne, setter: setWidgetOne },
                    { label: 'Widget 2', badge: 'W2', value: widgetTwo, setter: setWidgetTwo },
                    { label: 'Widget 3', badge: 'W3', value: widgetThree, setter: setWidgetThree },
                    { label: 'Widget 4', badge: 'W4', value: widgetFour, setter: setWidgetFour },
                  ].map(({ label, badge, value, setter }) => (
                    <Box
                      key={label}
                      onClick={(e) => openPicker(e, setter)}
                      sx={{
                        position: 'relative',
                        border: '1.5px solid',
                        borderColor: value ? alpha(theme.palette.primary.main, 0.35) : alpha(theme.palette.divider, 0.8),
                        borderStyle: value ? 'solid' : 'dashed',
                        borderRadius: 2.5,
                        p: 1.75,
                        cursor: 'pointer',
                        bgcolor: value ? alpha(theme.palette.primary.main, 0.03) : 'background.paper',
                        transition: 'all 0.18s ease',
                        '&:hover': {
                          borderColor: theme.palette.primary.main,
                          bgcolor: alpha(theme.palette.primary.main, 0.05),
                          boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.08)}`,
                        },
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                        <Box sx={{
                          px: 0.9, py: 0.2, borderRadius: 1,
                          bgcolor: value ? alpha(theme.palette.primary.main, 0.12) : alpha(theme.palette.grey[400], 0.15),
                          color: value ? 'primary.main' : 'text.disabled',
                          fontSize: '0.65rem', fontWeight: 800, letterSpacing: 0.5,
                        }}>
                          {badge}
                        </Box>
                        {value && (
                          <IconButton
                            size="small"
                            onClick={(e) => { e.stopPropagation(); setter(''); }}
                            sx={{ p: 0.25, color: 'text.disabled', '&:hover': { color: 'error.main' } }}
                          >
                            <HighlightOffOutlinedIcon sx={{ fontSize: '0.95rem' }} />
                          </IconButton>
                        )}
                      </Box>
                      {value ? (
                        <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: 'text.primary', lineHeight: 1.3 }}>
                          {formatMetricLabel(value)}
                        </Typography>
                      ) : (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.disabled' }}>
                          <AddCircleOutlineIcon sx={{ fontSize: '0.9rem' }} />
                          <Typography sx={{ fontSize: '0.8rem' }}>Assign metric</Typography>
                        </Box>
                      )}
                      <Typography sx={{ fontSize: '0.67rem', color: 'text.disabled', mt: 0.75 }}>
                        {label}
                      </Typography>
                    </Box>
                  ))}
                </Box>
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
                <Box
                  onClick={(e) => openPicker(e, setTrendAnalysisGraph)}
                  sx={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    border: '1.5px solid',
                    borderColor: trendAnalysisGraph ? alpha(theme.palette.primary.main, 0.35) : alpha(theme.palette.divider, 0.8),
                    borderStyle: trendAnalysisGraph ? 'solid' : 'dashed',
                    borderRadius: 2.5,
                    px: 2, py: 1.5,
                    cursor: 'pointer',
                    bgcolor: trendAnalysisGraph ? alpha(theme.palette.primary.main, 0.03) : 'background.paper',
                    transition: 'all 0.18s ease',
                    '&:hover': {
                      borderColor: theme.palette.primary.main,
                      bgcolor: alpha(theme.palette.primary.main, 0.05),
                      boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.08)}`,
                    },
                  }}
                >
                  <Box>
                    {trendAnalysisGraph ? (
                      <Typography sx={{ fontSize: '0.88rem', fontWeight: 600, color: 'text.primary' }}>
                        {formatMetricLabel(trendAnalysisGraph)}
                      </Typography>
                    ) : (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.disabled' }}>
                        <AddCircleOutlineIcon sx={{ fontSize: '0.9rem' }} />
                        <Typography sx={{ fontSize: '0.82rem' }}>Assign metric</Typography>
                      </Box>
                    )}
                    <Typography sx={{ fontSize: '0.67rem', color: 'text.disabled', mt: 0.4 }}>Trend Analysis Graph</Typography>
                  </Box>
                  {trendAnalysisGraph && (
                    <IconButton
                      size="small"
                      onClick={(e) => { e.stopPropagation(); setTrendAnalysisGraph(''); }}
                      sx={{ color: 'text.disabled', '&:hover': { color: 'error.main' } }}
                    >
                      <HighlightOffOutlinedIcon fontSize="small" />
                    </IconButton>
                  )}
                </Box>
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
                {(() => {
                  const chipSx = { fontSize: '0.75rem', fontWeight: 600, height: 22, borderRadius: 1.5, fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif', bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', border: `1px solid ${alpha(theme.palette.primary.main, 0.25)}`, '& .MuiChip-deleteIcon': { fontSize: '14px', color: alpha(theme.palette.primary.main, 0.5), '&:hover': { color: 'primary.main' } } };
                  const filteredActivity = availableMetrics.filter(m => m.metricName.toLowerCase().includes(activityPickerSearch.toLowerCase()));
                  const cbUnchecked = <Box sx={{ width: 16, height: 16, borderRadius: '3px', border: '1.5px solid', borderColor: 'action.disabled', flexShrink: 0 }} />;
                  const cbChecked = <Box sx={{ width: 16, height: 16, borderRadius: '3px', bgcolor: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><CheckIcon sx={{ fontSize: 11, color: '#fff' }} /></Box>;
                  const cbIndet = <Box sx={{ width: 16, height: 16, borderRadius: '3px', bgcolor: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Box sx={{ width: 8, height: 1.5, bgcolor: '#fff', borderRadius: '1px' }} /></Box>;
                  const isSel = (m) => activityGraphMetrics.some(s => s.metricName === m.metricName);
                  return (
                    <>
                      <TextField
                        fullWidth size="small"
                        value=""
                        error={isMetricssError}
                        helperText={isMetricssError ? errorMessage : ''}
                        onClick={(e) => { setActivityPickerAnchor(e.currentTarget); setActivityPickerSearch(''); }}
                        inputProps={{ readOnly: true, style: { width: activityGraphMetrics.length > 0 ? 0 : undefined, padding: activityGraphMetrics.length > 0 ? 0 : undefined, cursor: 'pointer', fontSize: '0.875rem', fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif' } }}
                        InputLabelProps={{ shrink: true }}
                        InputProps={{
                          startAdornment: activityGraphMetrics.length > 0
                            ? activityGraphMetrics.map((m, i) => <Chip key={i} label={formatMetricLabel(m.metricName)} size="small" sx={chipSx} onDelete={(e) => { e.stopPropagation(); setActivityGraphMetrics(prev => prev.filter((_, idx) => idx !== i)); }} />)
                            : <InputAdornment position="start"><SearchIcon fontSize="small" sx={{ color: 'text.disabled' }} /></InputAdornment>,
                        }}
                        sx={{ ...autocompleteFieldSx, '& .MuiOutlinedInput-root': { ...autocompleteFieldSx?.['& .MuiOutlinedInput-root'], ...(activityGraphMetrics.length > 0 && { flexWrap: 'wrap', gap: 0.5, pt: 2.5, pb: 0.75 }) } }}
                        placeholder={activityGraphMetrics.length === 0 ? 'Search and select metrics…' : ''}
                      />
                      <Popover
                        open={Boolean(activityPickerAnchor)} anchorEl={activityPickerAnchor}
                        onClose={() => setActivityPickerAnchor(null)}
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                        slotProps={{ paper: { sx: { mt: 0.75, width: activityPickerAnchor?.offsetWidth, borderRadius: 3, boxShadow: '0 8px 32px rgba(15,23,42,0.16)', border: '1px solid', borderColor: 'divider', overflow: 'hidden' } } }}
                      >
                        <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: alpha(theme.palette.divider, 0.6) }}>
                          <TextField autoFocus fullWidth size="small" placeholder="Search metrics…"
                            value={activityPickerSearch} onChange={(e) => setActivityPickerSearch(e.target.value)}
                            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" sx={{ color: 'text.disabled' }} /></InputAdornment> }}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                          />
                        </Box>
                        <List dense disablePadding sx={{ maxHeight: 280, overflow: 'auto' }}>
                          {filteredActivity.length > 0 && (
                            <ListItemButton onClick={() => { const allSel = filteredActivity.every(m => isSel(m)); setActivityGraphMetrics(prev => allSel ? prev.filter(s => !filteredActivity.some(m => m.metricName === s.metricName)) : [...prev, ...filteredActivity.filter(m => !isSel(m))]); }} sx={{ py: 0.75, px: 1, borderBottom: '1px solid', borderColor: alpha(theme.palette.divider, 0.5), bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
                              <Checkbox checked={filteredActivity.length > 0 && filteredActivity.every(m => isSel(m))} indeterminate={filteredActivity.some(m => isSel(m)) && !filteredActivity.every(m => isSel(m))} size="small" disableRipple icon={cbUnchecked} checkedIcon={cbChecked} indeterminateIcon={cbIndet} sx={{ p: 0.5 }} />
                              <ListItemText primary="Select All" primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: 700 }} />
                            </ListItemButton>
                          )}
                          {filteredActivity.length === 0
                            ? <ListItemButton disabled sx={{ justifyContent: 'center', py: 2.5 }}><Typography variant="caption" color="text.disabled">No metrics found.</Typography></ListItemButton>
                            : filteredActivity.map(m => {
                                const sel = isSel(m);
                                return (
                                  <ListItemButton key={m.metricName} onClick={() => setActivityGraphMetrics(prev => sel ? prev.filter(s => s.metricName !== m.metricName) : [...prev, m])} sx={{ py: 0.5, px: 1, '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.06) } }}>
                                    <Checkbox checked={sel} size="small" disableRipple icon={cbUnchecked} checkedIcon={cbChecked} sx={{ p: 0.5 }} />
                                    <ListItemText primary={formatMetricLabel(m.metricName)} primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: sel ? 600 : 400, color: sel ? 'primary.main' : 'text.primary', fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif' }} />
                                  </ListItemButton>
                                );
                              })
                          }
                        </List>
                      </Popover>
                    </>
                  );
                })()}
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
          <Button onClick={handleSaveDashboardConfiguration} variant="contained" disabled={isSaving} sx={{
            borderRadius: 2, textTransform: 'none', fontWeight: 700, minWidth: 150, px: 3,
            background: '#14213d', color: '#fff', boxShadow: '0 6px 16px rgba(20,33,61,0.35)',
            '&:hover': { background: '#0d1628', boxShadow: '0 8px 22px rgba(20,33,61,0.45)' },
            '&.Mui-disabled': { background: 'rgba(20,33,61,0.4)', color: '#fff' },
          }}>
            {isSaving ? 'Saving…' : (isEditMode ? 'Update Dashboard' : 'Save Dashboard')}
          </Button>
        </DialogActions>

        {/* ── Shared metric picker popover ── */}
        <Popover
          open={Boolean(pickerAnchor)}
          anchorEl={pickerAnchor}
          onClose={closePicker}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          transformOrigin={{ vertical: 'top', horizontal: 'left' }}
          slotProps={{
            paper: {
              sx: {
                mt: 0.75,
                width: 300,
                borderRadius: 3,
                boxShadow: '0 8px 32px rgba(15,23,42,0.16)',
                border: '1px solid', borderColor: 'divider',
                overflow: 'hidden',
              },
            },
          }}
        >
          <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: alpha(theme.palette.divider, 0.6) }}>
            <TextField
              autoFocus
              fullWidth
              size="small"
              placeholder="Search metrics..."
              value={pickerSearch}
              onChange={(e) => setPickerSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" sx={{ color: 'text.disabled' }} />
                  </InputAdornment>
                ),
              }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          </Box>
          <List dense disablePadding sx={{ maxHeight: 280, overflow: 'auto' }}>
            {filteredPickerMetrics.length === 0 ? (
              <ListItemButton disabled sx={{ justifyContent: 'center', py: 2.5 }}>
                <Typography variant="caption" color="text.disabled">No metrics found.</Typography>
              </ListItemButton>
            ) : filteredPickerMetrics.map((m) => (
              <ListItemButton
                key={m.metricName}
                onClick={() => selectMetric(m.metricName)}
                sx={{
                  py: 1, px: 2,
                  '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.06) },
                }}
              >
                <ListItemText
                  primary={formatMetricLabel(m.metricName)}
                  primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: 500 }}
                />
              </ListItemButton>
            ))}
          </List>
        </Popover>
      </Dialog>
    );
};

export default AddDashboardConfiguration;
