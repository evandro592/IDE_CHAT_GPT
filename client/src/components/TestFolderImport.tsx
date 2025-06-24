import React from 'react';
import { Button } from '@/components/ui/button';

export default function TestFolderImport() {
  const testOpenFolder = async () => {
    console.log('Test button clicked');
    try {
      if ('showDirectoryPicker' in window) {
        console.log('showDirectoryPicker is available');
        const dirHandle = await (window as any).showDirectoryPicker();
        console.log('Directory selected:', dirHandle);
        
        // List files in the directory
        for await (const [name, handle] of dirHandle.entries()) {
          console.log('Found:', name, 'type:', handle.kind);
          if (handle.kind === 'file') {
            const file = await handle.getFile();
            console.log('File details:', {
              name: file.name,
              size: file.size,
              type: file.type,
              lastModified: new Date(file.lastModified)
            });
          }
        }
      } else {
        console.log('File System Access API not supported');
        alert('Seu navegador não suporta a File System Access API. Use Chrome 86+ ou Edge 86+');
      }
    } catch (error: any) {
      console.error('Error:', error);
      if (error.name !== 'AbortError') {
        alert('Erro: ' + error.message);
      }
    }
  };

  return (
    <div className="p-4">
      <Button onClick={testOpenFolder}>
        Teste Abrir Pasta
      </Button>
    </div>
  );
}