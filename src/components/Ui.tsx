import { Button, ButtonLink } from './ui/button';
import { useLayoutEffect, useRef, type PropsWithChildren, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { drawioUrl, libraryPaths } from '../catalog.mjs';
import { siteBase, useIcons } from '../site';
import type { Category } from '../types';

const symbols={
  star:<path d="m12 3 2.8 5.7 6.3.9-4.55 4.45 1.07 6.28L12 17.36l-5.62 2.97 1.07-6.28L2.9 9.6l6.3-.9Z"/>,
  arrow:<path d="M5 12h14M13 6l6 6-6 6"/>,
  download:<path d="M12 3v12m-5-5 5 5 5-5M5 17v4h14v-4"/>,
  search:<><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></>,
  grid:<><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
  close:<path d="m6 6 12 12M18 6 6 18"/>,
  external:<path d="M14 3h7v7m0-7L10 14M9 3H3v18h18v-6"/>,
  globe:<><circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/></>,
  check:<path d="m5 12 4 4L19 6"/>,
};
export function Symbol({name}:{name:keyof typeof symbols}) {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{symbols[name]}</svg>;
}
export function LibraryLink({className,size='default',categories,children}:{className?:string;size?:'default'|'sm';categories?:Category[];children?:ReactNode}) {
  const s=useIcons();
  return <ButtonLink className={className} size={size} data-open-all href={drawioUrl(siteBase,libraryPaths(categories??s.visibleCategories,s.locale))} target="_blank" rel="noopener noreferrer" onClick={event=>{if(s.local){event.preventDefault();s.setModal({kind:'notice'});}}}>{children??s.t.openDrawio}<Symbol name="external"/></ButtonLink>;
}
export function Dialog({id,label,labelledBy,describedBy,onClose,children}:{id:string;label?:string;labelledBy?:string;describedBy?:string;onClose:()=>void;children:ReactNode}) {
  const ref=useRef<HTMLDialogElement>(null);
  useLayoutEffect(()=>{
    const dialog=ref.current!,opener=document.activeElement as HTMLElement|null;
    dialog.showModal();
    dialog.querySelector<HTMLElement>('[data-dialog-autofocus]')?.focus();
    return()=>{dialog.close();if(opener?.isConnected)opener.focus({preventScroll:true});};
  },[]);
  const element=<dialog id={id} ref={ref} aria-label={label} aria-labelledby={labelledBy} aria-describedby={describedBy} onCancel={event=>{event.preventDefault();onClose();}} onClose={onClose} onClick={event=>{
    if(event.target!==event.currentTarget)return;
    const box=event.currentTarget.getBoundingClientRect();
    if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)onClose();
  }}>{children}</dialog>;
  return typeof document==='undefined'?element:createPortal(element,document.body);
}
export function CloseButton({onClose,children}:{onClose:()=>void;children?:ReactNode}) {
  const {t}=useIcons();
  return <Button variant="ghost" size="icon-sm" className="absolute right-3.5 top-3.5 rounded-full" onClick={onClose} aria-label={t.close}>{children??<Symbol name="close"/>}</Button>;
}
export function ExternalLink({href,children}:PropsWithChildren<{href:string}>) {
  return <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>;
}
