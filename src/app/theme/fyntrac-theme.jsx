import { createTheme, alpha } from "@mui/material/styles";

// ----------------------------------------------------------------------
// 🎨 PALETTE: Modern SaaS "Indigo & Slate"
// ----------------------------------------------------------------------
const palette = {
  primary: {
    main: "#6366F1", // Modern Indigo (Better than #8C52FF)
    light: "#818CF8",
    dark: "#4338CA",
    contrastText: "#ffffff",
  },
  secondary: {
    main: "#0EA5E9", // Sky Blue
    light: "#38BDF8",
    dark: "#0284C7",
    contrastText: "#ffffff",
  },
  background: {
    default: "#F0F0F7", // Cool gray-white (Easier on eyes than #F0F0F7)
    paper: "#FFFFFF",
  },
  text: {
    primary: "#1E293B", // Slate 800 (Softer than pure black)
    secondary: "#64748B", // Slate 500
    disabled: "#94A3B8",
  },
  action: {
    hover: alpha("#6366F1", 0.08),
    selected: alpha("#6366F1", 0.16),
    disabled: alpha("#94A3B8", 0.3),
  },
  divider: "rgba(148, 163, 184, 0.12)",
};

// ----------------------------------------------------------------------
// ✒️ TYPOGRAPHY: Clean & Geometric
// ----------------------------------------------------------------------
const fontFamily = "'Plus Jakarta Sans', 'Inter', -apple-system, sans-serif";

const fyntracTheme = createTheme({
  palette,
  
  typography: {
    fontFamily,
    h1: { fontWeight: 800, letterSpacing: -1 },
    h2: { fontWeight: 700, letterSpacing: -0.5 },
    h3: { fontWeight: 700, letterSpacing: 0 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600, fontSize: "1.125rem" },
    subtitle1: { fontWeight: 600 },
    subtitle2: { fontWeight: 600, fontSize: "0.875rem" },
    body1: { fontSize: "1rem", lineHeight: 1.5 },
    body2: { fontSize: "0.875rem", lineHeight: 1.57 },
    button: {
      textTransform: "none",
      fontWeight: 600,
      letterSpacing: 0.3,
    },
    // Custom Variant for Grid Headers
    gridHeader: {
      fontFamily,
      fontSize: "0.75rem",
      fontWeight: 500,
      textTransform: "uppercase",
      color: palette.text.secondary,
      letterSpacing: "0.05em", // Wide tracking for labels
    },
  },

  shape: {
    borderRadius: 5, // Modern standard
  },

  // Soft, Diffused Shadows (Blue-tinted)
  shadows: [
    "none",
    "0px 2px 4px -1px rgba(100, 116, 139, 0.06), 0px 4px 6px -1px rgba(100, 116, 139, 0.1)", // Soft Low
    "0px 4px 6px -1px rgba(100, 116, 139, 0.1), 0px 2px 4px -1px rgba(100, 116, 139, 0.06)", // Soft Med
    "0px 10px 15px -3px rgba(100, 116, 139, 0.1), 0px 4px 6px -2px rgba(100, 116, 139, 0.05)", // Soft High
    ...Array(21).fill("none"), // Fill rest to avoid errors
  ],

  // ----------------------------------------------------------------------
  // 🧩 COMPONENT OVERRIDES
  // ----------------------------------------------------------------------
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: "#F0F0F7",
          scrollbarColor: "#CBD5E1 transparent",
          "&::-webkit-scrollbar, & *::-webkit-scrollbar": {
            backgroundColor: "transparent",
            width: 8,
            height: 8,
          },
          "&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb": {
            borderRadius: 8,
            backgroundColor: "#CBD5E1",
            minHeight: 24,
            border: "2px solid transparent",
            backgroundClip: "content-box",
          },
        },
      },
    },

    // --- DRAWER (Sidebar) ---
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: "#FFFFFF",
          borderRight: "1px dashed rgba(148, 163, 184, 0.2)", // Subtle dash border
          boxShadow: "none",
          transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        },
      },
    },

    // --- NAVIGATION ITEMS ---
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          margin: "4px 8px", // Breathing room around items
          padding: "8px 12px",
          transition: "all 0.2s ease-in-out",
          "&:hover": {
            backgroundColor: alpha(palette.primary.main, 0.04),
            transform: "translateX(2px)", // Subtle movement
          },
          "&.Mui-selected": {
            backgroundColor: alpha(palette.primary.main, 0.08),
            "&:hover": { backgroundColor: alpha(palette.primary.main, 0.12) },
          },
        },
      },
    },
    MuiListItemText: {
      styleOverrides: {
        primary: {
          fontSize: "0.9rem",
          fontWeight: 500, // Slightly bolder for readability (300 is too thin)
          color: palette.text.secondary,
        },
      },
    },
    MuiListItemIcon: {
      styleOverrides: {
        root: {
          minWidth: "40px",
          color: palette.text.secondary, // Gray by default
          "&.Mui-selected": { color: palette.primary.main },
          "& .MuiSvgIcon-root": { fontSize: "1.3rem" },
        },
      },
    },

    // --- BUTTONS ---
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: "none",
          padding: "8px 16px",
          fontSize: "0.875rem",
          transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
          "&:hover": {
            boxShadow: "0 4px 12px rgba(99, 102, 241, 0.2)", // Glow effect
            transform: "translateY(-1px)",
          },
        },
        contained: {
          background: `linear-gradient(135deg, ${palette.primary.main} 0%, ${palette.primary.dark} 100%)`,
        }
      },
    },

    // --- CARDS ---
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          border: "1px solid rgba(241, 245, 249, 1)", // Very light border
          boxShadow: "0px 2px 8px rgba(100, 116, 139, 0.04)", // Subtle static shadow
          transition: "all 0.3s ease",
          "&:hover": {
            transform: "translateY(-4px)",
            boxShadow: "0px 12px 24px -4px rgba(100, 116, 139, 0.12)", // Lifted shadow
            borderColor: alpha(palette.primary.main, 0.3), // Highlight border
          },
        },
      },
    },

    // --- INPUTS ---
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          backgroundColor: "#F8FAFC", // Light background input
          transition: "all 0.2s",
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: "rgba(148, 163, 184, 0.2)",
          },
          "&:hover": {
            backgroundColor: "#FFFFFF",
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: palette.primary.light,
            },
          },
          "&.Mui-focused": {
            backgroundColor: "#FFFFFF",
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: palette.primary.main,
              borderWidth: "1.5px",
            },
            // Soft Focus Ring
            boxShadow: `0 0 0 4px ${alpha(palette.primary.main, 0.1)}`,
          },
        },
      },
    },

    // --- DIALOG ---
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 20,
          boxShadow: "0px 48px 100px 0px rgba(17, 12, 46, 0.15)", // Deep, expensive shadow
        },
        backdrop: {
          backgroundColor: "rgba(15, 23, 42, 0.2)", // Slate backdrop
          backdropFilter: "blur(4px)", // Glassmorphism backdrop
        },
      },
    },

    // --- DIVIDER ---
    MuiDivider: {
      styleOverrides: {
        root: {
          borderStyle: "revert", // Modern dash style
          borderColor: "rgba(148, 163, 184, 0.2)",
        },
      },
    },
    
    // --- TOOLTIP ---
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: palette.text.primary,
          fontSize: "0.75rem",
          fontWeight: 600,
          padding: "6px 10px",
          borderRadius: 6,
        },
        arrow: {
          color: palette.text.primary,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: "#FFFFFF !important",
          backdropFilter: "none", 
          boxShadow: "none",
          borderBottom: "none", 
          color: palette.text.primary, // Ensures text/icons remain visible (dark)
        },
      },
    },
  },
});

export default fyntracTheme;