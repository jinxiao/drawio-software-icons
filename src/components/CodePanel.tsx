import { useLayoutEffect, useRef, type ComponentProps, type ReactNode, type RefObject } from 'react';
import { FileCode2, Terminal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Textarea } from './ui/textarea';

type CodePanelProps = Omit<ComponentProps<typeof Textarea>, 'ref' | 'value' | 'title'> & {
  title: string;
  value: string;
  fieldRef?: RefObject<HTMLTextAreaElement | null>;
  terminal?: boolean;
  prompt?: string;
  actions?: ReactNode;
  panelId?: string;
};

// shadcn/ui has no standalone terminal: compose its Card, Textarea and Button.
export function CodePanel({ title, value, fieldRef, terminal = false, prompt = '$', actions, panelId, className, ...props }: CodePanelProps) {
  const ownRef = useRef<HTMLTextAreaElement>(null);
  const ref = fieldRef ?? ownRef;
  const panelRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const field = ref.current;
    if (!field || !terminal) return;
    const fit = () => { field.style.height = 'auto'; field.style.height = `${field.scrollHeight}px`; };
    let width = -1;
    const observer = new ResizeObserver(([entry]) => {
      if (entry.contentRect.width !== width) { width = entry.contentRect.width; fit(); }
    });
    observer.observe(panelRef.current!);
    fit();
    return () => { observer.disconnect(); field.style.height = ''; };
  }, [value, terminal, ref]);

  const Icon = terminal ? Terminal : FileCode2;
  return <Card id={panelId} ref={panelRef} data-code-panel={terminal ? 'terminal' : 'config'}
    className={cn('min-w-0 gap-0 overflow-hidden border-border py-0 shadow-sm', terminal && 'terminal-theme')}>
    <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 border-b border-solid border-border bg-muted px-3 py-1 [.border-b]:pb-1">
      <CardTitle className="flex min-w-0 max-w-full items-center gap-2 font-mono text-xs leading-normal font-medium text-muted-foreground">
        <Icon className="size-4 shrink-0" aria-hidden="true" /><span className="break-all">{title}</span>
      </CardTitle>
      {actions && <div className="flex min-w-0 max-w-full flex-wrap gap-2">{actions}</div>}
    </CardHeader>
    <CardContent className="flex min-w-0 items-start gap-1 p-2 sm:gap-3 sm:p-4">
      {terminal && <span className="shrink-0 pt-2 font-mono text-xs leading-6 text-muted-foreground select-none" aria-hidden="true">{prompt}</span>}
      <Textarea {...props} value={value} ref={ref} spellCheck={false}
        className={cn('field-sizing-fixed min-w-0 flex-1 overscroll-contain border-input bg-background font-mono text-base leading-6 text-foreground [overflow-wrap:anywhere] md:text-xs',
          terminal ? 'max-h-80 min-h-0 resize-none overflow-auto border-transparent bg-transparent shadow-none' : 'max-h-80 min-h-24 resize-y', className)} />
    </CardContent>
  </Card>;
}
