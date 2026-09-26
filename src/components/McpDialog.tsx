import { useRef, useState } from 'react';
import { mcpMessages } from '../mcp-i18n';
import { ICON_SERVICE_URL, existingMcpConfig, mcpConfig } from '../mcp-config.mjs';
import { useIcons } from '../site';
import { CloseButton, Dialog, ExternalLink } from './Ui';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { SetupSelect } from './SetupSelect';
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
          <SetupSelect id="mcp-client" label={t.client} value={client} onValueChange={next => { setStatus(''); setClient(next); }}
            options={[{value:'codex',label:'Codex'},{value:'claude',label:'Claude Desktop'},{value:'cursor',label:'Cursor'},{value:'vscode',label:'VS Code'}]} />
        </div>
        <div className="space-y-2"><Label htmlFor="mcp-platform">{t.platform}</Label>
          <SetupSelect id="mcp-platform" label={t.platform} value={platform} onValueChange={next => { setStatus(''); setPlatform(next); }}
            options={[{value:'windows',label:'Windows'},{value:'unix',label:'macOS / Linux'}]} />
        </div>
      </div>
      <p id="mcp-client-help">{t[client]}</p><p id="mcp-merge" hidden={client === 'codex'}>{t.merge}</p>
    </div>
    <div id="mcp-existing" hidden={mode !== 'existing'}>
      <p>{t.existingHelp}</p><div className="space-y-2"><Label htmlFor="mcp-format">{t.format}</Label>
        <SetupSelect id="mcp-format" label={t.format} value={format} onValueChange={next => { setStatus(''); setFormat(next); }}
          options={[{value:'json',label:'JSON'},{value:'toml',label:'TOML (Codex)'}]} />
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
