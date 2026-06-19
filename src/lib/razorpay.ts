// Razorpay Types
declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => {
      open: () => void;
      close: () => void;
    };
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayResponse) => void;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  theme?: {
    color?: string;
  };
  modal?: {
    ondismiss?: () => void;
  };
  method?: {
    upi?: boolean;
    card?: boolean;
    netbanking?: boolean;
    wallet?: boolean;
    emi?: boolean;
  };
}

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface CreateOrderParams {
  amount: number;
  type: 'order' | 'cottage' | 'farm_visit' | 'hall';
  recordId: string;
}

interface PaymentResult {
  success: boolean;
  paymentId?: string;
  orderId?: string;
  error?: string;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Load Razorpay script
export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

// Create Razorpay order via edge function
export async function createRazorpayOrder(params: CreateOrderParams) {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/razorpay-payment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      action: 'create_order',
      amount: params.amount,
      type: params.type,
      recordId: params.recordId,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create payment order');
  }

  return response.json();
}

// Verify and update payment after successful payment
export async function verifyAndUpdatePayment(
  orderId: string,
  paymentId: string,
  signature: string,
  type: 'order' | 'cottage' | 'farm_visit' | 'hall',
  recordId: string,
  amount: number
): Promise<PaymentResult> {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/razorpay-payment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      action: 'update_payment_status',
      orderId,
      paymentId,
      signature,
      type,
      recordId,
      amount,
    }),
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    return { success: false, error: data.error || 'Payment verification failed' };
  }

  return { success: true, paymentId, orderId };
}

// Open Razorpay checkout
export async function openRazorpayCheckout(options: {
  amount: number;
  name: string;
  description: string;
  prefill?: { name?: string; email?: string; contact?: string };
  onSuccess: (response: RazorpayResponse) => void;
  onFailure: (error: string) => void;
  onDismiss?: () => void;
}): Promise<void> {
  const scriptLoaded = await loadRazorpayScript();
  if (!scriptLoaded) {
    options.onFailure('Failed to load payment gateway');
    return;
  }

  // Create order first
  let orderData;
  try {
    orderData = await createRazorpayOrder({
      amount: options.amount,
      type: 'order', // Will be updated by caller
      recordId: 'temp',
    });
  } catch (err) {
    options.onFailure(err instanceof Error ? err.message : 'Failed to create order');
    return;
  }

  const rzpOptions: RazorpayOptions = {
    key: orderData.razorpayKey,
    amount: orderData.amount,
    currency: orderData.currency || 'INR',
    name: options.name,
    description: options.description,
    order_id: orderData.razorpayOrderId,
    handler: options.onSuccess,
    prefill: options.prefill,
    theme: {
      color: '#15803d', // Green
    },
    method: {
      upi: true,
      card: true,
      netbanking: true,
      wallet: true,
      emi: true,
    },
    modal: {
      ondismiss: options.onDismiss,
    },
  };

  const rzp = new window.Razorpay(rzpOptions);
  rzp.open();
}

// Generate UPI QR code data
export function generateUPIQRData(upiId: string, amount: number, name: string, reference: string): string {
  const upiUrl = new URL('upi://pay');
  upiUrl.searchParams.set('pa', upiId);
  upiUrl.searchParams.set('pn', name);
  upiUrl.searchParams.set('am', amount.toString());
  upiUrl.searchParams.set('cu', 'INR');
  upiUrl.searchParams.set('tr', reference);
  return upiUrl.toString();
}
