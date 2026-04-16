"use client";

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sparkles, MessageSquare, Send, X, Mic } from 'lucide-react';

export default function RegionalAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [chat, setChat] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState<'telugu' | 'hindi'>('telugu');

  const handleSend = async () => {
    if (!query.trim()) return;

    const userMessage = { role: 'user' as const, content: query };
    setChat(prev => [...prev, userMessage]);
    setQuery('');
    setIsLoading(true);

    try {
      // Logic for de-stubbing would go to a real server action
      // In this demo implementation, we'll simulate the Sarvam response
      // but the backend agent RegionalAssistantAgent is ready.
      const response = await fetch('/api/ai/regional-assistant', {
        method: 'POST',
        body: JSON.stringify({ query, language }),
      });
      const data = await response.json();
      
      setChat(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (err) {
      setChat(prev => [...prev, { role: 'assistant', content: "క్షమించండి, సర్వర్ కనెక్ట్ కావడంలో ఇబ్బంది ఉంది." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Bubble */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-[#0F766E] text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform z-50 group"
      >
        {isOpen ? <X /> : <Sparkles className="group-hover:animate-spin" />}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-24 right-6 w-96 h-[500px] shadow-2xl border-0 z-50 flex flex-col overflow-hidden bg-slate-50">
          <div className="bg-slate-900 text-white p-4 flex justify-between items-center border-b-2 border-orange-500">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-orange-500 rounded-lg"><Sparkles className="w-4 h-4 text-white" /></span>
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider">Ayura Regional AI</h3>
                <p className="text-[10px] text-orange-400 font-bold tracking-tighter uppercase">Powered by Sarvam-105B</p>
              </div>
            </div>
            <div className="flex gap-1">
              <button 
                onClick={() => setLanguage('telugu')}
                className={`px-2 py-0.5 text-[8px] font-black rounded ${language === 'telugu' ? 'bg-orange-500' : 'bg-slate-800'}`}
              >
                TELUGU
              </button>
              <button 
                onClick={() => setLanguage('hindi')}
                className={`px-2 py-0.5 text-[8px] font-black rounded ${language === 'hindi' ? 'bg-orange-500' : 'bg-slate-800'}`}
              >
                HINDI
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {chat.length === 0 && (
              <div className="text-center py-10 opacity-40">
                <MessageSquare className="w-12 h-12 mx-auto mb-2" />
                <p className="text-sm font-bold uppercase tracking-widest text-slate-800">నమస్కారం! మేము మీకు ఎలా సహాయం చేయగలము?</p>
              </div>
            )}
            {chat.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-xl text-sm ${
                  msg.role === 'user' 
                    ? 'bg-[#0F766E] text-white rounded-tr-none shadow-lg shadow-[#0F766E]/20' 
                    : 'bg-white text-slate-800 border-2 border-slate-100 rounded-tl-none shadow-sm'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white p-3 rounded-xl rounded-tl-none border-2 border-slate-100 italic text-slate-400 text-xs animate-pulse">
                  Regional AI thinking...
                </div>
              </div>
            )}
          </div>

          <div className="p-4 bg-white border-t flex gap-2">
            <Input 
              placeholder={language === 'telugu' ? "ఇక్కడ టైప్ చేయండి..." : "यहाँ टाइप करें..."}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              className="bg-slate-50 border-slate-200"
            />
            <Button onClick={handleSend} size="icon" className="bg-[#0F766E] shrink-0">
              <Send className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon" className="shrink-0 text-orange-500 border-orange-200">
              <Mic className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      )}
    </>
  );
}
