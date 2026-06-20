import { useState, useEffect } from 'react';
import { MapPin, Check, X, Truck, Clock, AlertTriangle, ChevronDown, Plus, Trash2, Loader2, MapPinned, Navigation, Phone, Mail, MessageCircle } from 'lucide-react';
import { useDelivery, UserAddress } from '../context/DeliveryContext';
import { useAuth } from '../context/AuthContext';

type DeliveryZoneCheckerProps = {
  onNavigate: (page: string) => void;
  onDeliveryChange?: (charge: number, isServiceable: boolean) => void;
  showAddNew?: boolean;
  showBulkContact?: boolean;
};

export default function DeliveryZoneChecker({ onNavigate, onDeliveryChange, showAddNew = true, showBulkContact = true }: DeliveryZoneCheckerProps) {
  const { user } = useAuth();
  const {
    addresses, selectedAddress, eligibility, hubs, loading, checkingPincode, location,
    selectAddress, checkPincode, checkGPSLocation, addAddress, deleteAddress, setDefaultAddress
  } = useDelivery();

  const [showDropdown, setShowDropdown] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAddress, setNewAddress] = useState({
    label: 'Home',
    full_name: '',
    phone: '',
    address_line1: '',
    address_line2: '',
    city: '',
    district: '',
    pincode: '',
    landmark: '',
  });
  const [pincodeCheck, setPincodeCheck] = useState('');
  const [quickResult, setQuickResult] = useState<{
    is_serviceable: boolean;
    hub_name: string | null;
    delivery_charge: number | null;
    distance_km: number | null;
  } | null>(null);

  // Notify parent of delivery changes
  useEffect(() => {
    if (onDeliveryChange && eligibility) {
      onDeliveryChange(
        eligibility.delivery_charge || 0,
        eligibility.is_serviceable || false
      );
    }
  }, [eligibility]);

  const handleAddAddress = async () => {
    if (!newAddress.address_line1 || !newAddress.pincode || !newAddress.city) {
      return;
    }
    const addr = await addAddress(newAddress);
    if (addr) {
      setShowAddForm(false);
      setNewAddress({
        label: 'Home', full_name: '', phone: '', address_line1: '',
        address_line2: '', city: '', district: '', pincode: '', landmark: ''
      });
    }
  };

  const handleQuickPincodeCheck = async () => {
    if (!pincodeCheck || pincodeCheck.length !== 6) return;
    setQuickResult(null);
    const result = await checkPincode(pincodeCheck);
    if (result) {
      setQuickResult({
        is_serviceable: result.is_serviceable,
        hub_name: result.hub_name,
        delivery_charge: result.delivery_charge,
        distance_km: result.distance_km,
      });
    }
  };

  const handleGPSCheck = async () => {
    await checkGPSLocation();
  };

  const getEstimatedDeliveryText = () => {
    if (!eligibility?.estimated_minutes) return '2-3 hours';
    const mins = eligibility.estimated_minutes;
    if (mins <= 30) return '30-45 minutes';
    if (mins <= 60) return '45-60 minutes';
    if (mins <= 120) return '1-2 hours';
    const hours = Math.ceil(mins / 60);
    return `${hours}-${hours + 1} hours`;
  };

  const formatDistance = (distance: number | null) => {
    if (distance === null) return '';
    return `${distance.toFixed(1)} KM`;
  };

  if (!user) {
    return (
      <div className="bg-stone-50 border border-stone-200 rounded-2xl p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-stone-100 rounded-xl flex items-center justify-center">
            <MapPin size={18} className="text-stone-400" />
          </div>
          <div>
            <p className="font-semibold text-stone-800">Delivery Location</p>
            <p className="text-sm text-stone-500">Sign in to check delivery availability</p>
          </div>
        </div>
        <button onClick={() => onNavigate('login')} className="btn-primary w-full py-2.5 text-sm">
          Sign In to Continue
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            eligibility?.is_serviceable ? 'bg-green-100' : eligibility?.is_serviceable === false ? 'bg-red-100' : 'bg-stone-100'
          }`}>
            <MapPinned size={18} className={
              eligibility?.is_serviceable ? 'text-green-600' : eligibility?.is_serviceable === false ? 'text-red-500' : 'text-stone-400'
            } />
          </div>
          <div>
            <p className="font-semibold text-stone-800">Delivery Location</p>
            {!loading && addresses.length === 0 && (
              <p className="text-xs text-stone-500">Check if we deliver to your area</p>
            )}
          </div>
        </div>
        {selectedAddress && (
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="text-green-600 text-sm font-medium hover:text-green-700 flex items-center gap-1"
          >
            Change
            <ChevronDown size={14} className={`transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 size={24} className="animate-spin text-green-600" />
        </div>
      ) : (
        <>
          {/* Quick Location Check */}
          {!selectedAddress && (
            <div className="mb-4 space-y-3">
              {/* GPS Button */}
              <button
                onClick={handleGPSCheck}
                disabled={location.loading}
                className="w-full py-3 border-2 border-dashed border-green-300 rounded-xl text-sm text-green-600 font-medium hover:bg-green-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {location.loading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Navigation size={18} />
                )}
                {location.loading ? 'Detecting Location...' : 'Use My Current Location'}
              </button>

              {location.error && (
                <p className="text-xs text-red-500 text-center">{location.error}</p>
              )}

              {/* OR divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-stone-200" />
                <span className="text-xs text-stone-400">OR</span>
                <div className="flex-1 h-px bg-stone-200" />
              </div>

              {/* Pincode Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter your pincode"
                  value={pincodeCheck}
                  onChange={(e) => setPincodeCheck(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="flex-1 px-4 py-2.5 border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  maxLength={6}
                />
                <button
                  onClick={handleQuickPincodeCheck}
                  disabled={checkingPincode || pincodeCheck.length !== 6}
                  className="btn-primary py-2.5 px-4 text-sm disabled:opacity-50"
                >
                  {checkingPincode ? <Loader2 size={16} className="animate-spin" /> : 'Check'}
                </button>
              </div>

              {/* Quick Result */}
              {quickResult && (
                <div className={`p-4 rounded-xl ${
                  quickResult.is_serviceable ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                }`}>
                  {quickResult.is_serviceable ? (
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <Check size={18} className="text-green-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="font-semibold text-green-800">Delivery Available</p>
                          <p className="text-sm text-green-700 mt-0.5">
                            Nearest Hub: {quickResult.hub_name}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-green-200">
                        <div className="text-center">
                          <p className="text-xs text-stone-500">Distance</p>
                          <p className="font-semibold text-stone-800">
                            {quickResult.distance_km ? `${quickResult.distance_km} KM` : 'Within zone'}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-stone-500">Delivery Charge</p>
                          <p className="font-semibold text-green-700">₹{quickResult.delivery_charge || 40}</p>
                        </div>
                      </div>
                      <p className="text-xs text-green-600 flex items-center gap-1 pt-2">
                        <Clock size={12} />
                        Estimated delivery: 45-60 minutes
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <X size={18} className="text-red-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-semibold text-red-800">Sorry, we currently do not deliver to your location.</p>
                          <p className="text-xs text-red-600 mt-1">
                            Outside 20 KM service zone
                          </p>
                        </div>
                      </div>
                      {showBulkContact && (
                        <div className="pt-3 border-t border-red-200">
                          <p className="text-sm text-red-700 mb-2">For bulk orders and special delivery requests, please contact us:</p>
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => onNavigate('contact')}
                              className="flex-1 py-2 px-3 bg-white border border-red-300 rounded-lg text-xs font-medium text-red-700 hover:bg-red-50 transition-colors flex items-center justify-center gap-1"
                            >
                              <Mail size={14} />
                              Contact Us
                            </button>
                            <a
                              href="tel:+919952814029"
                              className="flex-1 py-2 px-3 bg-white border border-red-300 rounded-lg text-xs font-medium text-red-700 hover:bg-red-50 transition-colors flex items-center justify-center gap-1"
                            >
                              <Phone size={14} />
                              Call Now
                            </a>
                            <a
                              href="https://wa.me/919952814029?text=Hi, I'm interested in placing a bulk order for delivery outside your service area."
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 py-2 px-3 bg-green-600 rounded-lg text-xs font-medium text-white hover:bg-green-700 transition-colors flex items-center justify-center gap-1"
                            >
                              <MessageCircle size={14} />
                              WhatsApp
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Address Selection Dropdown */}
          {(showDropdown || !selectedAddress) && addresses.length > 0 && (
            <div className="mb-4 space-y-2">
              {addresses.map((addr) => (
                <button
                  key={addr.id}
                  onClick={() => {
                    selectAddress(addr);
                    setShowDropdown(false);
                  }}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${
                    selectedAddress?.id === addr.id
                      ? 'border-green-500 bg-green-50'
                      : 'border-stone-200 hover:border-green-300 hover:bg-stone-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2">
                      <MapPin size={16} className="text-green-600 mt-1 flex-shrink-0" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-stone-800 text-sm">{addr.label}</span>
                          {addr.is_default && (
                            <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">Default</span>
                          )}
                          {addr.is_serviceable === false && (
                            <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded">Not Serviceable</span>
                          )}
                        </div>
                        <p className="text-xs text-stone-500 mt-0.5">
                          {addr.address_line1}, {addr.city} - {addr.pincode}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDefaultAddress(addr.id);
                        }}
                        className="p-1 text-stone-400 hover:text-green-600"
                        title="Set as default"
                      >
                        <Check size={14} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteAddress(addr.id);
                        }}
                        className="p-1 text-stone-400 hover:text-red-500"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Add New Address Form */}
          {showAddForm ? (
            <div className="bg-stone-50 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium text-stone-800 text-sm">Add New Address</p>
                <button onClick={() => setShowAddForm(false)} className="text-stone-400 hover:text-stone-600">
                  <X size={16} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={newAddress.label}
                  onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })}
                  className="px-3 py-2 border border-stone-200 rounded-lg text-sm bg-white"
                >
                  <option>Home</option>
                  <option>Work</option>
                  <option>Other</option>
                </select>
                <input
                  placeholder="Full Name"
                  value={newAddress.full_name}
                  onChange={(e) => setNewAddress({ ...newAddress, full_name: e.target.value })}
                  className="px-3 py-2 border border-stone-200 rounded-lg text-sm"
                />
                <input
                  placeholder="Phone"
                  value={newAddress.phone}
                  onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                  className="px-3 py-2 border border-stone-200 rounded-lg text-sm"
                  maxLength={10}
                />
                <input
                  placeholder="Pincode *"
                  value={newAddress.pincode}
                  onChange={(e) => setNewAddress({ ...newAddress, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                  className="px-3 py-2 border border-stone-200 rounded-lg text-sm"
                  maxLength={6}
                />
              </div>
              <input
                placeholder="Address Line 1 (House No, Street) *"
                value={newAddress.address_line1}
                onChange={(e) => setNewAddress({ ...newAddress, address_line1: e.target.value })}
                className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm"
              />
              <input
                placeholder="Address Line 2 (Optional)"
                value={newAddress.address_line2}
                onChange={(e) => setNewAddress({ ...newAddress, address_line2: e.target.value })}
                className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  placeholder="City *"
                  value={newAddress.city}
                  onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                  className="px-3 py-2 border border-stone-200 rounded-lg text-sm"
                />
                <input
                  placeholder="District"
                  value={newAddress.district}
                  onChange={(e) => setNewAddress({ ...newAddress, district: e.target.value })}
                  className="px-3 py-2 border border-stone-200 rounded-lg text-sm"
                />
              </div>
              <button
                onClick={handleAddAddress}
                disabled={!newAddress.address_line1 || !newAddress.pincode || !newAddress.city}
                className="btn-primary w-full py-2.5 text-sm disabled:opacity-50"
              >
                Save Address
              </button>
            </div>
          ) : showAddNew && (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full py-2.5 border border-dashed border-green-300 rounded-xl text-sm text-green-600 font-medium hover:bg-green-50 transition-colors flex items-center justify-center gap-2"
            >
              <Plus size={16} />
              Add New Address
            </button>
          )}

          {/* Selected Address Details with Full Info */}
          {selectedAddress && !showDropdown && eligibility && (
            <div className={`mt-4 p-4 rounded-xl ${
              eligibility.is_serviceable ? 'bg-green-50' : 'bg-red-50'
            }`}>
              {eligibility.is_serviceable ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-green-700">
                    <Check size={16} />
                    <span className="font-medium text-sm">Delivery Available</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/60 rounded-lg p-2.5">
                      <div className="flex items-center gap-2 text-xs text-stone-500 mb-1">
                        <Truck size={12} />
                        Nearest Hub
                      </div>
                      <p className="font-semibold text-stone-800 text-sm">{eligibility.hub_name}</p>
                    </div>
                    {eligibility.distance_km !== null && (
                      <div className="bg-white/60 rounded-lg p-2.5">
                        <div className="flex items-center gap-2 text-xs text-stone-500 mb-1">
                          <MapPin size={12} />
                          Distance From Hub
                        </div>
                        <p className="font-semibold text-stone-800 text-sm">{eligibility.distance_km.toFixed(1)} KM</p>
                      </div>
                    )}
                    <div className="bg-white/60 rounded-lg p-2.5">
                      <div className="flex items-center gap-2 text-xs text-stone-500 mb-1">
                        <Truck size={12} />
                        Delivery Charge
                      </div>
                      <p className="font-semibold text-green-700 text-sm">₹{eligibility.delivery_charge || 0}</p>
                    </div>
                    <div className="bg-white/60 rounded-lg p-2.5">
                      <div className="flex items-center gap-2 text-xs text-stone-500 mb-1">
                        <Clock size={12} />
                        Estimated Delivery
                      </div>
                      <p className="font-semibold text-stone-800 text-sm">{getEstimatedDeliveryText()}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-start gap-2 text-red-700">
                    <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-sm">Sorry, we currently do not deliver to your location.</p>
                      <p className="text-xs text-red-600 mt-1">
                        Outside 20 KM service zone
                      </p>
                    </div>
                  </div>
                  {showBulkContact && (
                    <div className="pt-3 border-t border-red-200">
                      <p className="text-sm text-red-700 mb-2">For bulk orders and special delivery requests:</p>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => onNavigate('contact')}
                          className="flex-1 py-2 px-3 bg-white border border-red-300 rounded-lg text-xs font-medium text-red-700 hover:bg-red-50 transition-colors flex items-center justify-center gap-1"
                        >
                          <Mail size={14} />
                          Contact Us
                        </button>
                        <a
                          href="tel:+919952814029"
                          className="flex-1 py-2 px-3 bg-white border border-red-300 rounded-lg text-xs font-medium text-red-700 hover:bg-red-50 transition-colors flex items-center justify-center gap-1"
                        >
                          <Phone size={14} />
                          Call Now
                        </a>
                        <a
                          href="https://wa.me/919952814029?text=Hi, I'm interested in placing a bulk order for delivery outside your service area."
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 py-2 px-3 bg-green-600 rounded-lg text-xs font-medium text-white hover:bg-green-700 transition-colors flex items-center justify-center gap-1"
                        >
                          <MessageCircle size={14} />
                          WhatsApp
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Hub Info */}
      {hubs.length > 0 && (
        <div className="mt-4 pt-4 border-t border-stone-100">
          <p className="text-xs text-stone-500 mb-2">Our delivery hubs (20 KM radius):</p>
          <div className="flex flex-wrap gap-2">
            {hubs.map(hub => (
              <div key={hub.id} className="flex items-center gap-1.5 text-xs text-stone-600 bg-stone-100 px-2 py-1 rounded-lg">
                <MapPin size={12} className="text-green-600" />
                {hub.name}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
