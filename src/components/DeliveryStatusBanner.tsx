import { useState, useEffect } from 'react';
import { MapPin, Check, X, Navigation, Loader2, Phone, Mail, MessageCircle } from 'lucide-react';
import { useDelivery } from '../context/DeliveryContext';
import { useAuth } from '../context/AuthContext';

type DeliveryStatusBannerProps = {
  onNavigate: (page: string) => void;
  onServiceabilityChange?: (isServiceable: boolean | null) => void;
};

export default function DeliveryStatusBanner({ onNavigate, onServiceabilityChange }: DeliveryStatusBannerProps) {
  const { user } = useAuth();
  const { eligibility, location, checkGPSLocation, hubs, checkingPincode } = useDelivery();
  const [pincode, setPincode] = useState('');
  const [showExpanded, setShowExpanded] = useState(false);
  const [localResult, setLocalResult] = useState<{
    is_serviceable: boolean;
    hub_name?: string;
  } | null>(null);

  // Notify parent of serviceability
  useEffect(() => {
    if (onServiceabilityChange) {
      onServiceabilityChange(eligibility?.is_serviceable ?? null);
    }
  }, [eligibility?.is_serviceable]);

  const isServiceable = eligibility?.is_serviceable;

  // Compact banner (default)
  if (!showExpanded) {
    return (
      <button
        onClick={() => setShowExpanded(true)}
        className={`w-full py-2.5 px-4 rounded-full flex items-center justify-center gap-2 text-sm font-medium transition-all ${
          isServiceable === true
            ? 'bg-green-100 text-green-700 border border-green-200'
            : isServiceable === false
            ? 'bg-red-100 text-red-700 border border-red-200'
            : 'bg-stone-100 text-stone-600 border border-stone-200 hover:bg-stone-200'
        }`}
      >
        <MapPin size={16} />
        {isServiceable === true ? (
          <>Delivery Available • {eligibility?.hub_name}</>
        ) : isServiceable === false ? (
          <>Delivery Not Available</>
        ) : (
          <>Check Delivery Availability</>
        )}
      </button>
    );
  }

  // Expanded view
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-stone-200 p-5 absolute top-full left-0 right-0 z-50 mt-2">
      <div className="flex items-center justify-between mb-4">
        <p className="font-semibold text-stone-800">Delivery Location</p>
        <button onClick={() => setShowExpanded(false)} className="text-stone-400 hover:text-stone-600">
          <X size={18} />
        </button>
      </div>

      {/* GPS Button */}
      <button
        onClick={checkGPSLocation}
        disabled={location.loading}
        className="w-full py-3 border-2 border-green-300 rounded-xl text-sm text-green-600 font-medium hover:bg-green-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 mb-3"
      >
        {location.loading ? <Loader2 size={18} className="animate-spin" /> : <Navigation size={18} />}
        {location.loading ? 'Detecting...' : 'Use Current Location'}
      </button>

      {location.error && (
        <p className="text-xs text-red-500 text-center mb-3">{location.error}</p>
      )}

      <div className="flex items-center gap-3 mb-3">
        <div className="flex-1 h-px bg-stone-200" />
        <span className="text-xs text-stone-400">OR</span>
        <div className="flex-1 h-px bg-stone-200" />
      </div>

      {/* Pincode Input */}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Enter pincode"
          value={pincode}
          onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          className="flex-1 px-3 py-2.5 border border-stone-200 rounded-lg text-sm"
          maxLength={6}
        />
        <button className="btn-primary py-2.5 px-4 text-sm disabled:opacity-50" disabled={pincode.length !== 6}>
          Check
        </button>
      </div>

      {/* Result */}
      {isServiceable !== null && (
        <div className={`mt-4 p-4 rounded-xl ${isServiceable ? 'bg-green-50' : 'bg-red-50'}`}>
          {isServiceable ? (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                <Check size={16} className="text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-green-800">Delivery Available</p>
                <p className="text-xs text-green-600">{eligibility?.hub_name} • {eligibility?.distance_km?.toFixed(1)} KM away</p>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                  <X size={16} className="text-red-600" />
                </div>
                <div>
                  <p className="font-semibold text-red-800">Delivery Not Available</p>
                  <p className="text-xs text-red-600">Outside 20 KM service zone</p>
                </div>
              </div>
              <p className="text-xs text-red-600 mb-2">For bulk orders, contact us:</p>
              <div className="flex gap-2">
                <button onClick={() => onNavigate('contact')} className="flex-1 py-2 bg-white border border-red-200 rounded-lg text-xs font-medium text-red-700 hover:bg-red-50 flex items-center justify-center gap-1">
                  <Mail size={12} /> Contact
                </button>
                <a href="tel:+919952814029" className="flex-1 py-2 bg-white border border-red-200 rounded-lg text-xs font-medium text-red-700 hover:bg-red-50 flex items-center justify-center gap-1">
                  <Phone size={12} /> Call
                </a>
                <a href="https://wa.me/919952814029" target="_blank" className="flex-1 py-2 bg-green-600 rounded-lg text-xs font-medium text-white hover:bg-green-700 flex items-center justify-center gap-1">
                  <MessageCircle size={12} /> WhatsApp
                </a>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Hub Info */}
      <div className="mt-4 pt-4 border-t border-stone-100">
        <p className="text-xs text-stone-500 mb-2">Service zones (20 KM radius):</p>
        <div className="flex flex-wrap gap-1">
          {hubs.map(hub => (
            <span key={hub.id} className="text-xs bg-stone-100 text-stone-600 px-2 py-1 rounded-full">
              {hub.name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
