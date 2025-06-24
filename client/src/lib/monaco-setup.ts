// Monaco Editor setup and configuration
let monacoInstance: any = null;

export async function setupMonaco(
  container: HTMLElement,
  initialContent: string,
  onChange: (content: string) => void,
  language: string = 'javascript'
): Promise<any> {
  
  // Dispose existing instance
  if (monacoInstance) {
    monacoInstance.dispose();
  }

  // Clear container
  container.innerHTML = '';

  // Wait for Monaco to be available from CDN
  return new Promise((resolve, reject) => {
    if (typeof window !== 'undefined' && (window as any).require) {
      (window as any).require(['vs/editor/editor.main'], () => {
        try {
          const monaco = (window as any).monaco;
          initializeMonaco(monaco, container, initialContent, onChange, language, resolve);
        } catch (error) {
          reject(error);
        }
      });
    } else {
      // Fallback - check periodically for monaco
      const checkMonaco = () => {
        if ((window as any).monaco) {
          try {
            const monaco = (window as any).monaco;
            initializeMonaco(monaco, container, initialContent, onChange, language, resolve);
          } catch (error) {
            reject(error);
          }
        } else {
          setTimeout(checkMonaco, 100);
        }
      };
      checkMonaco();
    }
  });
}

function initializeMonaco(monaco: any, container: HTMLElement, initialContent: string, onChange: (content: string) => void, language: string, resolve: (value: any) => void) {

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

  resolve(monacoInstance);
}

export function updateMonacoContent(content: string) {
  if (monacoInstance && content !== undefined && monacoInstance.getValue() !== content) {
    const position = monacoInstance.getPosition();
    monacoInstance.setValue(content);
    if (position) {
      monacoInstance.setPosition(position);
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
