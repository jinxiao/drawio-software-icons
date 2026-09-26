export function redirectHtml(collection = 'software') {
  const fallback = collection === 'alibaba-cloud' ? 'https://icons.rambow.cloud/?collection=alibaba-cloud' : 'https://icons.rambow.cloud/';
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Architecture Icons — moved</title>
<link rel="canonical" href="https://icons.rambow.cloud/">
<script>
const target = new URL('https://icons.rambow.cloud/');
target.search = location.search;
target.hash = location.hash;
if (${JSON.stringify(collection)} === 'alibaba-cloud' && !target.searchParams.has('collection')) target.searchParams.set('collection', 'alibaba-cloud');
if (location.origin !== target.origin) location.replace(target.href);
</script>
<noscript><meta http-equiv="refresh" content="0;url=${fallback}"></noscript>
</head><body><p>图标库已迁移 / The icon library has moved.</p>
<a href="${fallback}">打开图标库 / Open Architecture Icons</a></body></html>\n`;
}
