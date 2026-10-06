"use client";

import React from 'react';
import { alpha } from '@mui/material/styles';
import { Box, Button, Card, CircularProgress, Typography } from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { refreshAccess, useAccess } from './access';
import { MODULES } from './permissions';

const labelOf = (key) => MODULES.flatMap((m) => m.permissions).find((p) => p.key === key)?.label ?? key;

/** Renders children only when the signed-in user's user type includes `permission`. */
export default function AccessGate({ permission, area, children }) {
  const { can, failed } = useAccess();
  const allowed = can(permission);
  if (allowed === undefined) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}>
        <CircularProgress size={28} />
      </Box>
    );
  }
  if (allowed) return children;
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 10, px: 2 }}>
      <Card variant="outlined" sx={{ maxWidth: 440, width: '100%', p: 4, textAlign: 'center', borderRadius: 3, '&:hover': { transform: 'none' } }}>
        <Box
          sx={(t) => ({
            width: 56, height: 56, mx: 'auto', mb: 2, borderRadius: 3, display: 'grid', placeItems: 'center',
            bgcolor: alpha(t.palette.primary.main, 0.1), color: 'primary.main',
          })}
        >
          <LockOutlinedIcon />
        </Box>
        {failed ? (
          <>
            <Typography variant="h6" fontWeight={700} gutterBottom>Couldn’t check your access</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
              Your permissions could not be loaded, so {area} is locked for now. Check your connection and try again.
            </Typography>
            <Button variant="contained" onClick={() => refreshAccess()} sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}>
              Retry
            </Button>
          </>
        ) : (
          <>
            <Typography variant="h6" fontWeight={700} gutterBottom>No access to {area}</Typography>
            <Typography variant="body2" color="text.secondary">
              Your user type does not include “{labelOf(permission)}”. Ask an Admin to grant it under Configurations → User Management → Roles.
            </Typography>
          </>
        )}
      </Card>
    </Box>
  );
}
