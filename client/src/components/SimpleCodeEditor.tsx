import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Save, 
  Search, 
  AlignLeft, 
  X,
  Circle
} from "lucide-react";
import type { File as FileType } from "@shared/schema";

interface SimpleCodeEditorProps {
  file: FileType | null;
  content: string;
  onChange: (content: string) => void;
  onSave: () => void;
}

export default function SimpleCodeEditor({ file, content, onChange, onSave }: SimpleCodeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
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
    if (textareaRef.current && content !== undefined) {
      textareaRef.current.value = content;
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
    
    // Tab support
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = e.target as HTMLTextAreaElement;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const value = textarea.value;
      
      if (e.shiftKey) {
        // Remove tab
        const lineStart = value.lastIndexOf('\n', start - 1) + 1;
        if (value.substring(lineStart, lineStart + 2) === '  ') {
          const newValue = value.substring(0, lineStart) + value.substring(lineStart + 2);
          onChange(newValue);
          setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd = start - 2;
          }, 0);
        }
      } else {
        // Add tab
        const newValue = value.substring(0, start) + '  ' + value.substring(end);
        onChange(newValue);
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = start + 2;
        }, 0);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
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
            <Button variant="ghost" size="icon" className="h-6 w-6" title="Formatar Código">
              <AlignLeft className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6" title="Localizar e Substituir">
              <Search className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onSave} title="Salvar">
              <Save className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}
      
      {/* Simple Text Editor */}
      <div className="flex-1 relative">
        {file ? (
          <textarea
            ref={textareaRef}
            className="w-full h-full resize-none border-none outline-none p-4 ide-bg ide-text code-editor"
            style={{
              fontFamily: 'JetBrains Mono, Fira Code, Monaco, Cascadia Code, Roboto Mono, monospace',
              fontSize: '14px',
              lineHeight: '1.5',
              tabSize: 2
            }}
            defaultValue={content}
            onChange={handleChange}
            placeholder="Digite seu código aqui..."
            spellCheck={false}
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