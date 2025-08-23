'use client';
import * as React from 'react';
import { createTheme } from '@mui/material/styles';
import BarChartIcon from '@mui/icons-material/BarChart';
import { AppProvider } from '@toolpad/core/AppProvider';
import { DashboardLayout } from '@toolpad/core/DashboardLayout';
import StartOutlinedIcon from '@mui/icons-material/StartOutlined';
import CottageOutlinedIcon from '@mui/icons-material/CottageOutlined';
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';
import AccountBalanceOutlinedIcon from '@mui/icons-material/AccountBalanceOutlined';
import SyncAltOutlinedIcon from '@mui/icons-material/SyncAltOutlined';
import AutoGraphOutlinedIcon from '@mui/icons-material/AutoGraphOutlined';
import SettingsSuggestOutlinedIcon from '@mui/icons-material/SettingsSuggestOutlined';
import ConstructionOutlinedIcon from '@mui/icons-material/ConstructionOutlined';
import Diversity3OutlinedIcon from '@mui/icons-material/Diversity3Outlined';
import BusinessCenterOutlinedIcon from '@mui/icons-material/BusinessCenterOutlined';
import RuleFolderOutlinedIcon from '@mui/icons-material/RuleFolderOutlined';
import TrendingUpOutlinedIcon from '@mui/icons-material/TrendingUpOutlined';
import TroubleshootIcon from '@mui/icons-material/Troubleshoot';
import PageContent from '../component/pageContent';
import { Inter } from 'next/font/google'; // Use built-in Next.js font loader
import TimelineIcon from '@mui/icons-material/Timeline';

const inter = Inter({ subsets: ['latin'] });
const NAVIGATION = [
  {
    segment: 'getstarted',
    title: 'Get Started',
    icon: <StartOutlinedIcon />,
  },
  {
    segment: 'dashboard',
    title: 'Dashboard',
    icon: <CottageOutlinedIcon />
  },
  {
    segment: 'diagnostic',
    title: 'Diagnostic',
    icon: <TroubleshootIcon />,
  },
  {
    segment: 'model',
    title: 'Model',
    icon: <ArticleOutlinedIcon />,
  },
  {
    segment: 'mapping',
    title: 'Mapping',
    icon: <AccountBalanceOutlinedIcon />,
  },
  {
    segment: 'sync',
    title: 'Sync',
    icon: <SyncAltOutlinedIcon />,
  },
  {kind: 'divider'},
  {
    segment: 'reports',
    title: 'Reports',
    icon: <BarChartIcon />,
    children: [
      {
        segment: 'gle-report',
        title: 'Journal Entry Report',
        icon: <AutoGraphOutlinedIcon />,
      },
      {
        segment: 'transaction-activity-report',
        title: 'Activity Report',
        icon: <TrendingUpOutlinedIcon />,
      },{
        segment: 'rollforward-report',
        title: 'Rollforward Report',
        icon: <TimelineIcon />,
      },
    ],
  },
  
  
  {
    kind: 'divider',
  },
  {
    segment: 'settings',
    title: 'Settings',
    icon: <ConstructionOutlinedIcon />,
    children: [
      {
        segment: 'configure',
        title: 'Configure',
        icon: <SettingsSuggestOutlinedIcon />,
      },
      {
        segment: 'accounting-rules',
        title: 'Accounting Rules',
        icon: <RuleFolderOutlinedIcon />,
      },
      {
        segment: 'team-members',
        title: 'Team Members',
        icon: <Diversity3OutlinedIcon />,
      },
    ],
  },
  {kind: 'divider'},
  {
    segment: 'merchant',
    title: 'Merchant',
    icon: <BusinessCenterOutlinedIcon />,
  },
];

const demoTheme = createTheme({
  cssVariables: {
    colorSchemeSelector: 'data-toolpad-color-scheme',
  },
  
  colorSchemes: {
    light: {
      palette: { mode: 'light' }, // Ensure proper theme definition
    },
    dark: {
      palette: { mode: 'light' },
    },
  },
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 600,
      lg: 1200,
      xl: 1536,
    },
  },
});



function DashboardLayoutBasic(props) {
  const { window } = props;

  const [pathname, setPathname] = React.useState('/home');
  // router.push('/' + 'rules')
  const router = React.useMemo(() => {
    return {
      pathname,
      searchParams: new URLSearchParams(),
      navigate: (path) => setPathname(String(path)),
    };
  }, [pathname]);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      setMode(window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'light');
    }
  }, []);
  
  // const [mode, setMode] = React.useState('light');
  const demoTheme = createTheme({
    typography: {
      fontFamily: `${inter.style.fontFamily}, sans-serif`, // Correctly set Inter with fallback
    },
    palette: {
      text: {
        primary: '#666666', // Set default font color
        secondary: '#666666', // Set secondary text color (optional)
      },
      primary: {
        main: '#1976d2', // Custom primary color
      },
      secondary: {
        main: '#dc004e', // Custom secondary color
      },
    },
    breakpoints: {
      values: {
        xs: 0,
        sm: 600,
        md: 600,
        lg: 1200,
        xl: 1536,
      },
    }, // Dynamically updates theme based on client mode
  });
  
  return (
    // preview-start
    <AppProvider
    branding={{
      logo: <img src="fyntrac-small.png" alt="Fyntrac" />,
      title: '',
      }}
      navigation={NAVIGATION}
      router={router}
      theme={demoTheme}
      // window={demoWindow}
    >
      <DashboardLayout  sx={{background: '#e4e8ee'}} theme={demoTheme}>
        <PageContent pathname={router.pathname} />
      </DashboardLayout>
    </AppProvider>
    // preview-end
  );
}


export default DashboardLayoutBasic;