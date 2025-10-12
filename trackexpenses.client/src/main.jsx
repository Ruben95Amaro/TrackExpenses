
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "./styles/Theme/Theme.jsx";
import { LanguageProvider } from "./utilis/Translate/LanguageContext.jsx";
import { AuthProvider } from "./services/Authentication/AuthContext.jsx";
import GlobalStyles from "./styles/Theme/GlobalStyle.jsx";
import App from "./App.jsx";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ThemeProvider>
      <LanguageProvider>
        <GlobalStyles />
        <AuthProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  </StrictMode>
);
