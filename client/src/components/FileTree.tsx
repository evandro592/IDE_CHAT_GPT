import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Folder, 
  FolderOpen, 
  File as FileIcon, 
  FilePlus, 
  FolderPlus, 
  RefreshCw,
  Circle
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { File as FileType } from "@shared/schema";

interface FileTreeProps {
  files: FileType[];
  currentFile: FileType | null;
  onFileSelect: (file: FileType) => void;
  onNewFile: () => void;
  onOpenFolder: () => void;
}

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: FileNode[];
  file?: FileType;
}

export default function FileTree({ 
  files, 
  currentFile, 
  onFileSelect, 
  onNewFile, 
  onOpenFolder 
}: FileTreeProps) {
  const queryClient = useQueryClient();
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  // Build tree structure from flat file list
  const buildFileTree = (files: FileType[]): FileNode[] => {
    const tree: FileNode[] = [];
    const nodeMap = new Map<string, FileNode>();

    // Sort files by path
    const sortedFiles = [...files].sort((a, b) => a.path.localeCompare(b.path));

    for (const file of sortedFiles) {
      const parts = file.path.split('/').filter(Boolean);
      let currentPath = '';

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const parentPath = currentPath;
        currentPath = currentPath ? `${currentPath}/${part}` : part;
        
        if (!nodeMap.has(currentPath)) {
          const isFile = i === parts.length - 1;
          const node: FileNode = {
            name: part,
            path: currentPath,
            type: isFile ? 'file' : 'folder',
            children: isFile ? undefined : [],
            file: isFile ? file : undefined
          };

          nodeMap.set(currentPath, node);

          if (parentPath && nodeMap.has(parentPath)) {
            nodeMap.get(parentPath)!.children!.push(node);
          } else if (!parentPath) {
            tree.push(node);
          }
        }
      }
    }

    return tree;
  };

  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      return newSet;
    });
  };

  const handleOpenFolder = async () => {
    console.log('handleOpenFolder called');
    try {
      if ('showDirectoryPicker' in window) {
        console.log('showDirectoryPicker available');
        const directoryHandle = await (window as any).showDirectoryPicker();
        console.log('Directory selected:', directoryHandle);
        await importFolderToProject(directoryHandle);
      } else {
        console.log('showDirectoryPicker not available');
        alert('Seu navegador não suporta a abertura de pastas. Use Chrome, Edge ou outro navegador compatível.');
      }
    } catch (error: any) {
      console.error('Error in handleOpenFolder:', error);
      if (error.name !== 'AbortError') {
        alert('Erro ao abrir pasta: ' + error.message);
      }
    }
  };

  const importFolderToProject = async (directoryHandle: FileSystemDirectoryHandle) => {
    console.log('Starting import for directory:', directoryHandle.name);
    try {
      const filesToImport: Array<{ path: string; content: string; language: string }> = [];
      
      const readDirectory = async (dirHandle: FileSystemDirectoryHandle, basePath: string = '') => {
        console.log('Reading directory:', basePath || 'root');
        for await (const [name, handle] of dirHandle.entries()) {
          const fullPath = basePath ? `${basePath}/${name}` : name;
          console.log('Processing:', fullPath, 'kind:', handle.kind);
          
          if (handle.kind === 'file') {
            try {
              const file = await handle.getFile();
              console.log('File size:', file.size, 'type:', file.type, 'name:', file.name);
              if (isTextFile(file.name)) {
                const content = await file.text();
                const language = getLanguageFromExtension(file.name);
                filesToImport.push({ path: fullPath, content, language });
                console.log('Added file:', fullPath, 'language:', language);
              } else {
                console.log('Skipped non-text file:', file.name);
              }
            } catch (error) {
              console.warn(`Não foi possível ler o arquivo ${fullPath}:`, error);
            }
          } else if (handle.kind === 'directory' && !shouldSkipDirectory(name)) {
            console.log('Entering directory:', name);
            await readDirectory(handle, fullPath);
          } else {
            console.log('Skipped directory:', name);
          }
        }
      };

      await readDirectory(directoryHandle);
      console.log('Total files to import:', filesToImport.length);
      
      if (filesToImport.length === 0) {
        alert('Nenhum arquivo de texto foi encontrado na pasta selecionada.');
        return;
      }

      console.log('Importing files...');
      const importPromises = filesToImport.map(({ path, content, language }) =>
        apiRequest(`/api/files`, {
          method: 'POST',
          body: JSON.stringify({
            projectId: 1,
            path,
            content,
            language
          })
        })
      );

      await Promise.all(importPromises);
      queryClient.invalidateQueries({ queryKey: ['/api/projects/1/files'] });
      console.log('Import completed successfully');
      alert(`${filesToImport.length} arquivos importados com sucesso!`);
      
    } catch (error: any) {
      console.error('Error importing folder:', error);
      alert('Erro ao importar pasta: ' + error.message);
    }
  };

  const isTextFile = (filename: string): boolean => {
    const textExtensions = [
      'js', 'jsx', 'ts', 'tsx', 'html', 'htm', 'css', 'scss', 'sass', 'less',
      'json', 'xml', 'yaml', 'yml', 'txt', 'md', 'markdown', 'py', 'java',
      'c', 'cpp', 'h', 'php', 'sql', 'sh', 'bat', 'ps1', 'rb', 'go', 'rs',
      'vue', 'svelte', 'astro', 'env', 'gitignore', 'dockerfile', 'makefile'
    ];
    const ext = filename.split('.').pop()?.toLowerCase();
    return textExtensions.includes(ext || '') || !filename.includes('.');
  };

  const shouldSkipDirectory = (dirName: string): boolean => {
    const skipDirs = ['node_modules', '.git', 'dist', 'build', '.next', '.vscode', 'coverage'];
    return skipDirs.includes(dirName) || dirName.startsWith('.');
  };

  const getLanguageFromExtension = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase();
    const languageMap: Record<string, string> = {
      'js': 'javascript', 'jsx': 'javascript', 'ts': 'typescript', 'tsx': 'typescript',
      'html': 'html', 'htm': 'html', 'css': 'css', 'scss': 'scss', 'sass': 'sass',
      'less': 'less', 'json': 'json', 'xml': 'xml', 'yaml': 'yaml', 'yml': 'yaml',
      'md': 'markdown', 'py': 'python', 'java': 'java', 'php': 'php', 'sql': 'sql',
      'rb': 'ruby', 'go': 'go', 'rs': 'rust', 'vue': 'vue', 'svelte': 'svelte'
    };
    return languageMap[ext || ''] || 'plaintext';
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
      'md': '📝',
      'py': '🐍',
      'java': '☕',
      'cpp': '⚙️',
      'c': '⚙️'
    };
    return iconMap[ext || ''] || '📄';
  };

  const renderTreeNode = (node: FileNode, depth: number = 0) => {
    const isExpanded = expandedFolders.has(node.path);
    const isCurrentFile = currentFile?.id === node.file?.id;
    const isModified = node.file?.isModified;

    return (
      <div key={node.path}>
        <div
          className={`flex items-center space-x-2 px-2 py-1 rounded cursor-pointer hover:bg-[var(--ide-surface-variant)] ${
            isCurrentFile ? 'bg-[var(--ide-primary)] bg-opacity-20' : ''
          }`}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={() => {
            if (node.type === 'folder') {
              toggleFolder(node.path);
            } else if (node.file) {
              onFileSelect(node.file);
            }
          }}
        >
          {node.type === 'folder' ? (
            isExpanded ? (
              <FolderOpen className="h-4 w-4 text-[var(--ide-accent)]" />
            ) : (
              <Folder className="h-4 w-4 text-[var(--ide-accent)]" />
            )
          ) : (
            <span className="text-sm">{getFileIcon(node.name)}</span>
          )}
          <span className="text-sm flex-1">{node.name}</span>
          {isModified && (
            <Circle className="h-2 w-2 text-[var(--ide-accent)] fill-current" />
          )}
        </div>
        
        {node.type === 'folder' && isExpanded && node.children && (
          <div>
            {node.children.map(child => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const fileTree = buildFileTree(files);

  return (
    <div className="h-full flex flex-col ide-surface">
      <div className="p-3 ide-border border-b flex items-center justify-between">
        <h3 className="font-medium text-sm">EXPLORER</h3>
        <div className="flex space-x-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6"
            onClick={onNewFile}
            title="Novo Arquivo"
          >
            <FilePlus className="h-3 w-3" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6"
            title="Nova Pasta"
          >
            <FolderPlus className="h-3 w-3" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6"
            onClick={handleOpenFolder}
            title="Abrir Pasta"
          >
            <FolderOpen className="h-3 w-3" />
          </Button>
        </div>
      </div>
      
      <ScrollArea className="flex-1 p-2">
        {fileTree.length === 0 ? (
          <div className="text-center py-8 text-[var(--ide-text-secondary)]">
            <Folder className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm mb-2">Nenhum arquivo aberto</p>
            <Button onClick={onOpenFolder} variant="outline" size="sm">
              Abrir Pasta
            </Button>
          </div>
        ) : (
          <div className="space-y-1">
            {fileTree.map(node => renderTreeNode(node))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
