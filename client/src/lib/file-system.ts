// File system utilities for browser-based file operations

export interface FileEntry {
  name: string;
  path: string;
  type: 'file' | 'directory';
  handle?: FileSystemHandle;
  size?: number;
  lastModified?: Date;
}

export class FileSystemManager {
  private static instance: FileSystemManager;
  private currentDirectoryHandle: FileSystemDirectoryHandle | null = null;
  
  static getInstance(): FileSystemManager {
    if (!FileSystemManager.instance) {
      FileSystemManager.instance = new FileSystemManager();
    }
    return FileSystemManager.instance;
  }

  get isSupported(): boolean {
    return typeof window !== 'undefined' && 'showDirectoryPicker' in window;
  }

  async openDirectory(): Promise<FileSystemDirectoryHandle> {
    if (!this.isSupported) {
      throw new Error('File System Access API is not supported');
    }

    try {
      const dirHandle = await (window as any).showDirectoryPicker({
        mode: 'readwrite'
      });
      
      this.currentDirectoryHandle = dirHandle;
      return dirHandle;
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        throw new Error('User cancelled directory selection');
      }
      throw error;
    }
  }

  async listFiles(directoryHandle?: FileSystemDirectoryHandle): Promise<FileEntry[]> {
    const handle = directoryHandle || this.currentDirectoryHandle;
    if (!handle) {
      throw new Error('No directory handle available');
    }

    const entries: FileEntry[] = [];
    
    for await (const [name, entryHandle] of handle.entries()) {
      const entry: FileEntry = {
        name,
        path: name, // Simple path for now
        type: entryHandle.kind === 'file' ? 'file' : 'directory',
        handle: entryHandle
      };

      if (entryHandle.kind === 'file') {
        try {
          const file = await (entryHandle as FileSystemFileHandle).getFile();
          entry.size = file.size;
          entry.lastModified = new Date(file.lastModified);
        } catch (error) {
          console.warn(`Could not get file info for ${name}:`, error);
        }
      }

      entries.push(entry);
    }

    return entries.sort((a, b) => {
      // Directories first, then files
      if (a.type !== b.type) {
        return a.type === 'directory' ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
  }

  async readFile(fileHandle: FileSystemFileHandle): Promise<string> {
    try {
      const file = await fileHandle.getFile();
      return await file.text();
    } catch (error) {
      throw new Error(`Failed to read file: ${(error as Error).message}`);
    }
  }

  async writeFile(fileHandle: FileSystemFileHandle, content: string): Promise<void> {
    try {
      const writable = await fileHandle.createWritable();
      await writable.write(content);
      await writable.close();
    } catch (error) {
      throw new Error(`Failed to write file: ${(error as Error).message}`);
    }
  }

  async createFile(name: string, content: string = '', directoryHandle?: FileSystemDirectoryHandle): Promise<FileSystemFileHandle> {
    const handle = directoryHandle || this.currentDirectoryHandle;
    if (!handle) {
      throw new Error('No directory handle available');
    }

    try {
      const fileHandle = await handle.getFileHandle(name, { create: true });
      await this.writeFile(fileHandle, content);
      return fileHandle;
    } catch (error) {
      throw new Error(`Failed to create file: ${(error as Error).message}`);
    }
  }

  async deleteFile(name: string, directoryHandle?: FileSystemDirectoryHandle): Promise<void> {
    const handle = directoryHandle || this.currentDirectoryHandle;
    if (!handle) {
      throw new Error('No directory handle available');
    }

    try {
      await handle.removeEntry(name);
    } catch (error) {
      throw new Error(`Failed to delete file: ${(error as Error).message}`);
    }
  }

  async createDirectory(name: string, directoryHandle?: FileSystemDirectoryHandle): Promise<FileSystemDirectoryHandle> {
    const handle = directoryHandle || this.currentDirectoryHandle;
    if (!handle) {
      throw new Error('No directory handle available');
    }

    try {
      return await handle.getDirectoryHandle(name, { create: true });
    } catch (error) {
      throw new Error(`Failed to create directory: ${(error as Error).message}`);
    }
  }

  getCurrentDirectoryHandle(): FileSystemDirectoryHandle | null {
    return this.currentDirectoryHandle;
  }

  // Utility function to get file extension
  getFileExtension(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() || '';
  }

  // Get language/mime type from file extension
  getLanguageFromExtension(filename: string): string {
    const ext = this.getFileExtension(filename);
    const languageMap: Record<string, string> = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'py': 'python',
      'java': 'java',
      'c': 'c',
      'cpp': 'cpp',
      'cc': 'cpp',
      'cxx': 'cpp',
      'h': 'c',
      'hpp': 'cpp',
      'cs': 'csharp',
      'php': 'php',
      'rb': 'ruby',
      'go': 'go',
      'rs': 'rust',
      'kt': 'kotlin',
      'swift': 'swift',
      'html': 'html',
      'htm': 'html',
      'css': 'css',
      'scss': 'scss',
      'sass': 'sass',
      'less': 'less',
      'json': 'json',
      'xml': 'xml',
      'yaml': 'yaml',
      'yml': 'yaml',
      'md': 'markdown',
      'txt': 'plaintext',
      'sql': 'sql',
      'sh': 'shell',
      'bash': 'shell',
      'zsh': 'shell',
      'fish': 'shell'
    };
    
    return languageMap[ext] || 'plaintext';
  }
}

export const fileSystemManager = FileSystemManager.getInstance();
