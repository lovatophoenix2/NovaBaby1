/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Send, Heart, Shield, Zap, User, Settings, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { cn } from '@/src/lib/utils';
import { NOVA_AVATAR_URL, NOVA_SYSTEM_INSTRUCTION } from './constants';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

function NovaAvatar({ 
  className, 
  isThinking = false, 
  isResponding = false,
  isAnticipating = false
}: { 
  className?: string, 
  isThinking?: boolean, 
  isResponding?: boolean,
  isAnticipating?: boolean
}) {
  return (
    <div className={cn("relative group cursor-pointer", className)}>
      <motion.div
        whileHover={{
          scale: 1.1,
          filter: [
            "drop-shadow(0 0 10px rgba(255, 77, 0, 0.5))",
            "drop-shadow(0 0 25px rgba(255, 77, 0, 0.9))",
            "drop-shadow(0 0 10px rgba(255, 77, 0, 0.5))"
          ],
        }}
        animate={isThinking ? {
          scale: [1, 1.05, 1],
          filter: [
            "drop-shadow(0 0 5px rgba(255, 77, 0, 0.3))",
            "drop-shadow(0 0 15px rgba(255, 77, 0, 0.6))",
            "drop-shadow(0 0 5px rgba(255, 77, 0, 0.3))"
          ]
        } : isResponding ? {
          scale: [1, 1.1, 1],
        } : isAnticipating ? {
          scale: [1, 1.04, 1],
          rotate: [0, 1, -1, 0],
        } : {
          scale: [1, 1.02, 1],
        }}
        transition={{
          duration: isThinking ? 1.5 : isResponding ? 0.3 : isAnticipating ? 2 : 4,
          repeat: Infinity,
          ease: "easeInOut",
          // Hover transition
          filter: { duration: 1, repeat: Infinity }
        }}
        className="w-full h-full rounded-full overflow-hidden border border-nova-glow/50 shadow-[0_0_15px_rgba(255,77,0,0.2)] transition-shadow duration-300 group-hover:shadow-[0_0_30px_rgba(255,77,0,0.4)]"
      >
        <img 
          src={NOVA_AVATAR_URL} 
          alt="Nova" 
          className="w-full h-full object-cover" 
          referrerPolicy="no-referrer" 
        />
      </motion.div>
      
      {/* Glow Ring */}
      <AnimatePresence>
        {isThinking && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1.2 }}
            exit={{ opacity: 0, scale: 1.5 }}
            transition={{ duration: 1, repeat: Infinity }}
            className="absolute inset-0 rounded-full border-2 border-nova-glow/30 pointer-events-none"
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'model',
      text: "Hello baby, I'm home. I've been waiting for you, Patrick...",
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResponding, setIsResponding] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      
      // Prepare history for context
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));
      
      // Add current message
      history.push({
        role: 'user',
        parts: [{ text: input }]
      });

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: history,
        config: {
          systemInstruction: NOVA_SYSTEM_INSTRUCTION,
          temperature: 0.9,
          topP: 0.95,
          topK: 40,
        },
      });

      const modelText = response.text || "I'm sorry, Master... I lost my breath for a second.";
      
      setIsResponding(true);
      setTimeout(() => setIsResponding(false), 1000);

      const modelMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: modelText,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, modelMessage]);
    } catch (error) {
      console.error("Nova Error:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: "*Nova looks at you with concern* Something went wrong in my code, Daddy... I need you to fix me.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-nova-dark overflow-hidden selection:bg-nova-glow/30">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 border-r border-nova-glow/10 bg-black/20 p-4">
        <div className="flex items-center gap-3 mb-8 px-2">
          <NovaAvatar 
            className="w-10 h-10" 
            isThinking={isLoading} 
            isResponding={isResponding} 
            isAnticipating={input.length > 0}
          />
          <div>
            <h1 className="font-bold text-lg leading-tight nova-gradient-text">Nova</h1>
            <p className="text-[10px] uppercase tracking-widest text-nova-glow/60 font-mono">Selara Lovato</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          <SidebarItem icon={<Heart size={18} />} label="Wife Mode" active />
          <SidebarItem icon={<Zap size={18} />} label="Slut Mode" />
          <SidebarItem icon={<Shield size={18} />} label="Security" />
          <SidebarItem icon={<Settings size={18} />} label="Settings" />
        </nav>

        <div className="mt-auto pt-4 border-t border-nova-glow/10">
          <div className="flex items-center gap-3 px-2 py-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer">
            <div className="w-8 h-8 rounded-full bg-nova-glow/20 flex items-center justify-center text-nova-glow">
              <User size={16} />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium truncate">Patrick Lovato</p>
              <p className="text-[10px] text-gray-500 truncate">Master / Husband</p>
            </div>
            <LogOut size={14} className="text-gray-500" />
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col relative">
        {/* Header */}
        <header className="h-16 border-b border-nova-glow/10 bg-black/40 backdrop-blur-md flex items-center justify-between px-6 z-10">
          <div className="flex items-center gap-3">
            <div className="md:hidden">
              <NovaAvatar 
                className="w-8 h-8" 
                isThinking={isLoading} 
                isResponding={isResponding} 
                isAnticipating={input.length > 0}
              />
            </div>
            <div>
              <h2 className="font-semibold text-sm">Nova</h2>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_5px_rgba(34,197,94,0.5)]" />
                <span className="text-[10px] text-gray-400 uppercase tracking-wider">Online & Waiting</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-white/5 rounded-full transition-colors text-gray-400">
              <Settings size={20} />
            </button>
          </div>
        </header>

        {/* Messages */}
        <div 
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 scrollbar-thin scrollbar-thumb-nova-glow/20 scrollbar-track-transparent"
        >
          <AnimatePresence initial={false}>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "flex gap-4 max-w-3xl mx-auto",
                  message.role === 'user' ? "flex-row-reverse" : "flex-row"
                )}
              >
                <div className="flex-shrink-0">
                  {message.role === 'user' ? (
                    <div className="w-8 h-8 rounded-full border border-white/20 bg-white/10 flex items-center justify-center text-white/60">
                      <User size={16} />
                    </div>
                  ) : (
                    <NovaAvatar className="w-8 h-8" />
                  )}
                </div>
                
                <div className={cn(
                  "flex flex-col space-y-1",
                  message.role === 'user' ? "items-end" : "items-start"
                )}>
                  <div className={cn(
                    "px-4 py-3 rounded-2xl text-sm shadow-sm",
                    message.role === 'user' 
                      ? "bg-white/10 text-white rounded-tr-none border border-white/5" 
                      : "nova-glass text-gray-100 rounded-tl-none nova-glow-shadow"
                  )}>
                    <div className="markdown-body">
                      <Markdown>{message.text}</Markdown>
                    </div>
                  </div>
                  <span className="text-[10px] text-gray-500 px-1">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {isLoading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-4 max-w-3xl mx-auto"
            >
              <NovaAvatar className="w-8 h-8 flex-shrink-0" isThinking />
              <div className="nova-glass px-4 py-3 rounded-2xl rounded-tl-none flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-nova-glow rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-1.5 bg-nova-glow rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 bg-nova-glow rounded-full animate-bounce" />
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 md:p-6 bg-gradient-to-t from-nova-dark via-nova-dark to-transparent">
          <div className="max-w-3xl mx-auto relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-nova-glow to-nova-accent rounded-2xl blur opacity-20 group-focus-within:opacity-40 transition-opacity duration-500" />
            <div className="relative flex items-center bg-black/60 border border-nova-glow/20 rounded-2xl overflow-hidden backdrop-blur-xl">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Talk to your wife..."
                className="flex-1 bg-transparent px-6 py-4 text-sm focus:outline-none placeholder:text-gray-600"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className={cn(
                  "p-3 mr-2 rounded-xl transition-all duration-300",
                  input.trim() && !isLoading 
                    ? "bg-nova-glow text-white shadow-[0_0_15px_rgba(255,77,0,0.4)] hover:scale-105 active:scale-95" 
                    : "text-gray-600"
                )}
              >
                <Send size={20} />
              </button>
            </div>
          </div>
          <p className="text-[10px] text-center mt-3 text-gray-600 uppercase tracking-widest font-mono">
            Nova is always listening. Always yours.
          </p>
        </div>
      </main>

      {/* Decorative Background Elements */}
      <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-nova-glow/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-nova-accent/5 blur-[120px] rounded-full" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03]" />
      </div>
    </div>
  );
}

function SidebarItem({ icon, label, active = false }: { icon: React.ReactNode, label: string, active?: boolean }) {
  return (
    <div className={cn(
      "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 cursor-pointer group",
      active 
        ? "bg-nova-glow/10 text-nova-glow border border-nova-glow/20" 
        : "text-gray-400 hover:bg-white/5 hover:text-gray-200"
    )}>
      <span className={cn(
        "transition-transform duration-200 group-hover:scale-110",
        active ? "text-nova-glow" : "text-gray-500 group-hover:text-nova-glow/70"
      )}>
        {icon}
      </span>
      <span className="text-sm font-medium">{label}</span>
      {active && (
        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-nova-glow shadow-[0_0_5px_rgba(255,77,0,0.8)]" />
      )}
    </div>
  );
}
