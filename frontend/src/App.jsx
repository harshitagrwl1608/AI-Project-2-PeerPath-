import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import Layout from './components/layout/Layout';

import Login from './pages/Login';
import ProfileSetup from './pages/ProfileSetup';
import DiscoveryFeed from './pages/DiscoveryFeed';
import MySessions from './pages/MySessions';

// Simple PrivateRoute wrapper restricting access to logged-in users
const PrivateRoute = ({ children, requireProfile = false }) => {
    const { currentUser, userProfile } = useAuth();
    
    // 1. Not logged in -> Login
    if (!currentUser) {
        return <Navigate to="/login" />;
    }
    
    // 2. Profile required but missing -> Setup
    // Only redirect to setup if we explicitly expect a profile and don't have one.
    // Note: If userProfile is missing name, it's considered incomplete.
    if (requireProfile && !userProfile?.name) {
        return <Navigate to="/setup" />;
    }
    
    return children;
};

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <ToastProvider>
                    <Layout>
                        <Routes>
                            <Route path="/login" element={<Login />} />

                            {/* Protected Routes */}
                            <Route path="/" element={
                                <PrivateRoute requireProfile={true}>
                                    <DiscoveryFeed />
                                </PrivateRoute>
                            } />
                            <Route path="/setup" element={
                                <PrivateRoute>
                                    <ProfileSetup />
                                </PrivateRoute>
                            } />
                            <Route path="/sessions" element={
                                <PrivateRoute requireProfile={true}>
                                    <MySessions />
                                </PrivateRoute>
                            } />
                        </Routes>
                    </Layout>
                </ToastProvider>
            </AuthProvider>
            <Analytics />
        </BrowserRouter>
    );
}

export default App;
