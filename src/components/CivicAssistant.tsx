import React, { useState, useRef, useEffect } from 'react';
import { HelpCircle, Send, Sparkles, MessageSquare, Trash, Bot, X } from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface CivicAssistantProps {
  onClose: () => void;
}

export default function CivicAssistant({ onClose }: CivicAssistantProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: "Hello! I am your **UrbanEye AI Civic Assistant**.\n\nI have live access to the Bangalore municipal issue database. You can ask me things like:\n* *Is there any active water leakage reported near Indiranagar?*\n* *What is the current status of the pothole at 80 Feet Road?*\n* *How do I earn citizen XP points or unlock badges?*"
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async () => {
    if (!inputValue.trim() || loading) return;

    const userText = inputValue;
    setInputValue('');
    setMessages(prev => [...prev, { role: 'user', content: userText }]);
    setLoading(true);

    try {
      const chatHistory = messages.map(m => ({
        role: m.role,
        content: m.content
      }));

      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userText,
          chatHistory
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Connection failed.');
      }

      setMessages(prev => [...prev, { role: 'assistant', content: data.text }]);
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: "I apologize, but I encountered a minor signal loss. Please try again! I'm ready to help check active community reports anytime."
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        role: 'assistant',
        content: "Cleared chat logs. Ask me anything about Bangalore municipal issues, live dispatches, or community XP rules!"
      }
    ]);
  };

  // Helper to parse markdown-like bold/list statements simple client-side
  const renderMessageText = (text: string) => {
    return text.split('\n').map((line, i) => {
      // Bold text formatting
      let formatted = line;
      const boldRegex = /\*\*(.*?)\*\*/g;
      formatted = formatted.replace(boldRegex, '<strong class="text-white font-bold">$1</strong>');
      
      // List item bullet
      if (line.trim().startsWith('* ')) {
        const itemContent = line.replace(/^\*\s*/, '');
        return (
          <li key={i} className="list-disc ml-4 text-xs text-slate-300 leading-relaxed mb-1" dangerouslySetInnerHTML={{ __html: itemContent.replace(boldRegex, '<strong>$1</strong>') }} />
        );
      }

      return (
        <p key={i} className="text-xs text-slate-300 leading-relaxed mb-2" dangerouslySetInnerHTML={{ __html: formatted }} />
      );
    });
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border-l border-slate-800 w-full md:w-[380px] shadow-2xl relative">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
            <Bot className="h-4.5 w-4.5 text-emerald-400" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white font-sans">AI Civic Assistant</h4>
            <span className="text-[9px] font-mono text-emerald-400">GEMINI AGENT ONLINE</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={clearChat}
            title="Reset Chat"
            className="p-1.5 text-slate-500 hover:text-slate-300 rounded hover:bg-slate-850"
          >
            <Trash className="h-4 w-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-500 hover:text-white rounded hover:bg-slate-850"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>
      </div>

      {/* Message Pane */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-950/40">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <span className="text-[9px] font-mono text-slate-500 mb-1">
              {m.role === 'user' ? 'Citizen' : 'UrbanEye AI'}
            </span>
            <div
              className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 shadow-md border text-left ${
                m.role === 'user'
                  ? 'bg-slate-800 border-slate-750 text-white rounded-tr-none'
                  : 'bg-slate-900 border-slate-800 text-slate-200 rounded-tl-none'
              }`}
            >
              {renderMessageText(m.content)}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex flex-col items-start">
            <span className="text-[9px] font-mono text-slate-500 mb-1">UrbanEye AI</span>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-2">
              <span className="h-1.5 w-1.5 bg-cyan-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
              <span className="h-1.5 w-1.5 bg-cyan-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
              <span className="h-1.5 w-1.5 bg-cyan-400 rounded-full animate-bounce"></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Tray */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/80">
        <div className="relative flex items-center">
          <input
            type="text"
            placeholder="Ask about Koramangala, reports, or XP..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyPress}
            className="w-full text-xs text-white bg-slate-900 border border-slate-800 rounded-xl py-2.5 pl-3 pr-10 focus:outline-none focus:border-emerald-500 placeholder:text-slate-500"
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || loading}
            className="absolute right-1.5 p-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg transition disabled:opacity-50"
          >
            <Send className="h-3.5 w-3.5 stroke-[2.5]" />
          </button>
        </div>
        <div className="flex items-center justify-center gap-1 mt-2 text-[9px] text-slate-500 font-mono">
          <Sparkles className="h-3 w-3 text-cyan-500" />
          Conversational real-time status summaries
        </div>
      </div>
    </div>
  );
}
