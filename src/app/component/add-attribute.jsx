import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Switch,
  IconButton, Typography, Tooltip, Box, Stack,
  Chip, Alert, Paper, Slide, Collapse,
  Popover, List, ListItemButton, ListItemText, InputAdornment,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import HighlightOffOutlinedIcon from '@mui/icons-material/HighlightOffOutlined';
import SearchIcon from '@mui/icons-material/Search';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import { dataloaderApi } from '../services/api-client';
import { useTenant } from "../tenant-context";
import { apiErrorMessage, clearAttributeMetadataCache, flagOn, normalizeDataType } from './rules-shared';

const AddAttributeDialog = ({ open, onClose, editData }) => {
  const { tenant } = useTenant();
  const theme = useTheme();
  const [userField, setUserField] = useState('');
  const [attributeName, setAttributeName] = useState('');
  const [isReclassable, setIsReclassable] = useState(false);
  const [isVersionable, setIsVersionable] = useState(false);
  const [dataType, setDataType] = useState('STRING');
  const [isNullable, setIsNullable] = useState(false);
  const [id, setId] = useState(null);
  const [errorSnackbar, setErrorSnackbar] = useState({ open: false, message: '' });
  const [dataTypePickerAnchor, setDataTypePickerAnchor] = useState(null);
  const [dataTypePickerSearch, setDataTypePickerSearch] = useState('');
  const [saving, setSaving] = useState(false);
  // The next USERFIELD couldn't be worked out: saving would risk reusing one that is taken.
  const [userFieldError, setUserFieldError] = useState('');

  const defaultDataTypes = ['STRING', 'NUMBER', 'DATE', 'BOOLEAN'];
  const filteredDataTypes = defaultDataTypes.filter(dt =>
    dt.toLowerCase().includes(dataTypePickerSearch.toLowerCase())
  );



  React.useEffect(() => {
    if (!open) return;
    if (editData) {
      setAttributeName(editData.attributeName || '');
      setUserField(editData.userField || '');
      setDataType(normalizeDataType(editData.dataType));
      setIsReclassable(flagOn(editData.isReclassable));
      setIsVersionable(flagOn(editData.isVersionable));
      setIsNullable(flagOn(editData.isNullable));
      setId(editData.id);
      setUserFieldError('');
    } else {
      setAttributeName('');
      setIsReclassable(false);
      setIsVersionable(false);
      setIsNullable(false);
      setDataType('STRING');
      setId(null);
      setUserField('');
      setUserFieldError('');
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
        .catch((error) => setUserFieldError(apiErrorMessage(error, 'The existing attributes could not be loaded, so the next user field is unknown.') + ' Close and try again.'));
    }
    setErrorSnackbar({ open: false, message: '' });
  }, [editData, open]);

  React.useEffect(() => {
    if (!errorSnackbar.open) return;
    const t = setTimeout(() => setErrorSnackbar(s => ({ ...s, open: false })), 5000);
    return () => clearTimeout(t);
  }, [errorSnackbar.open]);

  const handleAddAttribute = async () => {
    if (saving) return;
    if (isReclassable && !isVersionable) {
      setErrorSnackbar({ open: true, message: 'Reclassable requires Versionable to be enabled.' });
      return;
    }
    const oldName = editData?.attributeName ?? null;
    const newName = attributeName.trim();
    const renamed = Boolean(editData) && oldName && oldName !== newName;
    setSaving(true);
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
      clearAttributeMetadataCache(tenant); // Chart of Accounts columns come from the attributes

      // #6: a rename moves the chart of accounts values stored under the old name.
      if (renamed) {
        try {
          const coa = await dataloaderApi.get('/chartofaccount/get/all');
          const updates = (coa.data || [])
            .filter(c => c.attributes && Object.prototype.hasOwnProperty.call(c.attributes, oldName))
            .map(c => {
              const { [oldName]: value, ...rest } = c.attributes;
              return dataloaderApi.post('/chartofaccount/add', {
                id: c.id,
                accountNumber: c.accountNumber,
                accountName: c.accountName,
                accountSubtype: c.accountSubtype,
                attributes: { ...rest, [newName]: value },
              });
            });
          await Promise.all(updates);
        } catch (cascadeErr) {
          console.error('Attribute rename cascade failed:', cascadeErr);
          setErrorSnackbar({ open: true, message: `Attribute saved, but chart of accounts values stored under "${oldName}" could not be moved to "${newName}". Please update them manually. Events using "${oldName}" also need updating.` });
          return; // stay open so the message is seen; closing refreshes the list
        }
      }
      onClose(true);
    } catch (error) {
      console.error('Attribute save failed', error);
      setErrorSnackbar({ open: true, message: apiErrorMessage(error, 'Unable to save attribute config.') });
    } finally {
      setSaving(false);
    }
  };


  const handleClose = () => {
    // After a save whose follow-up failed, closing still refreshes the list.
    onClose(Boolean(errorSnackbar.open && /^Attribute saved/.test(errorSnackbar.message)));
  };

  const isEditMode = !!editData;
  // Front-end validation: no spaces anywhere, only alphanumeric + underscores
  const nameRegex = /^[a-zA-Z0-9_]+$/;
  const isNameEmpty = !attributeName.trim();
  const hasAnySpace = attributeName.includes(' ');
  const isNameFormatValid = isNameEmpty || nameRegex.test(attributeName);
  const canSave = userField.trim() && !userFieldError && !isNameEmpty && dataType && isNameFormatValid && !saving;

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
          '& .MuiTypography-root, & .MuiInputBase-root, & .MuiButton-root, & .MuiChip-root, & .MuiFormHelperText-root': {
          fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif',
          },
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
              error={Boolean(userFieldError)}
              helperText={userFieldError || ''}
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
              helperText={!isNameFormatValid ? (hasAnySpace ? "Spaces are not allowed — use underscores instead." : "Only alphanumeric characters and underscores are permitted.") : (isEditMode && editData?.attributeName && attributeName.trim() !== editData.attributeName ? 'Renaming moves its chart of accounts values; events using the old name must be updated by hand.' : "")}
              inputProps={{ style: { fontSize: '0.9rem', fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif' } }}
              InputLabelProps={{ style: { fontSize: '0.9rem', fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif' } }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5, bgcolor: 'background.paper' } }}
            />
            <TextField
              fullWidth
              label="Data Type"
              required
              size="small"
              value={dataType}
              disabled={isEditMode}
              helperText={isEditMode ? 'The data type can’t be changed once the attribute exists.' : ''}
              onClick={(e) => { if (!isEditMode) { setDataTypePickerAnchor(e.currentTarget); setDataTypePickerSearch(''); } }}
              inputProps={{ readOnly: true, style: { cursor: isEditMode ? 'default' : 'pointer', fontSize: '0.9rem', fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif' } }}
              InputLabelProps={{ style: { fontSize: '0.9rem', fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif' } }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5, bgcolor: 'background.paper' } }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" sx={{ color: 'text.disabled' }} />
                  </InputAdornment>
                ),
              }}
            />
            <Popover
              open={Boolean(dataTypePickerAnchor)}
              anchorEl={dataTypePickerAnchor}
              onClose={() => setDataTypePickerAnchor(null)}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
              transformOrigin={{ vertical: 'top', horizontal: 'left' }}
              slotProps={{
                paper: {
                  sx: {
                    mt: 0.75,
                    width: dataTypePickerAnchor?.offsetWidth,
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
                  placeholder="Search types..."
                  value={dataTypePickerSearch}
                  onChange={(e) => setDataTypePickerSearch(e.target.value)}
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
              <List dense disablePadding>
                {filteredDataTypes.length === 0 ? (
                  <ListItemButton disabled sx={{ justifyContent: 'center', py: 2.5 }}>
                    <Typography variant="caption" color="text.disabled">No types found.</Typography>
                  </ListItemButton>
                ) : filteredDataTypes.map((dt) => (
                  <ListItemButton
                    key={dt}
                    selected={dt === dataType}
                    onClick={() => { setDataType(dt); setDataTypePickerAnchor(null); }}
                    sx={{
                      py: 1, px: 2,
                      fontSize: '0.9rem',
                      fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif',
                      '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.06) },
                      '&.Mui-selected': { bgcolor: alpha(theme.palette.primary.main, 0.1) },
                    }}
                  >
                    <ListItemText
                      primary={dt}
                      primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: 500, fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif' }}
                    />
                  </ListItemButton>
                ))}
              </List>
            </Popover>
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
