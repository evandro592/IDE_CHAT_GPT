import { useState, useRef, useEffect, ReactNode } from "react";

interface ResizablePanelProps {
  children: ReactNode;
  defaultSize: number; // percentage
  minSize?: number; // percentage
  maxSize?: number; // percentage
  direction?: 'horizontal' | 'vertical';
  className?: string;
}

export default function ResizablePanel({
  children,
  defaultSize,
  minSize = 10,
  maxSize = 90,
  direction = 'horizontal',
  className = ''
}: ResizablePanelProps) {
  const [size, setSize] = useState(defaultSize);
  const [isResizing, setIsResizing] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const resizerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !panelRef.current) return;

      const rect = panelRef.current.parentElement!.getBoundingClientRect();
      let newSize;

      if (direction === 'horizontal') {
        newSize = ((e.clientX - rect.left) / rect.width) * 100;
      } else {
        newSize = ((e.clientY - rect.top) / rect.height) * 100;
      }

      newSize = Math.max(minSize, Math.min(maxSize, newSize));
      setSize(newSize);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = direction === 'horizontal' ? 'col-resize' : 'row-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, direction, minSize, maxSize]);

  const handleMouseDown = () => {
    setIsResizing(true);
  };

  const style = direction === 'horizontal' 
    ? { width: `${size}%` }
    : { height: `${size}%` };

  return (
    <>
      <div
        ref={panelRef}
        className={`relative ${className}`}
        style={style}
      >
        {children}
      </div>
      <div
        ref={resizerRef}
        className={`panel-resizer ${
          direction === 'horizontal' 
            ? 'w-1 cursor-col-resize hover:bg-[var(--ide-primary)]' 
            : 'h-1 cursor-row-resize hover:bg-[var(--ide-primary)]'
        }`}
        onMouseDown={handleMouseDown}
      />
    </>
  );
}
