import { projects, files, chatMessages, type Project, type File, type ChatMessage, type InsertProject, type InsertFile, type InsertChatMessage } from "@shared/schema";

export interface IStorage {
  // Projects
  getProject(id: number): Promise<Project | undefined>;
  getProjects(): Promise<Project[]>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: number, project: Partial<InsertProject>): Promise<Project | undefined>;
  deleteProject(id: number): Promise<void>;

  // Files
  getFile(id: number): Promise<File | undefined>;
  getFilesByProject(projectId: number): Promise<File[]>;
  getFileByPath(projectId: number, path: string): Promise<File | undefined>;
  createFile(file: InsertFile): Promise<File>;
  updateFile(id: number, file: Partial<InsertFile>): Promise<File | undefined>;
  deleteFile(id: number): Promise<void>;

  // Chat Messages
  getChatMessage(id: number): Promise<ChatMessage | undefined>;
  getChatMessagesByProject(projectId: number): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  deleteChatMessage(id: number): Promise<void>;
  clearProjectChat(projectId: number): Promise<void>;
}

export class MemStorage implements IStorage {
  private projects: Map<number, Project>;
  private files: Map<number, File>;
  private chatMessages: Map<number, ChatMessage>;
  private currentProjectId: number;
  private currentFileId: number;
  private currentChatId: number;

  constructor() {
    this.projects = new Map();
    this.files = new Map();
    this.chatMessages = new Map();
    this.currentProjectId = 1;
    this.currentFileId = 1;
    this.currentChatId = 1;
    
    // Initialize with demo project and files
    this.initializeDemoData();
  }

  private initializeDemoData() {
    // Create demo project
    const demoProject: Project = {
      id: 1,
      name: "Meu Projeto Demo",
      description: "Projeto de demonstração do IDE com IA",
      directoryHandle: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.projects.set(1, demoProject);

    // Create demo files
    const demoFiles = [
      {
        id: 1,
        projectId: 1,
        path: "index.html",
        content: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Minha Página Demo</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f0f0f0;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Bem-vindo ao IDE com IA!</h1>
        <p>Este é um arquivo de demonstração. Use o chat da IA para editá-lo!</p>
        <button onclick="alert('Olá!')">Clique aqui</button>
    </div>
</body>
</html>`,
        language: "html",
        isModified: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 2,
        projectId: 1,
        path: "script.js",
        content: `// Script de demonstração
function saudar(nome) {
    return "Olá, " + nome + "!";
}

function calcular(a, b) {
    return a + b;
}

// Teste a IA editando este código!
console.log(saudar("Usuário"));
console.log("Resultado:", calcular(5, 3));`,
        language: "javascript",
        isModified: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 3,
        projectId: 1,
        path: "styles.css",
        content: `/* Estilos de demonstração */
.botao {
    background-color: #007bff;
    color: white;
    padding: 10px 20px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
}

.botao:hover {
    background-color: #0056b3;
}

.card {
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 16px;
    margin: 10px 0;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}`,
        language: "css",
        isModified: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    demoFiles.forEach(file => {
      this.files.set(file.id, file);
    });

    this.currentProjectId = 2;
    this.currentFileId = 4;
  }

  // Projects
  async getProject(id: number): Promise<Project | undefined> {
    return this.projects.get(id);
  }

  async getProjects(): Promise<Project[]> {
    return Array.from(this.projects.values()).sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const id = this.currentProjectId++;
    const now = new Date();
    const project: Project = { 
      ...insertProject, 
      id, 
      createdAt: now,
      updatedAt: now,
      description: insertProject.description || null,
      directoryHandle: insertProject.directoryHandle || null
    };
    this.projects.set(id, project);
    return project;
  }

  async updateProject(id: number, projectUpdate: Partial<InsertProject>): Promise<Project | undefined> {
    const existing = this.projects.get(id);
    if (!existing) return undefined;
    
    const updated: Project = { 
      ...existing, 
      ...projectUpdate, 
      updatedAt: new Date() 
    };
    this.projects.set(id, updated);
    return updated;
  }

  async deleteProject(id: number): Promise<void> {
    this.projects.delete(id);
    // Also delete associated files and chat messages
    Array.from(this.files.entries()).forEach(([fileId, file]) => {
      if (file.projectId === id) {
        this.files.delete(fileId);
      }
    });
    Array.from(this.chatMessages.entries()).forEach(([msgId, msg]) => {
      if (msg.projectId === id) {
        this.chatMessages.delete(msgId);
      }
    });
  }

  // Files
  async getFile(id: number): Promise<File | undefined> {
    return this.files.get(id);
  }

  async getFilesByProject(projectId: number): Promise<File[]> {
    return Array.from(this.files.values())
      .filter(file => file.projectId === projectId)
      .sort((a, b) => a.path.localeCompare(b.path));
  }

  async getFileByPath(projectId: number, path: string): Promise<File | undefined> {
    return Array.from(this.files.values())
      .find(file => file.projectId === projectId && file.path === path);
  }

  async createFile(insertFile: InsertFile): Promise<File> {
    const id = this.currentFileId++;
    const now = new Date();
    const file: File = { 
      ...insertFile, 
      id, 
      createdAt: now,
      updatedAt: now,
      content: insertFile.content || null,
      language: insertFile.language || null,
      isModified: insertFile.isModified || null
    };
    this.files.set(id, file);
    return file;
  }

  async updateFile(id: number, fileUpdate: Partial<InsertFile>): Promise<File | undefined> {
    const existing = this.files.get(id);
    if (!existing) return undefined;
    
    const updated: File = { 
      ...existing, 
      ...fileUpdate, 
      updatedAt: new Date() 
    };
    this.files.set(id, updated);
    return updated;
  }

  async deleteFile(id: number): Promise<void> {
    this.files.delete(id);
  }

  // Chat Messages
  async getChatMessage(id: number): Promise<ChatMessage | undefined> {
    return this.chatMessages.get(id);
  }

  async getChatMessagesByProject(projectId: number): Promise<ChatMessage[]> {
    return Array.from(this.chatMessages.values())
      .filter(msg => msg.projectId === projectId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  async createChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const id = this.currentChatId++;
    const message: ChatMessage = { 
      ...insertMessage, 
      id, 
      createdAt: new Date(),
      metadata: insertMessage.metadata || null
    };
    this.chatMessages.set(id, message);
    return message;
  }

  async deleteChatMessage(id: number): Promise<void> {
    this.chatMessages.delete(id);
  }

  async clearProjectChat(projectId: number): Promise<void> {
    Array.from(this.chatMessages.entries()).forEach(([msgId, msg]) => {
      if (msg.projectId === projectId) {
        this.chatMessages.delete(msgId);
      }
    });
  }
}

export const storage = new MemStorage();
