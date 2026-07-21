import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSendChatMessage } from "@workspace/api-client-react";
import { Terminal, Send, ShieldAlert, Cpu, ArrowRight } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
};

export default function AskSentinel() {
  const { role } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Cyttack AI ready. Authenticated as ${role}. Ask me to analyze logs, explain detected techniques, or recommend containment steps.`,
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sendMessage = useSendChatMessage();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, sendMessage.isPending]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || sendMessage.isPending) return;

    const userMessage = input.trim();
    setInput("");
    
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    }]);

    sendMessage.mutate(
      { data: { message: userMessage, role: role || undefined } },
      {
        onSuccess: (data) => {
          setMessages(prev => [...prev, {
            id: Date.now().toString() + '-ai',
            role: 'assistant',
            content: data.reply,
            timestamp: new Date()
          }]);
        },
        onError: () => {
          setMessages(prev => [...prev, {
            id: Date.now().toString() + '-err',
            role: 'assistant',
            content: "Unable to reach the AI. Please try again.",
            timestamp: new Date()
          }]);
        }
      }
    );
  };

  return (
    <AppLayout>
      <div className="flex flex-col h-[calc(100vh-8rem)]">
        <div className="mb-6">
          <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground mb-2">AI PREDICTION</p>
          <h1 className="text-3xl font-heading font-bold tracking-tight text-foreground">Ask Cyttack</h1>
          <p className="text-muted-foreground text-sm mt-1">AI-assisted threat intelligence, log analysis, and playbook guidance.</p>
        </div>

        <div className="flex-1 bg-card border border-border rounded-xl shadow-sm flex flex-col overflow-hidden">
          {/* Header bar */}
          <div className="px-5 py-3 bg-secondary/50 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-low" />
              <span className="text-xs font-medium text-foreground">Cyttack AI</span>
              <span className="text-xs text-muted-foreground">· LLM-SOC-CORE</span>
            </div>
            <span className="text-[10px] text-muted-foreground font-mono">AES-256-GCM</span>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-5 surface-scroll">
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex gap-3 max-w-[85%] fade-up ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
              >
                <div className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center border ${
                  msg.role === 'user' 
                    ? 'bg-secondary border-border text-muted-foreground' 
                    : 'bg-primary border-primary text-primary-foreground'
                }`}>
                  {msg.role === 'user' ? <ShieldAlert className="w-3.5 h-3.5" /> : <Cpu className="w-3.5 h-3.5" />}
                </div>
                
                <div className={`rounded-xl px-4 py-3 text-sm leading-relaxed border ${
                  msg.role === 'user' 
                    ? 'bg-secondary border-border text-foreground' 
                    : 'bg-card border-border text-foreground shadow-sm'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            
            {sendMessage.isPending && (
              <div className="flex gap-3 max-w-[85%]">
                <div className="w-7 h-7 rounded-lg shrink-0 flex items-center justify-center border bg-primary border-primary text-primary-foreground">
                  <Cpu className="w-3.5 h-3.5" />
                </div>
                <div className="rounded-xl px-4 py-3 bg-card border border-border flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-border bg-card">
            <form onSubmit={handleSubmit} className="flex items-center gap-3">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about IOCs, MITRE techniques, containment steps..."
                className="flex-1 bg-secondary border-border focus-visible:ring-primary/30 text-sm"
                disabled={sendMessage.isPending}
              />
              <Button 
                type="submit" 
                size="icon" 
                disabled={!input.trim() || sendMessage.isPending}
                className="bg-primary text-primary-foreground hover:bg-primary/90 shrink-0"
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
