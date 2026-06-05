import { useState } from 'react';

/* @vite-ignore */
const BANNER_SRC = new URL('../assets/WhatsApp_Image_2026-06-03_at_3.17.50_PM.jpeg', import.meta.url).href;
const FALLBACK = 'https://images.pexels.com/photos/974314/pexels-photo-974314.jpeg';

export default function FarmBanner({ className = '' }: { className?: string }) {
  const [src, setSrc] = useState(BANNER_SRC);

  return (
    <img
      src={src}
      alt="Pasumai Farm"
      className={className}
      onError={() => setSrc(FALLBACK)}
    />
  );
}
