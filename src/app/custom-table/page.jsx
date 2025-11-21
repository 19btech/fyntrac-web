"use client"
import React, { useEffect } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid2';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import { styled } from '@mui/material/styles';

import CachedRoundedIcon from '@mui/icons-material/CachedRounded';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import Tab from '@mui/material/Tab';
import CustomTabPanel from '../component/custom-tab-panel';
import { Tabs, Divider } from '@mui/material';
import axios from 'axios';
import Tooltip from '@mui/material/Tooltip';
import GridHeader from '../component/gridHeader';
import '../common.css';

import { useTenant } from "../tenant-context";
import CustomTablesList from '../component/custom-tables';
import dynamic from 'next/dynamic';

// Dynamically import the CustomTableModal component
const CreateTableDialog = dynamic(() => import('../component/custom-table'), {
  ssr: false
});

const VisuallyHiddenInput = styled('input')({
    clip: 'rect(0 0 0 0)',
    clipPath: 'inset(50%)',
    height: 1,
    overflow: 'hidden',
    position: 'absolute',
    bottom: 0,
    left: 0,
    whiteSpace: 'nowrap',
    width: 1,
});

export default function CustomTablesMain() {
    const { tenant } = useTenant();
    const [panelIndex, setPanelIndex] = React.useState(0);
    const [modelRefreshKey, setModelRefreshKey] = React.useState(0);
    const [headerLabel, setHeaderLabel] = React.useState('Custom Tables');
    const [openCustomTableModal, setOpenCustomTableModal] = React.useState(false);

    const handleModelChange = (event, newValue) => {
        setPanelIndex(newValue);
    };

    const handleRefresh = () => {
        setModelRefreshKey(prev => prev + 1);
    };

    return (
        <>
            <Grid container spacing={3}>
                <Grid size="auto">
                    <div className='left'>
                        <GridHeader>
                            {headerLabel}
                        </GridHeader>
                    </div>
                </Grid>
                <Grid size={6} />

                <Grid size="grow">
                    <div className='right'>
                        <Stack direction="row" spacing={1}>

                            <Tooltip title="Refresh page" arrow>
                                <IconButton aria-label="refresh" onClick={handleRefresh} sx={{
                                    '&:hover': {
                                        backgroundColor: 'darkgrey',
                                    },
                                }}>
                                    <CachedRoundedIcon />
                                </IconButton>
                            </Tooltip>

                            <IconButton
                                aria-label="add"
                                onClick={() => setOpenCustomTableModal(true)}
                                sx={{
                                    '&:hover': {
                                        backgroundColor: 'darkgrey',
                                    },
                                }}
                            >
                                <AddOutlinedIcon />
                            </IconButton>
                        </Stack>
                    </div>
                </Grid>
            </Grid>

            <Divider />

            <Box>
                <Box sx={{ width: '100%', display: 'flex', borderBottom: 1, borderColor: 'divider', alignItems: 'flex-start', margin: 0, padding: 0 }}>
                    <Tabs sx={{ width: '90rem' }} value={panelIndex} onChange={handleModelChange} aria-label="Custom Tables">
                        <Tab label="Custom Tables" sx={{ textTransform: 'none' }} />
                    </Tabs>
                </Box>
                <CustomTabPanel value={panelIndex} index={panelIndex}>
                    <CustomTablesList refreshData={setModelRefreshKey} key={modelRefreshKey} />
                </CustomTabPanel>
            </Box>
            <CreateTableDialog open={openCustomTableModal} onClose={setOpenCustomTableModal} />
        </>
    )
}