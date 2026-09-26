import { useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { Check, Copy } from 'lucide-react';
import { Button } from './ui/button';

type CopyButtonProps = {
  id?: string;
  value: string;
  fieldRef: RefObject<HTMLTextAreaElement | null>;
  label: string;
  copiedLabel: string;
  fallbackLabel: string;
  onStatus: (status: string) => void;
  disabled?: boolean;
};

export function CopyButton({ id, value, fieldRef, label, copiedLabel, fallbackLabel, onStatus, disabled }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const revision = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useLayoutEffect(() => {
    setCopied(false);
    setBusy(false);
    return () => { revision.current++; clearTimeout(timer.current); };
  }, [value]);

  async function copy() {
    const version = ++revision.current;
    clearTimeout(timer.current);
    setBusy(true);
    onStatus('');
    try {
      await navigator.clipboard.writeText(value);
      if (version !== revision.current) return;
      setCopied(true);
      onStatus(copiedLabel);
      timer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      if (version !== revision.current) return;
      fieldRef.current?.focus();
      fieldRef.current?.select();
      onStatus(fallbackLabel);
    } finally {
      if (version === revision.current) setBusy(false);
    }
  }

  return <Button id={id} variant="outline" size="sm" disabled={disabled} loading={busy}
    className="max-w-full whitespace-normal text-xs" onClick={() => void copy()}>
    {!busy && (copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />)}
    {copied ? copiedLabel : label}
  </Button>;
}
