import { useState } from 'react'
import {
    Bars3Icon, UserCircleIcon
} from '@heroicons/react/24/outline'
import { useNavigate } from "react-router-dom";
import { useUser } from "../contexts/UserContexts";


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


export default function NavBar() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const navigate = useNavigate();
    const { role, setRole } = useUser();
    const API_URL = import.meta.env.VITE_API_URL; // API base URL

    const handleLogout = async() => {
        await fetch(`${API_URL}/auth/logout`, { // clear cookies through auth/logout endpoint
            method: "POST",
            credentials: "include",
        });
        
        setRole(null); // clear the role in the context
        navigate("/"); // navigate back to login page
    }

    const navItems = NAV_ITEMS_BY_ROLE[role] ?? [];

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
            {/* Role */}
            <h2 className="text-m font-bold text-space-indigo-500">{role}</h2>
            
            {/* Logout */}
            <button
                type="button"
                onClick={handleLogout}
                className="text-m font-bold text-flag-red-500 hover:text-strawberry-red-700 hover:cursor-pointer"
                >
                Logout
            </button>

            {/* Profile Settings */}
            <a onClick={() => navigate("/home")} className="-m-1.5 p-1.5 hover:cursor-pointer text-flag-red-500 hover:text-strawberry-red-700"> 
                <span className="sr-only">Your Company</span>
                <UserCircleIcon className="size-10 " />
            </a>
        </div>
      </nav>

    </header>
  );
}