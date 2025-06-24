# IDE com IA Autônoma

Um IDE completo com assistente de IA integrado que pode editar código automaticamente.

## 🚀 Como Rodar Localmente

### Pré-requisitos
- Node.js 18+ ou 20+
- npm ou yarn
- PostgreSQL (opcional - usa banco em memória por padrão)

### Instalação e Execução

1. **Clone ou baixe o projeto**
```bash
git clone [seu-repositorio]
cd ide-ai
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure as variáveis de ambiente (opcional)**
```bash
# Crie um arquivo .env na raiz do projeto
echo "OPENAI_API_KEY=sua-chave-openai-aqui" > .env
```

4. **Execute o projeto**
```bash
npm run dev
```

5. **Acesse no navegador**
```
http://localhost:5000
```

## 🔧 Comandos Disponíveis

```bash
# Desenvolvimento (servidor + cliente)
npm run dev

# Build para produção
npm run build

# Executar versão de produção
npm start

# Instalar dependências
npm install

# Limpar cache
npm run clean
```

## 🌟 Funcionalidades

- ✅ Editor de código com syntax highlighting
- ✅ IA que edita código automaticamente em português
- ✅ Chat integrado com assistente de IA
- ✅ Importação de pastas do sistema de arquivos
- ✅ Interface responsiva (PC e mobile)
- ✅ Sistema de arquivos completo
- ✅ Salvamento automático

## 🛠️ Tecnologias

- **Frontend**: React + TypeScript + Vite
- **Backend**: Node.js + Express + TypeScript
- **UI**: Tailwind CSS + Radix UI
- **IA**: OpenAI GPT-4o
- **Banco**: PostgreSQL (Neon) ou Memória

## 📱 Uso

1. **Criar arquivos**: Use o botão "+" na árvore de arquivos
2. **Importar pasta**: Clique no ícone de pasta e selecione uma pasta do seu computador
3. **Editar com IA**: Digite comandos no chat como:
   - "adicione uma função para validar email"
   - "mude a cor do botão para azul"
   - "crie um formulário de contato"

## 🔐 Configuração da IA

Para usar a IA, você precisa de uma chave da OpenAI:

1. Acesse [OpenAI API](https://platform.openai.com)
2. Crie uma conta e gere uma API key
3. Adicione a chave no arquivo `.env`:
```bash
OPENAI_API_KEY=sk-proj-sua-chave-aqui
```

## 🌐 Deploy

O projeto está configurado para deploy automático no Replit. Para outros provedores:

1. Execute `npm run build`
2. Suba a pasta `dist` para seu servidor
3. Configure as variáveis de ambiente
4. Execute `npm start`

## 📞 Suporte

- Interface em português brasileiro
- Funciona nos navegadores Chrome, Edge, Firefox
- Suporte a File System Access API (Chrome/Edge)
- Responsivo para desktop e mobile