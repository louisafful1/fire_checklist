import React from 'react';
import { Form, Link } from 'react-router';
import {
    LogOut,
    ShieldCheck,
} from 'lucide-react';
import logo from "../utils/logo.png"


export const Navbar = () => {
    return (
        <nav className="bg-nzema-dark text-white shadow-xl sticky top-0 z-50 no-print border-b border-slate-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center py-4">
                    {/* Left: Brand & Logo */}
                    <Link to="/dashboard" className="flex items-center gap-3 flex-shrink-0 cursor-pointer transition-transform hover:scale-105">

                        <div className="flex flex-col">
                            <span className="font-bold text-xl tracking-tight leading-none text-white"><img src={logo} alt="" className="w-20" /></span>
                            <span className="text-[10px] uppercase tracking-widest text-gold-500 font-semibold opacity-90">Fire Truck Checklist</span>
                        </div>
                    </Link>

                    {/* Right: Logout */}
                    <div>
                        <Form action="/logout" method="post">
                            <button
                                type="submit"
                                className="flex-shrink-0 flex items-center justify-center p-3 rounded-full border border-slate-600 hover:border-red-500 hover:text-red-500 hover:bg-red-500/10 transition-all duration-300 text-slate-300 group"
                                aria-label="Sign Out"
                            >
                                <LogOut size={24} className="transition-transform group-hover:scale-110" />
                            </button>
                        </Form>
                    </div>
                </div>
            </div>
        </nav>
    );
};
