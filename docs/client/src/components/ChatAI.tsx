import { useState, useRef, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { 
  Bot, 
  User, 
  Send, 
  Trash2, 
  Plus,
  CheckCircle,
  AlertCircle,
  Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { ChatMessage, File as FileType } from "@shared/schema";

interface ChatAIProps {
  projectId: number;
  messages: ChatMessage[];
  currentFile: FileType | null;
  currentCode: string;
  onCodeChange: (code: string) => void;
}

export default function ChatAI({ 
  projectId, 
  messages, 
  currentFile, 
  currentCode, 
  onCodeChange 
}: ChatAIProps) {
  const [input, setInput] = useState("");
  const [isOnline, setIsOnline] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      // Save user message first
      await apiRequest("POST", "/api/chat", {
        projectId,
        role: "user",
        content: message
      });

      // Send to AI
      const aiResponse = await apiRequest("POST", "/api/ai/chat", {
        message,
        context: {
          currentFile: currentFile?.path,
          currentCode: currentCode,
          projectFiles: ["index.html", "script.js", "styles.css"] // Demo project files
        }
      });

      const data = await aiResponse.json();

      // Save AI response
      await apiRequest("POST", "/api/chat", {
        projectId,
        role: "assistant",
        content: data.response,
        metadata: data.codeChanges ? { codeChanges: data.codeChanges } : null
      });

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/chat`] });
      
      // Apply code changes if any
      if (data.codeChanges && data.codeChanges.length > 0) {
        const change = data.codeChanges[0]; // Apply first change for now
        onCodeChange(change.content);
        toast({ 
          title: "Código atualizado", 
          description: "IA aplicou alterações no seu código" 
        });
      }
    },
    onError: () => {
      toast({ 
        title: "Falha ao enviar mensagem", 
        variant: "destructive" 
      });
      setIsOnline(false);
    }
  });

  // Edit code directly mutation
  const editCodeMutation = useMutation({
    mutationFn: async (instruction: string) => {
      const response = await apiRequest("POST", "/api/ai/edit-code", {
        instruction,
        currentCode,
        filename: currentFile?.path,
        language: currentFile?.language
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success && data.modifiedCode) {
        onCodeChange(data.modifiedCode);
        toast({ 
          title: "Código editado com sucesso", 
          description: data.explanation 
        });
      } else {
        toast({ 
          title: "Falha ao editar código", 
          description: data.error,
          variant: "destructive" 
        });
      }
    }
  });

  // Clear chat mutation
  const clearChatMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("DELETE", `/api/projects/${projectId}/chat`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/chat`] });
      toast({ title: "Chat limpo" });
    }
  });

  const handleSend = () => {
    if (!input.trim()) return;
    
    const message = input.trim();
    setInput("");
    
    // Check if it's a direct code edit instruction in Portuguese or English
    const editKeywords = ['edit', 'change', 'modify', 'add', 'remove', 'create', 'delete',
                         'editar', 'alterar', 'modificar', 'adicionar', 'remover', 'criar', 'deletar',
                         'mudar', 'corrigir', 'fix', 'update', 'atualizar'];
    
    const isEditInstruction = editKeywords.some(keyword => 
      message.toLowerCase().includes(keyword)
    );
    
    if (isEditInstruction && currentCode) {
      editCodeMutation.mutate(message);
    } else {
      sendMessageMutation.mutate(message);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (e.ctrlKey || e.metaKey) {
        handleSend();
      }
    }
  };

  const renderMessage = (message: ChatMessage) => {
    const isUser = message.role === 'user';
    const hasCodeChanges = message.metadata && (message.metadata as any).codeChanges;

    return (
      <div key={message.id} className="chat-message mb-4">
        <div className={`rounded-lg p-3 text-sm ${
          isUser 
            ? 'bg-[var(--ide-surface-variant)] ml-6' 
            : 'bg-[var(--ide-primary)] bg-opacity-20'
        }`}>
          <div className="flex items-center space-x-2 mb-2">
            {isUser ? (
              <User className="h-4 w-4 text-[var(--ide-accent)]" />
            ) : (
              <Bot className="h-4 w-4 text-[var(--ide-primary)]" />
            )}
            <span className="font-medium text-xs">
              {isUser ? 'You' : 'AI Assistant'}
            </span>
            <span className="text-xs text-[var(--ide-text-secondary)]">
              {new Date(message.createdAt).toLocaleTimeString()}
            </span>
          </div>
          
          <div className="whitespace-pre-wrap">{message.content}</div>
          
          {hasCodeChanges && (
            <div className="mt-3">
              <Button 
                size="sm" 
                className="bg-[var(--ide-accent)] text-black hover:bg-opacity-80"
                onClick={() => {
                  const changes = (message.metadata as any).codeChanges[0];
                  onCodeChange(changes.content);
                  toast({ title: "Código aplicado no editor" });
                }}
              >
                <CheckCircle className="mr-1 h-3 w-3" />
                Aplicar Mudanças
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col ide-surface">
      {/* Chat Header */}
      <div className="p-3 ide-border border-b flex items-center justify-between">
        <h3 className="font-medium text-sm flex items-center space-x-2">
          <Bot className="h-4 w-4 text-[var(--ide-primary)]" />
          <span>AI ASSISTANT</span>
        </h3>
        <div className="flex items-center space-x-2">
          <Badge 
            variant={isOnline ? "default" : "destructive"} 
            className="text-xs px-2 py-0"
          >
            {isOnline ? "Online" : "Offline"}
          </Badge>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6"
            onClick={() => clearChatMutation.mutate()}
            title="Clear Chat"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6"
            title="New Chat"
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      </div>
      
      {/* Chat Messages */}
      <ScrollArea className="flex-1 p-3" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <Bot className="h-12 w-12 mx-auto mb-4 text-[var(--ide-primary)] opacity-50" />
            <p className="text-sm text-[var(--ide-text-secondary)] mb-4">
              Olá! Eu sou seu assistente de programação IA. Posso ajudar você a:
            </p>
            <ul className="text-xs text-[var(--ide-text-secondary)] space-y-1 text-left max-w-xs mx-auto">
              <li>• Editar e refatorar seu código</li>
              <li>• Criar novos arquivos e pastas</li>
              <li>• Debugar e otimizar seus projetos</li>
              <li>• Responder perguntas sobre programação</li>
            </ul>
          </div>
        ) : (
          <div>
            {messages.map(renderMessage)}
            {(sendMessageMutation.isPending || editCodeMutation.isPending) && (
              <div className="chat-message mb-4">
                <div className="bg-[var(--ide-primary)] bg-opacity-20 rounded-lg p-3 text-sm">
                  <div className="flex items-center space-x-2 mb-2">
                    <Bot className="h-4 w-4 text-[var(--ide-primary)]" />
                    <span className="font-medium text-xs">AI Assistant</span>
                    <Loader2 className="h-3 w-3 animate-spin" />
                  </div>
                  <p className="text-[var(--ide-text-secondary)]">Pensando...</p>
                </div>
              </div>
            )}
          </div>
        )}
      </ScrollArea>
      
      {/* Chat Input */}
      <div className="p-3 ide-border border-t">
        <div className="flex space-x-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Peça ajuda à IA com seu código..."
            className="flex-1 ide-bg ide-border text-[var(--ide-text)] placeholder:text-[var(--ide-text-secondary)]"
            disabled={sendMessageMutation.isPending || editCodeMutation.isPending}
          />
          <Button 
            onClick={handleSend}
            disabled={!input.trim() || sendMessageMutation.isPending || editCodeMutation.isPending}
            className="bg-[var(--ide-primary)] hover:bg-opacity-80"
          >
            {sendMessageMutation.isPending || editCodeMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <div className="flex items-center justify-between mt-2 text-xs text-[var(--ide-text-secondary)]">
          <span>Ctrl + Enter para enviar</span>
          <span className="flex items-center space-x-1">
            {isOnline ? (
              <CheckCircle className="h-3 w-3 text-[var(--ide-accent)]" />
            ) : (
              <AlertCircle className="h-3 w-3 text-red-500" />
            )}
            <span>{isOnline ? "IA Online" : "IA Offline"}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
