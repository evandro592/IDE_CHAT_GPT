import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Save, 
  Search, 
  AlignLeft, 
  X,
  Circle
} from "lucide-react";
import { setupMonaco, disposeMonaco } from "@/lib/monaco-setup";
import type { File as FileType } from "@shared/schema";

interface CodeEditorProps {
  file: FileType | null;
  content: string;
  onChange: (content: string) => void;
  onSave: () => void;
}

export default function CodeEditor({ file, content, onChange, onSave }: CodeEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const monacoRef = useRef<any>(null);
  const [openTabs, setOpenTabs] = useState<FileType[]>([]);
  const [activeTab, setActiveTab] = useState<string>("");

  useEffect(() => {
    if (file && !openTabs.find(tab => tab.id === file.id)) {
      setOpenTabs(prev => [...prev, file]);
    }
    if (file) {
      setActiveTab(file.id.toString());
    }
  }, [file]);

  useEffect(() => {
    if (editorRef.current && file && content !== undefined) {
      setupMonaco(editorRef.current, content, onChange, file?.language || 'javascript')
        .then((editor) => {
          monacoRef.current = editor;
        })
        .catch((error) => {
          console.error('Failed to setup Monaco:', error);
          // Fallback to simple textarea
          const textarea = document.createElement('textarea');
          textarea.value = content;
          textarea.style.width = '100%';
          textarea.style.height = '100%';
          textarea.style.border = 'none';
          textarea.style.outline = 'none';
          textarea.style.resize = 'none';
          textarea.style.fontFamily = 'monospace';
          textarea.style.fontSize = '14px';
          textarea.style.padding = '10px';
          textarea.style.backgroundColor = 'var(--ide-bg)';
          textarea.style.color = 'var(--ide-text)';
          textarea.addEventListener('input', (e) => {
            onChange((e.target as HTMLTextAreaElement).value);
          });
          editorRef.current!.appendChild(textarea);
        });
    }
    
    // Listen for save events from Monaco
    const handleSave = () => onSave();
    window.addEventListener('monaco-save', handleSave);
    
    return () => {
      window.removeEventListener('monaco-save', handleSave);
    };
  }, [file, content, onChange, onSave]);

  useEffect(() => {
    if (monacoRef.current && content !== undefined && content !== monacoRef.current.getValue()) {
      const position = monacoRef.current.getPosition();
      monacoRef.current.setValue(content);
      if (position) {
        monacoRef.current.setPosition(position);
      }
    }
  }, [content]);

  const closeTab = (tabId: number) => {
    setOpenTabs(prev => prev.filter(tab => tab.id !== tabId));
    if (activeTab === tabId.toString()) {
      const remainingTabs = openTabs.filter(tab => tab.id !== tabId);
      if (remainingTabs.length > 0) {
        setActiveTab(remainingTabs[0].id.toString());
      } else {
        setActiveTab("");
        disposeMonaco();
      }
    }
  };

  const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    const iconMap: Record<string, string> = {
      'js': '📄',
      'jsx': '⚛️',
      'ts': '🔵',
      'tsx': '⚛️',
      'html': '🌐',
      'css': '🎨',
      'json': '📋',
      'md': '📝'
    };
    return iconMap[ext || ''] || '📄';
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      onSave();
    }
  };

  return (
    <div className="h-full flex flex-col ide-bg" onKeyDown={handleKeyDown}>
      {/* Editor Tabs */}
      {openTabs.length > 0 && (
        <div className="ide-surface ide-border border-b flex items-center">
          <div className="flex overflow-x-auto">
            {openTabs.map(tab => (
              <div
                key={tab.id}
                className={`px-4 py-2 ide-border border-r flex items-center space-x-2 text-sm cursor-pointer ${
                  activeTab === tab.id.toString() 
                    ? 'ide-bg' 
                    : 'ide-text-secondary hover:bg-[var(--ide-surface-variant)]'
                }`}
                onClick={() => setActiveTab(tab.id.toString())}
              >
                <span>{getFileIcon(tab.path)}</span>
                <span>{tab.path.split('/').pop()}</span>
                {tab.isModified && (
                  <Circle className="h-2 w-2 text-[var(--ide-accent)] fill-current" />
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 p-0 hover:bg-[var(--ide-surface-variant)]"
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTab(tab.id);
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
          
          <div className="ml-auto px-4 py-2 flex items-center space-x-2">
            <Button variant="ghost" size="icon" className="h-6 w-6" title="Format Code">
              <AlignLeft className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6" title="Find & Replace">
              <Search className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onSave} title="Save">
              <Save className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}
      
      {/* Monaco Editor */}
      <div className="flex-1 relative">
        {file ? (
          <div 
            ref={editorRef} 
            className="h-full w-full"
            style={{ minHeight: '400px' }}
          />
        ) : (
          <div className="h-full flex items-center justify-center text-[var(--ide-text-secondary)]">
            <div className="text-center">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-lg font-medium mb-2">Nenhum arquivo selecionado</h3>
              <p className="text-sm">Selecione um arquivo no explorador para começar a editar</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Status Bar */}
      {file && (
        <div className="ide-surface ide-border border-t px-4 py-1 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-1">
              <Circle className="h-2 w-2 text-[var(--ide-accent)] fill-current" />
              <span>{file.language || 'Plain Text'}</span>
            </span>
            <span>UTF-8</span>
            <span>LF</span>
          </div>
          <div className="flex items-center space-x-4">
            <span className={file.isModified ? 'text-[var(--ide-accent)]' : 'text-[var(--ide-text-secondary)]'}>
              {file.isModified ? '● Modificado' : '✓ Salvo'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
