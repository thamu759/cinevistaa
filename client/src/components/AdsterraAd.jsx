import { useEffect, useRef } from 'react';

const AD_QUEUE = [];
let LOADING = false;

function processQueue() {
  if (LOADING || AD_QUEUE.length === 0) return;
  LOADING = true;
  const { el, zoneKey, format, width, height } = AD_QUEUE.shift();
  window.atOptions = { key: zoneKey, format, height, width, params: {} };
  const script = document.createElement('script');
  script.src = `https://www.highperformanceformat.com/${zoneKey}/invoke.js`;
  script.async = true;
  script.onload = () => { LOADING = false; processQueue(); };
  script.onerror = () => { LOADING = false; processQueue(); };
  el.appendChild(script);
}

export default function AdsterraAd({ zoneKey, width, height, format = 'iframe' }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.innerHTML = '';
    AD_QUEUE.push({ el, zoneKey, format, width, height });
    if (!LOADING) processQueue();
    return () => {
      const idx = AD_QUEUE.findIndex(a => a.el === el);
      if (idx !== -1) AD_QUEUE.splice(idx, 1);
    };
  }, [zoneKey, width, height, format]);

  return <div ref={ref} style={{ minHeight: height, minWidth: width }} />;
}
