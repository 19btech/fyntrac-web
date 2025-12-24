import { createTheme, alpha } from "@mui/material/styles";

// Professional "Cool" Palette
const palette = {
  primary: {
    main: "#4F46E5", 
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
    default: "#F3F4F6",
    paper: "#FFFFFF",
  },
  text: {
    primary: "#111827",
    secondary: "#6B7280",
  },
  // 👇 UPDATED SECTION FOR SLEEK HOVER
  action: {
    // This creates a sleek, light blue/cyan background on hover
    // equivalent to Tailwind's 'sky-50' or 'blue-50'
    hover: "#F0F9FF", 
    
    // Slightly darker for selected items
    selected: "#E0F2FE", 
  },
};

const fyntracTheme = createTheme({
  palette,
  typography: {
    fontFamily: "'Inter', 'Plus Jakarta Sans', 'Roboto', sans-serif",
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