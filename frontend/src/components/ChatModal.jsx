import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Calendar, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import { addChatMessage, updateSession, updateMessageStatus, onSessionSnapshot } from '../services/sessionService';

const ChatModal = ({ session, currentUser, onClose, onSessionUpdate }) => {
    const [messages, setMessages] = useState(session?.messages || []);
    const [newMessage, setNewMessage] = useState('');
    const [showReschedule, setShowReschedule] = useState(false);
    const [newDate, setNewDate] = useState('');
    const [newTime, setNewTime] = useState('');
    const messagesEndRef = useRef(null);

    // Auto-scroll to bottom when messages update
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        if (!session?.id) return;
        const unsubscribe = onSessionSnapshot(session.id, (updatedSession) => {
            setMessages(updatedSession.messages || []);
            onSessionUpdate(session.id, updatedSession);
        });
        return () => unsubscribe();
    }, [session?.id, onSessionUpdate]);

    const handleSendText = async (e) => {
        e?.preventDefault();
        if (!newMessage.trim()) return;

        const msgObj = {
            type: 'text',
            text: newMessage.trim(),
            senderId: currentUser?.email || 'demo-user',
            senderName: currentUser?.displayName || 'Me'
        };

        setMessages(prev => [...prev, { ...msgObj, timestamp: new Date().toISOString() }]);
        setNewMessage('');
        await addChatMessage(session.id, msgObj);
    };

    const handleProposeReschedule = async (e) => {
        e.preventDefault();
        if (!newDate || !newTime) return;

        // Format the date nicely for display
        const dateObj = new Date(`${newDate}T${newTime}`);
        const formattedDate = dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
        const formattedTime = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

        const msgObj = {
            type: 'reschedule',
            text: `Proposed new time: ${formattedDate} at ${formattedTime}`,
            proposedDate: newDate,
            proposedTime: newTime,
            proposedDateDisplay: formattedDate,
            proposedTimeDisplay: formattedTime,
            status: 'pending',
            senderId: currentUser?.email || 'demo-user',
            senderName: currentUser?.displayName || 'Me'
        };

        setShowReschedule(false);
        setNewDate('');
        setNewTime('');
        setMessages(prev => [...prev, { ...msgObj, timestamp: new Date().toISOString() }]);
        await addChatMessage(session.id, msgObj);
    };

    const handleAcceptReschedule = async (messageIndex) => {
        const msg = messages[messageIndex];

        // 1. Optimistic UI update
        setMessages(prev => {
            const updated = [...prev];
            updated[messageIndex] = { ...updated[messageIndex], status: 'accepted' };
            return updated;
        });

        try {
            // 2. Atomically flip only this message's status in the DB
            await updateMessageStatus(session.id, messageIndex, 'accepted');

            // 3. Update the session's scheduled date/time
            const updatedSession = await updateSession(session.id, {
                date: msg.proposedDate,
                time: msg.proposedTime,
            });

            // 4. Notify parent so the session card reflects the new date and any new meetLink
            onSessionUpdate(session.id, updatedSession);

            // 5. Append a visible system confirmation message for both users
            await addChatMessage(session.id, {
                type: 'system',
                text: `✓ ${currentUser?.displayName || 'Peer'} accepted: ${msg.proposedDateDisplay || msg.proposedDate} at ${msg.proposedTimeDisplay || msg.proposedTime}`,
                senderId: 'system',
            });
        } catch (err) {
            console.error('handleAcceptReschedule error:', err);
            // Revert optimistic update on failure
            setMessages(prev => {
                const reverted = [...prev];
                reverted[messageIndex] = { ...reverted[messageIndex], status: 'pending' };
                return reverted;
            });
        }
    };

    const handleDeclineReschedule = async (messageIndex) => {
        const msg = messages[messageIndex];

        // 1. Optimistic UI update
        setMessages(prev => {
            const updated = [...prev];
            updated[messageIndex] = { ...updated[messageIndex], status: 'declined' };
            return updated;
        });

        try {
            // 2. Atomically flip only this message's status in the DB
            await updateMessageStatus(session.id, messageIndex, 'declined');

            // 3. Append a system message for both users
            await addChatMessage(session.id, {
                type: 'system',
                text: `✗ ${currentUser?.displayName || 'Peer'} declined the proposed time.`,
                senderId: 'system',
            });
        } catch (err) {
            console.error('handleDeclineReschedule error:', err);
            // Revert optimistic update on failure
            setMessages(prev => {
                const reverted = [...prev];
                reverted[messageIndex] = { ...reverted[messageIndex], status: 'pending' };
                return reverted;
            });
        }
    };

    const currentUserId = currentUser?.email || 'demo-user';

    // Minimum date for the date picker (today)
    const today = new Date().toISOString().split('T')[0];


    return (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-[24px] w-full max-w-lg shadow-2xl flex flex-col overflow-hidden" style={{ height: 'min(600px, 90vh)' }}>

                {/* Header */}
                <div className="flex-shrink-0 p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/80 rounded-t-[24px]">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Chat with {session.peerName}</h3>
                        <p className="text-xs text-gray-400 mt-0.5">Skill: {session.skill}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 bg-white shadow-sm rounded-full p-2 hover:bg-gray-50 transition"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Messages Area — flex-1 so it fills space between header and footer */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/30">
                    {messages.length === 0 ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center text-gray-400">
                                <p className="font-medium text-sm">No messages yet.</p>
                                <p className="text-xs mt-1">Say hi to coordinate your upcoming session!</p>
                            </div>
                        </div>
                    ) : (
                        messages.map((msg, idx) => {
                            const isMe = msg.senderId === currentUserId;
                            const isSystem = msg.type === 'system';

                            if (isSystem) {
                                return (
                                    <div key={idx} className="flex justify-center my-2">
                                        <span className="bg-gray-100 text-gray-500 text-[10px] uppercase tracking-wide font-bold px-3 py-1 rounded-full text-center max-w-[90%]">
                                            {msg.text}
                                        </span>
                                    </div>
                                );
                            }

                            if (msg.type === 'reschedule') {
                                return (
                                    <div key={idx} className={`max-w-[85%] ${isMe ? 'ml-auto' : 'mr-auto'}`}>
                                        <div className={`p-4 rounded-2xl ${isMe ? 'bg-primary/5 border border-primary/20' : 'bg-white border border-gray-200'}`}>
                                            <div className="flex items-center gap-2 mb-2 text-primary font-bold text-sm">
                                                <Calendar className="w-4 h-4" /> Reschedule Proposal
                                            </div>
                                            <p className="text-sm text-gray-700">{msg.text}</p>

                                            {msg.status === 'pending' && !isMe && (
                                                <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                                                    <button
                                                        onClick={() => handleDeclineReschedule(idx)}
                                                        className="flex-1 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 py-1.5 rounded-lg transition flex items-center justify-center gap-1"
                                                    >
                                                        <XCircle className="w-3.5 h-3.5" /> Decline
                                                    </button>
                                                    <button
                                                        onClick={() => handleAcceptReschedule(idx)}
                                                        className="flex-1 text-xs font-bold text-white bg-primary hover:bg-primary-hover py-1.5 rounded-lg transition flex items-center justify-center gap-1"
                                                    >
                                                        <CheckCircle2 className="w-3.5 h-3.5" /> Accept
                                                    </button>
                                                </div>
                                            )}
                                            {msg.status === 'pending' && isMe && (
                                                <p className="text-xs text-gray-400 mt-2 italic">Awaiting response…</p>
                                            )}
                                            {msg.status === 'accepted' && (
                                                <p className="text-xs text-emerald-600 font-bold mt-2 flex items-center gap-1">
                                                    <AlertCircle className="w-3 h-3" /> Accepted
                                                </p>
                                            )}
                                            {msg.status === 'declined' && (
                                                <p className="text-xs text-red-500 font-bold mt-2 flex items-center gap-1">
                                                    <AlertCircle className="w-3 h-3" /> Declined
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                );
                            }

                            // Plain text message
                            return (
                                <div key={idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                    <div className={`px-4 py-2.5 rounded-2xl max-w-[80%] text-sm ${
                                        isMe
                                            ? 'bg-primary text-white rounded-br-none shadow-sm'
                                            : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm'
                                    }`}>
                                        {msg.text}
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Reschedule Panel — fixed inside modal, above input */}
                {showReschedule && (
                    <div className="flex-shrink-0 border-t border-gray-100 bg-white px-4 py-3">
                        <div className="flex justify-between items-center mb-2">
                            <h4 className="font-bold text-sm text-gray-900">📅 Propose New Time</h4>
                            <button
                                onClick={() => setShowReschedule(false)}
                                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <form onSubmit={handleProposeReschedule} className="flex gap-2 items-center">
                            <div className="flex-1">
                                <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide block mb-1">Date</label>
                                <input
                                    type="date"
                                    min={today}
                                    className="w-full text-sm px-3 py-1.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent bg-gray-50"
                                    value={newDate}
                                    onChange={(e) => setNewDate(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="flex-1">
                                <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide block mb-1">Time</label>
                                <input
                                    type="time"
                                    className="w-full text-sm px-3 py-1.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent bg-gray-50"
                                    value={newTime}
                                    onChange={(e) => setNewTime(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="pt-4">
                                <button
                                    type="submit"
                                    disabled={!newDate || !newTime}
                                    className="bg-primary text-white px-4 py-1.5 rounded-xl font-bold text-sm disabled:opacity-50 hover:bg-primary-hover transition whitespace-nowrap"
                                >
                                    Propose
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Input Area — always at bottom, never overflows */}
                <div className="flex-shrink-0 p-3 border-t border-gray-100 bg-white rounded-b-[24px]">
                    <form onSubmit={handleSendText} className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setShowReschedule(prev => !prev)}
                            className={`flex-shrink-0 p-2.5 rounded-xl border transition ${
                                showReschedule
                                    ? 'bg-primary/10 border-primary text-primary'
                                    : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'
                            }`}
                            title="Propose Reschedule"
                        >
                            <Calendar className="w-5 h-5" />
                        </button>
                        <input
                            type="text"
                            className="flex-1 min-w-0 px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent shadow-sm text-sm"
                            placeholder="Type a message..."
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                        />
                        <button
                            type="submit"
                            disabled={!newMessage.trim()}
                            className="flex-shrink-0 bg-primary text-white p-2.5 rounded-xl hover:bg-primary-hover transition disabled:opacity-50 shadow-sm"
                        >
                            <Send className="w-5 h-5" />
                        </button>
                    </form>
                </div>

            </div>
        </div>
    );
};

export default ChatModal;
