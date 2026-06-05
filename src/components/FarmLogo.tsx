import { useState } from 'react';

// Attempts to load the actual farm logo from assets directory
// Falls back to SVG logo if image not available
/* @vite-ignore */
const LOGO_SRC = new URL('../assets/WhatsApp_Image_2026-06-03_at_3.17.33_PM.jpeg', import.meta.url).href;

function SVGLogo({ className }: { className?: string }) {
  return (
    <div className={`${className} rounded-full bg-green-800 flex items-center justify-center flex-shrink-0 ring-2 ring-green-500/50 overflow-hidden`}>
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <circle cx="50" cy="50" r="50" fill="#166534"/>
        <circle cx="50" cy="50" r="44" fill="none" stroke="white" strokeWidth="2"/>
        <circle cx="50" cy="50" r="34" fill="#c2410c" opacity="0.6"/>
        <text x="50" y="23" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold" fontFamily="Arial">PASUMAI</text>
        <text x="50" y="33" textAnchor="middle" fill="white" fontSize="6" fontFamily="Arial">INTEGRATED</text>
        <text x="50" y="43" textAnchor="middle" fill="white" fontSize="7" fontFamily="Arial">FARM</text>
        <text x="35" y="65" textAnchor="middle" fontSize="20">🐄</text>
        <text x="65" y="65" textAnchor="middle" fontSize="18">🐐</text>
        <text x="50" y="82" textAnchor="middle" fill="white" fontSize="5.5" fontFamily="Arial">விவசாயம் காப்போம்</text>
      </svg>
    </div>
  );
}

export default function FarmLogo({ className = 'h-12 w-12' }: { className?: string }) {
  const [imgError, setImgError] = useState(false);

  if (imgError) {
    return <SVGLogo className={className} />;
  }

  return (
    <img
      src={LOGO_SRC}
      alt="Pasumai Integrated Farm"
      className={`${className} rounded-full object-cover ring-2 ring-green-500/50`}
      onError={() => setImgError(true)}
    />
  );
}
