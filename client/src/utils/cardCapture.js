/**
 * High-fidelity share card capture utility.
 * Leverages modern html-to-image (SVG foreignObject -> Canvas) for pixel-perfect
 * rendering of modern CSS (glassmorphism, radial gradients, subpixel typography, box shadows).
 * Falls back to html2canvas if needed.
 */

export async function captureElementToBlob(element) {
  if (!element) throw new Error('No element provided for capture');

  // Strategy 1: Modern high-fidelity html-to-image
  try {
    const { toBlob } = await import('html-to-image');
    const blob = await toBlob(element, {
      pixelRatio: 2,
      backgroundColor: '#07090e',
      cacheBust: true,
      skipAutoScale: true,
    });
    if (blob) return blob;
  } catch (err) {
    console.warn('html-to-image capture fallback to html2canvas:', err);
  }

  // Strategy 2: Fallback to html2canvas
  try {
    const { default: html2canvas } = await import('html2canvas');
    const canvas = await html2canvas(element, {
      useCORS: true,
      allowTaint: false,
      scale: 2,
      backgroundColor: '#07090e',
      logging: false,
    });
    return await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
  } catch (err) {
    console.error('All capture strategies failed:', err);
    throw err;
  }
}

export async function captureElementToDataUrl(element) {
  if (!element) throw new Error('No element provided for capture');

  try {
    const { toPng } = await import('html-to-image');
    return await toPng(element, {
      pixelRatio: 2,
      backgroundColor: '#07090e',
      cacheBust: true,
    });
  } catch (err) {
    console.warn('html-to-image fallback to html2canvas for dataURL:', err);
    const { default: html2canvas } = await import('html2canvas');
    const canvas = await html2canvas(element, {
      useCORS: true,
      allowTaint: false,
      scale: 2,
      backgroundColor: '#07090e',
      logging: false,
    });
    return canvas.toDataURL('image/png');
  }
}

