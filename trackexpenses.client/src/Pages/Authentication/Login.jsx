import { useState, useContext } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "../../styles/Theme/Theme";
import { Lock, Mail } from "lucide-react";
import apiCall from "../../services/ApiCallGeneric/apiCall";
import AuthContext from "../../services/Authentication/AuthContext";
import { setAuthFromApiPayload, AuthTimer_start } from "../../services/MicroServices/AuthTime";

import Card from "../../components/UI/Card";
import Input from "../../components/Form/Input";
import Button from "../../components/Buttons/Button";

const Login = () => {
  const { setAuth, setIsAuthenticated, setRoles } = useContext(AuthContext);
  const { theme } = useTheme();

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [submitting, setSubmitting] = useState(false);
  const [errorSubmit, setErrorSubmit] = useState(null);

  const scheme =
    (theme?.mode ||
      theme?.appearance ||
      theme?.scheme ||
      theme?.palette?.mode ||
      theme?.colors?.mode ||
      theme?.name ||
      "").toString().toLowerCase();
  const isLight =
    theme?.isLight === true || theme?.isDark === false || scheme.includes("light");

  const CARD_BORDER = isLight ? "rgba(0,0,0,0.78)" : "rgba(255,255,255,0.78)";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorSubmit(null);
    setSubmitting(true);

    const payload = {
      email: formData.email || "",
      password: formData.password || "",
    };

    try {
      const response = await apiCall.post("/User/Login", payload, {
        validateStatus: () => true,
      });

      if (!(response?.status >= 200 && response?.status < 300)) {
        setSubmitting(false);
        return setErrorSubmit(response?.data?.message || "Unable to login");
      }

      const data = response.data || {};
      if (data?.Roles?.$values) data.Roles = data.Roles.$values;

      setAuthFromApiPayload(data);
      AuthTimer_start(data);

      setAuth(data);
      setRoles(data.Roles || null);
      setIsAuthenticated(true);

      window.dispatchEvent(new Event("token-refreshed"));
    } catch (err) {
      setErrorSubmit("Unable to login. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <Card
        className="max-w-md w-full p-8 rounded-2xl shadow-2xl"
        style={{
          backgroundColor: theme?.colors?.background?.paper,
          border: `1.5px solid ${CARD_BORDER}`,
          boxShadow: `0 25px 50px -12px ${theme?.colors?.primary?.dark}3D`,
        }}
      >
        <div className="text-center mb-8">
          <h2
            className="text-3xl font-bold mb-2"
            style={{ color: theme?.colors?.text?.primary }}
          >
            LOGIN
          </h2>
          <p className="text-sm" style={{ color: theme?.colors?.text?.secondary }}>
            Enter your credentials to access your account
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <Input
            label="Email"
            type="email"
            value={formData.email}
            placeholder="Enter your email"
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            icon={<Mail className="h-5 w-5" />}
          />

          <Input
            label="Password"
            type="password"
            value={formData.password}
            placeholder="Enter your password"
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            icon={<Lock className="h-5 w-5" />}
          />

          <div className="mt-2 text-center">
            <Link
              to="/ForgotPassword"
              className="text-sm font-medium hover:underline transition-colors duration-200"
              style={{ color: theme?.colors?.primary?.main }}
            >
              Forgot Password?
            </Link>
          </div>

          <Button
            type="submit"
            size="md"
            variant="primary"
            fullWidth
            disabled={submitting}
            className="mt-4 !h-11 !px-6 !rounded-xl leading-none"
            aria-busy={submitting}
          >
            {submitting ? "Signing in..." : "Login"}
          </Button>

          {errorSubmit && (
            <p className="text-center text-sm mt-2" style={{ color: theme?.colors?.error?.main }}>
              {errorSubmit}
            </p>
          )}
        </form>

        <div className="mt-8 text-center">
          <Link
            to="/Register"
            className="text-sm font-medium hover:underline transition-colors duration-200"
            style={{ color: theme?.colors?.primary?.main }}
          >
            Don't have an account? Sign Up
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default Login;
