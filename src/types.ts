import type { Locale } from './i18n';

export type Icon = {
  id:string; name:string; nameEn?:string; collection:string; categories?:string[]; aliases:string[]; tags:string[]; category:string; softwareType:string;
  asset:string; homepage:string; repository:string|null;
  source:{id:string;variant?:string;url:string;revision:string;collectionLicense:string;licenseUrl:string;listing?:string;publisher?:string};
};
export type Category = {id:string;collection:string;configData:string;name:string;nameEn:string;description:string;descriptionEn:string;keywords:string[];count:number;libraries:Record<Locale,string>;libraryRevisions?:Record<Locale,string>};
export type Collection = {id:string;name:string;nameEn:string;count:number;allLibrary:string};
export type Change = {kind:'added'|'updated'|'removed';collection:string;count?:number;icons:{id:string;name:string}[]};
export type UpdateEntry = {id:string;date:string;commit?:string;title:Record<Locale,string>;summary:Record<Locale,string>;changes:Change[]};
export type Catalog = {collections:Collection[];version:string;icons:Icon[];categories:Category[];categoryAliases?:Record<string,string>;changelog?:UpdateEntry[]};
