import React, { useState } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";

interface LayoutProps {
  children: React.ReactNode;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, onLogout }) => {
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="flex-1 flex flex-col overflow-auto">
        <Header
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          onLogout={onLogout}
        />
        <main className="p-4 bg-gray-100 flex-1 overflow-auto">{children}</main>
      </div>
      <button
        onClick={onLogout}
        className="text-red-500 hover:text-red-700 font-medium px-4 py-2"
      >
        Logout
      </button>
    </div>
  );
};

export default Layout;
