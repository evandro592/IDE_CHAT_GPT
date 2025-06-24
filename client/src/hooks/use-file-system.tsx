import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

interface FileSystemFile {
  name: string;
  handle: FileSystemFileHandle;
  content?: string;
}

interface FileSystemDirectory {
  name: string;
  handle: FileSystemDirectoryHandle;
  files: FileSystemFile[];
  directories: FileSystemDirectory[];
}

export function useFileSystem() {
  const [currentDirectory, setCurrentDirectory] = useState<FileSystemDirectory | null>(null);
  const [currentProject, setCurrentProject] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(
    typeof window !== 'undefined' && 'showDirectoryPicker' in window
  );
  const { toast } = useToast();

  const readFileContent = async (fileHandle: FileSystemFileHandle): Promise<string> => {
    const file = await fileHandle.getFile();
    return await file.text();
  };

  const writeFileContent = async (fileHandle: FileSystemFileHandle, content: string): Promise<void> => {
    const writable = await fileHandle.createWritable();
    await writable.write(content);
    await writable.close();
  };

  const scanDirectory = async (dirHandle: FileSystemDirectoryHandle): Promise<FileSystemDirectory> => {
    const files: FileSystemFile[] = [];
    const directories: FileSystemDirectory[] = [];

    for await (const [name, handle] of dirHandle.entries()) {
      if (handle.kind === 'file') {
        files.push({
          name,
          handle: handle as FileSystemFileHandle
        });
      } else if (handle.kind === 'directory') {
        const subDir = await scanDirectory(handle as FileSystemDirectoryHandle);
        directories.push(subDir);
      }
    }

    return {
      name: dirHandle.name,
      handle: dirHandle,
      files: files.sort((a, b) => a.name.localeCompare(b.name)),
      directories: directories.sort((a, b) => a.name.localeCompare(b.name))
    };
  };

  const openFolder = useCallback(async (): Promise<void> => {
    if (!isSupported) {
      throw new Error('File System Access API is not supported in this browser');
    }

    try {
      const dirHandle = await (window as any).showDirectoryPicker({
        mode: 'readwrite'
      });

      const directory = await scanDirectory(dirHandle);
      setCurrentDirectory(directory);
      setCurrentProject(directory.name);
      
      toast({
        title: "Folder opened successfully",
        description: `Loaded ${directory.files.length} files from ${directory.name}`
      });
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        // User cancelled the dialog
        return;
      }
      throw error;
    }
  }, [isSupported, toast]);

  const createFile = useCallback(async (fileName: string, content: string = ''): Promise<void> => {
    if (!currentDirectory) {
      throw new Error('No directory is currently open');
    }

    try {
      const fileHandle = await currentDirectory.handle.getFileHandle(fileName, { create: true });
      await writeFileContent(fileHandle, content);
      
      // Refresh the directory
      const updatedDirectory = await scanDirectory(currentDirectory.handle);
      setCurrentDirectory(updatedDirectory);
      
      toast({
        title: "File created",
        description: `${fileName} has been created successfully`
      });
    } catch (error) {
      throw new Error(`Failed to create file: ${(error as Error).message}`);
    }
  }, [currentDirectory, toast]);

  const deleteFile = useCallback(async (fileName: string): Promise<void> => {
    if (!currentDirectory) {
      throw new Error('No directory is currently open');
    }

    try {
      await currentDirectory.handle.removeEntry(fileName);
      
      // Refresh the directory
      const updatedDirectory = await scanDirectory(currentDirectory.handle);
      setCurrentDirectory(updatedDirectory);
      
      toast({
        title: "File deleted",
        description: `${fileName} has been deleted successfully`
      });
    } catch (error) {
      throw new Error(`Failed to delete file: ${(error as Error).message}`);
    }
  }, [currentDirectory, toast]);

  const saveFile = useCallback(async (fileName: string, content: string): Promise<void> => {
    if (!currentDirectory) {
      throw new Error('No directory is currently open');
    }

    try {
      const fileHandle = await currentDirectory.handle.getFileHandle(fileName);
      await writeFileContent(fileHandle, content);
      
      toast({
        title: "File saved",
        description: `${fileName} has been saved successfully`
      });
    } catch (error) {
      throw new Error(`Failed to save file: ${(error as Error).message}`);
    }
  }, [currentDirectory, toast]);

  const loadFile = useCallback(async (fileName: string): Promise<string> => {
    if (!currentDirectory) {
      throw new Error('No directory is currently open');
    }

    try {
      const fileHandle = await currentDirectory.handle.getFileHandle(fileName);
      return await readFileContent(fileHandle);
    } catch (error) {
      throw new Error(`Failed to load file: ${(error as Error).message}`);
    }
  }, [currentDirectory]);

  return {
    isSupported,
    currentDirectory,
    currentProject,
    openFolder,
    createFile,
    deleteFile,
    saveFile,
    loadFile
  };
}
