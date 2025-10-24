import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Lock, ArrowRight, ArrowLeft, CheckCircle } from "lucide-react";
import { useTheme } from "../../styles/Theme/Theme";
import { useLanguage } from "../../utils/Translate/LanguageContext";
import apiCall from "../../services/ApiCallGeneric/apiCall";

function RecoverPassword() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();

  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Ler email/token da querystring
  useEffect(() => {
    const qEmail = searchParams.get("email") || "";
    const qToken = searchParams.get("token") || "";
    setEmail(qEmail);
    setToken(qToken);
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // validações simples
    if (!email || !email.includes("@")) {
      setError("Invalid email from reset link.");
      return;
    }
    if (!token) {
      setError("Invalid or missing reset token.");
      return;
    }
    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);

    const payload = { email, token, newPassword: password };

    const response = await apiCall.post("/User/reset-password", payload);
    setIsSubmitted(true);
    if (!response.ok) {
      setIsLoading(false);
      return setError(response.error.message);
    }
    setIsSubmitted(true);
    setIsLoading(false);
  };

  const handleTryAgain = () => {
    setPassword("");
    setConfirm("");
    setError("");
    setIsSubmitted(false);
  };

  return (
    <div
      className="flex items-center justify-center px-4 sm:px-6 lg:px-8"
      style={{ backgroundColor: theme?.colors?.background?.default }}
    >
      <div
        className="max-w-md w-full rounded-2xl shadow-2xl overflow-hidden"
        style={{
          backgroundColor: theme?.colors?.background?.paper,
          boxShadow: `0 25px 50px -12px ${theme?.colors?.primary?.dark}50`,
        }}
      >
        <div className="p-8">
          {isSubmitted ? (
            <>
              <div className="text-center">
                <div
                  className="mx-auto h-20 w-20 rounded-full flex items-center justify-center mb-6"
                  style={{ backgroundColor: theme?.colors?.success?.light }}
                >
                  <CheckCircle
                    className="h-10 w-10"
                    style={{ color: theme?.colors?.success?.main }}
                  />
                </div>
                <h2
                  className="text-3xl font-extrabold mb-4"
                  style={{ color: theme?.colors?.text?.primary }}
                >
                  Password updated
                </h2>
                <p
                  className="text-sm mb-6"
                  style={{ color: theme?.colors?.text?.secondary }}
                >
                  Your password has been reset successfully for:
                </p>
                <p
                  className="text-sm font-semibold mb-6"
                  style={{ color: theme?.colors?.primary?.main }}
                >
                  {email}
                </p>
              </div>

              <div className="mt-8 space-y-4">
                <Link
                  to="/login"
                  className="w-full flex justify-center items-center py-3 px-4 border rounded-lg font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200"
                  style={{
                    borderColor: theme?.colors?.secondary?.light,
                    color: theme?.colors?.text?.primary,
                  }}
                >
                  <ArrowLeft className="mr-2 h-5 w-5" />
                  Back to login
                </Link>
              </div>
            </>
          ) : (
            <>
              <div className="text-center">
                <div
                  className="mx-auto h-16 w-16 rounded-full flex items-center justify-center mb-6"
                  style={{
                    backgroundColor: theme?.colors?.primary?.light + "30",
                  }}
                >
                  <Lock
                    className="h-8 w-8"
                    style={{ color: theme?.colors?.primary?.main }}
                  />
                </div>
                <h2
                  className="text-3xl font-extrabold mb-4"
                  style={{ color: theme?.colors?.text?.primary }}
                >
                  Reset your password
                </h2>
                <p
                  className="text-sm"
                  style={{ color: theme?.colors?.text?.secondary }}
                >
                  Enter a new password for the account below.
                </p>
                <p
                  className="text-sm font-semibold mt-2"
                  style={{ color: theme?.colors?.primary?.main }}
                >
                  {email || "—"}
                </p>
              </div>

              <form className="space-y-6 mt-8" onSubmit={handleSubmit}>
                <div>
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: theme?.colors?.text?.secondary }}
                  >
                    New password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none block w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200"
                    style={{
                      backgroundColor: theme?.colors?.background?.paper,
                      borderColor: theme?.colors?.secondary?.light,
                      color: theme?.colors?.text?.primary,
                    }}
                    placeholder="Enter new password"
                  />
                </div>

                <div>
                  <label
                    className="block text-sm font-medium mb-2"
                    style={{ color: theme?.colors?.text?.secondary }}
                  >
                    Confirm password
                  </label>
                  <input
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className="appearance-none block w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200"
                    style={{
                      backgroundColor: theme?.colors?.background?.paper,
                      borderColor: error
                        ? theme?.colors?.error?.main
                        : theme?.colors?.secondary?.light,
                      color: theme?.colors?.text?.primary,
                    }}
                    placeholder="Re-enter new password"
                  />
                </div>

                {error && (
                  <p
                    className="text-sm"
                    style={{ color: theme?.colors?.error?.main }}
                  >
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-white font-medium hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  style={{ backgroundColor: theme?.colors?.primary?.main }}
                >
                  {isLoading ? (
                    <span className="flex items-center">
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Updating password...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      Update password
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </span>
                  )}
                </button>
              </form>

              <div className="mt-8 text-center">
                <p
                  className="text-sm mb-2"
                  style={{ color: theme?.colors?.text?.secondary }}
                >
                  Remembered your password?
                </p>
                <Link
                  to="/signin"
                  className="inline-flex items-center text-sm font-medium hover:underline transition-colors duration-200"
                  style={{ color: theme?.colors?.primary?.main }}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to sign in
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default RecoverPassword;
