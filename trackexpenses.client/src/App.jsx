import React, { useEffect, useContext, useState, useMemo } from "react";
import { Routes, Route } from "react-router-dom";
import { useTheme } from "./styles/Theme/Theme";
import { useLanguage } from "./utilis/Translate/LanguageContext";
import AuthContext from "./services/Authentication/AuthContext";
import apiCall from "./services/ApiCallGeneric/apiCall";

import AppShell from "./components/Layouts/AppShell";
import SessionPopup from "./Pages/Autentication/SessionPopup";

import RequireAuth from "./services/Authentication/Require";
import NotRequireAuth from "./services/Authentication/NotRequire";
import { AuthTimer_resume } from "./services/MicroServices/AuthTime";

import {
  LineChart,   // dashboard / group dashboard
  Users,             // users / groups
  UserCog,           // group admin / settings
  Shield,            // admin dashboard
ShoppingCart,         // expenses
  CircleDollarSign,  // earnings
  Wallet,            // wallets
  CalendarDays,      // calendar
} from "lucide-react";

// pages
import Welcome from "./Pages/Welcome";
import Dashboard from "./Pages/Dashboards/Dashboard";
import AdminDashboard from "./Pages/Dashboards/AdminDashboard";
import GroupDashboard from "./Pages/Dashboards/GroupDashboard";
import UsersList from "./Pages/Administrador/ListClients";
import EditUser from "./Pages/Administrador/EditUser";
import EditUserProfile from "./Pages/Administrador/EditUser";
import ListExpenses from "./Pages/Expenses/ListExpenses";
import CreateExpense from "./Pages/Expenses/CreateExpense";
import EditExpense from "./Pages/Expenses/EditExpense";
import FinanceCalendar from "./Pages/Calendar/FinanceCalendar";
import ListEarnings from "./Pages/Earnings/ListEarnings";
import CreateEarning from "./Pages/Earnings/CreateEarning";
import EditEarning from "./Pages/Earnings/EditEarning";
import ViewEarning from "./Pages/Earnings/ViewEarning";
import Login from "./Pages/Autentication/Login";
import SignIn from "./Pages/Autentication/SignIn";
import ForgotPassword from "./Pages/Autentication/ForgotPassword";
import RecoverPassword from "./Pages/Autentication/RecoverPassword";
import SettingsPage from "./Pages/Settings";
import ProfilePage from "./Pages/User/Profile";
import PremiumChoicePage from "./Pages/Premium/Prices";
import AddUser from "./Pages/Administrador/AddUser";
import RequireRoles from "./services/Authentication/RequireRoles";
import GroupAdminPage from "./Pages/GroupAdmin/GroupAdminPage";
import GroupsList from "./Pages/GroupAdmin/GroupsList";
import CreateGroup from "./Pages/GroupAdmin/CreateGroup";
import ActivationAccount  from "./services/Authentication/ActivateAccount";
import DeleteAccount from "./services/Authentication/DeleteAccount";
import GroupsEdit from "./Pages/GroupAdmin/GroupEdit";
import ListWallets from "./Pages/Wallet/ListWallets";
import EditWallet from "./Pages/Wallet/EditWallet";
import CreateWallet from "./Pages/Wallet/CreateWallet";
import WalletGate from "./services/Authentication/WalletGate";
import ListGroups from "./Pages/GroupAdmin/GroupsList";

function normalizeGroups(raw) {
  if (!raw) return [];
  const arr = Array.isArray(raw) ? raw : raw.$values || [];
  return arr
    .map(g => {
      const id =
        g.id ?? g.groupId ?? g.Id ?? g.GroupId ?? g.GID ?? g.guid ?? null;
      const name =
        g.name ?? g.groupName ?? g.Name ?? g.GroupName ?? g.title ?? "";
      const mine =
        g.isAdmin ?? g.IsAdmin ?? (g.role === "GROUPADMINISTRATOR") ?? true;
      return id ? { id: String(id), name: String(name), isAdmin: !!mine } : null;
    })
    .filter(Boolean);
}

async function fetchAdminGroups() {
  const tryGet = async (url) => {
    try {
      const res = await apiCall.get(url, { validateStatus: () => true });
      if (res?.status >= 200 && res?.status < 300) return res.data;
    } catch {}
    return null;
  };

  const candidates = [
    "GroupAdmin/MyGroups",
    "Groups/Admin",
    "Groups/ListMine",
    "Group/GetMyGroups",
  ];

  for (const path of candidates) {
    const data = await tryGet(path);
    if (data) {
      const list = normalizeGroups(data);
      const adminOnly = list.filter(g => g.isAdmin);
      return adminOnly.length ? adminOnly : list;
    }
  }
  return [];
}

export default function App() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { roles, isAuthenticated, auth } = useContext(AuthContext);

  useEffect(() => {
    AuthTimer_resume({ earlyMs: 30_000, graceMs: 5000 });
  }, []);

  const [firstAdminGroupId, setFirstAdminGroupId] = useState(null);

  useEffect(() => {
    let alive = true;

    const hasGroupAdmin =
      Array.isArray(roles)
        ? roles.includes("GROUPADMINISTRATOR")
        : String(roles || "").includes("GROUPADMINISTRATOR");

    if (!hasGroupAdmin) {
      setFirstAdminGroupId(null);
      return;
    }

    (async () => {
      const list = await fetchAdminGroups();
      if (!alive) return;
      setFirstAdminGroupId(list[0]?.id || null);
    })();

    return () => { alive = false; };
  }, [roles]);

  // Menu
  const items = useMemo(
    () => [
      {
        to: "/admin/dashboard",
        icon: LineChart,
        label: "common.admin_dashboard",
        role: "ADMINISTRATOR",
        section: "ADMIN",
      },
      {
        to: "/Users",
        icon: Users,
        label: "common.users",
        role: "ADMINISTRATOR",
        section: "ADMIN",
      },

      firstAdminGroupId
        ? {
            to: `/groups/${firstAdminGroupId}/dashboard`,
            icon: LineChart,
            label: "common.group_dashboard",
            role: "GROUPADMINISTRATOR",
            section: "GROUPS",
          }
        : {
            to: "/GroupsList",
            icon: Users,
            label: "common.group_dashboard",
            role: ["GROUPADMINISTRATOR", "GROUPMEMBER"],
            section: "GROUPS",
          },
    
      {
        to: "/GroupsList",
        icon: Users,
        label: "common.group_list",
        role: "USER",
        section: "GROUPS",
      },
      {
        to: "/ListWallets",
        icon: Wallet,
        label: "common.listWallets",
        role: "USER",
        section: "FINANCES",
      },

      {
        to: "/Dashboard",
        icon: LineChart,
        label: "common.dashboard",
        role: "USER",
        section: "FINANCES",
      },
      {
        to: "/Expenses",
        icon: ShoppingCart,
        label: "common.expenses",
        role: "USER",
        section: "FINANCES",
      },
      {
        to: "/Earnings",
        icon: CircleDollarSign,
        label: "common.earnings",
        role: "USER",
        section: "FINANCES",
      },
      
      {
        to: "/Calendar",
        icon: CalendarDays,
        label: "common.calendar",
        role: "USER",
        section: "FINANCES",
      },
    ],
    [t, roles, firstAdminGroupId]
  );

  return (
    <AppShell
      topbarTitle={"TRACKEXPENSES"}
      sidebarItems={items}
      sidebarVisible={isAuthenticated}
      bg={theme?.colors?.background?.default || "#F9FAFB"}
    >
      <SessionPopup />

      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="*" element={<Welcome />} />

        <Route element={<NotRequireAuth />}>
          <Route path="/Login" element={<Login />} />
          <Route path="/Register" element={<SignIn />} />
          <Route path="/ForgotPassword" element={<ForgotPassword />} />
          <Route path="/RecoverPassword" element={<RecoverPassword />} />
          <Route path="/ActivationAccount" element={<ActivationAccount />} />
          <Route path="/DeleteAccount" element={<DeleteAccount />} />
        </Route>

        <Route element={<RequireRoles allow={["PREMIUM", "GROUPADMINISTRATOR"]} />}>
          <Route path="/Groups/Edit/:id" element={<GroupsEdit />} />
          <Route path="/GroupAdminPage" element={<GroupAdminPage />} />
          <Route path="/GroupsList" element={<GroupsList />} />
          <Route path="/CreateGroup" element={<CreateGroup />} />
          <Route path="/ListGroups" element={<ListGroups />} />
          
        </Route>

        <Route element={<RequireAuth />}>
          <Route element={
            <WalletGate
              redirectTo="/ListWallets"
              delayMs={5200}
              skipPaths={["/ListWallets", "/auth"]}
            />
          }>
            <Route path="/EditWallet/:id" element={<EditWallet />} />
            <Route path="/Dashboard" element={<Dashboard />} />

            <Route element={<RequireRoles allow="GROUPADMINISTRATOR" />}>
              <Route path="/groups/:groupId/dashboard" element={<GroupDashboard />} />
            </Route>

            <Route element={<RequireRoles allow="ADMINISTRATOR" />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
            </Route>

            <Route path="/Earnings" element={<ListEarnings />} />
            <Route path="/CreateEarning" element={<CreateEarning />} />
            <Route path="/Earnings/Edit/:id" element={<EditEarning />} />
            <Route path="/Earnings/View/:id" element={<ViewEarning />} />

            <Route path="/Expenses" element={<ListExpenses />} />
            <Route path="/CreateExpense" element={<CreateExpense />} />
            <Route path="/Expenses/Edit/:id" element={<EditExpense />} />
            <Route path="/Calendar" element={<FinanceCalendar />} />
          </Route>

          <Route path="/ListWallets" element={<ListWallets />} />
          <Route path="/CreateWallet" element={<CreateWallet />} />

          <Route path="/Users" element={<UsersList />} />
          <Route path="/Users/edit/:id" element={<EditUser />} />
          <Route path="/users/edit/:id/:email" element={<EditUserProfile />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/Profile" element={<ProfilePage />} />
          <Route path="/Premium" element={<PremiumChoicePage />} />
          <Route path="/users/new" element={<AddUser />} />
        </Route>
      </Routes>
    </AppShell>
  );
}
