import { useEffect, useRef } from "react";
import { Bot, Cpu, MessageSquare } from "lucide-react";

import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatInput } from "@/components/chat/ChatInput";
import { ChatMessage } from "@/components/chat/ChatMessage";
import type { ConversationMessage } from "@/lib/api";

interface ChatConversationPanelProps {
  messages: ConversationMessage[];
  onSend: (message: string) => Promise<unknown> | void;
  isSending?: boolean;
  placeholder?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  disabled?: boolean;
  heightClassName?: string;
}

export function ChatConversationPanel({
  messages,
  onSend,
  isSending,
  placeholder = "Type your message...",
  emptyTitle = "Ready to test?",
  emptyDescription = "Send a message below to start a conversation with your bot.",
  disabled,
  heightClassName = "min-h-[600px]",
}: ChatConversationPanelProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!scrollAreaRef.current) return;
    const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
    if (viewport) {
      viewport.scrollTop = viewport.scrollHeight;
    }
  }, [messages, isSending]);

  return (
    <Card className={`glass-enhanced p-6 flex flex-col shadow-glow-sm ${heightClassName}`}>
      <ScrollArea ref={scrollAreaRef} className="flex-1 overflow-y-auto mb-6 pr-2">
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-24 text-muted-foreground flex flex-col items-center">
              <div className="h-20 w-20 bg-primary/5 rounded-full flex items-center justify-center mb-6 border border-primary/10 animate-pulse-glow">
                <MessageSquare className="h-10 w-10 text-primary/40" />
              </div>
              <h3 className="text-xl font-bold text-primary/50 mb-2">{emptyTitle}</h3>
              <p className="max-w-xs mx-auto">{emptyDescription}</p>
            </div>
          ) : (
            messages.map((message, index) => <ChatMessage key={`${message.timestamp}-${index}`} {...message} />)
          )}

          {isSending ? (
            <div className="flex items-center gap-3 p-4 rounded-2xl glass-enhanced max-w-[80%]">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary animate-pulse">
                <Cpu className="h-4 w-4" />
              </div>
              <div className="flex gap-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-primary/40 animate-bounce [animation-delay:-0.3s]" />
                <div className="h-1.5 w-1.5 rounded-full bg-primary/40 animate-bounce [animation-delay:-0.15s]" />
                <div className="h-1.5 w-1.5 rounded-full bg-primary/40 animate-bounce" />
              </div>
            </div>
          ) : null}
        </div>
      </ScrollArea>

      {disabled ? (
        <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-6 text-center text-sm text-muted-foreground">
          <Bot className="mx-auto mb-2 h-5 w-5 text-primary/60" />
          Select a project to activate chat orchestration.
        </div>
      ) : (
        <ChatInput onSend={onSend} isLoading={isSending} placeholder={placeholder} />
      )}
    </Card>
  );
}
