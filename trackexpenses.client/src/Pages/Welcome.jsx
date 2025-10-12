import React, { useContext } from "react";
import { Link, Navigate } from "react-router-dom";
import { ArrowRight, PieChart, Shield, TrendingUp } from "lucide-react";
import { useTheme } from "../styles/Theme/Theme";
import AuthContext from "../services/Authentication/AuthContext";
import { useLanguage } from "../utilis/Translate/LanguageContext";

function Welcome() {
  const { theme } = useTheme();
  const { isAuthenticated } = useContext(AuthContext);
  const { t } = useLanguage();

  if (isAuthenticated) return <Navigate to="/ListWallets" replace />;

  const c = theme?.colors || {};

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <div className="text-center space-y-6">
        <h1
          className="text-4xl md:text-6xl font-bold"
          style={{ color: c.text?.primary }}
        >
          {t("welcome.take_control_of_your")}{" "}
          <span className="text-blue-500">{t("welcome.finances")}</span>
        </h1>

        <p className="text-xl" style={{ color: c.text?.secondary }}>
          {t("welcome.subtitle")}
        </p>

        <Link
          to="/Register"
          className="inline-flex items-center px-6 py-3 text-lg font-medium text-white rounded-lg hover:bg-blue-600 transition-colors"
          style={{ backgroundColor: c.primary?.main }}
        >
          {t("welcome.get_started")}
          <ArrowRight className="ml-2 h-5 w-5" />
        </Link>
      </div>

      {/* Features */}
      <div className="grid md:grid-cols-3 gap-8 mt-12">
        <div
          className="p-6 rounded-xl shadow-md"
          style={{ backgroundColor: c.background?.paper }}
        >
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
            <PieChart className="h-6 w-6 text-blue-500" />
          </div>
          <h3
            className="text-xl font-semibold mb-2"
            style={{ color: c.text?.primary }}
          >
            {t("welcome.features.expense.title")}
          </h3>
          <p style={{ color: c.text?.secondary }}>
            {t("welcome.features.expense.desc")}
          </p>
        </div>

        <div
          className="p-6 rounded-xl shadow-md"
          style={{ backgroundColor: c.background?.paper }}
        >
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
            <TrendingUp className="h-6 w-6 text-blue-500" />
          </div>
          <h3
            className="text-xl font-semibold mb-2"
            style={{ color: c.text?.primary }}
          >
            {t("welcome.features.income.title")}
          </h3>
          <p style={{ color: c.text?.secondary }}>
            {t("welcome.features.income.desc")}
          </p>
        </div>

        <div
          className="p-6 rounded-xl shadow-md"
          style={{ backgroundColor: c.background?.paper }}
        >
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
            <Shield className="h-6 w-6 text-blue-500" />
          </div>
          <h3
            className="text-xl font-semibold mb-2"
            style={{ color: c.text?.primary }}
          >
            {t("welcome.features.security.title")}
          </h3>
          <p style={{ color: c.text?.secondary }}>
            {t("welcome.features.security.desc")}
          </p>
        </div>
      </div>
    </div>
  );
}

export default Welcome;
