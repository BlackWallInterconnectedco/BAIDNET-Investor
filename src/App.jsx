import React,{useEffect,useMemo,useRef} from 'react';
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
      ['#readiness','#proof-evidence'].forEach(h=>{const a=byHref.get(h);if(a)nav.appendChild(a)});
      const faq=byHref.get('#faq');if(faq)nav.appendChild(faq);
      const contact=byHref.get('#contact');if(contact)nav.appendChild(contact);
      const ai=links.find(a=>a.id==='nav-ai-open');if(ai)nav.appendChild(ai);
    }
  }
  return {
    title:doc.title,
    head:[...doc.head.querySelectorAll('style,link[rel="stylesheet"],meta[name="theme-color"]')].map(n=>n.outerHTML).join('\n'),
    body:doc.body.innerHTML,
    scripts:[...doc.querySelectorAll('script')].map(s=>({src:s.getAttribute('src'),type:s.getAttribute('type')||'',text:s.textContent||''}))
  };
}

function LegacyReactPage({html,isOverview=false}){
  const root=useRef(null);
  const page=useMemo(()=>prepare(html,isOverview),[html,isOverview]);
  useEffect(()=>{
    document.title=page.title||'BAIDNET Investor Portal';
    const marker='react-legacy-head';
    document.querySelectorAll(`[data-${marker}]`).forEach(n=>n.remove());
    const holder=document.createElement('div');holder.innerHTML=page.head;
    [...holder.children].forEach(n=>{n.setAttribute(`data-${marker}`,'');document.head.appendChild(n)});
    const added=[];
    page.scripts.forEach(def=>{
      const s=document.createElement('script');
      if(def.type)s.type=def.type;
      if(def.src)s.src=def.src;else s.textContent=def.text;
      s.dataset.reactLegacyScript='';document.body.appendChild(s);added.push(s);
    });
    const intercept=e=>{
      const a=e.target.closest?.('a[href]');if(!a)return;
      const href=a.getAttribute('href');
      if(href?.startsWith('/')&&!href.startsWith('//')&&!a.target){
        const u=new URL(href,location.origin);
        if(pages[u.pathname]){e.preventDefault();history.pushState({},'',u.pathname+u.hash);window.dispatchEvent(new PopStateEvent('popstate'));}
      }
    };
    root.current?.addEventListener('click',intercept);
    return()=>{root.current?.removeEventListener('click',intercept);added.forEach(s=>s.remove());document.querySelectorAll(`[data-${marker}]`).forEach(n=>n.remove())};
  },[page]);
  return <div ref={root} className="legacy-react-page" dangerouslySetInnerHTML={{__html:page.body}}/>;
}

export default function App(){
  const {pathname}=useLocation();
  const source=pages[pathname]||overviewHtml;
  return <LegacyReactPage key={pathname} html={source} isOverview={pathname==='/'} />;
}
