import * as monaco from 'monaco-editor';

// Monaco Editor setup and configuration
let monacoInstance: monaco.editor.IStandaloneCodeEditor | null = null;

export async function setupMonaco(
  container: HTMLElement,
  initialContent: string,
  onChange: (content: string) => void,
  language: string = 'javascript'
): Promise<monaco.editor.IStandaloneCodeEditor> {
  
  // Dispose existing instance
  if (monacoInstance) {
    monacoInstance.dispose();
  }

  // Configure Monaco themes
  monaco.editor.defineTheme('ide-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '6A9955' },
      { token: 'keyword', foreground: 'C586C0' },
      { token: 'string', foreground: 'CE9178' },
      { token: 'number', foreground: 'B5CEA8' },
      { token: 'regexp', foreground: 'D16969' },
      { token: 'type', foreground: '4EC9B0' },
      { token: 'class', foreground: '4EC9B0' },
      { token: 'function', foreground: 'DCDCAA' },
      { token: 'variable', foreground: '9CDCFE' },
      { token: 'constant', foreground: '4FC1FF' },
    ],
    colors: {
      'editor.background': '#1E1E1E',
      'editor.foreground': '#D4D4D4',
      'editorLineNumber.foreground': '#858585',
      'editorLineNumber.activeForeground': '#C6C6C6',
      'editor.selectionBackground': '#264F78',
      'editor.inactiveSelectionBackground': '#3A3D41',
      'editorCursor.foreground': '#AEAFAD',
      'editor.findMatchBackground': '#515C6A',
      'editor.findMatchHighlightBackground': '#EA5C0055',
      'editor.linkedEditingBackground': '#F85149',
      'editorBracketMatch.background': '#0064001A',
      'editorBracketMatch.border': '#888888',
    }
  });

  // Configure TypeScript/JavaScript defaults
  monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
    target: monaco.languages.typescript.ScriptTarget.Latest,
    allowNonTsExtensions: true,
    moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
    module: monaco.languages.typescript.ModuleKind.CommonJS,
    noEmit: true,
    esModuleInterop: true,
    jsx: monaco.languages.typescript.JsxEmit.React,
    reactNamespace: 'React',
    allowJs: true,
    typeRoots: ['node_modules/@types']
  });

  monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
    target: monaco.languages.typescript.ScriptTarget.Latest,
    allowNonTsExtensions: true,
    moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
    module: monaco.languages.typescript.ModuleKind.CommonJS,
    noEmit: true,
    esModuleInterop: true,
    allowSyntheticDefaultImports: true,
    jsx: monaco.languages.typescript.JsxEmit.React,
    reactNamespace: 'React',
    typeRoots: ['node_modules/@types']
  });

  // Create editor instance
  monacoInstance = monaco.editor.create(container, {
    value: initialContent,
    language: language,
    theme: 'ide-dark',
    automaticLayout: true,
    fontSize: 14,
    fontFamily: 'JetBrains Mono, Fira Code, Monaco, Cascadia Code, Roboto Mono, monospace',
    lineHeight: 21,
    letterSpacing: 0.5,
    minimap: {
      enabled: window.innerWidth > 1200 // Only show minimap on larger screens
    },
    scrollBeyondLastLine: false,
    wordWrap: 'on',
    wrappingStrategy: 'advanced',
    renderLineHighlight: 'all',
    selectOnLineNumbers: true,
    roundedSelection: false,
    readOnly: false,
    cursorStyle: 'line',
    glyphMargin: true,
    folding: true,
    foldingStrategy: 'auto',
    showFoldingControls: 'mouseover',
    foldingHighlight: true,
    bracketPairColorization: {
      enabled: true
    },
    guides: {
      bracketPairs: true,
      indentation: true
    },
    suggest: {
      enabled: true,
      quickSuggestions: true,
      showKeywords: true,
      showSnippets: true
    },
    quickSuggestions: {
      other: true,
      comments: false,
      strings: false
    },
    parameterHints: {
      enabled: true
    },
    formatOnType: true,
    formatOnPaste: true,
    dragAndDrop: true
  });

  // Setup change listener
  monacoInstance.onDidChangeModelContent(() => {
    const content = monacoInstance?.getValue() || '';
    onChange(content);
  });

  // Add custom keybindings
  monacoInstance.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
    // Save command (handled by parent component)
    window.dispatchEvent(new CustomEvent('monaco-save'));
  });

  monacoInstance.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyF, () => {
    // Find command
    monacoInstance?.getAction('actions.find')?.run();
  });

  monacoInstance.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyF, () => {
    // Format document
    monacoInstance?.getAction('editor.action.formatDocument')?.run();
  });

  // Focus the editor
  monacoInstance.focus();

  return monacoInstance;
}

export function updateMonacoContent(content: string) {
  if (monacoInstance && monacoInstance.getValue() !== content) {
    monacoInstance.setValue(content);
  }
}

export function updateMonacoLanguage(language: string) {
  if (monacoInstance) {
    const model = monacoInstance.getModel();
    if (model) {
      monaco.editor.setModelLanguage(model, language);
    }
  }
}

export function getMonacoInstance() {
  return monacoInstance;
}

export function disposeMonaco() {
  if (monacoInstance) {
    monacoInstance.dispose();
    monacoInstance = null;
  }
}

// Auto-completion providers
export function registerCustomCompletions() {
  // Register custom completion provider for JavaScript/TypeScript
  monaco.languages.registerCompletionItemProvider('javascript', {
    provideCompletionItems: (model, position) => {
      const suggestions = [
        {
          label: 'console.log',
          kind: monaco.languages.CompletionItemKind.Function,
          insertText: 'console.log(${1:});',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Log output to console'
        },
        {
          label: 'function',
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: 'function ${1:name}(${2:params}) {\n\t${3:// code}\n}',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Function declaration'
        },
        {
          label: 'const',
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: 'const ${1:name} = ${2:value};',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Constant declaration'
        }
      ];

      return { suggestions };
    }
  });

  // Similar for TypeScript
  monaco.languages.registerCompletionItemProvider('typescript', {
    provideCompletionItems: (model, position) => {
      const suggestions = [
        {
          label: 'interface',
          kind: monaco.languages.CompletionItemKind.Interface,
          insertText: 'interface ${1:Name} {\n\t${2:property}: ${3:type};\n}',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Interface declaration'
        },
        {
          label: 'type',
          kind: monaco.languages.CompletionItemKind.Class,
          insertText: 'type ${1:Name} = ${2:type};',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Type alias'
        }
      ];

      return { suggestions };
    }
  });
}

// Initialize custom completions
registerCustomCompletions();
