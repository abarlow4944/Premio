import { useState } from 'react'
import {
    Bars3Icon, UserCircleIcon, ChevronDownIcon
} from '@heroicons/react/24/outline'
import { useNavigate, useLocation } from "react-router-dom";
import { useUser } from "../contexts/UserContexts";
import Message from "./Message";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem
} from "./ui/dropdown-menu";

// the visible navbar items based on role
const NAV_ITEMS_BY_ROLE = {
  regular: [
    { label: "Transactions", path: "/transactions" },
    { label: "Promotions", path: "/promotions" },
    { label: "Events", path: "/events" },
  ],
  cashier: [
    { label: "Transactions", path: "/transactions" },
  ],
  manager: [
    { label: "Users", path: "/users" },
    { label: "Transactions", path: "/transactions" },
    { label: "Promotions", path: "/promotions" },
    { label: "Events", path: "/events" },
  ],
  superuser: [
    { label: "Users", path: "/users" },
    { label: "Transactions", path: "/transactions" },
    { label: "Promotions", path: "/promotions" },
    { label: "Events", path: "/events" },
  ],
};

// Role hierarchy for switching: higher role can switch to lower roles
const ROLE_HIERARCHY = ["regular", "cashier", "manager", "superuser"];

// Get available roles to switch to based on current role
const getAvailableSwitchRoles = (currentRole) => {
  if (!currentRole) return [];
  const currentIndex = ROLE_HIERARCHY.indexOf(currentRole);
  if (currentIndex === -1) return [];
  // Can switch to current role or any lower role
  return ROLE_HIERARCHY.slice(0, currentIndex + 1);
};


export default function NavBar() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [switchRoleWarning, setSwitchRoleWarning] = useState(null)
    const navigate = useNavigate();
    const location = useLocation();
    const { role, setRole, visualRole, setVisualRole } = useUser();
    const API_URL = import.meta.env.VITE_API_URL; // API base URL
    
    const isOnUsersPage = location.pathname === '/users';

    const handleLogout = async() => {
        await fetch(`${API_URL}/auth/logout`, { // clear cookies through auth/logout endpoint
            method: "POST",
            credentials: "include",
        });
        
        setRole(null); // clear the role in the context
        setVisualRole(null);
        navigate("/"); // navigate back to login page
    }

    const handleRoleSwitch = (newRole) => {
        if (isOnUsersPage) {
            setSwitchRoleWarning("Role switching is not allowed while on the Users page");
            return;
        }
        setVisualRole(newRole);
    }

    const availableRoles = getAvailableSwitchRoles(role);
    const navItems = NAV_ITEMS_BY_ROLE[visualRole || role] ?? [];

    return (
        <header className='navigation-bar bg-strawberry-red-100 h-[10vh] shadow-[0_4px_6px_-1px_rgba(0,0,0,0.15)]'>
            <nav aria-label="Global" className="mx-auto h-[10vh] flex max-w-8xl items-center justify-between p-6 lg:px-8">
            
            {/* Logo */}
            <div className="flex lg:flex-1 flex-wrap items-center gap-4">
            <a onClick={() => navigate("/home")} className="-m-1.5 p-1.5 hover:cursor-pointer">
                <span className="sr-only">Your Company</span>
                <img
                    alt="Logo"
                    src="./public/logo.png"
                    className="mx-auto h-15 w-auto"
                />
            </a>
            </div>

            {/* Open menu button */}
            <div className="flex lg:hidden">
            <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-flag-red-500 hover:text-strawberry-red-700 hover:cursor-pointer"
            >
                <span className="sr-only">Open main menu</span>
                <Bars3Icon aria-hidden="true" className="size-6" />
            </button>
            </div>

            {/* Navigation items (based on role) */}
            <div className="hidden lg:flex lg:gap-x-8">
          {navItems.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => navigate(item.path)}
              className="text-m font-bold text-flag-red-500 hover:text-strawberry-red-700 hover:cursor-pointer"
            >
              {item.label}
            </button>
          ))}
        </div>

        
        <div className="lg:flex lg:flex-1 lg:justify-end gap-4 flex flex-wrap items-center">
            {/* Role with Switch Dropdown */}
            {availableRoles.length > 1 ? (
              <DropdownMenu>
                <DropdownMenuTrigger className="text-m text-space-indigo-500 hover:text-space-indigo-700 hover:cursor-pointer outline-none flex items-center gap-1">
                  Viewing as: <span className="font-bold">{visualRole || role}</span>
                  <ChevronDownIcon className="size-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {availableRoles.map((availableRole) => (
                    <DropdownMenuItem
                      key={availableRole}
                      onClick={() => handleRoleSwitch(availableRole)}
                      className={(visualRole || role) === availableRole ? "bg-flag-red-100 text-flag-red-500 font-semibold" : ""}
                    >
                      {availableRole}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              role === 'regular' ? null : <h2 className="text-m font-bold text-space-indigo-500">{visualRole}</h2>
            )}
            
            {/* Logout */}
            <button
                type="button"
                onClick={handleLogout}
                className="text-m font-bold text-flag-red-500 hover:text-strawberry-red-700 hover:cursor-pointer"
                >
                Logout
            </button>

            {/* Profile Settings */}
            <a onClick={() => navigate("/profile")} className="-m-1.5 p-1.5 hover:cursor-pointer text-flag-red-500 hover:text-strawberry-red-700"> 
                <span className="sr-only">Profile</span>
                <UserCircleIcon className="size-10 " />
            </a>
        </div>
      </nav>

      {/* Cannot switch roles on Users page */}
      {switchRoleWarning && (
        <div className="fixed top-[10vh] right-6 z-50 max-w-xs">
          <Message 
            status="error" 
            message={switchRoleWarning}
            onClose={() => setSwitchRoleWarning(null)}
          />
        </div>
      )}
    </header>
  );
}