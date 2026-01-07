"use client";

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardActionArea,
  Grid2 as Grid,
  Container,
  Chip,
  Fade,
  Button // Use Button instead of IconButton
} from '@mui/material';
import { 
  ArrowForward,
  AssessmentOutlined,
  ArrowBack, // Standard 'Back' icon
  KeyboardBackspace // Alternative sleek back icon
} from '@mui/icons-material';

// Import your actual report pages
import SettingsPage from '../settings/page';
import CustomRefDataReportPage from '../reports/custom-ref-data-report/page';
import CustomTablesMain from '../custom-table/page';
import RulePage from '../rules/page';
import EventConfigurationMain from '../event-configuration/page';
import AccountingPage from '../accounting/page';

export default function ReportDashboard() {
  const [selectedReport, setSelectedReport] = useState(null);

  const ComingSoon = () => (
    <Box sx={{ textAlign: 'center', py: 10, color: 'text.secondary', bgcolor: '#f9fafb', borderRadius: 2 }}>
      <AssessmentOutlined sx={{ fontSize: 60, mb: 2, opacity: 0.3 }} />
      <Typography variant="h6" color="text.secondary">This feature is under construction.</Typography>
    </Box>
  );

  const categories = [
    {
      name: "General Configuration",
      tag: "General",
      reports: [
        { name: "Tenant Management", description:"Manages tenant-level settings, system preferences and environment-wide configurations.", component: SettingsPage },
        { name: "User Management", description:"Creates and manages user accounts, roles, and permissions accross the paltform.", component: ComingSoon },
        { name: "Cron Jobs", description:"Configure and monitor scheduled tasks for automated processes and data sync.", component: ComingSoon }
      ]
    },
    {
      name: "Business Configuration",
      tag: "Business",
      reports: [
        { name: "Setup Events", description:"Define business events that aggregate required data from multple input sources.", component: EventConfigurationMain },
        { name: "Setup Custom Tables", description:"Create and manage custom operational and reference data tables to support business specific needs.", component: CustomTablesMain }
      ]
    },
    {
      name: "Reference Data",
      tag: "Reference",
      reports: [
        { name: "Accounting Rules", description:"Configure transaction logic, aggregate rules, and qualitative and quantitative attributes used in accounting calculations.", component: RulePage },
        { name: "Journal Mapping", description:"Map calcualted output to account subtypes, charts of accounts, and subledgers for journal posting.", component: AccountingPage }
      ]
    },
  ];

  // --- RENDER: DETAIL VIEW (The Selected Component) ---
  if (selectedReport) {
    const ComponentToRender = selectedReport.component;

    return (
      <Container maxWidth={false} sx={{ py: 1, px: { xs: 2, md: 3 }, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Fade in={true}>
          <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
            
            {/* Header Area */}
            <Box 
              sx={{ 
                mb: 2, // Added margin bottom for spacing
                pb: 0,
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'flex-end', // Pushes button to right
                borderColor: 'divider',
              }}
            >
              {/* Left: Title (Optional - currently empty in your code) */}
              <Box>
                 {/* You can add title here if needed later */}
              </Box>

              {/* Right: Back Link Button */}
              <Button
                onClick={() => setSelectedReport(null)}
                startIcon={<KeyboardBackspace fontSize="small" />} // Sleek back arrow
                sx={{ 
                  textTransform: 'none',
                  color: 'text.secondary',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  '&:hover': { 
                    bgcolor: 'transparent',
                    color: 'primary.main',
                    textDecoration: 'underline' 
                  }
                }}
              >
                Back to Dashboard
              </Button>
            </Box>

            {/* The Actual Component Rendered Here */}
            <Box sx={{ flexGrow: 1, width: '100%', minHeight: '95vh' }}>
              <ComponentToRender />
            </Box>

          </Box>
        </Fade>
      </Container>
    );
  }

  // --- RENDER: DASHBOARD VIEW (Grid of Cards) ---
  return (
    <Container maxWidth={false} sx={{ py: 1, px: { xs: 2, md: 3 }, minHeight: '100vh', textAlign: 'left' }}>
      {categories.map((cat, catIdx) => (
        <Box key={catIdx} sx={{ mb: 6, width: '100%' }}>
          
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Typography variant="overline" fontWeight="bold" fontSize="0.85rem" color="text.secondary" sx={{ letterSpacing: 1.5, textTransform: 'uppercase' }}>
              {cat.name}
            </Typography>
            <Box sx={{ height: '2px', bgcolor: 'divider', flexGrow: 1, ml: 2, opacity: 0.9 }} />
          </Box>

          <Grid container spacing={3}>
            {cat.reports.map((report, idx) => (
              <Grid size={{ xs: 12, md: 6, lg: 4 }} key={idx}>
                <Fade in={true} timeout={(idx + 1) * 300}>
                  <Card 
                    elevation={0}
                    sx={{ 
                      height: '100%', 
                      borderRadius: 4,
                      border: '1px solid',
                      borderColor: 'grey.200',
                      bgcolor: 'white',
                      transition: 'all 0.3s ease-in-out',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 12px 24px -10px rgba(0, 0, 0, 0.1)',
                        borderColor: 'primary.main',
                        bgcolor: '#eff6ff', 
                      }
                    }}
                  >
                    <CardActionArea 
                      onClick={() => setSelectedReport(report)} 
                      sx={{ 
                        height: '100%', 
                        p: 3, 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'flex-start', 
                        justifyContent: 'space-between',
                        '& .MuiCardActionArea-focusHighlight': { background: 'transparent' }
                      }}
                    >
                      <Box sx={{ width: '100%' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                           <Chip label={cat.tag} size="small" sx={{ bgcolor: 'grey.100', fontWeight: 600, color: 'text.secondary' }} />
                        </Box>
                        <Typography variant="h6" fontWeight="700" gutterBottom sx={{ lineHeight: 1.3 }}>
                          {report.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                          {report.description}
                        </Typography>
                      </Box>
                      <Box sx={{ mt: 3, display: 'flex', alignItems: 'center', color: 'primary.main' }}>
                        <Typography variant="button" fontSize="0.75rem" fontWeight="bold">Configure</Typography>
                        <ArrowForward sx={{ fontSize: 16, ml: 1 }} />
                      </Box>
                    </CardActionArea>
                  </Card>
                </Fade>
              </Grid>
            ))}
          </Grid>
        </Box>
      ))}
    </Container>
  );
}