import React from 'react';
import { useLocation } from 'react-router-dom';
import overviewHtml from './legacy/index.html?raw';
import snapshotHtml from './legacy/investment-snapshot.html?raw';
import fundingHtml from './legacy/funding-communique.html?raw';
import docsHtml from './legacy/docs.html?raw';
import termsHtml from './legacy/terms.html?raw';

const pages = {
  '/': overviewHtml,
  '/snapshot': snapshotHtml,
  '/investment-snapshot': snapshotHtml,
  '/investment-snapshot.html': snapshotHtml,
  '/funding': fundingHtml,
  '/funding-communique': fundingHtml,
  '/funding-communique.html': fundingHtml,
  '/docs': docsHtml,
  '/docs.html': docsHtml,
  '/terms': termsHtml,
  '/terms.html': termsHtml,
};

function prepareDocument(html) {
  // srcDoc has no document URL of its own. A base element makes every original
  // root/relative asset, navigation link and API call resolve exactly as it did
  // in the static production documents.
  const base = '<base href="/">';
  return html.includes('<head>')
    ? html.replace('<head>', `<head>${base}`)
    : html.replace(/<head([^>]*)>/i, `<head$1>${base}`);
}

export default function App() {
  const { pathname } = useLocation();
  const source = pages[pathname] || overviewHtml;
  return (
    <iframe
      key={pathname}
      title="BAIDNET Investor Portal"
      srcDoc={prepareDocument(source)}
      style={{position:'fixed',inset:0,width:'100%',height:'100%',border:0,background:'#020303'}}
    />
  );
}
