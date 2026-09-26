import { useCallback, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

export function SetupSelect<T extends string>({ id, label, value, options, onValueChange }: {
  id: string;
  label: string;
  value: T;
  options: readonly { value: T; label: string }[];
  onValueChange: (value: T) => void;
}) {
  const [open, setOpen] = useState(false);
  const [container, setContainer] = useState<HTMLDialogElement | null>(null);
  // A body portal would be behind (and inert outside) the native modal dialog.
  const attach = useCallback((node: HTMLButtonElement | null) => setContainer(node?.closest('dialog') ?? null), []);
  return <Select value={value} open={open} onOpenChange={setOpen}
    onValueChange={next => { if (options.some(option => option.value === next)) onValueChange(next as T); }}>
    <SelectTrigger id={id} ref={attach} aria-label={label}>
      <SelectValue>{options.find(option => option.value === value)?.label}</SelectValue>
    </SelectTrigger>
    <SelectContent container={container} onEscapeKeyDown={event => { event.preventDefault(); setOpen(false); }}>
      {options.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
    </SelectContent>
  </Select>;
}
