// Browser-side helper: reads a picked image, shrinks it and returns a compressed JPEG data URL.
// Keeps uploads small so posts stay fast to save and load. (Animated GIFs become still pictures.)
export const MAX_UPLOAD_MB = 10;

export function prepareImage(file, { maxSide = 1600, quality = 0.85 } = {}) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) return reject(new Error('Please select a valid image file.'));
    if (file.size > MAX_UPLOAD_MB * 1024 * 1024) return reject(new Error(`That picture is too large. Please use one under ${MAX_UPLOAD_MB} MB.`));

    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff'; // flatten transparent PNGs onto white
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read that picture. Please try a different file.'));
    };
    img.src = url;
  });
}
