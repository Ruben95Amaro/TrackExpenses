import React, { useEffect, useState } from "react";
import { Moon, Sun, Globe, Wallet } from "lucide-react";
import { useTheme } from "../styles/Theme/Theme";
import { useLanguage } from "../utils/Translate/LanguageContext";

function Settings() {
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();

  const languages = [
    { code: "en", name: "English" },
    { code: "pt", name: "Português" },
    { code: "es", name: "Español" },
    { code: "fr", name: "Français" },
  ];

  // const currencies = [
  //   { code: "USD", symbol: "$", name: "US Dollar" },
  //   { code: "EUR", symbol: "€", name: "Euro" },
  //   { code: "GBP", symbol: "£", name: "British Pound" },
  //   { code: "JPY", symbol: "¥", name: "Japanese Yen" },
  // ];

  // // prefered currency persisted em localStorage
  // const [currency, setCurrency] = useState(() => {
  //   return localStorage.getItem("preferred_currency") || "EUR";
  // });

  // useEffect(() => {
  //   localStorage.setItem("preferred_currency", currency);
  // }, [currency]);

  const cardStyle = {
    backgroundColor: theme.colors.background.paper,
    borderColor: theme.colors.secondary.light,
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1
        className="text-2xl font-bold"
        style={{ color: theme.colors.text.primary }}
      >
        {t("common.settings")}
      </h1>

      <div
        className="rounded-xl shadow-md border overflow-hidden"
        style={cardStyle}
      >
        {/* Appearance */}
        <div
          className="p-6 border-b"
          style={{ borderColor: theme.colors.secondary.light }}
        >
          <h2
            className="text-lg font-semibold mb-4"
            style={{ color: theme.colors.text.primary }}
          >
            {t("settings.appearance")}
          </h2>

          <div className="space-y-4">
            {/* Theme toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {isDarkMode ? (
                  <Moon
                    className="h-5 w-5"
                    style={{ color: theme.colors.text.secondary }}
                  />
                ) : (
                  <Sun
                    className="h-5 w-5"
                    style={{ color: theme.colors.text.secondary }}
                  />
                )}
                <span style={{ color: theme.colors.text.primary }}>
                  {t("settings.themeMode")}
                </span>
              </div>

              <button
                onClick={toggleTheme}
                className="px-4 py-2 rounded-md font-medium transition-colors"
                style={{
                  backgroundColor: theme.colors.primary.main,
                  color:
                    theme.colors.button?.primary?.text ||
                    theme.colors.background.paper,
                }}
                aria-label={t("settings.toggle_theme")}
                title={t("settings.toggle_theme")}
              >
                {isDarkMode ? t("settings.dark") : t("settings.light")}
              </button>
            </div>
          </div>
        </div>

        {/* Preferences */}
        <div className="p-6">
          <h2
            className="text-lg font-semibold mb-4"
            style={{ color: theme.colors.text.primary }}
          >
            {t("settings.preferences")}
          </h2>

          <div className="space-y-6">
            {/* Language */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Globe
                  className="h-5 w-5"
                  style={{ color: theme.colors.text.secondary }}
                />
                <span style={{ color: theme.colors.text.primary }}>
                  {t("settings.language")}
                </span>
              </div>

              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none px-3 py-2"
                style={{
                  backgroundColor: theme.colors.background.paper,
                  color: theme.colors.text.primary,
                  border: `1px solid ${theme.colors.secondary.light}`,
                }}
                aria-label={t("settings.language")}
              >
                {languages.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Currency */}
            {/* <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Wallet className="h-5 w-5" style={{ color: theme.colors.text.secondary }} />
                <span style={{ color: theme.colors.text.primary }}>
                  {t("settings.currency")}
                </span>
              </div>

              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none px-3 py-2"
                style={{
                  backgroundColor: theme.colors.background.paper,
                  color: theme.colors.text.primary,
                  border: `1px solid ${theme.colors.secondary.light}`,
                }}
                aria-label={t("settings.currency")}
              >
                {currencies.map((c) => (
                  <option key={c.code} value={c.code}>
                    {`${c.symbol} ${c.name} (${c.code})`}
                  </option>
                ))}
              </select>
            </div> */}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;
