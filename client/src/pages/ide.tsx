import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import FileTree from "@/components/FileTree";
import SimpleCodeEditor from "@/components/SimpleCodeEditor";
import ChatAI from "@/components/ChatAI";
import ResizablePanel from "@/components/ResizablePanel";
import MobileKeyboard from "@/components/MobileKeyboard";
import { useResponsive } from "@/hooks/use-responsive";
import { useFileSystem } from "@/hooks/use-file-system";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { 
  Plus, 
  FolderOpen, 
  Save, 
  Settings, 
  Menu,
  Code,
  FolderTree,
  Bot,
  FilePlus,
  FolderPlus,
  Trash2,
  RefreshCw
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Project, File as FileType, ChatMessage } from "@shared/schema";

export default function IDE() {
  const { isMobile } = useResponsive();
  const { openFolder, currentProject, currentDirectory } = useFileSystem();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<"files" | "editor" | "chat">("editor");
  const [currentFile, setCurrentFile] = useState<FileType | null>(null);
  const [editorContent, setEditorContent] = useState<string>("");
  const [mobileActionsOpen, setMobileActionsOpen] = useState(false);

  // Fetch current project data
  const { data: project } = useQuery<Project>({
    queryKey: ["/api/projects/1"], // Using default project for demo
    enabled: true
  });

  // Fetch files for current project
  const { data: files = [] } = useQuery<FileType[]>({
    queryKey: ["/api/projects/1/files"],
    enabled: !!project
  });

  // Fetch chat messages
  const { data: chatMessages = [] } = useQuery<ChatMessage[]>({
    queryKey: ["/api/projects/1/chat"],
    enabled: !!project
  });

  // Create new file mutation
  const createFileMutation = useMutation({
    mutationFn: async (fileData: { path: string; content?: string; language?: string }) => {
      return apiRequest("POST", "/api/files", {
        projectId: 1,
        ...fileData
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects/1/files"] });
      toast({ title: "Arquivo criado com sucesso" });
    },
    onError: () => {
      toast({ title: "Falha ao criar arquivo", variant: "destructive" });
    }
  });

  // Update file mutation
  const updateFileMutation = useMutation({
    mutationFn: async (data: { id: number; content: string; isModified: boolean }) => {
      return apiRequest("PUT", `/api/files/${data.id}`, {
        content: data.content,
        isModified: data.isModified
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects/1/files"] });
    }
  });

  const handleFileSelect = (file: FileType) => {
    setCurrentFile(file);
    setEditorContent(file.content || "");
    if (isMobile) {
      setActiveTab("editor");
    }
  };

  const handleEditorChange = (content: string) => {
    setEditorContent(content);
    if (currentFile) {
      updateFileMutation.mutate({
        id: currentFile.id,
        content,
        isModified: true
      });
    }
  };

  const handleSaveFile = () => {
    if (currentFile) {
      updateFileMutation.mutate({
        id: currentFile.id,
        content: editorContent,
        isModified: false
      });
      toast({ title: "Arquivo salvo com sucesso" });
    }
  };

  const handleNewFile = () => {
    const fileName = prompt("Digite o nome do arquivo:");
    if (fileName) {
      createFileMutation.mutate({
        path: fileName,
        content: "",
        language: getLanguageFromExtension(fileName)
      });
    }
  };

  const handleOpenFolder = async () => {
    try {
      await openFolder();
      toast({ title: "Pasta aberta com sucesso" });
    } catch (error) {
      toast({ 
        title: "Falha ao abrir pasta", 
        description: "API de acesso ao sistema de arquivos pode não estar disponível",
        variant: "destructive" 
      });
    }
  };

  const getLanguageFromExtension = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase();
    const languageMap: Record<string, string> = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'py': 'python',
      'html': 'html',
      'css': 'css',
      'json': 'json',
      'md': 'markdown'
    };
    return languageMap[ext || ''] || 'plaintext';
  };

  if (isMobile) {
    return (
      <div className="h-screen flex flex-col ide-bg ide-text">
        {/* Mobile Header */}
        <header className="ide-surface ide-border border-b px-4 py-2 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Code className="text-[var(--ide-primary)] text-xl" />
            <h1 className="text-lg font-medium">AI Code IDE</h1>
            <span className="text-xs bg-[var(--ide-accent)] text-black px-2 py-1 rounded font-medium">
              BETA
            </span>
          </div>
          
          <Sheet open={mobileActionsOpen} onOpenChange={setMobileActionsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent className="ide-surface">
              <div className="grid grid-cols-1 gap-3 mt-6">
                <Button onClick={handleNewFile} className="justify-start">
                  <FilePlus className="mr-2 h-4 w-4" />
                  Novo Arquivo
                </Button>
                <Button onClick={handleOpenFolder} className="justify-start">
                  <FolderOpen className="mr-2 h-4 w-4" />
                  Abrir Pasta
                </Button>
                <Button onClick={handleSaveFile} className="justify-start">
                  <Save className="mr-2 h-4 w-4" />
                  Salvar Arquivo
                </Button>
                <Button variant="outline" className="justify-start">
                  <Settings className="mr-2 h-4 w-4" />
                  Configurações
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </header>

        {/* Mobile Tabs */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-3 ide-surface ide-border border-b rounded-none">
            <TabsTrigger value="files" className="flex flex-col py-3">
              <FolderTree className="mb-1 h-4 w-4" />
              <span className="text-xs">Arquivos</span>
            </TabsTrigger>
            <TabsTrigger value="editor" className="flex flex-col py-3">
              <Code className="mb-1 h-4 w-4" />
              <span className="text-xs">Editor</span>
            </TabsTrigger>
            <TabsTrigger value="chat" className="flex flex-col py-3">
              <Bot className="mb-1 h-4 w-4" />
              <span className="text-xs">IA Chat</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="files" className="flex-1 mt-0">
            <FileTree 
              files={files}
              onFileSelect={handleFileSelect}
              currentFile={currentFile}
              onNewFile={handleNewFile}
              onOpenFolder={handleOpenFolder}
            />
          </TabsContent>

          <TabsContent value="editor" className="flex-1 mt-0 flex flex-col">
            <SimpleCodeEditor
              file={currentFile}
              content={editorContent}
              onChange={handleEditorChange}
              onSave={handleSaveFile}
            />
            <MobileKeyboard onInsert={(text) => setEditorContent(prev => prev + text)} />
          </TabsContent>

          <TabsContent value="chat" className="flex-1 mt-0">
            <ChatAI
              projectId={1}
              messages={chatMessages}
              currentFile={currentFile}
              currentCode={editorContent}
              onCodeChange={setEditorContent}
            />
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col ide-bg ide-text">
      {/* Desktop Header */}
      <header className="ide-surface ide-border border-b px-4 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Code className="text-[var(--ide-primary)] text-xl" />
          <h1 className="text-lg font-medium">AI Code IDE</h1>
          <span className="text-xs bg-[var(--ide-accent)] text-black px-2 py-1 rounded font-medium">
            BETA
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" onClick={handleNewFile} title="New File">
            <FilePlus className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" title="New Folder">
            <FolderPlus className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleOpenFolder} title="Open Folder">
            <FolderOpen className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleSaveFile} title="Save All">
            <Save className="h-4 w-4" />
          </Button>
          <div className="w-px h-6 ide-border border-l"></div>
          <Button variant="ghost" size="icon" title="Settings">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Desktop Layout */}
      <div className="flex-1 flex overflow-hidden">
        <ResizablePanel defaultSize={20} minSize={15} maxSize={40}>
          <FileTree 
            files={files}
            onFileSelect={handleFileSelect}
            currentFile={currentFile}
            onNewFile={handleNewFile}
            onOpenFolder={handleOpenFolder}
          />
        </ResizablePanel>

        <ResizablePanel defaultSize={60} minSize={30}>
          <SimpleCodeEditor
            file={currentFile}
            content={editorContent}
            onChange={handleEditorChange}
            onSave={handleSaveFile}
          />
        </ResizablePanel>

        <ResizablePanel defaultSize={20} minSize={15} maxSize={40}>
          <ChatAI
            projectId={1}
            messages={chatMessages}
            currentFile={currentFile}
            currentCode={editorContent}
            onCodeChange={setEditorContent}
          />
        </ResizablePanel>
      </div>
    </div>
  );
}
