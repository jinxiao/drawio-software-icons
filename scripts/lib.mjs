import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { createHash } from 'node:crypto';
import { XMLParser, XMLValidator } from 'fast-xml-parser';

export const parser = new XMLParser({ignoreAttributes:false, attributeNamePrefix:'@_', processEntities:true});
export const hash = data => createHash('sha256').update(data).digest('hex');
export const json = async path => JSON.parse(await readFile(path, 'utf8'));
export async function save(path, data) { await mkdir(dirname(path), {recursive:true}); await writeFile(path, data); }
export const saveJson = (path, data) => save(path, JSON.stringify(data, null, 2) + '\n');
export const xmlEscape = text => text.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&apos;');

export function inspectSvg(svg) {
  if (Buffer.byteLength(svg) > 1_000_000) throw Error('SVG exceeds 1 MB');
  if (/<!DOCTYPE|<!ENTITY|<\?xml-stylesheet/i.test(svg)) throw Error('External XML declarations are not supported');
  const result = XMLValidator.validate(svg);
  if (result !== true) throw Error(`Malformed SVG: ${result.err.msg}`);
  const document = parser.parse(svg);
  if (!document.svg || Object.keys(document).some(k => k !== 'svg' && !k.startsWith('?'))) throw Error('Expected a single SVG root');
  const root = document.svg;
  if (root['@_xmlns'] !== 'http://www.w3.org/2000/svg') throw Error('Missing SVG namespace');
  function walk(obj) {
    if (!obj || typeof obj !== 'object') return;
    for (const [key, value] of Object.entries(obj)) {
      const local = key.replace(/^@_/, '').split(':').pop().toLowerCase();
      if (!key.startsWith('@_') && ['script','foreignobject','iframe','object','embed','animate','animatetransform','animatemotion','set'].includes(local)) throw Error(`Unsafe SVG element: ${key}`);
      if (key.startsWith('@_') && (/^on/i.test(local) || local === 'base')) throw Error(`Unsafe SVG attribute: ${key}`);
      if (key.startsWith('@_') && ['href','src'].includes(local) && !String(value).startsWith('#')) throw Error('External SVG resource');
      if (typeof value === 'string') {
        if (/@import|expression\s*\(|javascript:|\\/i.test(value)) throw Error('Unsafe SVG CSS');
        for (const match of value.matchAll(/url\s*\(([^)]*)\)/gi)) {
          if (!/^['"]?#[^'"\s]+['"]?$/.test(match[1].trim())) throw Error('External SVG CSS resource');
        }
      }
      walk(value);
    }
  }
  walk(root);
  let width, height;
  if (root['@_viewBox']) {
    const parts = String(root['@_viewBox']).trim().split(/[\s,]+/).map(Number);
    if (parts.length !== 4 || parts.some(v => !Number.isFinite(v))) throw Error('Invalid viewBox');
    [, , width, height] = parts;
  } else {
    const length = value => /^\d+(?:\.\d+)?(?:px)?$/.test(String(value)) ? parseFloat(value) : NaN;
    width = length(root['@_width']); height = length(root['@_height']);
  }
  if (!(width > 0 && height > 0) || !Number.isFinite(width + height)) throw Error('Invalid SVG dimensions');
  return {width, height};
}

export function normalizeSvg(raw) {
  // Remove obsolete editor metadata and external DTD declarations, without changing artwork.
  if (/<!ENTITY/i.test(raw)) throw Error('SVG entity declaration is not allowed');
  return raw.replace(/^\uFEFF/, '').replace(/<\?xml[^?]*\?>/g, '')
    .replace(/<!DOCTYPE[^>]*>/gi, '').replace(/<metadata\b[^>]*>[\s\S]*?<\/metadata>/gi, '')
    .replace(/<sodipodi:namedview\b[^>]*\/>/gi, '').trim() + '\n';
}

export function libraryEntry(icon, svg) {
  const {width, height} = inspectSvg(svg);
  const scale = 64 / Math.max(width, height);
  return {data:`data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`,
    w: Number((width*scale).toFixed(4)), h: Number((height*scale).toFixed(4)),
    aspect:'fixed', title:icon.name, tags:[icon.id,...icon.aliases,...icon.tags].join(' '), style:'imageAspect=1;'};
}
export function libraryXml(entries, tags = '', title = '') {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<mxlibrary${title ? ` title="${xmlEscape(title)}"` : ''} tags="${xmlEscape(tags)}">${xmlEscape(JSON.stringify(entries))}</mxlibrary>\n`;
}
export function readLibrary(xml) {
  if (XMLValidator.validate(xml) !== true) throw Error('Invalid library XML');
  const node = parser.parse(xml).mxlibrary;
  return JSON.parse(typeof node === 'string' ? node : node['#text']);
}
