import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail } from "lucide-react";
import { useTheme } from "../../styles/Theme/Theme";
import Button from "../../components/Buttons/Button";
import Input from "../../components/Form/Input";
import Card from "../../components/UI/Card";
import apiCall from "../../services/ApiCallGeneric/apiCall";

const isValidEmail = (v) => /\S+@\S+\.\S+/.test(v);
const USE_RAW_STRING = true;

const ForgotPassword = () => {
  const { theme } = useTheme();

  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [isError, setIsError] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValidEmail(email)) {
      setMessage("Invalid email address.");
      setIsError(true);
      return;
    }

    setSubmitting(true);
    setMessage(null);
    setIsError(false);

    try {
      const payload = USE_RAW_STRING
        ? JSON.stringify(email.trim())
        : { email: email.trim() };

      const res = await apiCall.post("/User/Forgot-password", payload, {
        validateStatus: () => true,
        headers: {
          "Content-Type": "application/json",
        },
        ...(USE_RAW_STRING ? { transformRequest: [(d) => d] } : {}),
      });

      if (res?.status < 200 || res?.status >= 300) {
        const apiMsg =
          res?.data?.message ||
          "Unable to send reset link. Please check your email and try again.";
        throw new Error(apiMsg);
      }

      const successMsg =
        res?.data?.message ||
        "We’ve sent a password reset link to your email.";
      setMessage(successMsg);
      setIsError(false);
    } catch (err) {
      const msg =
        err?.message ||
        "Unable to send reset link. Please check your email and try again.";
      setMessage(msg);
      setIsError(true);
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit = isValidEmail(email);

  return (
    <div className="flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <Card
        className="w-full max-w-md"
        style={{
          backgroundColor: theme.colors.background.paper,
          boxShadow: `0 25px 50px -12px ${theme.colors.primary.dark}3D`,
        }}
      >
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div
            className="w-14 h-14 flex items-center justify-center rounded-full"
            style={{ backgroundColor: theme?.colors?.primary?.light }}
          >
            <Mail className="h-7 w-7 text-white" />
          </div>
        </div>

        {/* Title */}
        <h2
          className="text-2xl font-bold mb-2 text-center"
          style={{ color: theme?.colors?.text?.primary }}
        >
          Forgot your password?
        </h2>

        {/* Subtitle */}
        <p
          className="text-sm mb-6 text-center"
          style={{ color: theme?.colors?.text?.secondary }}
        >
          No worries! Enter your email and we’ll send you a reset link.
        </p>

        {/* Form */}
        <form className="space-y-3" onSubmit={handleSubmit} noValidate>
          <Input
            type="email"
            name="email"
            placeholder="Enter your email..."
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail className="h-5 w-5 text-gray-400" />}
            required
          />

          <Button
            type="submit"
            size="md"
            variant="primary"
            fullWidth
            disabled={submitting || !canSubmit}
            className="!h-11 !px-6 !rounded-xl leading-none"
            aria-busy={submitting}
          >
            {submitting ? "Sending..." : "Send email"}
          </Button>
        </form>

        {message && (
          <p
            className="mt-4 text-sm text-center"
            role="status"
            aria-live="polite"
            style={{
              color: isError
                ? theme?.colors?.error?.main
                : theme?.colors?.success?.main,
            }}
          >
            {message}
          </p>
        )}

        {/* Back link */}
        <div className="mt-6 text-sm flex flex-col items-center">
          <span style={{ color: theme?.colors?.text?.secondary }}>
            Remember your password?
          </span>
          <Link
            to="/login"
            className="font-medium hover:underline mt-1"
            style={{ color: theme?.colors?.primary?.main }}
          >
            Back to sign in
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default ForgotPassword;
