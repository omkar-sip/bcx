import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { cx } from '../../lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}

const FAQ = [
  "How do I add a new facility to track?",
  "What is the difference between Scope 1 and Scope 2?",
  "How does the Real-Time IoT telemetry tracking work?",
  "Can I offset my residual emissions here?"
];

const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
const hasKey = Boolean(apiKey && !apiKey.startsWith('YOUR_GEMINI_'));
const genAI = hasKey ? new GoogleGenerativeAI(apiKey!) : null;

// The strict boundary prompt to ensure it only talks about the platform context.
const SYSTEM_PROMPT = `You are the BCX (Bharat Carbon Exchange) Copilot. 
You are an expert in carbon accounting, GHG tracking, and the BCX platform features.
The BCX platform allows companies to:
1. Track Scope 1, 2, 3 emissions manually via 'Activity-Based Tracking'.
2. Calculate footprints and see them on a 'Visualization Dashboard'.
3. Use an 'AI Recommendation System' for reduction strategies.
4. Stream live machinery tracking via 'Real-Time Telemetry' using Riemann sum integration for instant kWh -> tCO2e conversion.
5. Offset residual emissions on a carbon credit marketplace.

CRITICAL RULE: You MUST ONLY answer questions related to the BCX platform, carbon tracking, climate change, GHG protocols, or the features mentioned above. If the user asks about ANY other topic (e.g. coding, general history, recipes, non-climate general knowledge), politely decline and state that you are the BCX Climate Copilot and can only assist with platform and sustainability inquiries. Keep answers concise and helpful.`;

export const CopilotPanel = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const [messages, setMessages] = useState<Message[]>([
    { id: 'welcome', role: 'assistant', text: "Hello! I'm your BCX Copilot. How can I help you navigate the platform or track your emissions today?" }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async (text: string) => {
    if (!text.trim()) return;
    
    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      if (genAI) {
        // Compile history
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash', systemInstruction: SYSTEM_PROMPT });
        const chat = model.startChat({
          history: messages.filter(m => m.id !== 'welcome').map(m => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.text }]
          }))
        });

        const result = await chat.sendMessage(text);
        const responseText = result.response.text();
        
        setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'assistant', text: responseText }]);
      } else {
        // Fallback if no API key
        setTimeout(() => {
          setMessages(prev => [...prev, { 
            id: crypto.randomUUID(), 
            role: 'assistant', 
            text: "I am currently in offline mode (No Gemini API Key found in .env). I can only answer based on predefined rules or you can configure my API key to unlock full AI capabilities."
          }]);
        }, 1000);
      }
    } catch (error: any) {
      console.error(error);
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'assistant', text: `Sorry, I ran into an error connecting to the AI brain: ${error.message}` }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend(input);
    }
  };

  return (
    <>
      {/* Backdrop overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}
      
      {/* Slide Panel */}
      <div 
        className={cx(
          "fixed right-0 top-0 z-50 flex h-full w-[400px] flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-4 bg-gradient-to-r from-violet-500/10 to-pink-500/10">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-tr from-violet-500 to-pink-500 text-white shadow-sm">
              <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4">
                <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.5" />
                <path d="M8 1v2M8 13v2M1 8h2M13 8h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-bold text-brand-ink">Platform Copilot</h2>
              <p className="text-[10px] uppercase tracking-wider text-violet-600 font-semibold">Always here to help</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full text-slate-400 hover:bg-white hover:text-slate-600 transition"
          >
            ✕
          </button>
        </div>

        {/* Scrollable messages area */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50"
        >
          {messages.map((msg) => (
            <div 
              key={msg.id} 
              className={cx(
                "flex w-full",
                msg.role === 'user' ? "justify-end" : "justify-start"
              )}
            >
              <div 
                className={cx(
                  "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm",
                  msg.role === 'user' 
                    ? "bg-brand-ink text-white rounded-br-sm" 
                    : "bg-white border border-slate-200 text-slate-700 rounded-tl-sm shadow-sm"
                )}
                style={{ whiteSpace: 'pre-wrap' }}
              >
                {msg.text}
              </div>
            </div>
          ))}
          
          {isTyping && (
             <div className="flex w-full justify-start">
               <div className="max-w-[85%] rounded-2xl bg-white border border-slate-200 px-4 py-3 shadow-sm rounded-tl-sm">
                 <div className="flex gap-1.5">
                   <div className="h-2 w-2 rounded-full bg-slate-300 animate-bounce" />
                   <div className="h-2 w-2 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: '0.15s' }} />
                   <div className="h-2 w-2 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: '0.3s' }} />
                 </div>
               </div>
             </div>
          )}
        </div>

        {/* FAQ Chips */}
        <div className="shrink-0 bg-white px-4 py-3 border-t border-slate-100 flex flex-nowrap overflow-x-auto gap-2 no-scrollbar">
          {FAQ.map((faq, i) => (
            <button
              key={i}
              onClick={() => handleSend(faq)}
              className="shrink-0 rounded-full border border-violet-100 bg-violet-50 px-3 py-1.5 text-xs font-medium text-violet-700 hover:bg-violet-100 transition whitespace-nowrap"
            >
              {faq}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="shrink-0 p-4 bg-white">
          <div className="relative flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about the platform..."
              className="w-full rounded-full border border-slate-200 bg-slate-50 py-3 pl-4 pr-12 text-sm outline-none focus:border-violet-300 focus:bg-white focus:ring-4 focus:ring-violet-50 transition"
              disabled={isTyping}
            />
            <button
              onClick={() => handleSend(input)}
              disabled={!input.trim() || isTyping}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 grid h-8 w-8 place-items-center rounded-full bg-brand-ink text-white shadow hover:opacity-90 disabled:opacity-50 transition"
            >
              <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5 translate-x-px">
                <path d="M1 8h14M15 8L8 1M15 8l-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
