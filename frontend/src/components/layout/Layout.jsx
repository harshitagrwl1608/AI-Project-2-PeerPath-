import React, { useEffect } from 'react';
import Navbar from './Navbar';
import { useToast } from '../../context/ToastContext';

const Layout = ({ children }) => {
    const { showToast } = useToast();

    useEffect(() => {
        const handleOfflineWarning = () => {
            showToast(
                "Unable to connect to live database. You're viewing local/demo data. If this is unexpected, try disabling your ad-blocker or check your internet connection.",
                "error",
                8000 // Show for longer
            );
        };

        window.addEventListener('firebase-offline-warning', handleOfflineWarning);
        return () => window.removeEventListener('firebase-offline-warning', handleOfflineWarning);
    }, [showToast]);

    return (
        <div className="min-h-screen bg-background font-sans">
            <Navbar />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-500">
                {children}
            </main>
        </div>
    );
};

export default Layout;
