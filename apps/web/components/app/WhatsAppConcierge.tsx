"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  attachment?: { title: string, size: string };
  time: string;
}

export default function WhatsAppConcierge() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'bot',
      text: 'Namaste Ramesh ji 🙏 Welcome to Ayura Hospital AI Concierge. How can I help you today?',
      time: '10:00 AM'
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    // Add user message
    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: inputText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setMessages(prev => [...prev, newMsg]);
    setInputText('');
    setIsTyping(true);

    // Simulate AI response logic matched from App Epic
    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: 'Yes, your LFT results were just finalized by Dr. Evelyn Reed. The results look normal. You can download your official signed report below:',
        attachment: { title: 'LFT_Report_P1234.pdf', size: '1.2 MB' },
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    }, 2500);
  };

  return (
    <div className="min-h-[800px] flex items-center justify-center p-8 bg-slate-100">
      
      {/* Mobile Device Mockup Container */}
      <div className="w-[380px] h-[780px] bg-slate-900 rounded-[3rem] p-3 shadow-2xl relative border-8 border-slate-800">
        
        {/* Screen */}
        <div className="w-full h-full bg-[#E5DDD5] rounded-[2.2rem] overflow-hidden flex flex-col relative">
          
          {/* Header */}
          <div className="bg-[#0F766E] text-white p-4 flex items-center gap-3 shadow-md z-10">
             <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center p-1 overflow-hidden shrink-0">
                <img src="/api/placeholder/40/40" alt="Ayura Logo" className="opacity-80" />
             </div>
             <div>
                <h3 className="font-bold text-[15px]">Ayura Hospital AI</h3>
                <p className="text-xs text-emerald-100 opacity-90 tracking-wide font-medium">
                   {isTyping ? 'typing...' : 'Verified Healthcare Bot • Online'}
                </p>
             </div>
          </div>

          {/* Chat Canvas (WhatsApp Background pattern built with CSS) */}
          <div 
             className="flex-1 overflow-y-auto p-4 space-y-4" 
             ref={scrollRef}
             style={{ backgroundImage: 'radial-gradient(circle at center, #d7cfc5 0%, #e5ddd5 100%)' }}
          >
             <div className="bg-[#E1F3FB] text-[#4A5568] text-xs font-bold px-3 py-1.5 rounded-lg mx-auto w-max mb-6 opacity-80 shadow-sm">
                TODAY
             </div>

             {messages.map(msg => (
               <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                 <div className={`max-w-[85%] rounded-2xl p-3 shadow text-[14px] leading-relaxed relative ${
                   msg.sender === 'user' 
                     ? 'bg-[#DCF8C6] text-slate-800 rounded-tr-sm' 
                     : 'bg-white text-slate-800 rounded-tl-sm'
                 }`}>
                    <p className="pb-3">{msg.text}</p>
                    
                    {msg.attachment && (
                      <div className="mt-2 bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center gap-3 hover:bg-slate-100 transition-colors cursor-pointer mb-2">
                        <div className="w-10 h-10 bg-rose-100 text-rose-500 rounded flex items-center justify-center shrink-0">
                           <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd"></path></svg>
                        </div>
                        <div className="flex-1 overflow-hidden">
                           <p className="font-bold text-sm text-slate-700 truncate">{msg.attachment.title}</p>
                           <p className="text-xs text-slate-500 uppercase">{msg.attachment.size} • PDF</p>
                        </div>
                      </div>
                    )}

                    <span className={`text-[10px] absolute bottom-1.5 right-2 ${msg.sender === 'user' ? 'text-emerald-700/80' : 'text-slate-400'}`}>
                      {msg.time}
                      {msg.sender === 'user' && (
                        <svg className="w-3 h-3 inline ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                      )}
                    </span>
                 </div>
               </div>
             ))}
          </div>

          {/* Input Area */}
          <form onSubmit={handleSend} className="bg-[#f0f0f0] p-2 px-3 flex items-center gap-2">
             <div className="flex-1 bg-white rounded-full flex items-center px-4 py-1 shadow-sm">
                <svg className="w-6 h-6 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <Input 
                   className="border-none shadow-none focus-visible:ring-0 text-[15px] bg-transparent"
                   placeholder="Message" 
                   value={inputText}
                   onChange={(e) => setInputText(e.target.value)}
                />
             </div>
             <button type="submit" disabled={!inputText.trim() || isTyping} className="w-11 h-11 bg-[#00A884] rounded-full flex items-center justify-center text-white shrink-0 shadow-sm transition-transform active:scale-95 disabled:opacity-50 disabled:bg-slate-400">
                <svg className="w-5 h-5 ml-1" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path></svg>
             </button>
          </form>

        </div>
      </div>
    </div>
  );
}
