import { useRef, useState } from 'react';
import { mcpMessages } from '../mcp-i18n';
import { ICON_SERVICE_URL, existingMcpConfig, mcpConfig } from '../mcp-config.mjs';
import { useIcons } from '../site';
import { CloseButton, Dialog, ExternalLink } from './Ui';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { NativeSelect, NativeSelectOption } from './ui/native-select';
import { CodePanel } from './CodePanel';
import { CopyButton } from './CopyButton';

export function McpNotice() {
  const { locale, setModal } = useIcons(), t = mcpMessages[locale];
  return <div className="mcp-notice"><div><strong>{t.badge}</strong><p>{t.intro}</p></div>
    <Button variant="outline" size="sm" data-mcp-open aria-haspopup="dialog" onClick={() => setModal({ kind: 'mcp' })}>
      {t.action}<span aria-hidden="true">→</span>
    </Button>
  </div>;
}

type Client = 'codex' | 'claude' | 'cursor' | 'vscode';

export function McpDialog() {
  const { locale, closeModal } = useIcons(), t = mcpMessages[locale];
  const [mode, setMode] = useState<'fresh' | 'existing'>('fresh');
  const [client, setClient] = useState<Client>('codex');
  const [platform, setPlatform] = useState<'windows' | 'unix'>(() => /win/i.test(globalThis.navigator?.platform ?? '') ? 'windows' : 'unix');
  const [format, setFormat] = useState<'json' | 'toml'>('json');
  const [status, setStatus] = useState('');
  const outputRef = useRef<HTMLTextAreaElement>(null), promptRef = useRef<HTMLTextAreaElement>(null), urlRef = useRef<HTMLTextAreaElement>(null);
  const output = mode === 'fresh' ? mcpConfig(client, platform) : existingMcpConfig(format);
  const isCommand = mode === 'fresh' && client === 'codex';
  const copyLabel = isCommand ? t.copyCommand : t.copyConfig;
  const title = isCommand ? (platform === 'windows' ? 'PowerShell' : 'Terminal') : (mode === 'existing' && format === 'toml' ? 'TOML' : 'JSON');
  const copyFeedback = { copiedLabel: t.copied, fallbackLabel: t.copyFallback, onStatus: setStatus };

  return <Dialog id="mcp-dialog" labelledBy="mcp-title" describedBy="mcp-description" onClose={closeModal}>
    <CloseButton onClose={closeModal} />
    <p className="eyebrow">DRAW.IO MCP</p><h2 id="mcp-title">{t.title}</h2><p id="mcp-description">{t.description}</p>
    <div className="my-5 flex gap-1 rounded-lg bg-muted p-1" role="group" aria-label={t.mode}>
      <Button variant={mode === 'fresh' ? 'secondary' : 'ghost'} size="sm" className="h-auto min-h-9 flex-1 whitespace-normal"
        data-mcp-mode="fresh" aria-pressed={mode === 'fresh'} data-dialog-autofocus onClick={() => { setStatus(''); setMode('fresh'); }}>{t.fresh}</Button>
      <Button variant={mode === 'existing' ? 'secondary' : 'ghost'} size="sm" className="h-auto min-h-9 flex-1 whitespace-normal"
        data-mcp-mode="existing" aria-pressed={mode === 'existing'} onClick={() => { setStatus(''); setMode('existing'); }}>{t.existing}</Button>
    </div>
    <div id="mcp-fresh" hidden={mode !== 'fresh'}>
      <p>{t.prerequisites} <ExternalLink href="https://nodejs.org/en/download">{t.node} ↗</ExternalLink></p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2"><Label htmlFor="mcp-client">{t.client}</Label>
          <NativeSelect id="mcp-client" value={client} onChange={event => { setStatus(''); setClient(event.target.value as Client); }}>
            <NativeSelectOption value="codex">Codex</NativeSelectOption><NativeSelectOption value="claude">Claude Desktop</NativeSelectOption>
            <NativeSelectOption value="cursor">Cursor</NativeSelectOption><NativeSelectOption value="vscode">VS Code</NativeSelectOption>
          </NativeSelect>
        </div>
        <div className="space-y-2"><Label htmlFor="mcp-platform">{t.platform}</Label>
          <NativeSelect id="mcp-platform" value={platform} onChange={event => { setStatus(''); setPlatform(event.target.value as 'windows' | 'unix'); }}>
            <NativeSelectOption value="windows">Windows</NativeSelectOption><NativeSelectOption value="unix">macOS / Linux</NativeSelectOption>
          </NativeSelect>
        </div>
      </div>
      <p id="mcp-client-help">{t[client]}</p><p id="mcp-merge" hidden={client === 'codex'}>{t.merge}</p>
    </div>
    <div id="mcp-existing" hidden={mode !== 'existing'}>
      <p>{t.existingHelp}</p><div className="space-y-2"><Label htmlFor="mcp-format">{t.format}</Label>
        <NativeSelect id="mcp-format" value={format} onChange={event => { setStatus(''); setFormat(event.target.value as 'json' | 'toml'); }}>
          <NativeSelectOption value="json">JSON</NativeSelectOption><NativeSelectOption value="toml">TOML (Codex)</NativeSelectOption>
        </NativeSelect>
      </div><p id="mcp-toml-help" hidden={format !== 'toml'}>{t.tomlHelp}</p>
    </div>
    <div className="mt-4">
      <CodePanel panelId="mcp-code-panel" title={title} terminal={isCommand} prompt={platform === 'windows' ? 'PS>' : '$'}
        id="mcp-config" aria-label={copyLabel} rows={Math.min(12, Math.max(3, output.split('\n').length))}
        value={output} fieldRef={outputRef} readOnly
        actions={<CopyButton id="mcp-copy-config" label={copyLabel} value={output} fieldRef={outputRef} {...copyFeedback} />} />
    </div>
    <p className="mcp-status" id="mcp-status" role="status" aria-live="polite">{status}</p><p>{t.restart}</p>
    <section className="mcp-example"><h3>{t.tryTitle}</h3>
      <CodePanel title={t.tryTitle} id="mcp-prompt" aria-label={t.tryTitle} rows={2} value={t.prompt} fieldRef={promptRef} readOnly
        actions={<CopyButton label={t.copyPrompt} value={t.prompt} fieldRef={promptRef} {...copyFeedback} />} />
      <p>{t.supplement}</p>
    </section>
    <details className="mcp-endpoint"><summary>{t.endpoint}</summary><p>{t.endpointHelp}</p>
      <CodePanel title="DRAWIO_ICON_SERVICE_URL" id="mcp-url" aria-label={t.endpoint} rows={2} value={ICON_SERVICE_URL} fieldRef={urlRef} readOnly
        actions={<CopyButton label={t.copyUrl} value={ICON_SERVICE_URL} fieldRef={urlRef} {...copyFeedback} />} />
    </details>
    <a className="mcp-official" href="https://github.com/jgraph/drawio-mcp/tree/main/mcp-tool-server" target="_blank" rel="noopener noreferrer">{t.official} ↗</a>
  </Dialog>;
}
