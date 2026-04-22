import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { BookOpen, User, Home, Monitor } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const Navbar = () => {
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error("Failed to log out", error);
        }
    };

    return (
        <nav className="bg-white shadow">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex">
                        <Link to="/" className="flex-shrink-0 flex items-center group">
                            <BookOpen className="h-8 w-8 text-primary group-hover:text-primary-hover transition" />
                            <span className="ml-2 font-bold text-xl text-gray-900 tracking-tight">PeerPath</span>
                        </Link>
                    </div>
                    <div className="flex items-center space-x-2 sm:space-x-4">
                        {currentUser ? (
                            <>
                                <Link to="/" className="text-gray-600 hover:text-primary px-3 py-2 rounded-md text-sm font-medium flex items-center transition">
                                    <Home className="h-4 w-4 mr-1" /> <span className="hidden sm:inline">Feed</span>
                                </Link>
                                <Link to="/sessions" className="text-gray-600 hover:text-primary px-3 py-2 rounded-md text-sm font-medium flex items-center transition">
                                    <Monitor className="h-4 w-4 mr-1" /> <span className="hidden sm:inline">Sessions</span>
                                </Link>
                                <div className="relative">
                                    <button
                                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                        className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition focus:outline-none"
                                    >
                                        <User className="h-5 w-5" />
                                    </button>

                                    {isDropdownOpen && (
                                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg py-1 border border-gray-100 z-50">
                                            <Link
                                                to="/setup"
                                                onClick={() => setIsDropdownOpen(false)}
                                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                                            >
                                                <User className="h-4 w-4 mr-2 text-gray-400" />
                                                My Profile
                                            </Link>
                                            <button
                                                onClick={() => {
                                                    setIsDropdownOpen(false);
                                                    handleLogout();
                                                }}
                                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                                            >
                                                <User className="h-4 w-4 mr-2" />
                                                Logout
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <Link
                                to="/login"
                                className="bg-primary text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-primary-hover transition shadow-custom"
                            >
                                Login
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
