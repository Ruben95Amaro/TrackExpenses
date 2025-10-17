import React, { createContext, useContext, useState, useEffect } from "react";

const LanguageContext = createContext();

const translations = {
  en: {
    app: {
      name: "TRACKEXPENSES",
    },
    common: {
      hideFilters: "Filters",
      admin_dashboard: "Dashboard",
      filters: "filters",
      group_dashboard: "Dashboard",
      listWallets: "List wallets",
      dashboard: "Dashboard",
      expenses: "Expenses",
      incomes: "Incomes",
      users: "Users",
      settings: "Settings",
      logout: "Logout",
      save: "Save",
      cancel: "Cancel",
      filter: "Filter",
      add: "Add",
      total: "Total",
      overview: "Overview",
      amount: "Amount",
      date: "Date",
      category: "Category",
      description: "Description",
      source: "Source",
      status: "Status",
      actions: "Actions",
      login: "Login",
      searchExpenses: "Search expenses...",
      searchIncomes: "Search incomes...",
      expense: "Expense",
      income: "Income",
      expensesOverview: "Expenses Overview",
      incomeOverview: "Income Overview",
      totalExpenses: "Total Expenses",
      totalIncome: "Total Income",
      allRightsReserved: "All rights reserved",
      privacyPolicy: "Privacy Policy",
      termsOfService: "Terms of Service",
      contact: "Contact",
      name: "Name",
      firstName: "First Name",
      familyName: "Family Name",
      email: "Email",
      user: "User",
      add_user: "Add a user",
      all: "All",
      allGroups: "All Groups",
      searchUsers: "Type to search users...",
      fullName: "Full Name",
      group: "Group",
      birthday: "Birthday",
      earnings: "Earnings",
      earning: "Earning",
      calendar: "Calendar",
      options: "Options",
      option: "option",
      forgotPassword: "Forgot Password?",
      password: "Password",
      noAccount: "Don't have an account? Sign Up",
      back: "Back",
      value: "Value",
      notpayed: "Remaining",
      premium: "Premium",
      editProfile: "Edit Profile",
      navigation: "Navigation",
      admin: "Admin",
      adminGroup: "Admin Group",
      account: "Account",
      menu: "Menu",
      save_Changes: "Save Changes",
      phone_number: "Phone number",
      save_Change: "Save Changes",
      new_Password: "New Password",
      new_password: "New Password",
      member: "Member",
      not_provided: "Not Provided",
      signingIn: "Signing in…",
      saving: "Saving…",
      retry: "Retry",
      try_again: "Try again",
      loading: "Loading…",
      click_to_change_photo: "Click to change photo",
      photo_alt: "Profile photo",
      remove_photo: "Remove photo",
      roles: "Roles",
      no_Provide: "No Provide",
      groups: "Groups",
      group_list: "Group List",
      group_admin: "Admin",
      checking: "Checking...",
      active: "Active",
      archived: "Archived",
    confirmDelete: "Are you sure you want to delete?",
    noResults: "No results",
    currency: "Currency",
      primary: "Primary",
      clear: "Clear",
      search: "Search...",
      limpar: "Clear",
      allCategories: "All Categories",
      paid: "Paid",
      wallet: "Wallet",
      select_option: "Select an option",
      create: "Create",
    photo: "Photo",
    fixErrors: "Fix the errors above to continue",
    edit: "Edit" 
       
  },
  tooltip: {
    info: "Information"
  },
  statCard: {
    trendUp: "Up",
    trendDown: "Down"
  },
  card: {
    defaultTitle: "Card"
  },
  wallets: {
      list: "Wallets",
      new: "New Wallet",
      searchPlaceholder: "Search wallets...",
      select: "Select wallet",
      all: "All Wallets",
      one: "Wallet",
      placeholderName : "Wallet name",
      limitReachedTip: "You need a Premium plan to create more wallets.",

    },
    settings: {
      appearance: "Appearance",
      themeMode: "Theme Mode",
      light: "Light",
      dark: "Dark",
      preferences: "Preferences",
      language: "Language",
      notifications: "Notifications",
      security: "Security",
    },
    categories: {
  house: "House",
  car: "Car",
  bills: "Bills",
  utilities: "Utilities",
  health: "Health",
  education: "Education",
  personalCare: "Personal Care",
  entertainment: "Entertainment",
  subscriptions: "Subscriptions",
  debtPayments: "Debt Payments",
  others: "Others",
  salary: "Salary",
    freelance: "Freelance",
    investments: "Investments",
    business: "Business",
    rental_income: "Rental Income",
    gifts: "Gifts",
    bonuses: "Bonuses",
    interest: "Interest",
    dividends: "Dividends",
    other: "Other",
}
,
    auth: {
      loginTitle: "LOGIN",
      forgotTitle: "Forgot your password?",
      forgotSubtitle:
        "No worries! Enter your email and we’ll send you a reset link.",
      sendEmail: "Send email",
      sending: "Sending...",
      rememberPassword: " Remember your password?",
      backToSignIn: "Back to sign in",
      firstName: "First Name",
      familyName: "Family Name",
      confirmPassword: "Confirm Password",
      next: "Next",
      alreadyAccount: "Already have an account? Sign in",
      createTitle: "Create your account",
      createSubtitle: "Just one more step to complete your registration",
      loginSubtitle: "Enter your credentials to access your account",
      firstNamePH: "Enter your First Name...",
      familyNamePH: "Enter your First Name...",
      date: "BirthDay",
      phone: "Phone",
      CodeInvite: "Code Invite",
      inviteCodePH: "Group Code",
      inviteHelp:"You can ask your financial administrator that is already registered to give you. <br /><b>Leave blank if you don't have a group code (you can add or change anytime)</b>",
      createAccount: "Create Account!",
      addUser: {
      title: "Add user",
      unable_to_login: "Unable to login",
      resetSent: "Reset link sent to your email.",
      resetError: "Something went wrong.",
      },
    },
    groups:{
      enter_email: "Enter an email...",
      enter_name: "Enter a name for the group...",
      members: "Members",
      create: "Create Group",
      errors_user_not_found: "Sorry, user not found!",
      errors_invalid_email: "Invalid Email!",
      errors_name_required: "Name is required",
      errors_lookup_bad_response: "User lookup returned an unexpected response.",
      errors_lookup_failed: "Could not verify the user.",
      error_equal_email: "No need to add yourself.",
      no_groups: "No groups found",   
      list_title: "Groups list",
      create_title: "Create Group",
      errors_create_failed: "Could not create the group.",
      errors_no_admin: "Admin group is not found.",
      admin: "Group Administrator",
      confirm_leave: "Are you sure you want to leave the group?",
      not_found: "Group not found.",
      saved: "Group saved",
      delete_failed: "Delete group faill",
      confirm_delete: "Are you sure that you want to delete the group?"
    },
  profile: { 
      title: "Profile",
      edit_Profile: "Edit Profile",
      no_Group_Members: "No group members",
      group_Members: "Group members",
      personal_information: "Personal Information",
      click_To_Change_Picture: "Click on your profile picture to change it",
      not_provided: "Not provided",
      group_information: "Group Information",
      group_name: "Group Name",
      invite_code: "Invite Code",
      copy_invite_code: "Copy invite code",
      group_role: "Group Role",
      group_members: "Group Members",
      no_group_members: "No group members",
      remove_member: "Remove member",
      password_leave_empty: "Leave empty to keep current password",
      retry_loading_profile: "Retry loading profile",
  enter_first_name: "Enter first name",
  enter_family_name: "Enter family name",
  email: "Email",
  enter_phone_number: "Enter phone number",
  hide_password: "Hide password",
  show_password: "Show password",
  image_invalid_format: "Invalid image format. Use JPG or PNG.",
  image_too_large: "Image is too large (max 5 MB).",
  image_upload_error: "We couldn't upload your image. Please try again.",
  image_error_prefix: "Error:"
  },
    placeholders: {
      email: "Enter your email...",
      password: "Enter your password...",
    },
    session:{
      almostExpire: "Session almost expiring",
      chose_Renew_Or_Logout:"Do you want to renew your session or end it?",
      time_Left: "Remaining time",
      logout: "Log out",
      renew: "Renew"
    }
    ,
    fields: {
      firstName: "First Name",
      firstNamePh: "First Name",
      familyName: "Family Name",
      familyNamePh: "Family Name",
      email: "Email",
      emailPh: "me@example.org",
      birthday: "Birthday",
      birthdayPh: "Date",
      telephone: "Phone",
      telephonePh: "000000000",
      password: "Password",
      passwordPh: "****************",
      confirmPassword: "Confirm Password",
      confirmPasswordPh: "****************"
    },
    errors: {
      firstNameRequired: "First name is required.",
      familyNameRequired: "Family name is required.",
      emailRequired: "Email is required.",
      emailInvalid: "Invalid email format.",
      emailCheckFailed: "Error while verifying email.",
      emailAlreadyRegistered: "Email already registered.",
      passwordRequired: "Password is required.",
      confirmPasswordRequired: "Confirm password is required.",
      passwordsDontMatch: "Passwords do not match.",
      registerFailed: "Error while registering user.",
      couldnt_load_profile: "We couldn't load your profile. Please try again.",
      couldnt_save_changes: "We couldn't save your changes. Please try again.",
      network: "Network error.",
    save: "Could not save.",
    load: "Failed to load.",
    upload: "Could not upload image.",
    notFound: "Not found",
    generic: "Error",
    createEarning: "Could not create earning."
    },
    password: {
      length: "Length: ",
      okLen: "ok (≥8)",
      errLen: "min 8 chars",
      upper: "Uppercase: ",
      needUpper: "need A-Z",
      lower: "Lowercase: ",
      needLower: "need a-z",
      number: "Number: ",
      needNumber: "need 0-9",
      symbol: "Symbol: ",
      needSymbol: "need a symbol"
    },
  premium: {
  title: "Premium",
  free: "Free",
  premium: "Premium",
  perMonth: "/month",
  mostPopular: "Most popular",
  active: "Active",
  upgrade: "Upgrade to Premium",
  manage: "Manage Subscription",
  cancel: "Cancel Premium",
  canceling: "Canceling...",
  enabling: "Enabling...",
  currentPlan: "Current plan",
  chooseFree: "Switch to Free",
  footer: "You can cancel anytime from your account settings.",
  features: {
    expenseTracking: "Expense tracking",
    monthlySummary: "Monthly summary",
    export: "Export",
    groupSharing: "Group sharing",
    prioritySupport: "Priority support"
  },
  errors: {
    enableFail: "Failed to enable premium.",
    cancelFail: "Failed to cancel premium."
  },
},
  expenses: {
    new: "New expense",
    total: "Total",
    paid: "Already paid",
    remaining: "Remaining",
    list: "List Expenses",
    searchPlaceholder: "Search name, description or category...",
    deleteConfirm: "Are you sure you want to delete this expense? This action can’t be undone.",
    
    method: {
      one: "One-off",
      installments: "Installments (credit)",
      recurring: "Recurring",
    },
    installments: {
      count: "Number of installments",
      each: "Each installment ≈",
      note: "(uses “Paid already” as the down payment)",
    },
    recurring: {
      periodicity: "Periodicity",
      repeatCount: "Repetitions (optional)",
    },
    form: {
      defaultName: "Expense",
      name: "Name",
      wallet: "Wallet",
      total: "Total amount",
      paidAlready: "Paid already (optional)",
      startDate: "Start date",
      endDate: "End date (optional)",
      category: "Category",
      notify: "Notify",
      description: "Description",
      categoryPlaceholder: "Type or select a category"
    },
    errors: {
      createExpense: "Could not create expense.",
      network: "Network error while creating expense.",
      invalidDates: "End date cannot be earlier than start date.",
      paidExceeds: "Paid amount cannot exceed total amount."
    },
    kpis: {
      planned: "Planned (all)",
      paid: "Already paid",
      remain: "Remaining"
    },
  },

  qr: {
    title: "Read invoice QR",
    subtitle: "Upload a clear photo of the QR. I'll auto-fill date, value and description.",
    readFromPhoto: "Read QR from photo",
  },
  earnings: {
    list: "Earnings",
    new: "New earning",
    edit: "Edit earning",
    details: "Earning details",
    empty: "No earnings to display.",

    kpi: {
      total: "Total",
      received: "Already received",
      pending: "Remaining"
    },

    form: {
      defaultTitle: "Earning",
      title: "Title",
      notes: "Notes",
      wallet: "Wallet",
      total: "Total amount",
      firstDate: "Start date",
      category: "Category"
    },

    photo: {
      _: "Earning photo (optional)",
      note: "Stored on the earning header. Instances can have their own photos later.",
      view: "View",
      no_photo: "No photo",
      title: "Earning photo"
    },

    method: {
      oneoff: "One-off",
      installments: "Installments (credit)",
      recurring: "Recurring"
    },

    total: "Total",
    installments: "Installments",
    perInstallment: "Per installment",

    installmentsBlock: {
      count: "Number of installments",
      each: "Each installment ≈"
    },

    recurring: {
      periodicity: "Periodicity",
      repeatCount: "Repetitions (optional)"
    },

    table: {
      title: "Title",
      category: "Category",
      total: "Total",
      instances: "Received/Pending",
      start: "Start",
      created: "Created"
    },

    status: {
      title: "Status",
      received: "Received",
      not_received: "Not received",
      pending: "Pending"
    },

    instances: {
      _: "Instances",
      empty: "No instances."
    },

    instance: {
      edit: "Edit instance",
      receivedAmount: "Received amount"
    },

    deleteConfirm: "Delete this earning (and all its instances)?"
  },
   walletGate: {
    title: "A wallet is required",
    message: "We couldn't find any active wallet in your account. You'll be redirected to create your first wallet.",
    redirectIn: "Redirecting in {seconds} second(s)…"
  },

receipt: {
    label: "Receipt / expense photo",
    add: "Add photo",
    change: "Change photo",
    remove: "Remove",
    note: "This is stored on the expense (not the QR reading).",
    noPreview: "No preview",
    clickToEnlarge: "Click to enlarge",
    previewAlt: "Preview",
    modalAlt: "Image (enlarged)"
  },
  periodicity: {
    daily: "Daily",
    weekly: "Weekly",
    monthly: "Monthly",
    yearly: "Yearly",
    endless: "Endless"
  },
  calendar: {
  title: "Expenses calendar",
  today: "Today",
  allWallets: "All wallets",
  wallet: "Wallet",
  user: "User",
  me: "Me",
  allUsers: "All users",
  showInstances: "Show instances",
  showEndDates: "Show end dates",
  legend: {
    instance: "Instance",
    end: "End date",
  },
  dow: {
    1: "Mon",
    2: "Tue",
    3: "Wed",
    4: "Thu",
    5: "Fri",
    6: "Sat",
    7: "Sun",
  },
  instance: "Instance",
  expense: "Expense",
  instanceOf: "Instance of",
  endOf: "End of",
  loading: "Loading…",
},
filters: {
    dateRange: "Date range",
    from: "From",
    to: "To",
    granularity: "Granularity",
    day: "Day",
    week: "Week",
    month: "Month",
    wallet: "Wallet",
    scope: "Scope",
    scope_all: "All wallets",
    scope_primary: "Primary wallet",
    scope_selected: "Selected wallet",
    category: "Category",
    all: "All",
    thisMonth: "This month",
    lastMonth: "Last month",
    last3m: "Last 3 months",
    ytd: "Year to date",
  },
dashboard: {
  title: "Dashboard",
  subtitle: "Overview of your finances",

  filters: {
    wallet_primary: "Primary",
    wallet_all: "All wallets",
    loadingWallets: "Loading wallets…",
    day: "Day",
    week: "Week",
    month: "Month",
    type_both: "Income & Expenses",
    type_income: "Income only",
    type_expense: "Expenses only",
    search: "Search",
    category_all: "All categories"
  },

  kpis: {
    totalIncome: "Total income",
    totalExpense: "Total expense",
    net: "Net balance",
    progress: "Progress (received / paid)",
    progress_hint: "Income received vs. expenses paid",
    walletBalance: "Wallet balance",
    walletBalance_hint: "Received − Paid in selected period"
  },

  charts: {
    evolution: "Evolution",
    categories: "Categories",
    income: "Income",
    expenses: "Expenses",
    status: "Status",
    wallets: "Wallet balances"
  },

  legend: {
    expensesPaid: "Expenses paid",
    expensesPending: "Expenses pending",
    incomePending: "Income pending",
    incomeReceived: "Income received"
  },

  error_title: "Couldn’t load dashboard"
},


  welcome: {
  take_control_of_your: "Take Control of Your",
  finances: "Finances",
  subtitle: "Track your expenses, monitor your income, and achieve your financial goals with our comprehensive financial management platform.",
  get_started: "Get Started",
  features: {
    expense: {
      title: "Expense Tracking",
      desc: "Keep track of every penny with our intuitive expense tracking system."
    },
    income: {
      title: "Income Management",
      desc: "Monitor your income sources and analyze your earning patterns."
    },
    security: {
      title: "Secure Platform",
      desc: "Your financial data is protected with industry-standard security measures."
    }
  }
},
  
  },

 
};

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    const savedLanguage = localStorage.getItem("language");
    return savedLanguage || "en";
  });

  useEffect(() => {
    localStorage.setItem("language", language);
    document.documentElement.lang = language;
  }, [language]);

  const t = (key) => {
    const keys = key.split(".");
    let value = translations[language];
    for (const k of keys) {
      value = value?.[k];
    }
    return value || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
