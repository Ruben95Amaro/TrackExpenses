import { useTheme } from "../../styles/Theme/Theme";
import { Lock, Mail, User, Phone, Calendar } from "lucide-react";

export function pageConfigurations() {
  const { theme } = useTheme();
  return {
    firstConfigurationPage: [
      {
        label: "Email",
        lower: "email",
        placeholder: "me@example.org",
        Required: true,
        type: "email",
        value: "",
        icon: (
          <Mail
            className="h-5 w-5"
            style={{ color: theme?.colors?.text?.secondary }}
          />
        ),
      },
      {
        label: "Password",
        lower: "password",
        placeholder: "****************",
        Required: true,
        type: "password",
        pattern: "(?=.*d)(?=.*[a-z])(?=.*[A-Z]).{8,}",
        value: "",
        icon: (
          <Lock
            className="h-5 w-5"
            style={{ color: theme?.colors?.text?.secondary }}
          />
        ),
      },
      {
        label: "Confirm Password",
        lower: "confirmpassword",
        placeholder: "****************",
        Required: true,
        type: "password",
        pattern: "",
        value: "",
        icon: (
          <Lock
            className="h-5 w-5"
            style={{ color: theme?.colors?.text?.secondary }}
          />
        ),
      },
    ],
    secondconfigurationPage: [
      {
        label: "First Name",
        lower: "firstname",
        placeholder: "First Name",
        Required: true,
        type: "text",
        pattern: "",
        value: "",
        icon: (
          <User
            className="h-5 w-5"
            style={{ color: theme?.colors?.text?.secondary }}
          />
        ),
      },
      {
        label: "Family Name",
        lower: "familyname",
        placeholder: "Family Name",
        Required: true,
        type: "text",
        pattern: "",
        value: "",
        icon: (
          <User
            className="h-5 w-5"
            style={{ color: theme?.colors?.text?.secondary }}
          />
        ),
      },
      {
        label: "Date",
        lower: "birthday",
        placeholder: "Date",
        Required: true,
        type: "date",
        pattern: "",
        value: "",
        icon: (
          <Calendar
            className="h-5 w-5"
            style={{ color: theme?.colors?.text?.secondary }}
            max:true
          />
        ),
        max: true,
      },
      {
        label: "Phone",
        lower: "phonenumber",
        placeholder: "00000000000",
        Required: false,
        type: "tel",
        pattern: "^d+$",
        value: "",
      },
      {
        label: "Code Invite",
        lower: "codeinvite",
        placeholder: "Group Code",
        type: "Text",
        Required: false,
        pattern: "",
        value: "",
        icon: "",
      },
    ],
  };
}

export function getPasswordValidation(password) {
  return [
    {
      label: "Password must be at least 16 characters ",
      rule: password.length >= 16,
      error: "❌",
      valid: "✅",
    },
    {
      label: "Password must have 1 lowercase character ",
      rule: /[a-z]/.test(password),
      error: "❌",
      valid: "✅",
    },
    {
      label: "Password must have 1 uppercase character ",
      rule: /[A-Z]/.test(password),
      error: "❌",
      valid: "✅",
    },
    {
      label: "Password must have 1 digit ",
      rule: /\d/.test(password),
      error: "❌",
      valid: "✅",
    },
    {
      label: "Password must have at least 1 special character ",
      rule: /[^a-zA-Z0-9]/.test(password),
      error: "❌",
      valid: "✅",
    },
  ];
}
