import { useState } from 'react';

/* @vite-ignore */
const QR_SRC = new URL('../assets/WhatsApp_Image_2026-06-04_at_10.28.40_AM.jpeg', import.meta.url).href;

type UpiQrCodeProps = {
  className?: string;
  amount?: number;
  orderId?: string;
};

export default function UpiQrCode({ className = 'w-48 h-48', amount, orderId }: UpiQrCodeProps) {
  const [imgError, setImgError] = useState(false);

  return (
    <div className="flex flex-col items-center gap-4">
      {amount !== undefined && (
        <div className="bg-green-50 border-2 border-green-200 rounded-2xl px-8 py-4 text-center">
          <p className="text-xs text-stone-500 font-medium uppercase tracking-wide mb-1">Amount to Pay</p>
          <p className="text-4xl font-black text-green-700">₹{amount.toLocaleString()}</p>
          {orderId && <p className="text-xs text-stone-400 mt-1">Ref: {orderId}</p>}
        </div>
      )}

      <div className="p-3 bg-white border-2 border-stone-200 rounded-2xl shadow-sm">
        {imgError ? (
          <div className={`${className} bg-stone-100 rounded-xl flex flex-col items-center justify-center`}>
            <div className="grid grid-cols-3 gap-1 p-4">
              {[...Array(9)].map((_, i) => (
                <div
                  key={i}
                  className={`aspect-square rounded-sm ${
                    [0, 2, 6, 8].includes(i) ? 'bg-stone-800' : i === 4 ? 'bg-green-600' : 'bg-stone-300'
                  }`}
                />
              ))}
            </div>
            <p className="text-xs font-bold text-stone-700 mt-1">UPI QR Code</p>
          </div>
        ) : (
          <img
            src={QR_SRC}
            alt="UPI QR Code"
            className={`${className} object-cover rounded-xl`}
            onError={() => setImgError(true)}
          />
        )}
      </div>

      <div className="text-center">
        <p className="text-sm font-bold text-stone-800">M. Kumaravel (Ex-Army)</p>
        <p className="text-sm text-stone-500">UPI: <span className="font-semibold text-green-700">mkumaran3577@gmail.com</span></p>
        <p className="text-xs text-stone-400 mt-1">Scan with any UPI app — GPay, PhonePe, Paytm</p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800 text-center max-w-xs">
        <strong>After payment:</strong> Screenshot & WhatsApp to{' '}
        <a href="tel:9952814029" className="font-bold underline">9952814029</a>
        {orderId && <span> with Ref: {orderId}</span>}
      </div>
    </div>
  );
}
