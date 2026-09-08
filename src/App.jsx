import React,{useEffect,useMemo} from 'react';
import {useLocation} from 'react-router-dom';
import overviewHtml from './legacy/index.html?raw';
import snapshotHtml from './legacy/investment-snapshot.html?raw';
import fundingHtml from './legacy/funding-communique.html?raw';
import docsHtml from './legacy/docs.html?raw';
import termsHtml from './legacy/terms.html?raw';

const pages={
  '/':overviewHtml,
  '/snapshot':snapshotHtml,'/investment-snapshot':snapshotHtml,'/investment-snapshot.html':snapshotHtml,
  '/funding':fundingHtml,'/funding-communique':fundingHtml,'/funding-communique.html':fundingHtml,
  '/docs':docsHtml,'/docs.html':docsHtml,
  '/terms':termsHtml,'/terms.html':termsHtml,
};
const priority=['home','funding','readiness','proof-evidence','commercial-model','platform','outcomes','faq','leadership','contact'];
const managedHeadSelector='meta[name],meta[property],link[rel="canonical"],link[rel="icon"],link[rel="shortcut icon"],link[rel="apple-touch-icon"],link[rel="stylesheet"],style';

function prepare(html,isOverview){
  const doc=new DOMParser().parseFromString(html,'text/html');
  if(isOverview){
    const main=doc.querySelector('main');
    if(main){
      const known=new Map([...main.querySelectorAll(':scope > section[id]')].map(el=>[el.id,el]));
      priority.forEach(id=>{const el=known.get(id);if(el)main.appendChild(el)});
    }
    const nav=doc.querySelector('header nav');
    if(nav){
      const links=[...nav.querySelectorAll('a')];
      const byHref=new Map(links.map(a=>[a.getAttribute('href'),a]));
      const ordered=['/funding-communique.html','#readiness','#proof-evidence','#faq','#contact'];
      ordered.forEach(h=>{const a=byHref.get(h);if(a)nav.appendChild(a)});
      const ai=links.find(a=>a.id==='nav-ai-open');if(ai)nav.appendChild(ai);
    }
  }
  return {
    title:doc.title,
    head:[...doc.head.querySelectorAll(managedHeadSelector)].map(n=>n.outerHTML).join('\n'),
    body:doc.body.innerHTML,
    scripts:[...doc.querySelectorAll('script')].map(s=>({src:s.getAttribute('src'),type:s.getAttribute('type')||'',text:s.textContent||''}))
  };
}

function syncHead(page){
  document.querySelectorAll('[data-react-legacy-head]').forEach(n=>n.remove());
  const holder=document.createElement('div');holder.innerHTML=page.head;
  [...holder.children].forEach(n=>{n.setAttribute('data-react-legacy-head','');document.head.appendChild(n)});
  document.title=page.title||'BAIDNET Investor Portal';
}

function runScripts(page){
  const added=[];
  page.scripts.forEach(def=>{
    const s=document.createElement('script');
    if(def.type)s.type=def.type;
    if(def.src)s.src=def.src;else s.textContent=def.text;
    s.dataset.reactLegacyScript='';document.body.appendChild(s);added.push(s);
  });
  return added;
}

function scrollToHash(hash){
  if(!hash){window.scrollTo(0,0);return;}
  const id=decodeURIComponent(hash.slice(1));
  requestAnimationFrame(()=>requestAnimationFrame(()=>document.getElementById(id)?.scrollIntoView({block:'start'})));
}

function LegacyReactPage({html,isOverview=false,hash=''}){
  const page=useMemo(()=>prepare(html,isOverview),[html,isOverview]);
  useEffect(()=>{
    syncHead(page);
    const scripts=runScripts(page);
    scrollToHash(hash);
    return()=>{scripts.forEach(s=>s.remove());document.querySelectorAll('[data-react-legacy-head]').forEach(n=>n.remove())};
  },[page,hash]);
  return <div className="legacy-react-page" dangerouslySetInnerHTML={{__html:page.body}}/>;
}

function NotFound(){
  useEffect(()=>{document.title='Page Not Found · BAIDNET Investor Portal';window.scrollTo(0,0)},[]);
  return <main style={{minHeight:'100vh',display:'grid',placeItems:'center',background:'#020303',color:'#f6f1e8',fontFamily:'Inter,Arial,sans-serif',padding:'2rem'}}><section><p style={{color:'#d9a441',letterSpacing:'.18em',textTransform:'uppercase'}}>BAIDNET Investor Portal</p><h1>Page not found.</h1><p>The requested investor resource does not exist.</p><a href="/" style={{color:'#f4cf76'}}>Return to the investor overview</a></section></main>;
}

export default function App(){
  const {pathname,hash}=useLocation();
  const source=pages[pathname];
  if(!source)return <NotFound/>;
  return <LegacyReactPage key={pathname} html={source} isOverview={pathname==='/'} hash={hash}/>;
}
