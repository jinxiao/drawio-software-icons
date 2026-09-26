export const ICON_SERVICE_URL = 'https://icons.rambow.cloud/api/icons';
export const DRAWIO_MCP_PACKAGE = '@drawio/mcp@1.6.1';

/** @param {'codex'|'claude'|'cursor'|'vscode'} client @param {'windows'|'unix'} platform */
export function mcpConfig(client, platform) {
  if (client === 'codex') return `codex mcp add drawio --env DRAWIO_ICON_SERVICE_URL=${ICON_SERVICE_URL} -- ${platform === 'windows' ? 'npx.cmd' : 'npx'} -y ${DRAWIO_MCP_PACKAGE}`;
  const server = {
    ...(client === 'vscode' ? { type: 'stdio' } : {}),
    command: platform === 'windows' ? 'cmd' : 'npx',
    args: [...(platform === 'windows' ? ['/c', 'npx'] : []), '-y', DRAWIO_MCP_PACKAGE],
    env: { DRAWIO_ICON_SERVICE_URL: ICON_SERVICE_URL },
  };
  return JSON.stringify({ [client === 'vscode' ? 'servers' : 'mcpServers']: { drawio: server } }, null, 2);
}

/** @param {'json'|'toml'} format */
export function existingMcpConfig(format) {
  return format === 'toml'
    ? `[mcp_servers.drawio.env]\nDRAWIO_ICON_SERVICE_URL = "${ICON_SERVICE_URL}"`
    : JSON.stringify({ env: { DRAWIO_ICON_SERVICE_URL: ICON_SERVICE_URL } }, null, 2);
}
