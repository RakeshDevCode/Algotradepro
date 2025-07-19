import React from 'react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';

interface HeaderProps {
  sidebarOpen: boolean;
   onLogout: () => void;
  setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const Header: React.FC<HeaderProps> = ({ sidebarOpen, setSidebarOpen, onLogout  }) => {
  return (
    <header className="bg-gray-800 text-white flex justify-between items-center p-4 md:hidden">
      <button onClick={() => setSidebarOpen(!sidebarOpen)}>
        {sidebarOpen ? <XMarkIcon className="w-6 h-6" /> : <Bars3Icon className="w-6 h-6" />}
      </button>
      <span className="font-semibold text-lg">AlgoTrade Pro</span>
       <button onClick={onLogout} className="text-sm text-red-600 hover:underline">
        Logout
      </button>
    </header>
  );
};

export default Header;
