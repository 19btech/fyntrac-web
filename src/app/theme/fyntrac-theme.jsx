import { createTheme, alpha } from "@mui/material/styles";

// Professional "Cool" Palette
const palette = {
  primary: {
    main: "#8C52FF",
    light: "#818cf8",
    dark: "#3730a3",
    contrastText: "#ffffff",
  },
  secondary: {
    main: "#06b6d4",
    light: "#67e8f9",
    dark: "#0e7490",
    contrastText: "#ffffff",
  },
  background: {
    default: "#FFFFFF !important",
    paper: "#FFFFFF",
  },
  text: {
    primary: "#111827",
    secondary: "#6B7280",
  },
  action: {
    hover: "#F0F9FF",
    selected: "#E0F2FE",
  },
};

const fyntracTheme = createTheme({
  palette,
  
  // Optional: Increases base font size for the whole app
  typography: {
    fontFamily: "'Inter', 'Plus Jakarta Sans', 'Roboto', 'sans-serif'",
    // fontSize: 16, 
    h1: { fontWeight: 700 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 700 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    button: {
      textTransform: "none",
      fontWeight: 600,
    },
  },
  gridHeader: {
      fontFamily: "'Plus Jakarta Sans', sans-serif", // Specific font family
      fontSize: "24px !important",   // Specific size
      fontWeight: 400 ,    // Specific weight (Bold)
      lineHeight: 1.2,
      color: "#111827 !important",   // Optional: specific color
      letterSpacing: "-0.02em" // Optional: makes it look tighter/modern
    },
  shape: {
    borderRadius: 12,
  },
  shadows: [
    "none",
    "0px 2px 4px -1px rgba(0,0,0,0.06),0px 4px 6px -1px rgba(0,0,0,0.1)",
    "0px 4px 6px -1px rgba(0,0,0,0.1),0px 2px 4px -1px rgba(0,0,0,0.06)",
    "0px 10px 15px -3px rgba(0,0,0,0.1),0px 4px 6px -2px rgba(0,0,0,0.05)",
    ...Array(21).fill("none"),
  ],
  components: {
    MuiDrawer: {
      styleOverrides: {
        paper: {
          // Default is usually 240px. 
          // 5% is very small (approx 90px on a large screen), so icons might break.
          // I recommend a fixed pixel width like "280px" or "300px".
          width: "320px !important", 
         //  width: "var(--Toolpad-navigation-width) !important",
          transition: "width 0.2s ease", // Optional: Smooth transition
          // If you really want percentage (not recommended for sidebars):
          // width: "20vw !important", 
        },
      },
    },
    MuiListItemText: {
      styleOverrides: {
        primary: {
          fontSize: "14px !important", // Increases the text size "Configure"
          fontWeight: 500,  // Makes it slightly bolder
          // color: palette.text.primary,
          color: '#71717A', // Default gray color
        },
      },
    },
    MuiListItemIcon: {
      styleOverrides: {
        root: {
          minWidth: "48px", // Adds more space between icon and text
          color: palette.primary.main, // Optional: colors the icons
          "& .MuiSvgIcon-root": {
            fontSize: "25px", // Increases the Icon Size
            iconWeight: 100,
          },
        },
      },
    },
    // ----------------------------------------------------

    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: "8px",
          boxShadow: "none",
          padding: "8px 20px",
          "&:hover": {
            boxShadow: "0px 4px 12px rgba(79, 70, 229, 0.2)",
            transform: "translateY(-1px)",
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: "16px",
          border: "1px solid rgba(229, 231, 235, 0.5)",
          boxShadow: "0px 2px 4px -1px rgba(0,0,0,0.05)",
          backgroundImage: "none",
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: "10px",
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: "rgba(0, 0, 0, 0.12)",
          },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: palette.primary.light,
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderWidth: "1.5px",
            boxShadow: `0 0 0 3px ${alpha(palette.primary.main, 0.1)}`,
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: "16px",
          boxShadow: "0px 25px 50px -12px rgba(0, 0, 0, 0.25)",
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: "rgba(0, 0, 0, 0.06)",
        },
      },
    },
  },
});

export default fyntracTheme;