import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Calendar, Phone } from "lucide-react";

import { useTheme } from "../../styles/Theme/Theme";
import { useLanguage } from "../../utilis/Translate/LanguageContext";
import apiCall from "../../services/ApiCallGeneric/apiCall";

import Card from "../../components/UI/Card";
import Input from "../../components/Form/Input";
import Button from "../../components/Buttons/Button";

import { pageConfigurations, getPasswordValidation } from "../../utilis/Configurations/SigninConfiguration";

export default function SignIn() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const hiddenDateRef = useRef(null);

  const { firstConfigurationPage, secondconfigurationPage } = pageConfigurations();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const openDatePicker = () => {
    if (hiddenDateRef.current?.showPicker) hiddenDateRef.current.showPicker();
    else hiddenDateRef.current?.click();
  };

  const validateEmail = () => {
    const email = formData.email?.trim().toLowerCase() || "";
    const regex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if (!regex.test(email)) {
      setErrors((p) => ({ ...p, email: t("auth.errors.emailInvalid") || "Formato de email inválido" }));
      return false;
    }
    return true;
  };

  const verifyEmail_Bd = async () => {
    const email = formData.email?.trim().toLowerCase();
    if (!email) {
      setErrors((p) => ({ ...p, email: t("auth.errors.emailRequired") || "Email obrigatório" }));
      return false;
    }

    const response = await apiCall.post("/User/EmailCheckInDb", email);
    if (!response.ok) {
      setErrors((p) => ({ ...p, email: response.error?.message || t("auth.errors.emailCheckFailed") || "Erro ao verificar email" }));
      return false;
    }
    if (response.data === true) {
      setErrors((p) => ({ ...p, email: t("auth.errors.emailAlreadyRegistered") || "Email já registado" }));
      return false;
    }
    return true;
  };

  const validatePasswords = () => {
    const pwd = formData.password || "";
    const confirm = formData.confirmpassword || "";
    if (pwd !== confirm) {
      setErrors((p) => ({ ...p, confirmpassword: t("auth.errors.passwordsDontMatch") || "As passwords não coincidem." }));
      return false;
    }
    const list = getPasswordValidation(pwd);
    if (list.some((r) => !r.rule)) {
      setErrors((p) => ({ ...p, password: list.map((r) => `${r.label}${r.rule ? r.valid : r.error}`) }));
      return false;
    }
    return true;
  };

  const handleNext = async (e) => {
    e.preventDefault();
    if (!validateEmail()) return;
    if (!(await verifyEmail_Bd())) return;
    if (!validatePasswords()) return;
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const payload = { ...formData };
    const response = await apiCall.post("/User/Register", payload);

    setSubmitting(false);
    if (!response.ok) {
      setErrors((p) => ({ ...p, submit: response.error.message }));
      return;
    }
    navigate("/login");
  };

  return (
    <div className="flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <Card
        className="max-w-md w-full p-8 rounded-2xl shadow-2xl"
        style={{
          backgroundColor: theme.colors.background.paper,
          boxShadow: `0 25px 50px -12px ${theme.colors.primary.dark}3D`,
        }}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-2" style={{ color: theme.colors.text.primary }}>
            {t("auth.createTitle") || "Criar Conta"}
          </h2>
          <p className="text-sm" style={{ color: theme.colors.text.secondary }}>
            {t("auth.createSubtitle") || "Só falta um passo para concluíres o registo"}
          </p>
        </div>

        <form onSubmit={step === 1 ? handleNext : handleSubmit} className="space-y-6">
          {step === 1 &&
            firstConfigurationPage.map((field) => (
              <Input
                key={field.lower}
                name={field.lower}
                label={field.label}
                placeholder={field.placeholder}
                type={field.type}
                value={formData[field.lower] || ""}
                onChange={handleChange}
                leftIcon={field.icon}
                error={errors[field.lower]}
              />
            ))}

          {step === 2 &&
            secondconfigurationPage.map((field) =>
              field.lower === "birthday" ? (
                <div key="birthday">
                  <label className="block text-sm mb-2" style={{ color: theme.colors.text.secondary }}>
                    {field.label}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      readOnly
                      value={formData.birthday || ""}
                      placeholder={field.placeholder}
                      className="w-full h-11 rounded-xl border px-4 pr-11"
                      onClick={openDatePicker}
                      style={{
                        backgroundColor: theme.colors.background.paper,
                        color: theme.colors.text.primary,
                        borderColor: theme.colors.secondary.light,
                      }}
                    />
                    <button
                      type="button"
                      onClick={openDatePicker}
                      className="absolute inset-y-0 right-0 px-3 flex items-center opacity-80 hover:opacity-100"
                    >
                      <Calendar className="h-5 w-5" />
                    </button>
                    <input
                      ref={hiddenDateRef}
                      type="date"
                      value={formData.birthday || ""}
                      onChange={handleChange}
                      name="birthday"
                      className="sr-only"
                    />
                  </div>
                </div>
              ) : field.lower === "phonenumber" ? (
                <Input
                  key={field.lower}
                  name={field.lower}
                  label={field.label}
                  placeholder={field.placeholder}
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={formData[field.lower] || ""}
                  onChange={(e) => {
                    const onlyDigits = (e.target.value || "").replace(/\D/g, "");
                    handleChange({ target: { name: field.lower, value: onlyDigits } });
                  }}
                  onKeyDown={(e) => {
                    const blocked = ["e", "E", "+", "-", ".", ","];
                    if (blocked.includes(e.key)) e.preventDefault();
                  }}
                  leftIcon={field.icon}
                  error={errors[field.lower]}
                />
              ) : (
                <Input
                  key={field.lower}
                  name={field.lower}
                  label={field.label}
                  placeholder={field.placeholder}
                  type={field.type}
                  value={formData[field.lower] || ""}
                  onChange={handleChange}
                  leftIcon={field.icon}
                  error={errors[field.lower]}
                />
              )
            )}

          {errors.submit && (
            <p className="text-sm text-center" style={{ color: theme.colors.error.main }}>
              {errors.submit}
            </p>
          )}

          <div className="pt-2">
            {step === 1 ? (
<Button
  type="submit"
  size="md"
  variant="primary"
  fullWidth
  className="!h-11 !px-6 !rounded-xl leading-none"
>
  {t("auth.next") || "Seguinte"}
</Button>
            ) : (
<div className="grid grid-cols-2 gap-3">
  <Button
    variant="secondary"
    size="md"
    onClick={() => setStep(1)}
    fullWidth
    className="!h-11 !px-6 !rounded-xl leading-none"
  >
    {t("common.back") || "Voltar"}
  </Button>

  <Button
    type="submit"
    size="md"
    disabled={submitting}
    fullWidth
    className="!h-11 !px-6 !rounded-xl leading-none"
    aria-busy={submitting}
  >
    {submitting
      ? t("common.saving") || "A guardar..."
      : t("auth.createAccount") || "Criar Conta"}
  </Button>
</div>
            )}
          </div>

          <div className="text-center pt-2">
            <Link to="/Login" className="text-sm hover:underline" style={{ color: theme.colors.primary.main }}>
              {t("auth.alreadyAccount") || "Já tens conta? Entrar"}
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
