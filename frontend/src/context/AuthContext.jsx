import React, { createContext, useContext, useEffect, useState } from 'react';
import { getUserProfile } from '../services/userService';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    const loginWithEmail = async (email) => {
        const cleanEmail = email.toLowerCase().trim();
        localStorage.setItem('peerpath_auth_email', cleanEmail);
        setCurrentUser({ email: cleanEmail, id: cleanEmail });
        const profile = await getUserProfile(cleanEmail);
        setUserProfile(profile);
    };

    const logout = () => {
        localStorage.removeItem('peerpath_auth_email');
        setCurrentUser(null);
        setUserProfile(null);
    };

    const refreshUserProfile = async () => {
        if (currentUser) {
            console.log("Refreshing user profile for:", currentUser.email);
            const profile = await getUserProfile(currentUser.email);
            setUserProfile(profile);
            return profile;
        }
        return null;
    };

    useEffect(() => {
        const initializeAuth = async () => {
            const savedEmail = localStorage.getItem('peerpath_auth_email');
            if (savedEmail) {
                console.log("Auth state loaded. Email:", savedEmail);
                setCurrentUser({ email: savedEmail, id: savedEmail });
                const profile = await getUserProfile(savedEmail);
                setUserProfile(profile);
            } else {
                setCurrentUser(null);
                setUserProfile(null);
            }
            setLoading(false);
        };
        
        initializeAuth();
    }, []);

    const value = {
        currentUser,
        userProfile,
        refreshUserProfile,
        loginWithEmail,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
