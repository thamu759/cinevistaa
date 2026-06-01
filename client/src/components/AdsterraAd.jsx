import { useEffect, useRef } from 'react';

export default function AdsterraAd({ zoneKey, width, height, format = 'iframe' }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.innerHTML = '';
    window.atOptions = {
      'key': zoneKey,
      'format': format,
      'height': height,
      'width': width,
      'params': {}
    };
    const script = document.createElement('script');
    script.src = `https://www.highperformanceformat.com/${zoneKey}/invoke.js`;
    script.async = true;
    el.appendChild(script);
    return () => { if (el.contains(script)) el.removeChild(script); };
  }, [zoneKey, width, height, format]);

  return <div ref={ref} style={{ minHeight: height, minWidth: width }} />;
}
