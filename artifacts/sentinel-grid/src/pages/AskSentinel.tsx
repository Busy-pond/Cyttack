import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSendChatMessage } from "@workspace/api-client-react";
import { Terminal, Send, ShieldAlert, Cpu } from "lucide-react";
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
      content: `SentinelGrid AI initialized. Authenticated as ${role}. How can I assist with your investigation today?`,
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
    
    // Add user message to UI immediately
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
            content: "ERROR: Secure uplink failed. Please try your query again.",
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
          <h1 className="text-3xl font-heading font-bold tracking-tight flex items-center gap-3">
            <Terminal className="w-8 h-8 text-primary" />
            Ask SentinelGrid
          </h1>
          <p className="text-muted-foreground mt-1 font-mono text-sm">AI-assisted threat intelligence and log analysis.</p>
        </div>

        <div className="flex-1 bg-card border border-border rounded-xl shadow-lg flex flex-col overflow-hidden relative">
          {/* Background decoration */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
          
          <div className="p-3 bg-secondary/50 border-b border-border flex items-center justify-between text-xs font-mono text-muted-foreground z-10">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              LLM-SOC-CORE-v9 ONLINE
            </div>
            <div>ENC: AES-256-GCM</div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 terminal-scroll z-10">
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex gap-4 max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
              >
                <div className={`w-8 h-8 rounded shrink-0 flex items-center justify-center border
                  ${msg.role === 'user' ? 'bg-secondary border-border text-foreground' : 'bg-primary/20 border-primary text-primary'}
                `}>
                  {msg.role === 'user' ? <ShieldAlert className="w-4 h-4" /> : <Cpu className="w-4 h-4" />}
                </div>
                
                <div className={`rounded-lg p-4 font-mono text-sm leading-relaxed border shadow-sm
                  ${msg.role === 'user' 
                    ? 'bg-secondary/50 border-border text-foreground' 
                    : 'bg-card border-primary/30 text-primary-foreground shadow-[0_0_15px_rgba(0,229,199,0.05)]'
                  }
                `}>
                  {msg.content}
                </div>
              </div>
            ))}
            
            {sendMessage.isPending && (
              <div className="flex gap-4 max-w-[85%]">
                <div className="w-8 h-8 rounded shrink-0 flex items-center justify-center border bg-primary/20 border-primary text-primary">
                  <Cpu className="w-4 h-4 animate-pulse" />
                </div>
                <div className="rounded-lg p-4 bg-card border border-primary/30 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 bg-card border-t border-border z-10">
            <form onSubmit={handleSubmit} className="relative flex items-center gap-2">
              <span className="text-primary font-mono ml-2 font-bold">{'>'}</span>
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Query system logs, analyze IOCs, or request mitigation steps..."
                className="flex-1 bg-transparent border-none shadow-none focus-visible:ring-0 font-mono"
                disabled={sendMessage.isPending}
              />
              <Button 
                type="submit" 
                size="icon" 
                disabled={!input.trim() || sendMessage.isPending}
                className="shrink-0"
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
