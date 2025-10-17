import React, { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext();

const lightTheme = {
  colors: {
    primary: {
      main: "#1D4ED8",   
      light: "#2A6CFF",  
      dark: "#1E40AF",   
    },
    secondary: {
      main: "#4B5563",   
      light: "#D1D5DB", 
      dark: "#1F2937",   
    },
    background: {
      default: "#FAFAFA", 
      paper: "#FAFAFA",  
    },
    menu: {
      bg: "#F1F5F9",                      
      border: "#CBD5E1",                  
      text: "#111827",                  
      muted: "#374151",                   
      hoverBg: "rgba(0,0,0,0.06)",       
      activeBg: "rgba(59,130,246,0.18)",  
      activeText: "#1D4ED8",             
    },
    text: {
      primary: "#0F172A",  
      secondary: "#334155",
    },
    success: {
      main: "#15803D", 
      light: "#CBEFD9",
    },
    error: {
      main: "#B91C1C", 
      light: "#FBD5D5",
    },
    card: {
      bg: "#FAFAFA",                    
      border: "#CBD5E1",                 
      shadow: "rgba(0, 0, 0, 0.08)",    
    },
    input: {
      bg: "#FAFAFA",     
      border: "#94A3B8", 
      focus: "#1D4ED8",  
      placeholder: "#64748B",
    },
    button: {
      primary: {
        bg: "#1D4ED8",   
        hover: "#1E40AF",
        text: "#FFFFFF",
      },
      secondary: {
        bg: "#E5E7EB",   
        hover: "#CBD5E1",
        text: "#0F172A", 
      },
    },
    premium: {
      gold: "#E6C200", 
    },
  },
};


const darkTheme = {
  colors: {
    primary: {
      main: "#3B82F6",
      light: "#60A5FA",
      dark: "#1E40AF",
    },
    secondary: {
      main: "#9CA3AF",
      light: "#4B5563",
      dark: "#1F2937",
    },
    background: {
      default: "#0F172A",
      paper: "#1E293B",
    },
    menu: {
      bg: "#1E293B",
      border: "#475569",
      text: "#E2E8F0",
      muted: "#94A3B8",
      hoverBg: "#1E3A8A",
      activeBg: "#1E40AF",
      activeText: "#60A5FA",
    },
    text: {
      primary: "#F9FAFB",
      secondary: "#94A3B8",
    },
    success: {
      main: "#22C55E",
      light: "#14532D",
    },
    error: {
      main: "#F87171",
      light: "#7F1D1D",
    },
    card: {
      bg: "#1E293B",
      border: "#334155",
      shadow: "rgba(0,0,0,0.4)",
    },
    input: {
      bg: "#0F172A",
      border: "#334155",
      focus: "#3B82F6",
      placeholder: "#64748B",
    },
    button: {
      primary: {
        bg: "#3B82F6",
        hover: "#2563EB",
        text: "#F9FAFB",
      },
      secondary: {
        bg: "#334155",
        hover: "#475569",
        text: "#E2E8F0",
      },  
    },
    premium: {
      gold: "#FFD700",
    },
  },
};

export function ThemeProvider({ children }) {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem("theme");
    return savedTheme === "dark";
  });

  const theme = isDarkMode ? darkTheme : lightTheme;

  useEffect(() => {
    localStorage.setItem("theme", isDarkMode ? "dark" : "light");
    document.documentElement.classList.toggle("dark", isDarkMode);
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };

  return (
    <ThemeContext.Provider value={{ theme, isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
