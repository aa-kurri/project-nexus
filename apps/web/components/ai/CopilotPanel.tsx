"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  citations?: { date: string, text: string }[];
}

export default function CopilotPanel() {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hi Dr. Sharma, I have vector-indexed P-5512\'s entire 5-year history. What would you like to know?' }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleAsk = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const userMessage: Message = { role: 'user', content: query };
    setMessages(prev => [...prev, userMessage]);
    setQuery("");
    setIsTyping(true);

    // Simulate RAG vector search timeline
    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Yes, started on Metformin 500mg by Dr. Rao in Oct 2024. The patient was also advised to monitor HbA1c every 3 months.`,
        citations: [
          { date: 'Oct 12, 2024', text: 'Encounter Note - Dr. Rao (Endocrinology)' }
        ]
      }]);
    }, 2000);
  };

  return (
    <Card className="w-full h-full min-h-[500px] flex flex-col shadow-lg border border-slate-200">
      {/* Header */}
      <div className="p-4 bg-slate-900 text-white rounded-t-xl flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-bold">
            AI
          </div>
          <div>
            <h3 className="font-bold tracking-wide">Clinical Copilot</h3>
            <p className="text-[10px] text-slate-300">Context: Patient P-5512 (Rajesh K.)</p>
          </div>
        </div>
        <Badge variant="outline" className="border-indigo-400 text-indigo-300 text-[10px]">Vectors Active</Badge>
      </div>

      {/* Chat History */}
      <div className="flex-1 p-4 overflow-y-auto bg-slate-50 relative" ref={scrollRef}>
        <div className="space-y-6">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl p-4 shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-[#0F766E] text-white rounded-tr-none' 
                  : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
              }`}>
                <p className="text-sm leading-relaxed">{msg.content}</p>
                
                {msg.citations && (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <p className="text-[10px] uppercase font-bold text-slate-400 mb-2">Sources Referenced</p>
                    {msg.citations.map((cite, i) => (
                      <div key={i} className="flex items-center justify-between bg-slate-50 p-2 rounded border border-slate-150 hover:bg-slate-100 cursor-pointer transition-colors">
                        <span className="text-[10px] text-indigo-600 font-semibold">{cite.text}</span>
                        <Badge variant="secondary" className="text-[9px] h-4">{cite.date}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none p-4 shadow-sm flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '0.3s' }}></div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input Form */}
      <form onSubmit={handleAsk} className="p-4 bg-white border-t border-slate-200 flex gap-2">
        <Input 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask anything about the clinical history..."
          className="flex-1 focus-visible:ring-indigo-500 bg-slate-50 border-slate-200"
          disabled={isTyping}
        />
        <Button 
          type="submit" 
          disabled={isTyping || !query.trim()}
          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-6"
        >
          Ask Copilot
        </Button>
      </form>
    </Card>
  );
}
