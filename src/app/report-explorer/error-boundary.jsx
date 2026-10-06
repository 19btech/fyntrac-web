"use client";

import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import ReportProblemOutlinedIcon from '@mui/icons-material/ReportProblemOutlined';

/**
 * Keeps a rendering failure inside one report from blanking the whole app.
 */
export default class ReportErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Report Explorer crashed:', error, info?.componentStack);
  }

  componentDidUpdate(prevProps) {
    if (this.state.error && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ error: null });
    }
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 4 }}>
        <Box sx={{ textAlign: 'center', maxWidth: 420 }}>
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              mx: 'auto',
              mb: 2,
              display: 'grid',
              placeItems: 'center',
              bgcolor: 'rgba(239, 68, 68, 0.08)',
              color: 'error.main',
            }}
          >
            <ReportProblemOutlinedIcon />
          </Box>
          <Typography variant="subtitle1" sx={{ mb: 0.5 }}>This report couldn&apos;t be displayed</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
            Something unexpected happened while rendering it. Your other reports are unaffected.
          </Typography>
          <Button variant="outlined" onClick={() => this.setState({ error: null })}>Try again</Button>
          {this.props.onExit && (
            <Button sx={{ ml: 1 }} onClick={this.props.onExit}>Back to reports</Button>
          )}
        </Box>
      </Box>
    );
  }
}
