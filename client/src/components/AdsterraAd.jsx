import { useEffect, useRef, useState } from 'react';

const FALLBACK_IMG = 'https://i.ibb.co/SzC0d6r/New-Project-2.jpg';

export default function AdsterraAd({ zoneKey, width, height, format = 'iframe', fallbackImg }) {
  const ref = useRef(null);
  const loadedRef = useRef(false);
  const [failed, setFailed] = useState(false);
  const timers = useRef([]);

  useEffect(() => {
    const el = ref.current;
    if (!el || loadedRef.current) return;
    loadedRef.current = true;

    setFailed(false);
    el.innerHTML = '';

    const handler = (e) => {
      if (e.data === 'adsterra:loaded') {
        timers.current.forEach(clearTimeout);
        timers.current = [];
        setFailed(false);
      }
    };
    window.addEventListener('message', handler);

    const iframe = document.createElement('iframe');
    const srcdoc = [
      '<html><body style="margin:0;padding:0;overflow:hidden">',
      '<script>',
      `window.atOptions = ${JSON.stringify({ key: zoneKey, format, height, width, params: {} })};`,
      '<\/script>',
      `<script src="https://www.highperformanceformat.com/${zoneKey}/invoke.js"><\/script>`,
      '<script>',
      'var c = setInterval(function(){',
      'var a = document.querySelector("iframe, ins, [id^=google_ads], a[target=_blank], .advertisment");',
      'if(a&&a.offsetHeight>0){clearInterval(c);clearTimeout(f);window.parent.postMessage("adsterra:loaded","*")}',
      '},500);',
      'var f = setTimeout(function(){clearInterval(c)},5000);',
      '<\/script>',
      '</body></html>'
    ].join('');

    iframe.srcdoc = srcdoc;
    iframe.width = width;
    iframe.height = height;
    iframe.style.cssText = 'border:none;display:block;background:#0b0c10';
    iframe.scrolling = 'no';
    iframe.title = 'Advertisement';
    iframe.loading = 'lazy';
    iframe.setAttribute('sandbox', 'allow-scripts');
    el.appendChild(iframe);

    const t = setTimeout(() => setFailed(true), 6000);
    timers.current = [t];

    return () => {
      window.removeEventListener('message', handler);
      timers.current.forEach(clearTimeout);
    };
  }, [zoneKey, width, height, format]);

  if (failed) {
    return (
      <div style={{
        minHeight: height, minWidth: width,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#0b0c10'
      }}>
        <img
          src={fallbackImg || FALLBACK_IMG}
          alt="Advertisement"
          style={{ maxWidth: '100%', maxHeight: height, display: 'block' }}
        />
      </div>
    );
  }

  return <div ref={ref} style={{ minHeight: height, minWidth: width }} />;
}