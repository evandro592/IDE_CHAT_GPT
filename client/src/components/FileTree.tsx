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
            onClick={onOpenFolder}
            title="Abrir Pasta"
          >
            <RefreshCw className="h-3 w-3" />
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
