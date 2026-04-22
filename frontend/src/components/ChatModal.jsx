import React, { useState, useEffect } from 'react';
import { X, Send, Calendar, Clock, AlertCircle } from 'lucide-react';
import { addChatMessage, updateSession, onSessionSnapshot } from '../services/sessionService';

const ChatModal = ({ session, currentUser, onClose, onSessionUpdate }) => {
    const [messages, setMessages] = useState(session?.messages || []);
    const [newMessage, setNewMessage] = useState('');
    const [showReschedule, setShowReschedule] = useState(false);
    const [newDate, setNewDate] = useState('');
    const [newTime, setNewTime] = useState('');

    useEffect(() => {
        // Set up real-time listener for this session
        if (!session?.id) return;
        
        const unsubscribe = onSessionSnapshot(session.id, (updatedSession) => {
            setMessages(updatedSession.messages || []);
            // Tell parent about the update mostly if dates/times changed
            onSessionUpdate(session.id, updatedSession);
        });

        // Cleanup the listener when the modal unmounts
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

        // Optimistic update
        setMessages(prev => [...prev, { ...msgObj, timestamp: new Date().toISOString() }]);
        setNewMessage('');
        
        await addChatMessage(session.id, msgObj);
    };

    const handleProposeReschedule = async (e) => {
        e.preventDefault();
        if (!newDate.trim() || !newTime.trim()) return;

        const msgObj = {
            type: 'reschedule',
            text: `Proposed new time: ${newDate} at ${newTime}`,
            proposedDate: newDate,
            proposedTime: newTime,
            status: 'pending',
            senderId: currentUser?.email || 'demo-user',
            senderName: currentUser?.displayName || 'Me'
        };

        setShowReschedule(false);
        setNewDate('');
        setNewTime('');
        
        await addChatMessage(session.id, msgObj);
    };

    const handleAcceptReschedule = async (messageIndex) => {
        const msg = messages[messageIndex];
        
        // Optimistic update of local messages array
        const updatedMessages = [...messages];
        updatedMessages[messageIndex] = { ...msg, status: 'accepted' };
        
        // Add a system acceptance message
        const acceptMsgObj = {
            type: 'system',
            text: `${currentUser?.displayName || 'Me'} accepted the new time: ${msg.proposedDate} at ${msg.proposedTime}`,
            senderId: 'system',
            timestamp: new Date().toISOString()
        };
        updatedMessages.push(acceptMsgObj);
        
        setMessages(updatedMessages);

        // Update the session's actual date/time and the messages array in DB
        const updateData = { 
            date: msg.proposedDate, 
            time: msg.proposedTime,
            messages: updatedMessages
        };
        
        await updateSession(session.id, updateData);
    };

    const handleDeclineReschedule = async (messageIndex) => {
         const msg = messages[messageIndex];
         
         const updatedMessages = [...messages];
         updatedMessages[messageIndex] = { ...msg, status: 'declined' };
         
         const declineMsgObj = {
            type: 'system',
            text: `${currentUser?.displayName || 'Me'} declined the proposed time.`,
            senderId: 'system',
            timestamp: new Date().toISOString()
        };
        updatedMessages.push(declineMsgObj);
        
        setMessages(updatedMessages);
        await updateSession(session.id, { messages: updatedMessages });
    };

    const currentUserId = currentUser?.email || 'demo-user';

    return (
        <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-[24px] w-full max-w-lg shadow-2xl flex flex-col h-[600px] max-h-[90vh]">
                
                {/* Header */}
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 rounded-t-[24px]">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Chat with {session.peerName}</h3>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 bg-white shadow-sm rounded-full p-2 hover:bg-gray-50">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/30 flex flex-col">
                    {messages.length === 0 ? (
                        <div className="text-center text-gray-400 mt-10">
                            <p className="font-medium text-sm">No messages yet.</p>
                            <p className="text-xs mt-1">Say hi to coordinate your upcoming session!</p>
                        </div>
                    ) : (
                        messages.map((msg, idx) => {
                            const isMe = msg.senderId === currentUserId;
                            const isSystem = msg.type === 'system';

                            if (isSystem) {
                                return (
                                    <div key={idx} className="flex justify-center my-2">
                                        <span className="bg-gray-100 text-gray-500 text-[10px] uppercase tracking-wide font-bold px-3 py-1 rounded-full">
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
                                                    <button onClick={() => handleDeclineReschedule(idx)} className="flex-1 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 py-1.5 rounded-lg transition">Decline</button>
                                                    <button onClick={() => handleAcceptReschedule(idx)} className="flex-1 text-xs font-bold text-white bg-primary hover:bg-primary-hover py-1.5 rounded-lg transition">Accept Time</button>
                                                </div>
                                            )}
                                            {msg.status === 'accepted' && (
                                                <p className="text-xs text-emerald-600 font-bold mt-2 flex items-center"><AlertCircle className="w-3 h-3 mr-1"/> Proposal Accepted</p>
                                            )}
                                            {msg.status === 'declined' && (
                                                <p className="text-xs text-red-500 font-bold mt-2 flex items-center"><AlertCircle className="w-3 h-3 mr-1"/> Proposal Declined</p>
                                            )}
                                        </div>
                                    </div>
                                );
                            }

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
                </div>

                {/* Reschedule Dropdown/Form */}
                {showReschedule && (
                    <div className="p-4 border-t border-gray-100 bg-white">
                        <div className="flex justify-between items-center mb-3">
                            <h4 className="font-bold text-sm text-gray-900">Propose New Time</h4>
                            <button onClick={() => setShowReschedule(false)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4"/></button>
                        </div>
                        <form onSubmit={handleProposeReschedule} className="flex gap-2">
                            <input 
                                type="text" 
                                placeholder="Date (e.g. Tomorrow)" 
                                className="flex-1 text-sm px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                                value={newDate}
                                onChange={(e)=>setNewDate(e.target.value)}
                            />
                            <input 
                                type="text" 
                                placeholder="Time (e.g. 5:00 PM)" 
                                className="flex-1 text-sm px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                                value={newTime}
                                onChange={(e)=>setNewTime(e.target.value)}
                            />
                            <button type="submit" disabled={!newDate || !newTime} className="bg-primary text-white px-4 rounded-xl font-bold text-sm disabled:opacity-50">Send</button>
                        </form>
                    </div>
                )}

                {/* Input Area */}
                <div className="p-4 border-t border-gray-100 bg-white rounded-b-[24px]">
                    <form onSubmit={handleSendText} className="flex items-center gap-2">
                        <button 
                            type="button" 
                            onClick={() => setShowReschedule(!showReschedule)}
                            className={`p-2.5 rounded-xl border transition ${showReschedule ? 'bg-primary/10 border-primary text-primary' : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'}`}
                            title="Propose Reschedule"
                        >
                            <Calendar className="w-5 h-5" />
                        </button>
                        <input
                            type="text"
                            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent shadow-sm text-sm"
                            placeholder="Type a message..."
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                        />
                        <button 
                            type="submit" 
                            disabled={!newMessage.trim()}
                            className="bg-primary text-white p-2.5 rounded-xl hover:bg-primary-hover transition disabled:opacity-50 shadow-custom"
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
