import React, { createContext, useContext, useState, useEffect } from "react";

const LanguageContext = createContext();

const translations = {
  en: {
    app: {
      name: "TRACKEXPENSES",
    },
    common: {
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
    title: "Read invoice QR (Portugal)",
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

  pt: {
    app: {
      name: "TRACKEXPENSES",
    },
    common: {
      admin_dashboard: "Painel de Administração",
      group_dashboard: "Painel do Grupo",
      listWallets: "Listar carteiras",
      dashboard: "Painel",
      expenses: "Despesas",
      incomes: "Receitas",
      users: "Utilizadores",
      settings: "Configurações",
      logout: "Terminar sessão",
      save: "Guardar",
      cancel: "Cancelar",
      filter: "Filtrar",
      add: "Adicionar",
      total: "Total",
      overview: "Resumo",
      amount: "Valor",
      date: "Data",
      category: "Categoria",
      description: "Descrição",
      source: "Origem",
      status: "Estado",
      actions: "Ações",
      login: "Iniciar sessão",
      searchExpenses: "Pesquisar despesas...",
      searchIncomes: "Pesquisar receitas...",
      expense: "Despesa",
      income: "Receita",
      expensesOverview: "Resumo de Despesas",
      incomeOverview: "Resumo de Receitas",
      totalExpenses: "Total de Despesas",
      totalIncome: "Total de Receitas",
      allRightsReserved: "Todos os direitos reservados",
      privacyPolicy: "Política de Privacidade",
      termsOfService: "Termos de Serviço",
      contact: "Contacto",
      name: "Nome",
      firstName: "Primeiro Nome",
      familyName: "Apelido",
      email: "Email",
      user: "Utilizador",
      add_user: "Adicionar utilizador",
      all: "Todos",
      allGroups: "Todos os Grupos",
      searchUsers: "Escreve para pesquisar utilizadores...",
      fullName: "Nome completo",
      group: "Grupo",
      birthday: "Data de Nascimento",
      earnings: "Ganhos",
      earning: "Ganho",
      calendar: "Calendário",
      options: "Opções",
      option: "opção",
      forgotPassword: "Esqueceste-te da senha?",
      password: "Senha",
      noAccount: "Ainda não tens conta? Regista-te",
      back: "Voltar",
      value: "Valor",
      notpayed: "Por pagar",
      premium: "Premium",
      editProfile: "Editar Perfil",
      navigation: "Navegação",
      admin: "Administrador",
      adminGroup: "Administrador do Grupo",
      account: "Conta",
      menu: "Menu",
      save_Changes: "Guardar Alterações",
      phone_number: "Número de telefone",
      save_Change: "Guardar Alteração",
      new_Password: "Nova senha",
      new_password: "Nova senha",
      member: "Membro",
      not_provided: "Não fornecido",
      signingIn: "A iniciar sessão…",
      saving: "A guardar…",
      retry: "Tentar novamente",
      try_again: "Tenta de novo",
      loading: "A carregar…",
      click_to_change_photo: "Clica para mudar a foto",
      photo_alt: "Foto de perfil",
      remove_photo: "Remover foto",
      roles: "Papéis",
      no_Provide: "Não fornecido",
      groups: "Grupos",
      group_list: "Lista de Grupos",
      group_admin: "Administrador",
      checking: "A verificar...",
      active: "Ativo",
      archived: "Arquivado",
      confirmDelete: "Tens a certeza que queres eliminar?",
      noResults: "Sem resultados",
      currency: "Moeda",
      primary: "Principal",
      clear: "Limpar",
      search: "Pesquisar...",
      allCategories: "Todas as Categorias",
      paid: "Pago",
      wallet: "Carteira",
      select_option: "Seleciona uma opção",
      create: "Criar",
      photo: "Foto",
      fixErrors: "Corrige os erros acima para continuar",
      edit: "Editar"
    },
    tooltip: {
      info: "Informação"
    },
    statCard: {
      trendUp: "Subida",
      trendDown: "Descida"
    },
    card: {
      defaultTitle: "Cartão"
    },
    wallets: {
      list: "Carteiras",
      new: "Nova Carteira",
      searchPlaceholder: "Pesquisar carteiras...",
      select: "Selecionar carteira",
      all: "Todas as Carteiras",
      one: "Carteira",
      placeholderName: "Nome da carteira",
    },
    settings: {
      appearance: "Aparência",
      themeMode: "Modo de Tema",
      light: "Claro",
      dark: "Escuro",
      preferences: "Preferências",
      language: "Idioma",
      notifications: "Notificações",
      security: "Segurança",
    },
    categories: {
      house: "Casa",
      car: "Carro",
      bills: "Faturas",
      utilities: "Utilitários",
      health: "Saúde",
      education: "Educação",
      personalCare: "Cuidados Pessoais",
      entertainment: "Entretenimento",
      subscriptions: "Subscrições",
      debtPayments: "Pagamentos de Dívidas",
      others: "Outros",
      salary: "Salário",
      freelance: "Freelance",
      investments: "Investimentos",
      business: "Negócios",
      rental_income: "Rendas",
      gifts: "Presentes",
      bonuses: "Bónus",
      interest: "Juros",
      dividends: "Dividendos",
      other: "Outro",
    },
    auth: {
      loginTitle: "ENTRAR",
      forgotTitle: "Esqueceste-te da senha?",
      forgotSubtitle: "Sem problema! Introduz o teu email e enviaremos um link de recuperação.",
      sendEmail: "Enviar email",
      sending: "A enviar...",
      rememberPassword: "Lembras-te da tua senha?",
      backToSignIn: "Voltar ao login",
      firstName: "Primeiro Nome",
      familyName: "Apelido",
      confirmPassword: "Confirmar senha",
      next: "Seguinte",
      alreadyAccount: "Já tens conta? Inicia sessão",
      createTitle: "Cria a tua conta",
      createSubtitle: "Só mais um passo para concluíres o registo",
      loginSubtitle: "Insere as tuas credenciais para aceder",
      firstNamePH: "Escreve o teu nome...",
      familyNamePH: "Escreve o teu apelido...",
      date: "Data de nascimento",
      phone: "Telefone",
      CodeInvite: "Código de convite",
      inviteCodePH: "Código de grupo",
      inviteHelp: "Pede ao teu administrador financeiro que já esteja registado para te dar um. <br /><b>Deixa em branco se não tiveres (podes adicionar mais tarde)</b>",
      createAccount: "Criar Conta!",
      addUser: {
        title: "Adicionar utilizador",
        unable_to_login: "Não foi possível iniciar sessão",
        resetSent: "Link de recuperação enviado para o teu email.",
        resetError: "Algo correu mal.",
      },
    },
    groups: {
      enter_email: "Escreve um email...",
      enter_name: "Escreve o nome do grupo...",
      members: "Membros",
      create: "Criar Grupo",
      errors_user_not_found: "Utilizador não encontrado!",
      errors_invalid_email: "Email inválido!",
      errors_name_required: "O nome é obrigatório",
      errors_lookup_bad_response: "A pesquisa do utilizador retornou um erro inesperado.",
      errors_lookup_failed: "Não foi possível verificar o utilizador.",
      error_equal_email: "Não precisas de adicionar-te a ti mesmo.",
      no_groups: "Sem grupos",
      list_title: "Lista de Grupos",
      create_title: "Criar Grupo",
      errors_create_failed: "Não foi possível criar o grupo.",
      errors_no_admin: "Administrador de grupo não encontrado.",
      admin: "Administrador do Grupo",
      confirm_leave: "Tens a certeza que queres sair do grupo?",
      not_found: "Grupo não encontrado.",
      saved: "Grupo guardado",
      delete_failed: "Erro ao eliminar grupo",
      confirm_delete: "Tens a certeza que queres eliminar o grupo?"
    },
    profile: {
      title: "Perfil",
      edit_Profile: "Editar Perfil",
      no_Group_Members: "Sem membros no grupo",
      group_Members: "Membros do grupo",
      personal_information: "Informações Pessoais",
      click_To_Change_Picture: "Clica na foto de perfil para alterar",
      not_provided: "Não fornecido",
      group_information: "Informações do Grupo",
      group_name: "Nome do Grupo",
      invite_code: "Código de Convite",
      copy_invite_code: "Copiar código",
      group_role: "Papel no grupo",
      group_members: "Membros do grupo",
      no_group_members: "Sem membros",
      remove_member: "Remover membro",
      password_leave_empty: "Deixa em branco para manter a senha atual",
      retry_loading_profile: "Tentar novamente",
      enter_first_name: "Escreve o nome",
      enter_family_name: "Escreve o apelido",
      email: "Email",
      enter_phone_number: "Escreve o telefone",
      hide_password: "Esconder senha",
      show_password: "Mostrar senha",
      image_invalid_format: "Formato inválido. Usa JPG ou PNG.",
      image_too_large: "Imagem demasiado grande (máx 5 MB).",
      image_upload_error: "Não conseguimos carregar a imagem.",
      image_error_prefix: "Erro:"
    },
    placeholders: {
      email: "Escreve o teu email...",
      password: "Escreve a tua senha...",
    },
    session: {
      almostExpire: "Sessão quase a expirar",
      chose_Renew_Or_Logout: "Queres renovar a sessão ou terminar?",
      time_Left: "Tempo restante",
      logout: "Sair",
      renew: "Renovar"
    },
    fields: {
      firstName: "Primeiro Nome",
      firstNamePh: "Primeiro Nome",
      familyName: "Apelido",
      familyNamePh: "Apelido",
      email: "Email",
      emailPh: "me@example.org",
      birthday: "Data de Nascimento",
      birthdayPh: "Data",
      telephone: "Telefone",
      telephonePh: "000000000",
      password: "Senha",
      passwordPh: "****************",
      confirmPassword: "Confirmar senha",
      confirmPasswordPh: "****************"
    },
    errors: {
      firstNameRequired: "O nome é obrigatório.",
      familyNameRequired: "O apelido é obrigatório.",
      emailRequired: "O email é obrigatório.",
      emailInvalid: "Formato de email inválido.",
      emailCheckFailed: "Erro ao verificar email.",
      emailAlreadyRegistered: "Email já registado.",
      passwordRequired: "A senha é obrigatória.",
      confirmPasswordRequired: "Confirmação da senha obrigatória.",
      passwordsDontMatch: "As senhas não coincidem.",
      registerFailed: "Erro ao registar utilizador.",
      couldnt_load_profile: "Não conseguimos carregar o perfil.",
      couldnt_save_changes: "Não conseguimos guardar as alterações.",
      network: "Erro de rede.",
      save: "Não foi possível guardar.",
      load: "Erro ao carregar.",
      upload: "Erro ao carregar imagem.",
      notFound: "Não encontrado",
      generic: "Erro",
      createEarning: "Não foi possível criar ganho."
    },
    password: {
      length: "Comprimento: ",
      okLen: "ok (≥8)",
      errLen: "mín 8 caracteres",
      upper: "Maiúsculas: ",
      needUpper: "precisa A-Z",
      lower: "Minúsculas: ",
      needLower: "precisa a-z",
      number: "Número: ",
      needNumber: "precisa 0-9",
      symbol: "Símbolo: ",
      needSymbol: "precisa símbolo"
    },
    premium: {
      title: "Premium",
      free: "Grátis",
      premium: "Premium",
      perMonth: "/mês",
      mostPopular: "Mais popular",
      active: "Ativo",
      upgrade: "Ativar Premium",
      manage: "Gerir Subscrição",
      cancel: "Cancelar Premium",
      canceling: "A cancelar...",
      enabling: "A ativar...",
      currentPlan: "Plano atual",
      chooseFree: "Mudar para Grátis",
      footer: "Podes cancelar a qualquer momento nas definições da conta.",
      features: {
        expenseTracking: "Controlo de despesas",
        monthlySummary: "Resumo mensal",
        export: "Exportar",
        groupSharing: "Partilha em grupo",
        prioritySupport: "Suporte prioritário"
      },
      errors: {
        enableFail: "Falha ao ativar premium.",
        cancelFail: "Falha ao cancelar premium."
      }
    },
    expenses: {
      new: "Nova despesa",
      total: "Total",
      paid: "Pago",
      remaining: "Por pagar",
      list: "Lista de Despesas",
      searchPlaceholder: "Pesquisar nome, descrição ou categoria...",
      deleteConfirm: "Tens a certeza que queres eliminar esta despesa? Esta ação não pode ser revertida.",
      method: {
        one: "Única",
        installments: "Prestações (crédito)",
        recurring: "Recorrente",
      },
      installments: {
        count: "N.º de prestações",
        each: "Cada prestação ≈",
        note: "(usa “Já pago” como entrada)",
      },
      recurring: {
        periodicity: "Periodicidade",
        repeatCount: "Repetições (opcional)",
      },
      form: {
        defaultName: "Despesa",
        name: "Nome",
        wallet: "Carteira",
        total: "Montante total",
        paidAlready: "Já pago (opcional)",
        startDate: "Data de início",
        endDate: "Data de fim (opcional)",
        category: "Categoria",
        notify: "Notificar",
        description: "Descrição",
        categoryPlaceholder: "Escreve ou seleciona categoria"
      },
      errors: {
        createExpense: "Não foi possível criar despesa.",
        network: "Erro de rede.",
        invalidDates: "Data de fim não pode ser anterior à inicial.",
        paidExceeds: "Valor pago não pode exceder total."
      },
      kpis: {
        planned: "Planeado",
        paid: "Pago",
        remain: "Por pagar"
      }
    },
    qr: {
      title: "Ler QR da fatura (Portugal)",
      subtitle: "Carrega uma foto do QR. Preenche automaticamente data, valor e descrição.",
      readFromPhoto: "Ler QR da foto",
    },
    earnings: {
      list: "Ganhos",
      new: "Novo ganho",
      edit: "Editar ganho",
      details: "Detalhes do ganho",
      empty: "Sem ganhos.",
      kpi: {
        total: "Total",
        received: "Recebido",
        pending: "Por receber"
      },
      form: {
        defaultTitle: "Ganho",
        title: "Título",
        notes: "Notas",
        wallet: "Carteira",
        total: "Montante total",
        firstDate: "Data de início",
        category: "Categoria"
      },
      photo: {
        _: "Foto do ganho (opcional)",
        note: "Guardada no cabeçalho do ganho. Instâncias podem ter fotos próprias.",
        view: "Ver",
        no_photo: "Sem foto",
        title: "Foto do ganho"
      },
      method: {
        oneoff: "Único",
        installments: "Prestações (crédito)",
        recurring: "Recorrente"
      },
      total: "Total",
      installments: "Prestações",
      perInstallment: "Por prestação",
      installmentsBlock: {
        count: "N.º de prestações",
        each: "Cada prestação ≈"
      },
      recurring: {
        periodicity: "Periodicidade",
        repeatCount: "Repetições (opcional)"
      },
      table: {
        title: "Título",
        category: "Categoria",
        total: "Total",
        instances: "Recebido/Por receber",
        start: "Início",
        created: "Criado"
      },
      status: {
        title: "Estado",
        received: "Recebido",
        not_received: "Não recebido",
        pending: "Pendente"
      },
      instances: {
        _: "Instâncias",
        empty: "Sem instâncias."
      },
      instance: {
        edit: "Editar instância",
        receivedAmount: "Valor recebido"
      },
      deleteConfirm: "Eliminar este ganho (e todas as instâncias)?"
    },
    walletGate: {
      title: "É necessária uma carteira",
      message: "Não encontrámos nenhuma carteira ativa. Vais ser redirecionado para criar uma.",
      redirectIn: "Redirecionar em {seconds} segundo(s)…"
    },
    receipt: {
      label: "Recibo / foto da despesa",
      add: "Adicionar foto",
      change: "Alterar foto",
      remove: "Remover",
      note: "Guardado na despesa (não no QR).",
      noPreview: "Sem pré-visualização",
      clickToEnlarge: "Clica para ampliar",
      previewAlt: "Pré-visualização",
      modalAlt: "Imagem ampliada"
    },
    periodicity: {
      daily: "Diário",
      weekly: "Semanal",
      monthly: "Mensal",
      yearly: "Anual",
      endless: "Sem fim"
    },
    calendar: {
      title: "Calendário de Despesas",
      today: "Hoje",
      allWallets: "Todas as carteiras",
      wallet: "Carteira",
      user: "Utilizador",
      me: "Eu",
      allUsers: "Todos os utilizadores",
      showInstances: "Mostrar instâncias",
      showEndDates: "Mostrar datas de fim",
      legend: {
        instance: "Instância",
        end: "Data de fim",
      },
      dow: {
        1: "Seg",
        2: "Ter",
        3: "Qua",
        4: "Qui",
        5: "Sex",
        6: "Sáb",
        7: "Dom",
      },
      instance: "Instância",
      expense: "Despesa",
      instanceOf: "Instância de",
endOf: "Fim de",
loading: "A carregar…",
},
filters: {
  dateRange: "Intervalo de datas",
  from: "De",
  to: "Até",
  granularity: "Granularidade",
  day: "Dia",
  week: "Semana",
  month: "Mês",
  wallet: "Carteira",
  scope: "Âmbito",
  scope_all: "Todas as carteiras",
  scope_primary: "Carteira principal",
  scope_selected: "Carteira selecionada",
  category: "Categoria",
  all: "Todos",
  thisMonth: "Este mês",
  lastMonth: "Mês passado",
  last3m: "Últimos 3 meses",
  ytd: "Ano até à data",
},
dashboard: {
  title: "Painel",
  subtitle: "Resumo das tuas finanças",

  filters: {
    wallet_primary: "Principal",
    wallet_all: "Todas as carteiras",
    loadingWallets: "A carregar carteiras…",
    day: "Dia",
    week: "Semana",
    month: "Mês",
    type_both: "Receitas e Despesas",
    type_income: "Só Receitas",
    type_expense: "Só Despesas",
    search: "Pesquisar",
    category_all: "Todas as categorias"
  },

  kpis: {
    totalIncome: "Total de receitas",
    totalExpense: "Total de despesas",
    net: "Saldo líquido",
    progress: "Progresso (recebido / pago)",
    progress_hint: "Receitas recebidas vs. despesas pagas",
    walletBalance: "Saldo da carteira",
    walletBalance_hint: "Recebido − Pago no período selecionado"
  },

  charts: {
    evolution: "Evolução",
    categories: "Categorias",
    income: "Receitas",
    expenses: "Despesas",
    status: "Estado",
    wallets: "Saldos das carteiras"
  },

  legend: {
    expensesPaid: "Despesas pagas",
    expensesPending: "Despesas pendentes",
    incomePending: "Receitas pendentes",
    incomeReceived: "Receitas recebidas"
  },

  error_title: "Não foi possível carregar o painel"
},


welcome: {
  take_control_of_your: "Assume o controlo das tuas",
  finances: "Finanças",
  subtitle: "Acompanha as tuas despesas, monitoriza as tuas receitas e atinge os teus objetivos financeiros com a nossa plataforma completa de gestão financeira.",
  get_started: "Começar",
  features: {
    expense: {
      title: "Gestão de Despesas",
      desc: "Controla cada cêntimo com o nosso sistema intuitivo de registo de despesas."
    },
    income: {
      title: "Gestão de Receitas",
      desc: "Monitoriza as tuas fontes de rendimento e analisa os padrões de ganhos."
    },
    security: {
      title: "Plataforma Segura",
      desc: "Os teus dados financeiros estão protegidos com medidas de segurança de nível industrial."
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
