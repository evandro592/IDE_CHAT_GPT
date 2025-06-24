import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface MobileKeyboardProps {
  onInsert: (text: string) => void;
}

const commonSymbols = [
  { label: 'Tab', value: '\t' },
  { label: '{', value: '{' },
  { label: '}', value: '}' },
  { label: '[', value: '[' },
  { label: ']', value: ']' },
  { label: '(', value: '(' },
  { label: ')', value: ')' },
  { label: ';', value: ';' },
  { label: '"', value: '"' },
  { label: "'", value: "'" },
  { label: '=', value: '=' },
  { label: '+', value: '+' },
  { label: '-', value: '-' },
  { label: '*', value: '*' },
  { label: '/', value: '/' },
  { label: '<', value: '<' },
  { label: '>', value: '>' },
  { label: '&', value: '&' },
  { label: '|', value: '|' },
  { label: '!', value: '!' },
  { label: '?', value: '?' },
  { label: ':', value: ':' },
  { label: '@', value: '@' },
  { label: '#', value: '#' },
  { label: '$', value: '$' },
  { label: '%', value: '%' },
  { label: '^', value: '^' },
  { label: '~', value: '~' },
  { label: '`', value: '`' },
  { label: '\\', value: '\\' }
];

export default function MobileKeyboard({ onInsert }: MobileKeyboardProps) {
  return (
    <div className="ide-surface ide-border border-t p-2">
      <ScrollArea className="w-full">
        <div className="flex space-x-1 pb-2" style={{ width: 'max-content' }}>
          {commonSymbols.map((symbol, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              className="px-3 py-1 text-xs whitespace-nowrap ide-surface-variant ide-border hover:bg-[var(--ide-primary)] hover:bg-opacity-20"
              onClick={() => onInsert(symbol.value)}
            >
              {symbol.label}
            </Button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
