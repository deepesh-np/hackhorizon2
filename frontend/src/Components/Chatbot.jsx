import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'Hi! I am your AI Pharmacist. Ask me about any medicine!' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { sender: 'user', text: userMessage }]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await axios.post('http://localhost:5000/api/medicines/chat', {
        message: userMessage
      });
      if (res.data.success) {
        setMessages(prev => [...prev, { sender: 'bot', text: res.data.reply }]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { sender: 'bot', text: 'Sorry, I am having trouble connecting right now.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Chat Window */}
      {isOpen && (
        <div className="mb-4 w-80 sm:w-96 h-[450px] bg-surface rounded-2xl shadow-2xl border border-outline-variant/30 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="bg-primary text-on-primary p-4 flex justify-between items-center shadow-sm z-10">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined rounded-full bg-white/20 p-1.5 text-lg">robot_2</span>
              <div>
                <h3 className="font-bold leading-tight">AI Pharmacist</h3>
                <p className="text-[10px] opacity-80">Instant Medicine Knowledge</p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="hover:bg-white/20 p-1 rounded-full transition-colors"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-4 overflow-y-auto bg-surface-container-lowest flex flex-col gap-3 custom-scrollbar">
            {messages.map((msg, i) => (
              <div 
                key={i} 
                className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${
                  msg.sender === 'user' 
                    ? 'bg-primary text-on-primary self-end rounded-tr-sm' 
                    : 'bg-surface-variant text-on-surface-variant self-start rounded-tl-sm border border-outline-variant/20 shadow-sm'
                }`}
              >
                {msg.text}
              </div>
            ))}
            {isLoading && (
              <div className="bg-surface-variant text-on-surface-variant self-start rounded-2xl rounded-tl-sm px-4 py-3 text-sm flex gap-1 items-center shadow-sm w-fit">
                <div className="w-1.5 h-1.5 bg-on-surface-variant/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 bg-on-surface-variant/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 bg-on-surface-variant/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form onSubmit={handleSend} className="p-3 bg-surface border-t border-outline-variant/30 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="E.g. What is Dolo 650?"
              className="flex-1 bg-surface-container-low border border-outline-variant/50 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-on-surface"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="bg-primary text-on-primary w-10 h-10 rounded-full flex items-center justify-center disabled:opacity-50 hover:bg-primary/90 transition-colors shrink-0 shadow-sm"
            >
              <span className="material-symbols-outlined text-[18px]">send</span>
            </button>
          </form>
        </div>
      )}

      {/* Floating Action Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-primary text-on-primary w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all group"
        >
          <span className="material-symbols-outlined text-3xl group-hover:scale-110 transition-transform">chat</span>
        </button>
      )}
    </div>
  );
};

export default Chatbot;
