import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

export type DeliveryHub = {
  id: string;
  name: string;
  address: string;
  city: string;
  district: string;
  state: string;
  pincode: string;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  is_primary: boolean;
  is_active: boolean;
};

export type DeliveryZone = {
  hub_id: string;
  hub_name: string;
  max_distance_km: number;
  min_delivery_charge: number;
  per_km_charge: number;
  free_delivery_min_order: number;
  estimated_delivery_hours: number;
};

export type UserAddress = {
  id: string;
  user_id: string;
  label: string;
  full_name: string | null;
  phone: string | null;
  address_line1: string;
  address_line2: string | null;
  city: string;
  district: string | null;
  state: string;
  pincode: string;
  landmark: string | null;
  latitude: number | null;
  longitude: number | null;
  is_default: boolean;
  is_serviceable: boolean | null;
  nearest_hub_id: string | null;
  delivery_charge: number | null;
};

export type DeliveryEligibility = {
  is_serviceable: boolean;
  hub_id: string | null;
  hub_name: string | null;
  distance_km: number | null;
  delivery_charge: number | null;
  estimated_minutes: number | null;
};

export type LocationState = {
  latitude: number | null;
  longitude: null;
  address: string | null;
  error: string | null;
  loading: boolean;
};

type DeliveryContextType = {
  addresses: UserAddress[];
  selectedAddress: UserAddress | null;
  eligibility: DeliveryEligibility | null;
  hubs: DeliveryHub[];
  loading: boolean;
  checkingPincode: boolean;
  location: LocationState;
  selectAddress: (address: UserAddress | null) => void;
  checkPincode: (pincode: string) => Promise<DeliveryEligibility | null>;
  checkGPSLocation: () => Promise<void>;
  calculateDistance: (lat1: number, lon1: number, lat2: number, lon2: number) => number;
  findNearestHub: (lat: number, lon: number) => { hub: DeliveryHub | null; distance: number };
  addAddress: (address: Partial<UserAddress>) => Promise<UserAddress | null>;
  updateAddress: (id: string, updates: Partial<UserAddress>) => Promise<boolean>;
  deleteAddress: (id: string) => Promise<boolean>;
  setDefaultAddress: (id: string) => Promise<boolean>;
  getDefaultAddress: () => UserAddress | null;
  refreshAddresses: () => Promise<void>;
};

const DeliveryContext = createContext<DeliveryContextType>({
  addresses: [],
  selectedAddress: null,
  eligibility: null,
  hubs: [],
  loading: false,
  checkingPincode: false,
  location: { latitude: null, longitude: null, address: null, error: null, loading: false },
  selectAddress: () => {},
  checkPincode: async () => null,
  checkGPSLocation: async () => {},
  calculateDistance: () => 0,
  findNearestHub: () => ({ hub: null, distance: 0 }),
  addAddress: async () => null,
  updateAddress: async () => false,
  deleteAddress: async () => false,
  setDefaultAddress: async () => false,
  getDefaultAddress: () => null,
  refreshAddresses: async () => {},
});

// Haversine formula to calculate distance between two GPS coordinates
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function DeliveryProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<UserAddress | null>(null);
  const [eligibility, setEligibility] = useState<DeliveryEligibility | null>(null);
  const [hubs, setHubs] = useState<DeliveryHub[]>([]);
  const [zones, setZones] = useState<Map<string, DeliveryZone>>(new Map());
  const [loading, setLoading] = useState(false);
  const [checkingPincode, setCheckingPincode] = useState(false);
  const [location, setLocation] = useState<LocationState>({
    latitude: null,
    longitude: null,
    address: null,
    error: null,
    loading: false,
  });

  // Load hubs and zones on mount
  useEffect(() => {
    const loadHubsAndZones = async () => {
      const [hubsRes, zonesRes] = await Promise.all([
        supabase.from('delivery_hubs').select('*').eq('is_active', true),
        supabase.from('delivery_zones').select('*, delivery_hubs(name)'),
      ]);

      if (hubsRes.data) setHubs(hubsRes.data as DeliveryHub[]);

      if (zonesRes.data) {
        const zoneMap = new Map<string, DeliveryZone>();
        zonesRes.data.forEach((z: any) => {
          zoneMap.set(z.hub_id, {
            hub_id: z.hub_id,
            hub_name: z.delivery_hubs?.name || 'Unknown',
            max_distance_km: z.max_distance_km,
            min_delivery_charge: z.min_delivery_charge,
            per_km_charge: z.per_km_charge,
            free_delivery_min_order: z.free_delivery_min_order,
            estimated_delivery_hours: z.estimated_delivery_hours,
          });
        });
        setZones(zoneMap);
      }
    };
    loadHubsAndZones();
  }, []);

  // Load addresses when user logs in
  useEffect(() => {
    if (user) {
      refreshAddresses();
    } else {
      setAddresses([]);
      setSelectedAddress(null);
      setEligibility(null);
    }
  }, [user]);

  const refreshAddresses = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAddresses(data || []);

      // Auto-select default address
      const defaultAddr = data?.find(a => a.is_default);
      if (defaultAddr && !selectedAddress) {
        setSelectedAddress(defaultAddr);
        if (defaultAddr.latitude && defaultAddr.longitude) {
          const { hub, distance } = findNearestHub(defaultAddr.latitude, defaultAddr.longitude);
          if (hub) {
            const zone = zones.get(hub.id);
            const isServiceable = zone ? distance <= zone.max_distance_km : false;
            const deliveryCharge = zone
              ? Math.max(zone.min_delivery_charge, Math.round(zone.min_delivery_charge + distance * zone.per_km_charge))
              : 0;
            const estimatedMinutes = zone ? zone.estimated_delivery_hours * 60 : 120;

            setEligibility({
              is_serviceable: isServiceable,
              hub_id: hub.id,
              hub_name: hub.name,
              distance_km: Math.round(distance * 10) / 10,
              delivery_charge: deliveryCharge,
              estimated_minutes: estimatedMinutes,
            });
          }
        } else if (defaultAddr.pincode) {
          const elig = await checkPincodeService(defaultAddr.pincode);
          setEligibility(elig);
        }
      }
    } catch (err) {
      console.error('Error loading addresses:', err);
    } finally {
      setLoading(false);
    }
  }, [user, zones]);

  const calculateDistance = useCallback((lat1: number, lon1: number, lat2: number, lon2: number): number => {
    return haversineDistance(lat1, lon1, lat2, lon2);
  }, []);

  const findNearestHub = useCallback((lat: number, lon: number): { hub: DeliveryHub | null; distance: number } => {
    if (hubs.length === 0) return { hub: null, distance: 0 };

    let nearestHub: DeliveryHub | null = null;
    let minDistance = Infinity;

    for (const hub of hubs) {
      if (hub.latitude && hub.longitude) {
        const dist = haversineDistance(lat, lon, hub.latitude, hub.longitude);
        if (dist < minDistance) {
          minDistance = dist;
          nearestHub = hub;
        }
      }
    }

    return { hub: nearestHub, distance: minDistance };
  }, [hubs]);

  const checkPincodeService = async (pincode: string): Promise<DeliveryEligibility | null> => {
    const { data, error } = await supabase.rpc('check_delivery_eligibility', { p_pincode: pincode });
    if (error) {
      console.error('Pincode check error:', error);
      return null;
    }
    const result = data?.[0];
    if (result) {
      // Get zone info for estimated time
      const zone = result.hub_id ? zones.get(result.hub_id) : null;
      return {
        is_serviceable: result.is_serviceable || false,
        hub_id: result.hub_id,
        hub_name: result.hub_name,
        distance_km: null, // Can't calculate distance from pincode alone
        delivery_charge: result.delivery_charge,
        estimated_minutes: result.estimated_hours ? result.estimated_hours * 60 : 120,
      };
    }
    return null;
  };

  const checkPincode = async (pincode: string): Promise<DeliveryEligibility | null> => {
    setCheckingPincode(true);
    try {
      const result = await checkPincodeService(pincode);
      setEligibility(result);
      return result;
    } finally {
      setCheckingPincode(false);
    }
  };

  const checkGPSLocation = async () => {
    if (!navigator.geolocation) {
      setLocation(prev => ({ ...prev, error: 'Geolocation is not supported by your browser' }));
      return;
    }

    setLocation(prev => ({ ...prev, loading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        setLocation(prev => ({ ...prev, latitude: lat, longitude: lon, loading: false }));

        const { hub, distance } = findNearestHub(lat, lon);

        if (hub) {
          const zone = zones.get(hub.id);
          const maxDistance = zone?.max_distance_km || 20;
          const isServiceable = distance <= maxDistance;
          const deliveryCharge = zone
            ? Math.max(zone.min_delivery_charge, Math.round(zone.min_delivery_charge + distance * zone.per_km_charge))
            : 0;
          const estimatedMinutes = zone ? zone.estimated_delivery_hours * 60 : 120;

          setEligibility({
            is_serviceable: isServiceable,
            hub_id: hub.id,
            hub_name: hub.name,
            distance_km: Math.round(distance * 10) / 10,
            delivery_charge: deliveryCharge,
            estimated_minutes: estimatedMinutes,
          });
        } else {
          setEligibility({
            is_serviceable: false,
            hub_id: null,
            hub_name: null,
            distance_km: null,
            delivery_charge: null,
            estimated_minutes: null,
          });
        }
      },
      (error) => {
        let errorMsg = 'Unable to get your location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMsg = 'Location permission denied. Please enable location access.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMsg = 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMsg = 'Location request timed out.';
            break;
        }
        setLocation(prev => ({ ...prev, error: errorMsg, loading: false }));
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  };

  const addAddress = async (address: Partial<UserAddress>): Promise<UserAddress | null> => {
    if (!user) return null;

    const payload: any = {
      user_id: user.id,
      label: address.label || 'Home',
      full_name: address.full_name || null,
      phone: address.phone || null,
      address_line1: address.address_line1 || '',
      address_line2: address.address_line2 || null,
      city: address.city || '',
      district: address.district || null,
      state: address.state || 'Tamil Nadu',
      pincode: address.pincode || '',
      landmark: address.landmark || null,
      latitude: address.latitude || null,
      longitude: address.longitude || null,
      is_default: addresses.length === 0,
    };

    // Calculate nearest hub and eligibility
    if (payload.latitude && payload.longitude) {
      const { hub, distance } = findNearestHub(payload.latitude, payload.longitude);
      if (hub) {
        const zone = zones.get(hub.id);
        payload.is_serviceable = zone ? distance <= zone.max_distance_km : false;
        payload.nearest_hub_id = hub.id;
        payload.delivery_charge = zone
          ? Math.max(zone.min_delivery_charge, Math.round(zone.min_delivery_charge + distance * zone.per_km_charge))
          : null;
      }
    } else if (payload.pincode) {
      const elig = await checkPincodeService(payload.pincode);
      payload.is_serviceable = elig?.is_serviceable || false;
      payload.nearest_hub_id = elig?.hub_id || null;
      payload.delivery_charge = elig?.delivery_charge || null;
    }

    const { data, error } = await supabase
      .from('user_addresses')
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error('Error adding address:', error);
      return null;
    }

    await refreshAddresses();
    return data;
  };

  const updateAddress = async (id: string, updates: Partial<UserAddress>): Promise<boolean> => {
    const { error } = await supabase
      .from('user_addresses')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('Error updating address:', error);
      return false;
    }

    await refreshAddresses();
    return true;
  };

  const deleteAddress = async (id: string): Promise<boolean> => {
    const { error } = await supabase
      .from('user_addresses')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting address:', error);
      return false;
    }

    await refreshAddresses();
    return true;
  };

  const setDefaultAddress = async (id: string): Promise<boolean> => {
    if (!user) return false;

    // Unset all defaults
    await supabase
      .from('user_addresses')
      .update({ is_default: false })
      .eq('user_id', user.id);

    // Set new default
    await supabase
      .from('user_addresses')
      .update({ is_default: true })
      .eq('id', id);

    await refreshAddresses();
    return true;
  };

  const getDefaultAddress = (): UserAddress | null => {
    return addresses.find(a => a.is_default) || addresses[0] || null;
  };

  return (
    <DeliveryContext.Provider value={{
      addresses,
      selectedAddress,
      eligibility,
      hubs,
      loading,
      checkingPincode,
      location,
      selectAddress: (addr) => {
        setSelectedAddress(addr);
        if (addr?.latitude && addr?.longitude) {
          const { hub, distance } = findNearestHub(addr.latitude, addr.longitude);
          if (hub) {
            const zone = zones.get(hub.id);
            const isServiceable = zone ? distance <= zone.max_distance_km : false;
            const deliveryCharge = zone
              ? Math.max(zone.min_delivery_charge, Math.round(zone.min_delivery_charge + distance * zone.per_km_charge))
              : 0;
            setEligibility({
              is_serviceable: isServiceable,
              hub_id: hub.id,
              hub_name: hub.name,
              distance_km: Math.round(distance * 10) / 10,
              delivery_charge: deliveryCharge,
              estimated_minutes: zone?.estimated_delivery_hours ? zone.estimated_delivery_hours * 60 : 120,
            });
          }
        } else if (addr?.pincode) {
          checkPincode(addr.pincode);
        }
      },
      checkPincode,
      checkGPSLocation,
      calculateDistance,
      findNearestHub,
      addAddress,
      updateAddress,
      deleteAddress,
      setDefaultAddress,
      getDefaultAddress,
      refreshAddresses,
    }}>
      {children}
    </DeliveryContext.Provider>
  );
}

export const useDelivery = () => useContext(DeliveryContext);
