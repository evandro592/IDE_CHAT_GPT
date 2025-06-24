import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "sk-default_key"
});

export interface CodeEditRequest {
  instruction: string;
  currentCode: string;
  filename?: string;
  language?: string;
}

export interface CodeEditResponse {
  success: boolean;
  modifiedCode?: string;
  explanation?: string;
  error?: string;
}

export interface ChatResponse {
  response: string;
  codeChanges?: {
    filename: string;
    content: string;
    explanation: string;
  }[];
}

export async function editCodeWithAI(request: CodeEditRequest): Promise<CodeEditResponse> {
  try {
    const systemPrompt = `Você é um assistente de programação especialista integrado a um editor de código. 
Você pode ler e modificar arquivos de código diretamente. Quando receber uma instrução para modificar código:

1. Analise o código atual e as mudanças solicitadas
2. Aplique as mudanças com precisão
3. Retorne apenas o código completo modificado
4. Forneça uma breve explicação em português do que foi alterado

Arquivo atual: ${request.filename || 'sem título'}
Linguagem: ${request.language || 'javascript'}

Sempre responda em português brasileiro e aplique as mudanças diretamente no código.`;

    const userPrompt = `Código atual:
\`\`\`${request.language || 'javascript'}
${request.currentCode}
\`\`\`

Instrução: ${request.instruction}

Por favor, modifique o código de acordo com a instrução e retorne o código completo atualizado.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.1,
    });

    const content = response.choices[0].message.content;
    if (!content) {
      return { success: false, error: "Nenhuma resposta da IA" };
    }

    // Extract code from markdown code blocks
    const codeMatch = content.match(/```(?:\w+)?\n([\s\S]*?)\n```/);
    const modifiedCode = codeMatch ? codeMatch[1] : content;
    
    // Extract explanation (text outside code blocks)
    const explanation = content.replace(/```(?:\w+)?\n[\s\S]*?\n```/g, '').trim();

    return {
      success: true,
      modifiedCode,
      explanation: explanation || "Código foi modificado conforme solicitado."
    };
  } catch (error) {
    return {
      success: false,
      error: `Falha ao editar código: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    };
  }
}

export async function chatWithAI(
  message: string, 
  context: { 
    currentFile?: string;
    currentCode?: string;
    projectFiles?: string[];
  }
): Promise<ChatResponse> {
  try {
    let systemPrompt = `Você é um assistente de programação IA integrado a um editor de código. Você pode:
- Responder perguntas sobre programação em português
- Ajudar a debugar código
- Sugerir melhorias
- Criar novos arquivos e código
- Modificar código existente
- Editar diretamente o código no editor

Você tem acesso completo ao editor de texto e pode fazer alterações diretas no código quando solicitado.
Sempre responda em português brasileiro.

Quando o usuário pedir para "editar", "modificar", "alterar", "mudar" ou "criar" código, você deve:
1. Fornecer o código completo atualizado
2. Explicar brevemente as mudanças feitas
3. O código será aplicado automaticamente no editor

Contexto atual do projeto:`;

    if (context.currentFile) {
      systemPrompt += `\n\nArquivo atual: ${context.currentFile}`;
    }
    if (context.projectFiles?.length) {
      systemPrompt += `\n\nArquivos do projeto: ${context.projectFiles.join(', ')}`;
    }

    let userMessage = message;
    if (context.currentCode) {
      userMessage += `\n\nCódigo atual no editor:\n\`\`\`\n${context.currentCode}\n\`\`\``;
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage }
      ],
      temperature: 0.3,
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No response from AI");
    }

    // Check if the response contains code that should be applied
    const codeBlocks = content.match(/```(?:\w+)?\n([\s\S]*?)\n```/g);
    const codeChanges: { filename: string; content: string; explanation: string; }[] = [];

    if (codeBlocks && context.currentFile) {
      // Extract all code blocks and apply the most complete one
      for (const block of codeBlocks) {
        const codeContent = block.replace(/```(?:\w+)?\n([\s\S]*?)\n```/, '$1');
        if (codeContent.length > 50) { // Only apply substantial code changes
          codeChanges.push({
            filename: context.currentFile,
            content: codeContent,
            explanation: "Alterações sugeridas pela IA aplicadas automaticamente"
          });
          break; // Apply only the first substantial code block
        }
      }
    }

    return {
      response: content,
      codeChanges: codeChanges.length > 0 ? codeChanges : undefined
    };
  } catch (error) {
    throw new Error(`Failed to chat with AI: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function generateCode(prompt: string, language: string = 'javascript'): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a code generation assistant. Generate clean, well-documented ${language} code based on the user's request. Return only the code without explanations unless specifically asked.`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.2,
    });

    return response.choices[0].message.content || '';
  } catch (error) {
    throw new Error(`Failed to generate code: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
