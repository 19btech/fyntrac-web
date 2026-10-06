"use client";

import React from 'react';
import { alpha, useTheme } from '@mui/material/styles';
import {
  Box,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Slide,
  Tooltip,
  Typography,
} from '@mui/material';
import HighlightOffOutlinedIcon from '@mui/icons-material/HighlightOffOutlined';

const FONT = '"Inter", "Helvetica Neue", Arial, sans-serif';

const SlideUp = React.forwardRef(function SlideUp(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

/**
 * Report Explorer modal in the app's standard dialog style (see component/add-attribute.jsx):
 * gradient header with logo, type chip and title; tinted body; bordered footer.
 */
export default function ExplorerDialog({ open, onClose, kind, kindIcon, title, maxWidth = 'sm', actions, children }) {
  const theme = useTheme();
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={maxWidth}
      fullWidth
      slots={{ transition: SlideUp }}
      slotProps={{
        paper: {
          sx: {
            borderRadius: 4,
            boxShadow: '0 32px 64px rgba(15,23,42,0.18)',
            overflow: 'hidden',
            border: '1px solid',
            borderColor: 'divider',
            fontFamily: FONT,
          },
        },
      }}
    >
      <DialogTitle component="div" sx={{ p: 0, flexShrink: 0 }}>
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
            <Box component="img" src="/fyntrac.png" alt="Fyntrac" sx={{ width: 72, height: 'auto' }} />
            <Box>
              <Chip
                icon={kindIcon}
                label={kind}
                size="small"
                sx={{
                  height: 20,
                  mb: 0.5,
                  fontSize: '0.6rem',
                  fontWeight: 700,
                  letterSpacing: 0.8,
                  textTransform: 'uppercase',
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  color: theme.palette.primary.main,
                  borderRadius: 1,
                  '& .MuiChip-icon': { fontSize: '12px', color: 'inherit' },
                }}
              />
              <Typography variant="h6" component="h2" fontWeight={700} sx={{ lineHeight: 1.2, color: 'text.primary' }}>
                {title}
              </Typography>
            </Box>
          </Box>
          <Tooltip title="Close" placement="left">
            <IconButton
              onClick={onClose}
              size="small"
              aria-label="Close"
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

      <DialogContent sx={{ p: 0, bgcolor: alpha(theme.palette.grey[500], 0.03) }}>
        <Box sx={{ px: 3.5, pt: 3, pb: 2.5 }}>{children}</Box>
      </DialogContent>

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
        {actions}
      </DialogActions>
    </Dialog>
  );
}

// Primary footer button, identical to the app's dialog save buttons.
export const primaryActionSx = {
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
};

export const secondaryActionSx = {
  borderRadius: 2,
  textTransform: 'none',
  fontWeight: 600,
  color: 'text.secondary',
};
