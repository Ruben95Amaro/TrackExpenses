import React, { useState } from "react";
import TopBar from "./TopBar";
import SideBar from "./SideBar";
import Footer from "../../Pages/Footer/Footer";

export default function AppShell({
  topbarTitle = "TRACKEXPENSES",
  sidebarItems = [],
  rightSlot,
  sidebarVisible = true,
  children,
  bg = "#F9FAFB",
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: bg }}>
      <TopBar
        title={topbarTitle}
        menuItems={sidebarItems}
        hideOnDesktop={sidebarVisible}   
      />

      <div className="flex flex-1 overflow-hidden">
        {sidebarVisible && (
          <SideBar
            items={sidebarItems}
            collapsed={collapsed}
            onToggle={() => setCollapsed((v) => !v)}
          />
        )}

        <main
          className={`flex-1 min-w-0 ${
            sidebarVisible ? "p-4 md:p-8" : "py-8 px-4"
          } min-h-[1200px]`}
        >
          {rightSlot}
          {children}
        </main>
      </div>

      <Footer />
    </div>
  );
}
