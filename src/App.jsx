import React,{useEffect,useRef} from 'react';
import {Routes,Route,useLocation} from 'react-router-dom';

const legacyPages={
  '/':'/legacy/index.html',
  '/snapshot':'/legacy/investment-snapshot.html',
  '/investment-snapshot':'/legacy/investment-snapshot.html',
  '/investment-snapshot.html':'/legacy/investment-snapshot.html',
  '/funding':'/legacy/funding-communique.html',
  '/funding-communique':'/legacy/funding-communique.html',
  '/funding-communique.html':'/legacy/funding-communique.html',
  '/docs':'/legacy/docs.html',
  '/docs.html':'/legacy/docs.html',
  '/terms':'/legacy/terms.html',
  '/terms.html':'/legacy/terms.html'
};

function LegacyParityPage(){
  const location=useLocation();
  const frame=useRef(null);
  const src=legacyPages[location.pathname]||legacyPages['/'];
  useEffect(()=>{
    const el=frame.current;
    if(!el)return;
    const sync=()=>{
      try{
        const doc=el.contentDocument;
        if(doc?.title)document.title=doc.title;
        const height=Math.max(doc?.documentElement?.scrollHeight||0,doc?.body?.scrollHeight||0,window.innerHeight);
        el.style.height=`${height}px`;
      }catch{}
    };
    el.addEventListener('load',sync);
    const timer=setInterval(sync,750);
    return()=>{el.removeEventListener('load',sync);clearInterval(timer)};
  },[src]);
  return <iframe ref={frame} className="legacy-parity-frame" src={`${src}${location.hash||''}`} title="BAIDNET Investor Portal" />;
}

export default function App(){return <Routes><Route path="*" element={<LegacyParityPage/>}/></Routes>}
