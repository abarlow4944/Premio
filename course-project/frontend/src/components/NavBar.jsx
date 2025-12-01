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
    { label: "Users", path: "/users" },
    { label: "Transactions", path: "/transactions" }
  ],
  manager: [
    { label: "Users", path: "/users" },
    { label: "Transactions", path: "/transactions" },
    { label: "Promotions", path: "/promotions" },
    { label: "Events", path: "/events" },
    { label: "Analytics", path: "/analytics" },
  ],
  superuser: [
    { label: "Users", path: "/users" },
    { label: "Transactions", path: "/transactions" },
    { label: "Promotions", path: "/promotions" },
    { label: "Events", path: "/events" },
    { label: "Analytics", path: "/analytics" },
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
    const isOnPromotionsPage = location.pathname === '/promotions';
    const isOnEventsPage = location.pathname === '/events';
    const isOnMyEventsPage = location.pathname === '/my-events';

    const handleLogout = async() => {
        await fetch(`${API_URL}/auth/logout`, { // clear cookies through auth/logout endpoint
            method: "POST",
            credentials: "include",
        });
        
        setRole(null); // clear the role in the context
        setVisualRole(null);
        localStorage.removeItem('visualRole');
        navigate("/"); // navigate back to login page
    }

    const handleRoleSwitch = (newRole) => {
        const currentRole = visualRole || role;
        
        if (isOnUsersPage) {
            setSwitchRoleWarning("Role switching is not allowed while on the Users page");
            return;
        }

        if (isOnMyEventsPage) {
            setSwitchRoleWarning("Role switching is not allowed while on the My Events page");
            return;
        }

        if (isOnPromotionsPage && newRole === 'cashier') {
            setSwitchRoleWarning("Cannot switch to cashier role while on the Promotions page");
            return;
        }
        if (isOnEventsPage && newRole === 'cashier') {
            setSwitchRoleWarning("Cannot switch to cashier role while on the Events page");
            return;
        }
        
        setVisualRole(newRole);
        localStorage.setItem('visualRole', newRole);
        
        // Refresh the page to reload data with new role
        window.location.reload();
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

            {/* Mobile menu */}
            {mobileMenuOpen && (
              <div className="fixed inset-0 z-40 lg:hidden">
                {/* Backdrop */}
                <div 
                  className="fixed inset-0 bg-black/50"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-hidden="true"
                />
                {/* Menu content */}
                <div className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-white px-6 py-6 sm:max-w-sm">
                  <div className="flex items-center justify-between mb-6">
                    <button
                      type="button"
                      onClick={() => setMobileMenuOpen(false)}
                      className="rounded-md text-gray-400 hover:text-gray-500"
                    >
                      <span className="sr-only">Close menu</span>
                      <svg className="size-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="space-y-2">
                    {navItems.map((item) => {
                      if (item.label === 'Events' && (visualRole === 'regular' || (visualRole === null && role === 'regular'))) {
                        return (
                          <div key="events-dropdown" className="space-y-1">
                            <button
                              className="block w-full text-left rounded-lg px-3 py-2 text-base font-semibold text-flag-red-500 hover:bg-gray-100"
                              onClick={() => {
                                navigate('/events');
                                setMobileMenuOpen(false);
                              }}
                            >
                              Available Events
                            </button>
                            <button
                              className="block w-full text-left rounded-lg px-3 py-2 text-base font-semibold text-flag-red-500 hover:bg-gray-100"
                              onClick={() => {
                                navigate('/my-events');
                                setMobileMenuOpen(false);
                              }}
                            >
                              My Events
                            </button>
                          </div>
                        );
                      }
                      
                      return (
                        <button
                          key={item.label}
                          onClick={() => {
                            navigate(item.path);
                            setMobileMenuOpen(false);
                          }}
                          className="block w-full text-left rounded-lg px-3 py-2 text-base font-semibold text-flag-red-500 hover:bg-gray-100"
                        >
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-6 space-y-4 border-t border-gray-200 pt-4">
                    {availableRoles.length > 1 && (
                      <div>
                        <p className="text-sm font-semibold text-gray-700 mb-2">Switch Role:</p>
                        <div className="space-y-2">
                          {availableRoles.map((availableRole) => (
                            <button
                              key={availableRole}
                              onClick={() => {
                                handleRoleSwitch(availableRole);
                                setMobileMenuOpen(false);
                              }}
                              className={`block w-full text-left rounded-lg px-3 py-2 text-base font-semibold ${
                                (visualRole || role) === availableRole
                                  ? 'bg-strawberry-red-500 text-white'
                                  : 'text-flag-red-500 hover:bg-gray-100'
                              }`}
                            >
                              {availableRole.toUpperCase()}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="border-t border-gray-200 pt-4" />
                    <button
                      onClick={() => {
                        handleLogout();
                        setMobileMenuOpen(false);
                      }}
                      className="block w-full text-left rounded-lg px-3 py-2 text-base font-semibold text-flag-red-500 hover:bg-gray-100"
                    >
                      Logout
                    </button>
                    <button
                      onClick={() => {
                        navigate("/profile");
                        setMobileMenuOpen(false);
                      }}
                      className="block w-full text-left rounded-lg px-3 py-2 text-base font-semibold text-flag-red-500 hover:bg-gray-100"
                    >
                      Profile
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation items (based on role) */}
            <div className="hidden lg:flex lg:gap-x-6 lg:flex-1 lg:justify-center">
          {navItems.map((item) => {
            // Replace Events with dropdown for regular users
            if (item.label === 'Events' && (visualRole === 'regular' || (visualRole === null && role === 'regular'))) {
              return (
                <DropdownMenu key="events-dropdown">
                  <DropdownMenuTrigger className={`text-sm font-semibold transition-colors px-3 py-1 rounded-lg flex items-center gap-1 outline-none whitespace-nowrap ${
                    location.pathname === '/events' || location.pathname === '/my-events'
                      ? 'text-strawberry-red-500 border-2 border-strawberry-red-500'
                      : 'text-flag-red-500 hover:text-strawberry-red-700'
                  } hover:cursor-pointer`}>
                    Events
                    <ChevronDownIcon className="size-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="center" className="bg-white border border-gray-200">
                    <DropdownMenuItem
                      onClick={() => navigate('/events')}
                      className={`${location.pathname === '/events' ? 'bg-strawberry-red-100 text-strawberry-red-600 font-semibold' : 'text-gray-700 hover:bg-gray-100'} cursor-pointer`}
                    >
                      Available Events
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => navigate('/my-events')}
                      className={`${location.pathname === '/my-events' ? 'bg-strawberry-red-100 text-strawberry-red-600 font-semibold' : 'text-gray-700 hover:bg-gray-100'} cursor-pointer`}
                    >
                      My Events
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              );
            }
            
            return (
              <button
                key={item.label}
                type="button"
                onClick={() => navigate(item.path)}
                className={`text-sm font-semibold transition-colors px-3 py-1 rounded-lg whitespace-nowrap ${
                  location.pathname === item.path
                    ? 'text-strawberry-red-500 border-2 border-strawberry-red-500'
                    : 'text-flag-red-500 hover:text-strawberry-red-700'
                } hover:cursor-pointer`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        
        <div className="lg:flex lg:flex-1 lg:justify-end lg:gap-4 hidden lg:flex items-center">
            {/* Role with Switch Dropdown */}
            {availableRoles.length > 1 ? (
              <DropdownMenu>
                <DropdownMenuTrigger className="text-m text-white hover:text-gray-100 hover:cursor-pointer outline-none flex items-center gap-1 bg-strawberry-red-500 px-4 py-2 rounded-lg hover:bg-strawberry-red-600 transition-colors whitespace-nowrap">
                  Viewing as: <span className="font-bold">{(visualRole || role).toUpperCase()}</span>
                  <ChevronDownIcon className="size-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-strawberry-red-500 border-strawberry-red-600">
                  {availableRoles.map((availableRole) => (
                    <DropdownMenuItem
                      key={availableRole}
                      onClick={() => handleRoleSwitch(availableRole)}
                      className={(visualRole || role) === availableRole ? "bg-strawberry-red-600 text-white font-semibold cursor-pointer" : "text-white hover:bg-strawberry-red-600 cursor-pointer"}
                    >
                      {availableRole}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              role === 'regular' ? null : <h2 className="text-m font-bold text-space-indigo-500 whitespace-nowrap">{visualRole}</h2>
            )}
            
            {/* Logout */}
            <button
                type="button"
                onClick={handleLogout}
                className="text-m font-bold text-flag-red-500 hover:text-strawberry-red-700 hover:cursor-pointer whitespace-nowrap"
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