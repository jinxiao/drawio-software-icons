import { mcpMessages } from './mcp-i18n';
import { ICON_SERVICE_URL, mcpConfig, existingMcpConfig } from './mcp-config.mjs';
import type { Locale } from './i18n';

export function mcpNotice(locale:Locale) {
  const t=mcpMessages[locale];
  return `<div class="mcp-notice"><div><strong>${t.badge}</strong><p>${t.intro}</p></div><button class="button outline small" data-mcp-open aria-haspopup="dialog">${t.action}<span aria-hidden="true">→</span></button></div>`;
}

export function showMcpSetup(locale:Locale, opener:HTMLElement) {
  if(document.querySelector('dialog[open]'))return;
  const t=mcpMessages[locale],dialog=document.createElement('dialog');
  dialog.id='mcp-dialog';
  dialog.setAttribute('aria-labelledby','mcp-title');
  dialog.setAttribute('aria-describedby','mcp-description');
  const textField=(id:string,label:string,rows:number)=>`<textarea id="${id}" class="mcp-code" rows="${rows}" readonly spellcheck="false" aria-label="${label}"></textarea>`;
  dialog.innerHTML=`<button class="dialog-close" data-mcp-dismiss aria-label="${t.close}">×</button>
    <p class="eyebrow">DRAW.IO MCP</p><h2 id="mcp-title">${t.title}</h2><p id="mcp-description">${t.description}</p>
    <div class="mcp-modes" role="group" aria-label="${t.mode}"><button class="button small" data-mcp-mode="fresh" aria-pressed="true" autofocus>${t.fresh}</button><button class="button small" data-mcp-mode="existing" aria-pressed="false">${t.existing}</button></div>
    <div id="mcp-fresh"><p>${t.prerequisites} <a href="https://nodejs.org/en/download" target="_blank" rel="noopener noreferrer">${t.node} ↗</a></p>
      <div class="mcp-selectors"><label>${t.client}<select id="mcp-client"><option value="codex">Codex</option><option value="claude">Claude Desktop</option><option value="cursor">Cursor</option><option value="vscode">VS Code</option></select></label>
      <label>${t.platform}<select id="mcp-platform"><option value="windows">Windows</option><option value="unix">macOS / Linux</option></select></label></div>
      <p id="mcp-client-help"></p><p id="mcp-merge">${t.merge}</p></div>
    <div id="mcp-existing" hidden><p>${t.existingHelp}</p><label class="mcp-format">${t.format}<select id="mcp-format"><option value="json">JSON</option><option value="toml">TOML (Codex)</option></select></label><p id="mcp-toml-help" hidden>${t.tomlHelp}</p></div>
    ${textField('mcp-config',t.copyConfig,9)}<button class="button primary small" data-mcp-copy="mcp-config" id="mcp-copy-config">${t.copyCommand}</button>
    <p class="mcp-status" id="mcp-status" role="status" aria-live="polite"></p><p>${t.restart}</p>
    <section class="mcp-example"><h3>${t.tryTitle}</h3>${textField('mcp-prompt',t.tryTitle,2)}<button class="button outline small" data-mcp-copy="mcp-prompt">${t.copyPrompt}</button><p>${t.supplement}</p></section>
    <details class="mcp-endpoint"><summary>${t.endpoint}</summary><p>${t.endpointHelp}</p>${textField('mcp-url',t.endpoint,2)}<button class="button outline small" data-mcp-copy="mcp-url">${t.copyUrl}</button></details>
    <a class="mcp-official" href="https://github.com/jgraph/drawio-mcp/tree/main/mcp-tool-server" target="_blank" rel="noopener noreferrer">${t.official} ↗</a>`;
  document.body.append(dialog);
  const get=<T extends HTMLElement>(id:string)=>dialog.querySelector<T>('#'+id)!;
  const client=get<HTMLSelectElement>('mcp-client'),platform=get<HTMLSelectElement>('mcp-platform'),format=get<HTMLSelectElement>('mcp-format');
  const output=get<HTMLTextAreaElement>('mcp-config'),status=get<HTMLElement>('mcp-status');
  platform.value=/win/i.test(navigator.platform)?'windows':'unix';
  get<HTMLTextAreaElement>('mcp-url').value=ICON_SERVICE_URL;
  get<HTMLTextAreaElement>('mcp-prompt').value=t.prompt;
  let mode='fresh',revision=0;
  const refresh=()=>{
    revision++;status.textContent='';
    const selectedClient=client.value as 'codex'|'claude'|'cursor'|'vscode';
    get<HTMLElement>('mcp-fresh').hidden=mode!=='fresh';
    get<HTMLElement>('mcp-existing').hidden=mode!=='existing';
    get<HTMLElement>('mcp-client-help').textContent=t[selectedClient];
    get<HTMLElement>('mcp-merge').hidden=selectedClient==='codex';
    get<HTMLElement>('mcp-toml-help').hidden=format.value!=='toml';
    output.value=mode==='fresh'?mcpConfig(selectedClient,platform.value as 'windows'|'unix'):existingMcpConfig(format.value as 'json'|'toml');
    output.rows=Math.min(12,Math.max(3,output.value.split('\n').length));
    const copyLabel=mode==='fresh' && selectedClient==='codex'?t.copyCommand:t.copyConfig;
    get<HTMLElement>('mcp-copy-config').textContent=copyLabel;
    output.setAttribute('aria-label',copyLabel);
    dialog.querySelectorAll<HTMLElement>('[data-mcp-mode]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.mcpMode===mode)));
  };
  for(const select of [client,platform,format])select.addEventListener('change',refresh);
  dialog.addEventListener('click',async event=>{
    const target=event.target as Element;
    if(target.closest('[data-mcp-dismiss]')){dialog.close();return;}
    const modeButton=target.closest<HTMLElement>('[data-mcp-mode]');
    if(modeButton){mode=modeButton.dataset.mcpMode!;refresh();return;}
    const copyButton=target.closest<HTMLElement>('[data-mcp-copy]');
    if(copyButton){
      const field=get<HTMLTextAreaElement>(copyButton.dataset.mcpCopy!),value=field.value,version=++revision;
      status.textContent='';
      try {
        await navigator.clipboard.writeText(value);
        if(dialog.open && version===revision)status.textContent=t.copied;
      } catch {
        if(dialog.open && version===revision){field.focus();field.select();status.textContent=t.copyFallback;}
      }
      return;
    }
    if(target===dialog){const rect=dialog.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)dialog.close();}
  });
  dialog.addEventListener('close',()=>{revision++;dialog.remove();if(opener.isConnected)opener.focus({preventScroll:true});},{once:true});
  refresh();dialog.showModal();
}
