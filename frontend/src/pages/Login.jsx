import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { BookOpen, AlertCircle, ArrowLeft, X, Mail } from 'lucide-react';
import { api } from '../services/apiService';

const Login = () => {
    const { loginWithEmail } = useAuth();
    const navigate = useNavigate();
    
    // Modes: 'login', 'signup_email', 'signup_otp', 'forgot_email', 'forgot_otp'
    const [mode, setMode] = useState('login');
    
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');
    
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState('');
    const [previewUrl, setPreviewUrl] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        if (!email.trim() || !password.trim()) {
            setError('Please enter email and password.');
            return;
        }
        
        try {
            setLoading(true);
            await api.post('/api/auth/login', { email, password });
            await loginWithEmail(email);
            navigate('/');
        } catch (err) {
            setError(err.message || 'Failed to sign in. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    const handleRequestOtp = async (e, nextMode) => {
        e.preventDefault();
        setError('');
        setMsg('');
        if (!email.trim() || !email.includes('@')) {
            setError('Please enter a valid email address.');
            return;
        }
        
        try {
            setLoading(true);
            const res = await api.post('/api/auth/request-otp', { email });
            setMsg(res.previewUrl ? 'Test OTP sent! Check the popup on the right.' : 'OTP sent to your email.');
            setPreviewUrl(res.previewUrl || '');
            setMode(nextMode);
        } catch (err) {
            setError(err.message || 'Failed to send OTP.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e, isSignup) => {
        e.preventDefault();
        setError('');
        if (!otp.trim() || otp.length !== 6) {
            setError('Please enter a valid 6-digit OTP.');
            return;
        }
        
        try {
            setLoading(true);
            await api.post('/api/auth/verify-otp', { email, otp });
            await loginWithEmail(email);
            navigate('/');
        } catch (err) {
            setError(err.message || 'Invalid OTP.');
        } finally {
            setLoading(false);
        }
    };

    const renderForm = () => {
        if (mode === 'login') {
            return (
                <form onSubmit={handleLogin} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Email address</label>
                        <input
                            type="email" required value={email} onChange={e => setEmail(e.target.value)}
                            className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                            placeholder="your.email@university.edu"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Password</label>
                        <input
                            type="password" required value={password} onChange={e => setPassword(e.target.value)}
                            className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                            placeholder="••••••••"
                        />
                    </div>
                    <div className="flex items-center justify-end">
                        <button type="button" onClick={() => { setMode('forgot_email'); setError(''); setMsg(''); }} className="text-sm font-bold text-primary hover:text-primary-hover">
                            Forgot your password?
                        </button>
                    </div>
                    <button
                        type="submit" disabled={loading}
                        className="w-full flex justify-center py-3.5 px-4 rounded-xl shadow-custom text-sm font-bold text-white bg-primary hover:bg-primary-hover disabled:opacity-50 transition"
                    >
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                    <div className="text-center mt-4">
                        <p className="text-sm text-gray-600">
                            Don't have an account?{' '}
                            <button type="button" onClick={() => { setMode('signup_email'); setError(''); setMsg(''); }} className="font-bold text-primary hover:text-primary-hover">
                                Sign up
                            </button>
                        </p>
                    </div>
                </form>
            );
        }

        if (mode === 'signup_email' || mode === 'forgot_email') {
            const isSignup = mode === 'signup_email';
            return (
                <form onSubmit={(e) => handleRequestOtp(e, isSignup ? 'signup_otp' : 'forgot_otp')} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Enter your email</label>
                        <input
                            type="email" required value={email} onChange={e => setEmail(e.target.value)}
                            className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                            placeholder="your.email@university.edu"
                        />
                        <p className="mt-2 text-xs text-gray-500">We will send a 6-digit OTP to verify your email.</p>
                    </div>
                    <button
                        type="submit" disabled={loading}
                        className="w-full flex justify-center py-3.5 px-4 rounded-xl shadow-custom text-sm font-bold text-white bg-primary hover:bg-primary-hover disabled:opacity-50 transition"
                    >
                        {loading ? 'Sending...' : 'Send OTP'}
                    </button>
                    <div className="text-center mt-4">
                        <button type="button" onClick={() => { setMode('login'); setError(''); setMsg(''); }} className="flex items-center justify-center w-full text-sm font-bold text-gray-600 hover:text-gray-900">
                            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Login
                        </button>
                    </div>
                </form>
            );
        }

        if (mode === 'signup_otp' || mode === 'forgot_otp') {
            const isSignup = mode === 'signup_otp';
            return (
                <form onSubmit={(e) => handleVerifyOtp(e, isSignup)} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Enter 6-Digit OTP</label>
                        <input
                            type="text" required maxLength="6" value={otp} onChange={e => setOtp(e.target.value)}
                            className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-primary focus:border-primary text-center text-2xl tracking-widest sm:text-sm"
                            placeholder="------"
                        />
                        <p className="mt-2 text-xs text-gray-500 text-center">OTP sent to <span className="font-bold">{email}</span></p>
                    </div>
                    <button
                        type="submit" disabled={loading || otp.length !== 6}
                        className="w-full flex justify-center py-3.5 px-4 rounded-xl shadow-custom text-sm font-bold text-white bg-primary hover:bg-primary-hover disabled:opacity-50 transition"
                    >
                        {loading ? 'Verifying...' : 'Verify OTP'}
                    </button>
                    <div className="text-center mt-4">
                        <button type="button" onClick={() => { setMode(isSignup ? 'signup_email' : 'forgot_email'); setError(''); setMsg(''); setOtp(''); }} className="text-sm font-bold text-primary hover:text-primary-hover">
                            Change Email
                        </button>
                    </div>
                </form>
            );
        }
    };

    const getTitle = () => {
        if (mode === 'login') return 'Welcome to PeerPath';
        if (mode === 'signup_email' || mode === 'signup_otp') return 'Create an Account';
        if (mode === 'forgot_email' || mode === 'forgot_otp') return 'Reset Password';
    };

    return (
        <div className="flex flex-col items-center justify-center py-12 sm:px-6 lg:px-8 min-h-[80vh]">
            <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
                <BookOpen className="mx-auto h-14 w-14 text-primary" />
                <h2 className="mt-4 text-center text-3xl font-extrabold text-gray-900 tracking-tight">
                    {getTitle()}
                </h2>
                {mode === 'login' && (
                    <p className="mt-2 text-center text-base text-gray-600">
                        Trade skills, not money. Learn from peers.
                    </p>
                )}
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md w-full">
                <div className="bg-white py-10 px-8 shadow-xl sm:rounded-3xl border border-gray-100/50">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm mb-6 flex items-start gap-2">
                            <AlertCircle className="w-5 h-5 shrink-0" /> <span>{error}</span>
                        </div>
                    )}
                    {msg && (
                        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm mb-6 flex items-center justify-center font-medium text-center">
                            {msg}
                        </div>
                    )}

                    {renderForm()}
                </div>
            </div>

            {/* Floating OTP Link for Prototype */}
            {previewUrl && (
                <div className="fixed bottom-8 right-8 max-w-sm bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-5 border border-indigo-100 z-50 animate-[bounce_1s_infinite]">
                    <div className="flex items-start gap-4">
                        <div className="bg-indigo-50 p-2.5 rounded-xl shrink-0">
                            <Mail className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1">
                            <h4 className="text-sm font-bold text-gray-900 mb-1">Test OTP Email Caught</h4>
                            <p className="text-xs text-gray-600 mb-3 leading-relaxed">
                                Since this is a prototype, the email wasn't actually sent. Click below to view the test email and get your OTP.
                            </p>
                            <a 
                                href={previewUrl} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="inline-flex items-center justify-center bg-primary text-white text-xs font-bold px-4 py-2 rounded-lg shadow-sm hover:bg-primary-hover transition"
                            >
                                Open Test Email
                            </a>
                        </div>
                        <button 
                            onClick={() => setPreviewUrl('')} 
                            className="text-gray-400 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 p-1.5 rounded-lg transition shrink-0"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Login;
