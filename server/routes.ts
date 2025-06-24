import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertProjectSchema, insertFileSchema, insertChatMessageSchema } from "@shared/schema";
import { editCodeWithAI, chatWithAI, generateCode } from "./services/openai";

export async function registerRoutes(app: Express): Promise<Server> {
  // Projects
  app.get("/api/projects", async (req, res) => {
    try {
      const projects = await storage.getProjects();
      res.json(projects);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch projects" });
    }
  });

  app.get("/api/projects/:id", async (req, res) => {
    try {
      const project = await storage.getProject(parseInt(req.params.id));
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch project" });
    }
  });

  app.post("/api/projects", async (req, res) => {
    try {
      const projectData = insertProjectSchema.parse(req.body);
      const project = await storage.createProject(projectData);
      res.status(201).json(project);
    } catch (error) {
      res.status(400).json({ error: "Invalid project data" });
    }
  });

  app.put("/api/projects/:id", async (req, res) => {
    try {
      const projectData = insertProjectSchema.partial().parse(req.body);
      const project = await storage.updateProject(parseInt(req.params.id), projectData);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      res.status(400).json({ error: "Invalid project data" });
    }
  });

  app.delete("/api/projects/:id", async (req, res) => {
    try {
      await storage.deleteProject(parseInt(req.params.id));
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete project" });
    }
  });

  // Files
  app.get("/api/projects/:projectId/files", async (req, res) => {
    try {
      const files = await storage.getFilesByProject(parseInt(req.params.projectId));
      res.json(files);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch files" });
    }
  });

  app.get("/api/files/:id", async (req, res) => {
    try {
      const file = await storage.getFile(parseInt(req.params.id));
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }
      res.json(file);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch file" });
    }
  });

  app.post("/api/files", async (req, res) => {
    try {
      const fileData = insertFileSchema.parse(req.body);
      const file = await storage.createFile(fileData);
      res.status(201).json(file);
    } catch (error) {
      res.status(400).json({ error: "Invalid file data" });
    }
  });

  app.put("/api/files/:id", async (req, res) => {
    try {
      const fileData = insertFileSchema.partial().parse(req.body);
      const file = await storage.updateFile(parseInt(req.params.id), fileData);
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }
      res.json(file);
    } catch (error) {
      res.status(400).json({ error: "Invalid file data" });
    }
  });

  app.delete("/api/files/:id", async (req, res) => {
    try {
      await storage.deleteFile(parseInt(req.params.id));
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete file" });
    }
  });

  // Chat Messages
  app.get("/api/projects/:projectId/chat", async (req, res) => {
    try {
      const messages = await storage.getChatMessagesByProject(parseInt(req.params.projectId));
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch chat messages" });
    }
  });

  app.post("/api/chat", async (req, res) => {
    try {
      const messageData = insertChatMessageSchema.parse(req.body);
      const message = await storage.createChatMessage(messageData);
      res.status(201).json(message);
    } catch (error) {
      res.status(400).json({ error: "Invalid message data" });
    }
  });

  app.delete("/api/projects/:projectId/chat", async (req, res) => {
    try {
      await storage.clearProjectChat(parseInt(req.params.projectId));
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to clear chat" });
    }
  });

  // AI Integration Routes
  app.post("/api/ai/edit-code", async (req, res) => {
    try {
      const { instruction, currentCode, filename, language } = req.body;
      
      if (!instruction || !currentCode) {
        return res.status(400).json({ error: "Instruction and current code are required" });
      }

      const result = await editCodeWithAI({
        instruction,
        currentCode,
        filename,
        language
      });

      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to edit code with AI" });
    }
  });

  app.post("/api/ai/chat", async (req, res) => {
    try {
      const { message, context } = req.body;
      
      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }

      const result = await chatWithAI(message, context || {});
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to chat with AI" });
    }
  });

  app.post("/api/ai/generate", async (req, res) => {
    try {
      const { prompt, language } = req.body;
      
      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
      }

      const code = await generateCode(prompt, language);
      res.json({ code });
    } catch (error) {
      res.status(500).json({ error: "Failed to generate code" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
