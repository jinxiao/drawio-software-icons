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

export function inspectPng(data) {
  const bytes=Buffer.from(data);
  if(bytes.length<45 || bytes.length>1_000_000 || bytes.subarray(0,8).toString('hex')!=='89504e470d0a1a0a' || bytes.readUInt32BE(8)!==13 || bytes.toString('ascii',12,16)!=='IHDR') throw Error('Invalid PNG header');
  const width=bytes.readUInt32BE(16),height=bytes.readUInt32BE(20);
  if(!width || !height || width>4096 || height>4096) throw Error('Invalid PNG dimensions');
  let offset=8,hasData=false,ended=false;
  while(offset+12<=bytes.length) {
    const length=bytes.readUInt32BE(offset),type=bytes.toString('ascii',offset+4,offset+8);
    if(offset+12+length>bytes.length) throw Error('Truncated PNG chunk');
    if(type==='IDAT') hasData=true;
    offset+=12+length;
    if(type==='IEND') {if(length!==0) throw Error('Invalid PNG end');ended=true;break;}
  }
  if(!hasData || !ended || offset!==bytes.length) throw Error('Incomplete PNG');
  return {width,height};
}

export function packageOfficialPng(png, presentation) {
  const {width,height}=inspectPng(png);
  if(!presentation) return png;
  if(presentation.kind!=='rounded-rect' || !Number.isFinite(presentation.radius) || presentation.radius<=0 || presentation.radius>Math.min(width,height)/2) throw Error('Invalid PNG presentation');
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><defs><clipPath id="corners"><rect width="${width}" height="${height}" rx="${presentation.radius}"/></clipPath></defs><image width="${width}" height="${height}" clip-path="url(#corners)" xlink:href="data:image/png;base64,${Buffer.from(png).toString('base64')}"/></svg>\n`;
}

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
        if (key.startsWith('@_') && ['href','src'].includes(local) && !String(value).startsWith('#')) {
          const embedded=/^data:image\/png;base64,([A-Za-z0-9+/]+={0,2})$/.exec(String(value));
          if(!embedded) throw Error('External SVG resource');
          const png=Buffer.from(embedded[1],'base64');
          if(png.toString('base64')!==embedded[1]) throw Error('Invalid embedded PNG encoding');
          inspectPng(png);
        }
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

export function libraryEntry(icon, data) {
  const png=icon.asset?.endsWith('.png');
  const {width, height} = png?inspectPng(data):inspectSvg(data);
  const scale = 64 / Math.max(width, height);
  return {data:`data:${png?'image/png':'image/svg+xml'};base64,${Buffer.from(data).toString('base64')}`,
    w: Number((width*scale).toFixed(4)), h: Number((height*scale).toFixed(4)),
    aspect:'fixed', title:icon.name, tags:[icon.id,...icon.aliases,...icon.tags].join(' '), style:'imageAspect=1;'};
}
export function libraryXml(entries, tags = '', title = '', notice = '') {
  // Desktop drag-and-drop identifies libraries by the first 10 characters.
  // UTF-8 is XML's default; keep declarations/comments before the root out.
  return `<mxlibrary${title ? ` title="${xmlEscape(title)}"` : ''} tags="${xmlEscape(tags)}">${xmlEscape(JSON.stringify(entries))}</mxlibrary>\n${notice?`<!-- ${xmlEscape(notice).replaceAll('--','- -')} -->\n`:''}`;
}
export function readLibrary(xml) {
  if (XMLValidator.validate(xml) !== true) throw Error('Invalid library XML');
  const node = parser.parse(xml).mxlibrary;
  return JSON.parse(typeof node === 'string' ? node : node['#text']);
}
