import React from 'react';
import { CheckCircle, Clock } from 'lucide-react';

/**
 * StatusBadge — reusable session status indicator.
 * @param {{ status: 'confirmed' | 'pending' | 'completed' }} props
 */
const StatusBadge = ({ status }) => {
    switch (status) {
        case 'confirmed':
            return (
                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs px-3 py-1 rounded-full font-bold flex items-center shadow-sm">
                    <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                    Confirmed
                </span>
            );
        case 'pending':
            return (
                <span className="bg-amber-50 text-amber-700 border border-amber-200 text-xs px-3 py-1 rounded-full font-bold flex items-center shadow-sm">
                    <Clock className="w-3.5 h-3.5 mr-1.5" />
                    Pending
                </span>
            );
        case 'completed':
            return (
                <span className="bg-gray-100 text-gray-700 border border-gray-200 text-xs px-3 py-1 rounded-full font-bold shadow-sm">
                    Completed
                </span>
            );
        default:
            return null;
    }
};

export default StatusBadge;
