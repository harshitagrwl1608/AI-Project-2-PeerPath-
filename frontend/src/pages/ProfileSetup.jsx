import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, AlertCircle, Loader2, Search, X, Star, Clock, Plus, Trash2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { saveUserProfile } from '../services/userService';
import { SKILLS_OPTIONS } from '../data/mockData';

const ProfileSetup = () => {
    const navigate = useNavigate();
    const { currentUser, userProfile, refreshUserProfile } = useAuth();
    const [formData, setFormData] = useState({
        name: userProfile?.name || '', 
        college: userProfile?.college || '', 
        year: userProfile?.year || '1st Year', 
        branch: userProfile?.branch || '',
        skillsTeach: userProfile?.skillsTeach || [], 
        skillsLearn: userProfile?.skillsLearn || [], 
        email: userProfile?.email || '', 
        showEmail: userProfile?.showEmail || false,
        password: '',
        confirmPassword: '',
        availability: userProfile?.availability && Object.keys(userProfile?.availability).length > 0 
            ? userProfile.availability 
            : { Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [], Saturday: [], Sunday: [] }
    });
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    useEffect(() => {
        // If we later load userProfile from DB, update the form
        if (userProfile && !formData.name) {
            setFormData(prev => ({
                ...prev,
                name: userProfile.name || '',
                college: userProfile.college || '',
                year: userProfile.year || '1st Year',
                branch: userProfile.branch || '',
                skillsTeach: userProfile.skillsTeach || [],
                skillsLearn: userProfile.skillsLearn || [],
                email: userProfile.email || '',
                showEmail: userProfile.showEmail || false,
                availability: userProfile.availability && Object.keys(userProfile.availability).length > 0 
                    ? userProfile.availability 
                    : { Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [], Saturday: [], Sunday: [] }
            }));
        } else if (currentUser?.email && !formData.email) {
            setFormData(prev => ({ ...prev, email: currentUser.email }));
        }
    }, [currentUser, userProfile]);

    const toggleSkill = (type, skill) => {
        setFormData(prev => {
            const list = prev[type];
            if (list.includes(skill)) {
                return { ...prev, [type]: list.filter(item => item !== skill) };
            }
            if (list.length >= 2) return prev; // Limit to 2 skills for MVP free tier
            return { ...prev, [type]: [...list, skill] };
        });
        if (errors[type]) setErrors(prev => ({ ...prev, [type]: '' }));
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.name.trim()) newErrors.name = 'Full name is required.';
        if (!formData.college.trim()) newErrors.college = 'College name is required.';
        if (!formData.branch.trim()) newErrors.branch = 'Branch/course is required.';
        if (formData.showEmail && !formData.email.trim()) newErrors.email = 'Email is required if shown on profile.';
        if (formData.skillsTeach.length === 0) newErrors.skillsTeach = 'Please select at least one skill you can teach.';
        if (formData.skillsLearn.length === 0) newErrors.skillsLearn = 'Please select at least one skill you want to learn.';
        
        // Only require password if userProfile is null (new user)
        if (!userProfile) {
            if (!formData.password) newErrors.password = 'Password is required for new accounts.';
            else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters.';
            if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match.';
        }

        // Validate availability slots (end time must be after start time)
        Object.entries(formData.availability).forEach(([day, slots]) => {
            slots.forEach((slot, index) => {
                if (slot.start && slot.end && slot.start >= slot.end) {
                    newErrors[`availability_${day}`] = `${day}: End time must be after start time.`;
                }
            });
        });
        
        return newErrors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const validationErrors = validate();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        setSaving(true);
        const newProfile = {
            ...formData,
            name: formData.name.trim(),
            college: formData.college.trim(),
            branch: formData.branch.trim(),
            email: formData.email.trim(),
            requestsUsed: userProfile?.requestsUsed || 0,
            plan: userProfile?.plan || 'free',
            rating: userProfile?.rating || null,
            totalSessions: userProfile?.totalSessions || 0,
            createdAt: userProfile?.createdAt || new Date().toISOString(),
            ...(formData.password ? { password: formData.password } : {}),
            availability: formData.availability
        };

        console.log('Saving profile:', newProfile);
        await saveUserProfile(currentUser?.email || `local-${Date.now()}`, newProfile);
        console.log('Profile saved successfully');
        if (refreshUserProfile) {
            await refreshUserProfile();
        }
        setSaving(false);
        // Small delay ensures AuthContext state updates are committed before routing check occurs
        setTimeout(() => {
            navigate('/');
        }, 100);
    };

    const FieldError = ({ field }) =>
        errors[field] ? (
            <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {errors[field]}
            </p>
        ) : null;

    const SkillSection = ({ type, title, limit, placeholder, colorClass }) => {
        const [query, setQuery] = useState('');
        const [focused, setFocused] = useState(false);

        const handleAdd = (skill) => {
            if (!skill.trim()) return;
            const item = skill.trim();
            setFormData(prev => {
                const list = prev[type];
                if (list.includes(item)) return prev;
                if (limit && list.length >= limit) return prev;
                return { ...prev, [type]: [...list, item] };
            });
            setQuery('');
            if (errors[type]) setErrors(prev => ({ ...prev, [type]: '' }));
        };

        const handleRemove = (skill) => {
            setFormData(prev => ({ ...prev, [type]: prev[type].filter(s => s !== skill) }));
        };

        const filtered = SKILLS_OPTIONS.filter(s => s.toLowerCase().includes(query.toLowerCase()) && !formData[type].includes(s));

        return (
            <div className="border-t border-gray-100 pt-6">
                <div className="flex justify-between items-center mb-3">
                    <h3 className="font-bold text-gray-900">{title}</h3>
                    {limit && <span className={`text-xs font-medium ${colorClass}`}>{formData[type].length}/{limit} selected</span>}
                </div>
                
                {/* Selected Pills */}
                <div className="flex flex-wrap gap-2 mb-3">
                    {formData[type].map(skill => (
                        <span key={skill} className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${type === 'skillsTeach' ? 'bg-primary text-white shadow-custom' : 'bg-emerald-600 text-white shadow-md'}`}>
                            {skill}
                            <button type="button" onClick={() => handleRemove(skill)} className="ml-1.5 focus:outline-none hover:opacity-75">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </span>
                    ))}
                </div>

                {/* Input & Autocomplete */}
                {(limit ? formData[type].length < limit : true) && (
                    <div className="relative">
                        <div className="flex items-center border border-gray-300 rounded-xl px-3 py-2 bg-white focus-within:ring-2 focus-within:ring-primary focus-within:border-transparent transition">
                            <Search className="w-4 h-4 text-gray-400 mr-2 shrink-0" />
                            <input
                                type="text"
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                onFocus={() => setFocused(true)}
                                onBlur={() => setTimeout(() => setFocused(false), 200)} // delay for click
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleAdd(query);
                                    }
                                }}
                                className="flex-1 outline-none text-sm bg-transparent min-w-0"
                                placeholder={placeholder}
                            />
                            {query && (
                                <button type="button" onClick={() => handleAdd(query)} className={`text-xs font-bold px-2 py-1 ${colorClass}`}>
                                    Add
                                </button>
                            )}
                        </div>

                        {focused && query && filtered.length > 0 && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                                {filtered.map(s => (
                                    <button
                                        key={s}
                                        type="button"
                                        onMouseDown={(e) => { e.preventDefault(); handleAdd(s); setQuery(''); }}
                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}
                <FieldError field={type} />
            </div>
        );
    };

    const AvailabilitySection = () => {
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

        const handleAddSlot = (day) => {
            setFormData(prev => ({
                ...prev,
                availability: {
                    ...prev.availability,
                    [day]: [...prev.availability[day], { start: '09:00', end: '17:00' }]
                }
            }));
        };

        const handleRemoveSlot = (day, index) => {
            setFormData(prev => ({
                ...prev,
                availability: {
                    ...prev.availability,
                    [day]: prev.availability[day].filter((_, i) => i !== index)
                }
            }));
        };

        const handleUpdateSlot = (day, index, field, value) => {
            setFormData(prev => {
                const newSlots = [...prev.availability[day]];
                newSlots[index] = { ...newSlots[index], [field]: value };
                return {
                    ...prev,
                    availability: { ...prev.availability, [day]: newSlots }
                };
            });
            if (errors[`availability_${day}`]) {
                setErrors(prev => ({ ...prev, [`availability_${day}`]: '' }));
            }
        };

        return (
            <div className="border-t border-gray-100 pt-6">
                <div className="mb-4">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-indigo-500" /> Weekly Availability
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">Set your available hours for mentoring sessions.</p>
                </div>
                
                <div className="space-y-4">
                    {days.map(day => {
                        const slots = formData.availability[day] || [];
                        const isAvailable = slots.length > 0;

                        return (
                            <div key={day} className="flex flex-col sm:flex-row sm:items-start gap-3 p-3 bg-gray-50/50 rounded-xl border border-gray-100">
                                <div className="w-32 pt-2 flex items-center gap-2 shrink-0">
                                    <input
                                        type="checkbox"
                                        checked={isAvailable}
                                        onChange={(e) => {
                                            setFormData(prev => ({
                                                ...prev,
                                                availability: {
                                                    ...prev.availability,
                                                    [day]: e.target.checked ? [{ start: '09:00', end: '17:00' }] : []
                                                }
                                            }));
                                        }}
                                        className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                                    />
                                    <span className={`text-sm font-medium ${isAvailable ? 'text-gray-900' : 'text-gray-400'}`}>{day}</span>
                                </div>
                                
                                <div className="flex-1 space-y-2">
                                    {!isAvailable ? (
                                        <span className="text-sm text-gray-400 italic pt-2 block">Unavailable</span>
                                    ) : (
                                        slots.map((slot, idx) => (
                                            <div key={idx} className="flex items-center gap-2">
                                                <input 
                                                    type="time" 
                                                    value={slot.start} 
                                                    onChange={e => handleUpdateSlot(day, idx, 'start', e.target.value)}
                                                    className="px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                                                />
                                                <span className="text-gray-400">-</span>
                                                <input 
                                                    type="time" 
                                                    value={slot.end} 
                                                    onChange={e => handleUpdateSlot(day, idx, 'end', e.target.value)}
                                                    className="px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                                                />
                                                <button 
                                                    type="button" 
                                                    onClick={() => handleRemoveSlot(day, idx)}
                                                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition"
                                                    title="Remove Slot"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))
                                    )}
                                    {isAvailable && (
                                        <button 
                                            type="button" 
                                            onClick={() => handleAddSlot(day)}
                                            className="text-xs font-semibold text-primary hover:text-primary-hover flex items-center gap-1 mt-1"
                                        >
                                            <Plus className="w-3 h-3" /> Add Slot
                                        </button>
                                    )}
                                    <FieldError field={`availability_${day}`} />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <div className="text-center mb-8">
                <BookOpen className="mx-auto h-10 w-10 text-primary mb-3" />
                <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">{userProfile ? 'My Profile' : 'Complete Your Profile'}</h2>
                <p className="text-gray-500 mt-2">Let others know what you can teach and what you want to learn.</p>
                {userProfile && (
                    <div className="flex justify-center gap-6 mt-6 py-4 border-y border-gray-100 bg-gray-50/50 rounded-xl">
                        <div className="text-center px-4">
                            <div className="flex items-center justify-center gap-1 text-gray-900 font-bold mb-1 text-lg">
                                <Star className="w-5 h-5 text-amber fill-amber text-amber-400" /> 
                                {userProfile.rating ? Number(userProfile.rating).toFixed(1) : 'New'}
                            </div>
                            <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Rating</span>
                        </div>
                        <div className="w-px h-12 bg-gray-200"></div>
                        <div className="text-center px-4">
                            <div className="flex items-center justify-center gap-1 text-gray-900 font-bold mb-1 text-lg">
                                <BookOpen className="w-5 h-5 text-primary" /> 
                                {userProfile.totalSessions || 0}
                            </div>
                            <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Lectures</span>
                        </div>
                    </div>
                )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="profile-name" className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name</label>
                        <input
                            id="profile-name"
                            type="text"
                            className={`w-full px-4 py-2.5 rounded-xl border focus:ring-2 focus:ring-primary focus:border-transparent transition ${errors.name ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                            value={formData.name}
                            onChange={e => {
                                setFormData({ ...formData, name: e.target.value });
                                if (errors.name) setErrors(prev => ({ ...prev, name: '' }));
                            }}
                            placeholder="Rahul Sharma"
                        />
                        <FieldError field="name" />
                    </div>
                    <div>
                        <label htmlFor="profile-college" className="block text-sm font-semibold text-gray-700 mb-1.5">College/University</label>
                        <input
                            id="profile-college"
                            type="text"
                            className={`w-full px-4 py-2.5 rounded-xl border focus:ring-2 focus:ring-primary focus:border-transparent transition ${errors.college ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                            value={formData.college}
                            onChange={e => {
                                setFormData({ ...formData, college: e.target.value });
                                if (errors.college) setErrors(prev => ({ ...prev, college: '' }));
                            }}
                            placeholder="Delhi University"
                        />
                        <FieldError field="college" />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="profile-year" className="block text-sm font-semibold text-gray-700 mb-1.5">Year of Study</label>
                        <select
                            id="profile-year"
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent transition"
                            value={formData.year}
                            onChange={e => setFormData({ ...formData, year: e.target.value })}
                        >
                            <option>1st Year</option>
                            <option>2nd Year</option>
                            <option>3rd Year</option>
                            <option>4th Year</option>
                            <option>Alumni</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="profile-branch" className="block text-sm font-semibold text-gray-700 mb-1.5">Branch/Course</label>
                        <input
                            id="profile-branch"
                            type="text"
                            className={`w-full px-4 py-2.5 rounded-xl border focus:ring-2 focus:ring-primary focus:border-transparent transition ${errors.branch ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                            value={formData.branch}
                            onChange={e => {
                                setFormData({ ...formData, branch: e.target.value });
                                if (errors.branch) setErrors(prev => ({ ...prev, branch: '' }));
                            }}
                            placeholder="B.Tech CSE"
                        />
                        <FieldError field="branch" />
                    </div>
                </div>

                <div className="border-t border-gray-100 pt-6">
                    <h3 className="font-bold text-gray-900 mb-3">Contact Information</h3>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="profile-email" className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address</label>
                            <input
                                id="profile-email"
                                type="email"
                                className={`w-full px-4 py-2.5 rounded-xl border focus:ring-2 focus:ring-primary focus:border-transparent transition ${errors.email ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                                value={formData.email}
                                onChange={e => {
                                    setFormData({ ...formData, email: e.target.value });
                                    if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
                                }}
                                placeholder="name@example.com"
                            />
                            <FieldError field="email" />
                        </div>
                        <div className="flex items-center">
                            <input
                                id="profile-showEmail"
                                type="checkbox"
                                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                                checked={formData.showEmail}
                                onChange={e => setFormData({ ...formData, showEmail: e.target.checked })}
                            />
                            <label htmlFor="profile-showEmail" className="ml-2 block text-sm text-gray-700">
                                Show email on my public profile
                            </label>
                        </div>
                    </div>
                </div>

                {!userProfile && (
                    <div className="border-t border-gray-100 pt-6">
                        <h3 className="font-bold text-gray-900 mb-3">Account Security</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Create Password</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        className={`w-full px-4 py-2.5 rounded-xl border focus:ring-2 focus:ring-primary focus:border-transparent transition pr-10 ${errors.password ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                                        value={formData.password}
                                        onChange={e => {
                                            setFormData({ ...formData, password: e.target.value });
                                            if (errors.password) setErrors(prev => ({ ...prev, password: '' }));
                                        }}
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                                    >
                                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                    </button>
                                </div>
                                <FieldError field="password" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Confirm Password</label>
                                <div className="relative">
                                    <input
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        className={`w-full px-4 py-2.5 rounded-xl border focus:ring-2 focus:ring-primary focus:border-transparent transition pr-10 ${errors.confirmPassword ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                                        value={formData.confirmPassword}
                                        onChange={e => {
                                            setFormData({ ...formData, confirmPassword: e.target.value });
                                            if (errors.confirmPassword) setErrors(prev => ({ ...prev, confirmPassword: '' }));
                                        }}
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                                    >
                                        {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                    </button>
                                </div>
                                <FieldError field="confirmPassword" />
                            </div>
                        </div>
                    </div>
                )}

                <AvailabilitySection />

                <SkillSection 
                    type="skillsTeach"  
                    title="Skills I can Teach" 
                    placeholder="Search or type a new skill and press Enter..." 
                    colorClass="text-primary"
                />

                <SkillSection 
                    type="skillsLearn" 
                    title="Skills I want to Learn" 
                    limit={2} 
                    placeholder="Search or type a new skill and press Enter..." 
                    colorClass="text-emerald-600"
                />

                <div className="pt-6">
                    <button
                        type="submit"
                        disabled={saving}
                        className="w-full bg-primary text-white py-4 rounded-xl font-bold hover:bg-primary-hover transition shadow-custom flex items-center justify-center disabled:opacity-60"
                    >
                        {saving ? (
                            <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Saving...</>
                        ) : (
                            'Save & Continue to Feed'
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ProfileSetup;

