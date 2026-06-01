import { useEffect, useRef } from 'react';

export default function AdsterraAd({ zoneKey, width, height, format = 'iframe' }) {
  const ref = useRef(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || loadedRef.current) return;
    loadedRef.current = true;

    el.innerHTML = '';

    const iframe = document.createElement('iframe');
    const srcdoc = `
      <html><body style="margin:0;padding:0;overflow:hidden">
        <script>
          window.atOptions = ${JSON.stringify({ key: zoneKey, format, height, width, params: {} })};
        <\/script>
        <script src="https://www.highperformanceformat.com/${zoneKey}/invoke.js"><\/script>
      </body></html>
    `;
    iframe.srcdoc = srcdoc;
    iframe.width = width;
    iframe.height = height;
    iframe.style = 'border:none;display:block';
    iframe.scrolling = 'no';
    iframe.title = 'Advertisement';
    iframe.loading = 'lazy';
    el.appendChild(iframe);
  }, [zoneKey, width, height, format]);

  return <div ref={ref} style={{ minHeight: height, minWidth: width }} />;
}