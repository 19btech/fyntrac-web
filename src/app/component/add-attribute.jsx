import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Switch, Autocomplete,
  IconButton, Typography, Tooltip, Box, Stack,
  Chip, Alert, Paper, Slide, Collapse,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import HighlightOffOutlinedIcon from '@mui/icons-material/HighlightOffOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import { dataloaderApi } from '../services/api-client';
import { useTenant } from "../tenant-context";

const AddAttributeDialog = ({ open, onClose, editData }) => {
  const { tenant } = useTenant();
  const theme = useTheme();
  const [userField, setUserField] = useState('');
  const [attributeName, setAttributeName] = useState('');
  const [isReclassable, setIsReclassable] = useState(false);
  const [isVersionable, setIsVersionable] = useState(false);
  const [dataType, setDataType] = useState('String');
  const [isNullable, setIsNullable] = useState(false);
  const [id, setId] = useState(null);
  const [errorSnackbar, setErrorSnackbar] = useState({ open: false, message: '' });
  const dataTypes = [{ label: 'STRING' },
  { label: 'NUMBER' },
  { label: 'DATE' },
  { label: 'BOOLEAN' }];

  const defaultDataTypes = ['STRING',
    'NUMBER',
    'DATE',
    'BOOLEAN'];



  React.useEffect(() => {
    if (!open) return;
    if (editData) {
      setAttributeName(editData.attributeName || '');
      setUserField(editData.userField || '');
      setDataType(editData.dataType || 'STRING');
      setIsReclassable(editData.isReclassable === 1 ? true : false);
      setIsVersionable(editData.isVersionable === 1 ? true : false);
      setIsNullable(editData.isNullable === 1 ? true : false);
      setId(editData.id);
    } else {
      setAttributeName('');
      setIsReclassable(false);
      setIsVersionable(false);
      setIsNullable(false);
      setDataType('STRING');
      setId(null);
      setUserField('');
      // Auto-compute next USERFIELD value from existing attributes
      dataloaderApi.get('/attribute/get/all')
        .then(res => {
          const attrs = res.data || [];
          const maxNum = attrs.reduce((max, attr) => {
            const match = attr.userField?.match(/^USERFIELD(\d+)$/i);
            return match ? Math.max(max, parseInt(match[1], 10)) : max;
          }, 0);
          setUserField(`USERFIELD${String(maxNum + 1).padStart(2, '0')}`);
        })
        .catch(() => setUserField('USERFIELD01'));
    }
    setErrorSnackbar({ open: false, message: '' });
  }, [editData, open]);

  React.useEffect(() => {
    if (!errorSnackbar.open) return;
    const t = setTimeout(() => setErrorSnackbar(s => ({ ...s, open: false })), 5000);
    return () => clearTimeout(t);
  }, [errorSnackbar.open]);

  const handleAddAttribute = async () => {
    console.log('Tenant...', tenant);
    if (isReclassable && !isVersionable) {
      setErrorSnackbar({ open: true, message: 'Reclassable requires Versionable to be enabled.' });
      return;
    }
    try {
      const response = await dataloaderApi.post('/attribute/add', {
        userField: userField.trim(),
        attributeName: attributeName.trim(),
        dataType: dataType,
        isReclassable: isReclassable ? 1 : 0,
        isVersionable: isVersionable ? 1 : 0,
        isNullable: isNullable ? 1 : 0,
        id: id
      });
      onClose(true);
    } catch (error) {
      console.error('Attribute save failed', error);
      const raw = error.response?.data?.message || error.response?.data || error.message || 'Unable to save attribute config.';
      const detailMessage = String(raw).replace(/^\[ERR_[A-Z0-9_]+\]\s*/, '');
      setErrorSnackbar({ open: true, message: detailMessage });
    }
  };


  const handleClose = () => {
    onClose(false);
  };

  const isEditMode = !!editData;
  // Front-end validation: no spaces anywhere, only alphanumeric + underscores
  const nameRegex = /^[a-zA-Z0-9_]+$/;
  const isNameEmpty = !attributeName.trim();
  const hasAnySpace = attributeName.includes(' ');
  const isNameFormatValid = isNameEmpty || nameRegex.test(attributeName);
  const canSave = userField.trim() && !isNameEmpty && dataType && isNameFormatValid;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      TransitionComponent={Slide}
      TransitionProps={{ direction: 'up' }}
      PaperProps={{
        sx: {
          borderRadius: 4,
          boxShadow: '0 32px 64px rgba(15,23,42,0.18)',
          overflow: 'hidden',
          border: '1px solid',
          borderColor: 'divider',
          fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif',
          '& .MuiTypography-root, & .MuiInputBase-root, & .MuiButton-root, & .MuiChip-root, & .MuiFormHelperText-root': {
            fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif',
          },
        },
      }}
    >
      {/* ── HEADER ── */}
      <DialogTitle sx={{ p: 0, flexShrink: 0 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            px: 3,
            pt: 3,
            pb: 2.5,
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <img src="fyntrac.png" alt="Fyntrac" style={{ width: 72, height: 'auto' }} />
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <Chip
                  icon={<SettingsOutlinedIcon sx={{ fontSize: '12px !important' }} />}
                  label="Attribute"
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: '0.6rem',
                    fontWeight: 700,
                    letterSpacing: 0.8,
                    textTransform: 'uppercase',
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    color: theme.palette.primary.main,
                    borderRadius: 1,
                  }}
                />
                {isEditMode && (
                  <Chip
                    label="Edit Mode"
                    size="small"
                    sx={{
                      height: 20,
                      fontSize: '0.6rem',
                      fontWeight: 700,
                      letterSpacing: 0.8,
                      textTransform: 'uppercase',
                      bgcolor: alpha(theme.palette.warning.main, 0.1),
                      color: theme.palette.warning.dark,
                      borderRadius: 1,
                    }}
                  />
                )}
              </Box>
              <Typography variant="h6" fontWeight={700} sx={{ lineHeight: 1.2, color: 'text.primary' }}>
                {isEditMode ? 'Edit' : 'Add'} Attribute
              </Typography>
            </Box>
          </Box>
          <Tooltip title="Close" placement="left">
            <IconButton
              onClick={handleClose}
              size="small"
              sx={{
                color: 'text.secondary',
                bgcolor: 'action.hover',
                borderRadius: 2,
                '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.12), color: 'error.main' },
              }}
            >
              <HighlightOffOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </DialogTitle>

      {/* ── Inline error alert ── */}
      <Collapse in={errorSnackbar.open}>
        <Box sx={{ px: 3, pt: 2 }}>
          <Alert
            severity="error"
            variant="standard"
            onClose={() => setErrorSnackbar(s => ({ ...s, open: false }))}
            sx={{
              borderRadius: 2, fontSize: '0.85rem', fontWeight: 600,
              bgcolor: 'rgba(220,38,38,0.10)',
              border: '1px solid rgba(220,38,38,0.3)',
              color: '#dc2626',
              '& .MuiAlert-icon': { color: '#dc2626' },
            }}
          >
            {errorSnackbar.message}
          </Alert>
        </Box>
      </Collapse>

      {/* ── BODY ── */}
      <DialogContent sx={{ p: 0, bgcolor: alpha(theme.palette.grey[500], 0.03) }}>
        <Box sx={{ px: 3.5, pt: 3, pb: 2.5, display: 'flex', flexDirection: 'column', gap: 3 }}>

          {/* Identity fields */}
          <Stack spacing={2}>
            <TextField
              label="User Field"
              fullWidth
              required
              size="small"
              disabled
              value={userField}
              inputProps={{ style: { fontSize: '0.9rem', fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif' } }}
              InputLabelProps={{ style: { fontSize: '0.9rem', fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif' } }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5, bgcolor: 'background.paper' } }}
            />
            <TextField
              label="Attribute Name"
              fullWidth
              required
              size="small"
              value={attributeName}
              onChange={(e) => setAttributeName(e.target.value)}
              error={!isNameFormatValid}
              helperText={!isNameFormatValid ? (hasAnySpace ? "Leading or trailing spaces are not allowed." : "Only alphanumeric characters and underscores are permitted.") : ""}
              inputProps={{ style: { fontSize: '0.9rem', fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif' } }}
              InputLabelProps={{ style: { fontSize: '0.9rem', fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif' } }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5, bgcolor: 'background.paper' } }}
            />
            <Autocomplete
              fullWidth
              disablePortal
              options={defaultDataTypes}
              value={dataType}
              getOptionLabel={(option) => option}
              onChange={(event, newValue) => setDataType(newValue)}
              componentsProps={{
                paper: {
                  sx: {
                    '& .MuiAutocomplete-option': {
                      fontSize: '0.9rem',
                      fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif',
                      py: 0.5,
                    },
                  },
                },
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Data Type"
                  required
                  size="small"
                  inputProps={{ ...params.inputProps, style: { ...params.inputProps?.style, fontSize: '0.9rem', fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif' } }}
                  InputLabelProps={{ style: { fontSize: '0.9rem', fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif' } }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5, bgcolor: 'background.paper' } }}
                />
              )}
            />
          </Stack>

          {/* Toggle flags */}
          <Paper
            elevation={0}
            sx={{
              borderRadius: 3,
              border: '1px solid',
              borderColor: alpha(theme.palette.divider, 0.7),
              bgcolor: 'background.paper',
              overflow: 'hidden',
            }}
          >
            <Box
              sx={{
                px: 2.5,
                py: 1.25,
                borderBottom: '1px solid',
                borderColor: alpha(theme.palette.divider, 0.6),
                bgcolor: alpha(theme.palette.primary.main, 0.025),
              }}
            >
              <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.7, color: 'text.secondary', fontSize: '0.67rem' }}>
                Settings
              </Typography>
            </Box>
            <Stack sx={{ px: 2.5, py: 1.5 }} divider={<Box sx={{ borderBottom: '1px solid', borderColor: alpha(theme.palette.divider, 0.5) }} />}>
              {[
                { label: 'Reclassable', desc: 'Allows this attribute to be reclassified. Requires Versionable to also be enabled.', value: isReclassable, onChange: setIsReclassable },
                { label: 'Versionable', desc: 'Tracks historical versions of this attribute.', value: isVersionable, onChange: setIsVersionable },
                { label: 'Nullable', desc: 'Permits null values for this attribute.', value: isNullable, onChange: setIsNullable },
              ].map(({ label, desc, value, onChange }) => (
                <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.25 }}>
                  <Box>
                    <Typography variant="body2" fontWeight={600} sx={{ lineHeight: 1.3 }}>{label}</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.72rem' }}>{desc}</Typography>
                  </Box>
                  <Switch
                    size="small"
                    checked={value}
                    onChange={(e) => onChange(e.target.checked)}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': { color: '#14213d' },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#14213d' },
                    }}
                  />
                </Box>
              ))}
            </Stack>
          </Paper>
        </Box>
      </DialogContent>

      {/* ── FOOTER ── */}
      <DialogActions
        sx={{
          px: 3.5,
          py: 2,
          borderTop: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
          justifyContent: 'flex-end',
          gap: 1.25,
        }}
      >
        <Button
          onClick={handleAddAttribute}
          variant="contained"
          disabled={!canSave}
          sx={{
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 700,
            minWidth: 130,
            px: 3,
            background: '#14213d',
            color: '#fff',
            boxShadow: '0 6px 16px rgba(20,33,61,0.35)',
            '&:hover': { background: '#0d1628', boxShadow: '0 8px 22px rgba(20,33,61,0.45)' },
            '&.Mui-disabled': { background: 'rgba(20,33,61,0.35)', color: '#fff', boxShadow: 'none' },
          }}
        >
          {isEditMode ? 'Update Attribute' : 'Save Attribute'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddAttributeDialog;
