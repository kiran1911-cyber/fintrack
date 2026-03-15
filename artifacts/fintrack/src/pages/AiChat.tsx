import { useState, useRef, useEffect } from "react";
import { useSendChatMessage } from "@workspace/api-client-react";
import { useAppStore } from "@/lib/store";
import { Send, Bot, User, Sparkles, Trash2, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const QUICK_SUGGESTIONS = [
  "How can I save more money?",
  "Should I invest in mutual funds?",
  "How to reduce food expenses?",
  "Create a 50/30/20 budget for me"
];

export default function AiChat() {
  const { chatHistory, addChatMessage, clearChat } = useAppStore();
  const [input, setInput] = useState("");
  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  
  const chatMutation = useSendChatMessage();

  // Auto-scroll to bottom
  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, chatMutation.isPending]);

  const handleSend = (text: string = input) => {
    if (!text.trim() || chatMutation.isPending) return;
    
    const userMsg = { role: "user", content: text };
    addChatMessage(userMsg);
    setInput("");
    
    chatMutation.mutate(
      { data: { message: text, history: chatHistory } },
      {
        onSuccess: (data) => {
          addChatMessage({ role: "assistant", content: data.reply });
        },
        onError: () => {
          addChatMessage({ role: "assistant", content: "Sorry, I encountered an error. Please try again." });
        }
      }
    );
  };

  return (
    <div className="h-[calc(100vh-100px)] md:h-[calc(100vh-80px)] flex flex-col max-w-4xl mx-auto animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img 
              src={`${import.meta.env.BASE_URL}images/chat-avatar.png`} 
              alt="FinTrack AI" 
              className="w-12 h-12 rounded-xl object-cover border border-primary/30 bg-card p-1"
            />
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-background" />
          </div>
          <div>
            <h1 className="text-xl font-display font-bold text-foreground">FinTrack AI</h1>
            <p className="text-xs text-primary font-medium flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Online & ready to advise
            </p>
          </div>
        </div>
        <button 
          onClick={clearChat}
          className="p-2 text-muted-foreground hover:text-destructive bg-card border border-border rounded-xl transition-colors hover:bg-destructive/10"
          title="Clear Chat"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      {/* Quick Suggestions (only show if history is just the greeting) */}
      {chatHistory.length <= 1 && (
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {QUICK_SUGGESTIONS.map(sug => (
            <button
              key={sug}
              onClick={() => handleSend(sug)}
              className="text-left px-4 py-3 rounded-xl bg-card border border-border hover:border-primary/50 hover:bg-primary/5 transition-all text-sm text-foreground shadow-sm"
            >
              "{sug}"
            </button>
          ))}
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto py-6 space-y-6 custom-scrollbar px-2">
        <AnimatePresence initial={false}>
          {chatHistory.map((msg, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-4 max-w-[85%] ${msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"}`}
            >
              <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center ${
                msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-card border border-primary/30 text-primary"
              }`}>
                {msg.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              
              <div className={`px-5 py-3.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === "user" 
                  ? "bg-primary text-primary-foreground rounded-tr-sm shadow-md shadow-primary/20" 
                  : "bg-card border border-border text-foreground rounded-tl-sm shadow-sm"
              }`}>
                {msg.content}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {chatMutation.isPending && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-4 max-w-[85%] mr-auto">
            <div className="w-8 h-8 rounded-full bg-card border border-primary/30 text-primary flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div className="px-5 py-4 rounded-2xl bg-card border border-border rounded-tl-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-bounce" />
              <span className="w-2 h-2 rounded-full bg-primary animate-bounce delay-75" />
              <span className="w-2 h-2 rounded-full bg-primary animate-bounce delay-150" />
            </div>
          </motion.div>
        )}
        <div ref={endOfMessagesRef} />
      </div>

      {/* Input Area */}
      <div className="pt-4 border-t border-border mt-auto">
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="relative flex items-center"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything about your finances..."
            className="w-full bg-card border-2 border-border focus:border-primary/50 focus:ring-4 focus:ring-primary/10 rounded-full pl-6 pr-14 py-4 text-sm transition-all outline-none text-foreground placeholder:text-muted-foreground shadow-sm"
          />
          <button
            type="submit"
            disabled={!input.trim() || chatMutation.isPending}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors shadow-md"
          >
            {chatMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 ml-0.5" />}
          </button>
        </form>
        <p className="text-center text-[10px] text-muted-foreground mt-3">
          FinTrack AI can make mistakes. Consider verifying important financial information.
        </p>
      </div>
    </div>
  );
}
