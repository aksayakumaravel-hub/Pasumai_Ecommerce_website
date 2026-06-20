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
  delivery_charge: number | null;
  estimated_hours: number | null;
};

type DeliveryContextType = {
  addresses: UserAddress[];
  selectedAddress: UserAddress | null;
  eligibility: DeliveryEligibility | null;
  hubs: DeliveryHub[];
  loading: boolean;
  checkingPincode: boolean;
  selectAddress: (address: UserAddress | null) => void;
  checkPincode: (pincode: string) => Promise<DeliveryEligibility | null>;
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
  selectAddress: () => {},
  checkPincode: async () => null,
  addAddress: async () => null,
  updateAddress: async () => false,
  deleteAddress: async () => false,
  setDefaultAddress: async () => false,
  getDefaultAddress: () => null,
  refreshAddresses: async () => {},
});

export function DeliveryProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<UserAddress | null>(null);
  const [eligibility, setEligibility] = useState<DeliveryEligibility | null>(null);
  const [hubs, setHubs] = useState<DeliveryHub[]>([]);
  const [loading, setLoading] = useState(false);
  const [checkingPincode, setCheckingPincode] = useState(false);

  // Load hubs on mount
  useEffect(() => {
    const loadHubs = async () => {
      const { data } = await supabase
        .from('delivery_hubs')
        .select('*')
        .eq('is_active', true);
      if (data) setHubs(data as DeliveryHub[]);
    };
    loadHubs();
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
        if (defaultAddr.pincode) {
          const elig = await checkPincodeService(defaultAddr.pincode);
          setEligibility(elig);
        }
      }
    } catch (err) {
      console.error('Error loading addresses:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const checkPincodeService = async (pincode: string): Promise<DeliveryEligibility | null> => {
    const { data, error } = await supabase.rpc('check_delivery_eligibility', { p_pincode: pincode });
    if (error) {
      console.error('Pincode check error:', error);
      return null;
    }
    return data?.[0] || null;
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

  const addAddress = async (address: Partial<UserAddress>): Promise<UserAddress | null> => {
    if (!user) return null;

    const payload = {
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
      is_default: addresses.length === 0,
    };

    // Check delivery eligibility
    const elig = await checkPincodeService(payload.pincode);
    payload.is_serviceable = elig?.is_serviceable || false;
    payload.nearest_hub_id = elig?.hub_id || null;
    payload.delivery_charge = elig?.delivery_charge || null;

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
      selectAddress: (addr) => {
        setSelectedAddress(addr);
        if (addr?.pincode) checkPincode(addr.pincode);
      },
      checkPincode,
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
