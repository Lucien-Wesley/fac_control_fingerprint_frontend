import React from 'react';
import { NavLink } from 'react-router-dom';
import { Users, UserCheck, Settings, Home, Activity } from 'lucide-react';

const Sidebar: React.FC = () => {
  const navItems = [
    { to: '/', icon: Home, label: 'Tableau de bord' },
    { to: '/students', icon: Users, label: 'Étudiants' },
    { to: '/professors', icon: UserCheck, label: 'Professeurs' },
    { to: '/access-logs', icon: Activity, label: "Journaux d'accès" },
  ];

  const bottomItems = [
    { to: '/arduino-settings', icon: Settings, label: 'Paramètres Arduino' },
  ];

  return (
    <div className="fixed left-0 top-0 bg-[#002d00ff] text-white w-64 h-screen overflow-y-auto">
      <div className="p-4 flex flex-col h-full">
        {/* Branding */}
        <div className="flex items-center mb-6">
          <div className="flex-shrink-0 flex items-center">
            <div className="h-8 w-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">BM</span>
            </div>
            <span className="ml-3 text-lg font-semibold text-gray-200">Campus Access</span>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-200 mb-4"> </h2>

          <nav className="space-y-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-green-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`
                }
              >
                <item.icon className="h-5 w-5 mr-3" />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="mt-auto pt-4 border-t border-gray-700">
          <nav className="space-y-2">
            {bottomItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-green-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`
                }
              >
                <item.icon className="h-5 w-5 mr-3" />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;