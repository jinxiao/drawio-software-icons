import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Download } from 'lucide-react';
import { configurationFor, mergeConfiguration } from '../configuration.mjs';
import { file, useIcons } from '../site';
import { CloseButton, Dialog, Symbol } from './Ui';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { CodePanel } from './CodePanel';
import { CopyButton } from './CopyButton';

export function BundleDialog() {
  const s = useIcons(), { catalog, t, locale, selected, setSelected } = s;
  const [existing, setExisting] = useState(''), [output, setOutput] = useState(''), [status, setStatus] = useState(''), [busy, setBusy] = useState(false);
  const generation = useRef(0), fileGeneration = useRef(0), request = useRef<AbortController | null>(null);
  const allRef = useRef<HTMLInputElement>(null), outputRef = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => { if (allRef.current) allRef.current.indeterminate = selected.size > 0 && selected.size < catalog.categories.length; }, [selected, catalog]);
  useEffect(() => () => { generation.current++; fileGeneration.current++; request.current?.abort(); }, []);
  const invalidate = () => { generation.current++; request.current?.abort(); setOutput(''); setStatus(''); setBusy(false); };
  const changeSelection = (ids: Set<string>) => { invalidate(); setSelected(ids); };

  async function generate() {
    request.current?.abort();
    const controller = new AbortController(); request.current = controller;
    const version = ++generation.current, ids = [...selected];
    setOutput(''); setStatus(t.configLoading); setBusy(true);
    try {
      const config = existing.trim() ? JSON.parse(existing) : {};
      const payloads = Object.fromEntries(await Promise.all(catalog.categories.filter(c => ids.includes(c.id)).map(async c => {
        const response = await fetch(file(c.configData), { signal: controller.signal });
        if (!response.ok) throw Error(String(response.status));
        return [c.id, await response.json()];
      })));
      const result = mergeConfiguration(config, configurationFor(catalog, ids, payloads, locale));
      if (version !== generation.current) return;
      setOutput(JSON.stringify(result, null, 2)); setStatus(t.configReady);
    } catch (error) {
      if (version === generation.current && !controller.signal.aborted) setStatus(t.configError + ' ' + (error instanceof Error ? error.message : String(error)));
    } finally { if (version === generation.current) setBusy(false); }
  }

  const download = () => {
    const url = URL.createObjectURL(new Blob([output], { type: 'application/json;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = 'drawio-icons-configuration.json'; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return <Dialog id="bundle-dialog" labelledBy="bundle-title" onClose={s.closeModal}>
    <CloseButton onClose={s.closeModal} /><p className="eyebrow">DRAW.IO LIBRARIES</p><h2 id="bundle-title">{t.bundle}</h2><p>{t.bundleHint}</p>
    <div className="bundle-controls"><label className="load-all-toggle"><input type="checkbox" id="bundle-all" ref={allRef}
      checked={selected.size === catalog.categories.length} onChange={event => changeSelection(new Set(event.target.checked ? catalog.categories.map(c => c.id) : []))} /><span>{t.loadAll}</span></label>
      <Button variant="ghost" size="sm" id="deselect" onClick={() => changeSelection(new Set())}>{t.deselect}</Button>
    </div>
    <div className="bundle-list">{catalog.categories.map(c => <label key={c.id}><input type="checkbox" value={c.id} checked={selected.has(c.id)}
      onChange={event => { const ids = new Set(selected); if (event.target.checked) ids.add(c.id); else ids.delete(c.id); changeSelection(ids); }} />
      <span>{s.title(c)}</span><small>{c.count}</small></label>)}</div>
    <div className="bundle-footer"><span id="selected-count" role="status">{selected.size} {t.selected}</span>
      <Button id="open-bundle" disabled={!selected.size} onClick={() => { s.closeModal(); s.openLibraries(catalog.categories.filter(c => selected.has(c.id))); }}>{t.openDrawio}<Symbol name="external" /></Button>
    </div>
    <section className="config-export"><h3>{t.desktopConfig}</h3><p>{t.configInstructions}</p><p>{t.configReplacement}</p>
      <div className="space-y-3"><Label htmlFor="existing-config" className="leading-6">{t.existingConfig}</Label>
        <CodePanel title="JSON" id="existing-config" rows={5} placeholder="{}" value={existing}
          onChange={event => { fileGeneration.current++; setExisting(event.target.value); invalidate(); }} />
      </div>
      <div className="my-4 space-y-2"><Label htmlFor="config-file">{t.importConfig}</Label>
        <Input id="config-file" type="file" accept=".json,application/json" className="bg-card" onChange={async event => {
          const imported = event.target.files?.[0]; if (!imported) return;
          const version = ++fileGeneration.current; invalidate();
          try { const content = await imported.text(); if (version === fileGeneration.current) { setExisting(content); invalidate(); } }
          catch (error) { if (version === fileGeneration.current) setStatus(t.configError + ' ' + (error instanceof Error ? error.message : String(error))); }
        }} />
      </div>
      <Button id="generate-config" variant="outline" onClick={() => void generate()} disabled={!selected.size} loading={busy}>{t.generateConfig}</Button>
      <p id="config-status" role="status" aria-live="polite">{status}</p>
      <div hidden={!output}>
        <CodePanel title="drawio-icons-configuration.json" id="config-output" rows={8} readOnly aria-label={t.generatedConfig} value={output} fieldRef={outputRef}
          actions={<div className="flex min-w-0 max-w-full flex-wrap gap-2">
            <CopyButton id="copy-config" label={t.copyConfig} value={output} fieldRef={outputRef} disabled={!output}
              copiedLabel={t.configCopied} fallbackLabel={t.configCopyFallback} onStatus={setStatus} />
            <Button id="download-config" variant="outline" size="sm" disabled={!output} onClick={download}><Download aria-hidden="true" />{t.downloadConfig}</Button>
          </div>} />
      </div>
    </section>{s.local && <p className="local-note">{t.localNote}</p>}
  </Dialog>;
}
