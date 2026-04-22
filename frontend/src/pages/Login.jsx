import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { BookOpen } from 'lucide-react';

const Login = () => {
    const { loginWithEmail } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        if (!email.trim() || !email.includes('@')) {
            setError('Please enter a valid email address.');
            return;
        }
        
        try {
            setError('');
            setLoading(true);
            await loginWithEmail(email);
            // App.jsx PrivateRoute will automatically redirect to /setup if profile is missing
            navigate('/');
        } catch (err) {
            setError('Failed to sign in. Please try again.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center py-12 sm:px-6 lg:px-8 min-h-[70vh]">
            <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
                <BookOpen className="mx-auto h-16 w-16 text-primary" />
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 tracking-tight">
                    Welcome to PeerPath
                </h2>
                <p className="mt-3 text-center text-base text-gray-600 max-w">
                    Trade skills, not money. Learn from peers.
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md w-full">
                <div className="bg-white py-10 px-6 shadow-xl sm:rounded-2xl border border-gray-100/50">
                    {error && <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm mb-6 flex items-center">
                        <span>{error}</span>
                    </div>}

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                Email address
                            </label>
                            <div className="mt-1">
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                                    placeholder="your.email@university.edu"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !email}
                            className="w-full flex justify-center py-4 px-4 rounded-xl shadow-custom text-sm font-bold text-white bg-primary hover:bg-primary-hover disabled:opacity-50 disabled:hover:bg-primary focus:outline-none transition group"
                        >
                            {loading ? 'Authenticating...' : 'Continue with Email'}
                        </button>
                    </form>

                    <p className="mt-6 text-center text-xs text-gray-500">
                        By continuing, verify with your .edu domain for this demo.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
