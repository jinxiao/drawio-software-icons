import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import { SiteProvider, initialFilters } from '../src/site';
import { Page } from '../src/App';
import { BundleDialog } from '../src/components/BundleDialog';
import { DetailDialog, SpotlightDialog } from '../src/components/IconDialogs';
import { McpDialog } from '../src/components/McpDialog';
import type { Catalog, Icon } from '../src/types';
import type { Locale } from '../src/i18n';
import type { ReactNode } from 'react';

const icon:Icon={id:'safe-logo',name:'品牌 <script>alert(1)</script>',nameEn:'Brand <script>alert(1)</script>',collection:'software',category:'software-category',aliases:[],tags:[],softwareType:'open-source',asset:'icons/safe-logo.svg',homepage:'https://example.com/',repository:null,source:{id:'vendor',url:'https://example.com/logo.svg',revision:'abcdef123456',collectionLicense:'MIT',licenseUrl:'LICENSE'}};
const catalog:Catalog={
  version:'2026-09-26',categoryAliases:{legacy:'alibaba-category'},
  collections:[{id:'software',name:'通用软件',nameEn:'General Software',count:75,allLibrary:'libraries/all.xml'},{id:'alibaba-cloud',name:'阿里云',nameEn:'Alibaba Cloud',count:1,allLibrary:'libraries/alibaba.xml'}],
  categories:[{id:'software-category',collection:'software',configData:'config/software.json',name:'基础设施',nameEn:'Infrastructure',description:'基础设施图标',descriptionEn:'Infrastructure icons',keywords:[],count:75,libraries:{en:'libraries/en/software.xml','zh-CN':'libraries/zh-CN/software.xml'}},{id:'alibaba-category',collection:'alibaba-cloud',configData:'config/alibaba.json',name:'云',nameEn:'Cloud',description:'云图标',descriptionEn:'Cloud icons',keywords:[],count:1,libraries:{en:'libraries/en/alibaba.xml','zh-CN':'libraries/zh-CN/alibaba.xml'}}],
  icons:[...Array.from({length:75},(_,i)=>({...icon,id:`icon-${i}`})),{...icon,id:'alibaba-ecs',collection:'alibaba-cloud',category:'alibaba-category'}],
};
const render=(node:ReactNode,locale:Locale='en')=>renderToStaticMarkup(<SiteProvider catalog={catalog} locale={locale} setLocale={()=>{}}>{node}</SiteProvider>);

test('React page preserves section structure, bilingual labels, 72-card pagination and escaped catalog names',()=>{
  for(const locale of ['en','zh-CN'] as const){
    const html=render(<Page/>,locale);
    for(const id of ['home-title','library','changelog','guide','sources','grid','load-more'])assert(html.includes(`id="${id}"`),id);
    assert.equal((html.match(/class="icon-card"/g)??[]).length,72);
    assert.equal((html.match(/class="mcp-notice"/g)??[]).length,2);
    assert(html.includes(locale==='en'?'Choose categories / desktop setup':'选择分类加载 / 桌面配置'));
    assert(html.includes('&lt;script&gt;alert(1)&lt;/script&gt;'));
    assert(!html.includes('<script>alert(1)</script>'));
    // The homepage button includes both collections; sidebar links use the browsing scope.
    const primary=html.match(/class="button primary" data-open-all="true" href="([^"]+)"/)?.[1];
    assert(primary,'homepage draw.io link');
    const libraries=new URL(primary.replaceAll('&amp;','&')).searchParams.get('clibs')!;
    assert.equal(libraries.split(';').length,2);
    assert(libraries.includes(locale==='en'?'libraries/en/alibaba.xml':'libraries/zh-CN/alibaba.xml'));
  }
});

test('URL restoration keeps queries, aliases, cross-collection categories and invalid-filter fallbacks',()=>{
  const resolved=initialFilters(catalog,'https://icons.rambow.cloud/?q=K8s&category=legacy&type=commercial');
  assert.deepEqual(resolved,{collection:'alibaba-cloud',category:'alibaba-category',query:'K8s',type:'commercial',limit:72});
  assert.equal(initialFilters(catalog,'https://icons.rambow.cloud/?collection=all&category=legacy').collection,'all');
  assert.deepEqual(initialFilters(catalog,'https://icons.rambow.cloud/?collection=missing&category=missing&type=missing'),{collection:'software',category:'all',type:'all',query:'',limit:72});
  assert.equal(initialFilters(catalog,'https://jinxiao.github.io/alibaba-cloud-icons/').collection,'alibaba-cloud');
});

test('React dialogs retain accessible labels, selection scope and MCP command contract',()=>{
  const bundle=render(<BundleDialog/>);
  assert(bundle.includes('aria-labelledby="bundle-title"'));
  assert.equal((bundle.match(/checked=""/g)??[]).length,1,'only the active software category starts selected');
  assert(bundle.includes('id="copy-config" class="button primary" disabled=""'));
  const search=render(<SpotlightDialog/>);
  assert(search.includes('role="combobox"'));
  assert(search.includes('aria-controls="spotlight-results"'));
  const detail=render(<DetailDialog icon={icon}/>);
  assert(detail.includes('aria-labelledby="detail-title"'));
  assert(detail.includes('icons/safe-logo.svg'));
  const mcp=render(<McpDialog/>);
  assert(mcp.includes('mcp-code-panel is-terminal'));
  assert(mcp.includes('codex mcp add drawio --env DRAWIO_ICON_SERVICE_URL=https://icons.rambow.cloud/api/icons'));
  assert(mcp.includes('@drawio/mcp@1.6.1'));
  for(const client of ['Codex','Claude Desktop','Cursor','VS Code'])assert(mcp.includes(client));
  assert(mcp.includes('id="mcp-existing" hidden=""'));
  assert(mcp.includes('aria-live="polite"'));
});
