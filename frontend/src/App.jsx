import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { NotificationProvider } from './context/NotificationContext';
import Layout from './components/layout/Layout';

import Login from './pages/Login';
import ProfileSetup from './pages/ProfileSetup';
import DiscoveryFeed from './pages/DiscoveryFeed';
import MySessions from './pages/MySessions';
import AdminDashboard from './pages/AdminDashboard';
import AdminLogin from './pages/AdminLogin';

const ADMIN_EMAIL = 'admin@gmail.com';

// Route for regular users only — admin gets redirected to /admin
const PrivateRoute = ({ children, requireProfile = false, adminAllowed = false }) => {
    const { currentUser, userProfile } = useAuth();
    
    // 1. Not logged in -> Login
    if (!currentUser) {
        return <Navigate to="/login" />;
    }
    
    // 2. Admin: redirect to dashboard unless the route explicitly allows admin
    if (currentUser.email === ADMIN_EMAIL && !adminAllowed) {
        return <Navigate to="/admin" />;
    }
    
    // 3. Profile required but missing -> Setup
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
                    <NotificationProvider>
                        <Layout>
                            <Routes>
                                <Route path="/login" element={<Login />} />
                                <Route path="/admin-login" element={<AdminLogin />} />

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
                                <Route path="/admin" element={
                                    <PrivateRoute adminAllowed={true}>
                                        <AdminDashboard />
                                    </PrivateRoute>
                                } />
                            </Routes>
                        </Layout>
                    </NotificationProvider>
                </ToastProvider>
            </AuthProvider>
            <Analytics />
        </BrowserRouter>
    );
}

export default App;
