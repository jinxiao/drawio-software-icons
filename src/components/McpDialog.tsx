import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { mcpMessages } from '../mcp-i18n';
import { ICON_SERVICE_URL, existingMcpConfig, mcpConfig } from '../mcp-config.mjs';
import { useIcons } from '../site';
import { CloseButton, Dialog, ExternalLink } from './Ui';

export function McpNotice() {
  const {locale,setModal}=useIcons(),t=mcpMessages[locale];
  return <div className="mcp-notice"><div><strong>{t.badge}</strong><p>{t.intro}</p></div><button className="button outline small" data-mcp-open aria-haspopup="dialog" onClick={()=>setModal({kind:'mcp'})}>{t.action}<span aria-hidden="true">→</span></button></div>;
}
type Client='codex'|'claude'|'cursor'|'vscode';
function CodeField({id,label,rows,value,fieldRef}:{id:string;label:string;rows:number;value:string;fieldRef?:RefObject<HTMLTextAreaElement|null>}) {
  return <textarea id={id} className="mcp-code" rows={rows} readOnly spellCheck={false} aria-label={label} value={value} ref={fieldRef}/>;
}
export function McpDialog() {
  const {locale,closeModal}=useIcons(),t=mcpMessages[locale];
  const [mode,setMode]=useState<'fresh'|'existing'>('fresh'),[client,setClient]=useState<Client>('codex');
  const [platform,setPlatform]=useState<'windows'|'unix'>(()=>/win/i.test(globalThis.navigator?.platform??'')?'windows':'unix');
  const [format,setFormat]=useState<'json'|'toml'>('json'),[status,setStatus]=useState('');
  const panelRef=useRef<HTMLDivElement>(null),outputRef=useRef<HTMLTextAreaElement>(null),promptRef=useRef<HTMLTextAreaElement>(null),urlRef=useRef<HTMLTextAreaElement>(null),revision=useRef(0);
  const output=mode==='fresh'?mcpConfig(client,platform):existingMcpConfig(format),isCommand=mode==='fresh'&&client==='codex';
  const copyLabel=isCommand?t.copyCommand:t.copyConfig;
  useEffect(()=>()=>{revision.current++;},[]);
  useLayoutEffect(()=>{
    const field=outputRef.current!,panel=panelRef.current!;field.style.height='';
    if(!isCommand)return;
    const fit=()=>{field.style.height='auto';field.style.height=`${field.scrollHeight}px`;};
    let lastWidth=0;const observer=new ResizeObserver(([entry])=>{if(entry.contentRect.width!==lastWidth){lastWidth=entry.contentRect.width;fit();}});
    observer.observe(panel);fit();return()=>observer.disconnect();
  },[isCommand,output]);
  const invalidate=()=>{revision.current++;setStatus('');};
  const copy=async(ref:RefObject<HTMLTextAreaElement|null>)=>{
    const field=ref.current;if(!field)return;const version=++revision.current;setStatus('');
    try {await navigator.clipboard.writeText(field.value);if(version===revision.current)setStatus(t.copied);}
    catch {if(version===revision.current){field.focus();field.select();setStatus(t.copyFallback);}}
  };
  return <Dialog id="mcp-dialog" labelledBy="mcp-title" describedBy="mcp-description" onClose={closeModal}><CloseButton onClose={closeModal}>×</CloseButton>
    <p className="eyebrow">DRAW.IO MCP</p><h2 id="mcp-title">{t.title}</h2><p id="mcp-description">{t.description}</p>
    <div className="mcp-modes" role="group" aria-label={t.mode}><button className="button small" data-mcp-mode="fresh" aria-pressed={mode==='fresh'} data-dialog-autofocus onClick={()=>{invalidate();setMode('fresh');}}>{t.fresh}</button><button className="button small" data-mcp-mode="existing" aria-pressed={mode==='existing'} onClick={()=>{invalidate();setMode('existing');}}>{t.existing}</button></div>
    <div id="mcp-fresh" hidden={mode!=='fresh'}><p>{t.prerequisites} <ExternalLink href="https://nodejs.org/en/download">{t.node} ↗</ExternalLink></p>
      <div className="mcp-selectors"><label>{t.client}<select id="mcp-client" value={client} onChange={event=>{invalidate();setClient(event.target.value as Client);}}><option value="codex">Codex</option><option value="claude">Claude Desktop</option><option value="cursor">Cursor</option><option value="vscode">VS Code</option></select></label><label>{t.platform}<select id="mcp-platform" value={platform} onChange={event=>{invalidate();setPlatform(event.target.value as 'windows'|'unix');}}><option value="windows">Windows</option><option value="unix">macOS / Linux</option></select></label></div>
      <p id="mcp-client-help">{t[client]}</p><p id="mcp-merge" hidden={client==='codex'}>{t.merge}</p></div>
    <div id="mcp-existing" hidden={mode!=='existing'}><p>{t.existingHelp}</p><label className="mcp-format">{t.format}<select id="mcp-format" value={format} onChange={event=>{invalidate();setFormat(event.target.value as 'json'|'toml');}}><option value="json">JSON</option><option value="toml">TOML (Codex)</option></select></label><p id="mcp-toml-help" hidden={format!=='toml'}>{t.tomlHelp}</p></div>
    <div className={`mcp-code-panel${isCommand?' is-terminal':''}`} id="mcp-code-panel" ref={panelRef}><div className="mcp-code-bar"><span className="mcp-code-heading"><span className="mcp-terminal-dots" aria-hidden="true"><i/><i/><i/></span><span id="mcp-code-title">{isCommand?(platform==='windows'?'PowerShell':'Terminal'):(mode==='existing'&&format==='toml'?'TOML':'JSON')}</span></span><button className="button outline small" data-mcp-copy="mcp-config" id="mcp-copy-config" onClick={()=>void copy(outputRef)}>{copyLabel}</button></div><div className="mcp-code-body"><span className="mcp-terminal-prompt" id="mcp-terminal-prompt" aria-hidden="true">{platform==='windows'?'PS>':'$'}</span><CodeField id="mcp-config" label={copyLabel} rows={Math.min(12,Math.max(3,output.split('\n').length))} value={output} fieldRef={outputRef}/></div></div>
    <p className="mcp-status" id="mcp-status" role="status" aria-live="polite">{status}</p><p>{t.restart}</p>
    <section className="mcp-example"><h3>{t.tryTitle}</h3><CodeField id="mcp-prompt" label={t.tryTitle} rows={2} value={t.prompt} fieldRef={promptRef}/><button className="button outline small" data-mcp-copy="mcp-prompt" onClick={()=>void copy(promptRef)}>{t.copyPrompt}</button><p>{t.supplement}</p></section>
    <details className="mcp-endpoint"><summary>{t.endpoint}</summary><p>{t.endpointHelp}</p><CodeField id="mcp-url" label={t.endpoint} rows={2} value={ICON_SERVICE_URL} fieldRef={urlRef}/><button className="button outline small" data-mcp-copy="mcp-url" onClick={()=>void copy(urlRef)}>{t.copyUrl}</button></details>
    <a className="mcp-official" href="https://github.com/jgraph/drawio-mcp/tree/main/mcp-tool-server" target="_blank" rel="noopener noreferrer">{t.official} ↗</a>
  </Dialog>;
}
