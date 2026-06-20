import { useState, useEffect } from 'react';
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft, Leaf, CreditCard, Loader2, CheckCircle, MapPin } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useDelivery } from '../context/DeliveryContext';
import { supabase } from '../lib/supabase';
import { loadRazorpayScript, createRazorpayOrder, verifyAndUpdatePayment } from '../lib/razorpay';
import UpiQrCode from '../components/UpiQrCode';
import DeliveryZoneChecker from '../components/DeliveryZoneChecker';

type CartPageProps = {
  onNavigate: (page: string) => void;
};

type CheckoutStep = 'cart' | 'details' | 'payment' | 'success';

export default function CartPage({ onNavigate }: CartPageProps) {
  const { items, removeItem, updateQuantity, clearCart, total } = useCart();
  const { user, profile } = useAuth();
  const { selectedAddress, eligibility, checkPincode } = useDelivery();
  const [step, setStep] = useState<CheckoutStep>('cart');
  const [loading, setLoading] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [fullOrderId, setFullOrderId] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'failed'>('idle');
  const [deliveryCharge, setDeliveryCharge] = useState(0);
  const [isServiceable, setIsServiceable] = useState(true);
  const [form, setForm] = useState({
    name: profile?.full_name || '',
    phone: profile?.phone || '',
    address: '',
    notes: '',
  });

  useEffect(() => {
    if (profile) {
      setForm(f => ({
        ...f,
        name: f.name || profile.full_name || '',
        phone: f.phone || profile.phone || '',
      }));
    }
  }, [profile]);

  // Update form when address changes
  useEffect(() => {
    if (selectedAddress) {
      setForm(f => ({
        ...f,
        address: `${selectedAddress.address_line1}${selectedAddress.address_line2 ? ', ' + selectedAddress.address_line2 : ''}, ${selectedAddress.city}, ${selectedAddress.district || ''} - ${selectedAddress.pincode}`,
      }));
    }
  }, [selectedAddress]);

  // Calculate delivery fee
  const deliveryFee = eligibility?.delivery_charge ?? (total >= 500 ? 0 : 40);
  const grandTotal = total + deliveryFee;
  const freeDeliveryMin = 500;
  const isEligibleForFreeDelivery = total >= freeDeliveryMin;
  const canPlaceOrder = selectedAddress ? eligibility?.is_serviceable : true;

  const handlePlaceOrder = async () => {
    if (!user) {
      onNavigate('login');
      return;
    }

    // Check delivery eligibility
    if (selectedAddress && !eligibility?.is_serviceable) {
      alert('Sorry, we do not deliver to this address. Please select a different address or contact us for bulk orders.');
      return;
    }

    setLoading(true);
    try {
      const { data: order, error } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          total_amount: grandTotal,
          payment_method: 'razorpay',
          payment_status: 'pending',
          delivery_name: form.name,
          delivery_phone: form.phone,
          delivery_address: form.address,
          notes: form.notes,
          estimated_delivery: new Date(Date.now() + (eligibility?.estimated_hours || 48) * 60 * 60 * 1000).toISOString(),
          delivery_hub_id: eligibility?.hub_id || null,
          delivery_address_id: selectedAddress?.id || null,
        })
        .select()
        .single();

      if (error) throw error;

      await supabase.from('order_items').insert(
        items.map(item => ({
          order_id: order.id,
          product_id: item.product.id,
          product_name: item.product.name,
          quantity: item.quantity,
          price: item.product.price,
        }))
      );

      setFullOrderId(order.id);
      setOrderId(order.id.slice(0, 8).toUpperCase());
      setStep('payment');
    } catch (err) {
      console.error(err);
      alert('Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRazorpayPayment = async () => {
    if (!user || !fullOrderId) return;

    setPaymentStatus('processing');

    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      setPaymentStatus('failed');
      alert('Failed to load payment gateway. Please try again.');
      return;
    }

    try {
      // Create Razorpay order
      const orderData = await createRazorpayOrder({
        amount: grandTotal,
        type: 'order',
        recordId: fullOrderId,
      });

      // Open Razorpay checkout
      const options = {
        key: orderData.razorpayKey,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'Pasumai Integrated Farm',
        description: `Order #${orderId} - Organic Products`,
        order_id: orderData.razorpayOrderId,
        handler: async (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
          // Verify payment
          const result = await verifyAndUpdatePayment(
            response.razorpay_order_id,
            response.razorpay_payment_id,
            response.razorpay_signature,
            'order',
            fullOrderId,
            grandTotal
          );

          if (result.success) {
            setPaymentStatus('success');
            clearCart();
            setTimeout(() => setStep('success'), 1500);
          } else {
            setPaymentStatus('failed');
            alert(result.error || 'Payment verification failed');
          }
        },
        prefill: {
          name: form.name,
          email: user.email,
          contact: form.phone,
        },
        theme: {
          color: '#15803d',
        },
        method: {
          upi: true,
          card: true,
          netbanking: true,
          wallet: true,
          emi: true,
        },
        modal: {
          ondismiss: () => {
            setPaymentStatus('idle');
          },
        },
      };

      // @ts-expect-error - Razorpay is loaded dynamically
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      setPaymentStatus('failed');
      console.error('Payment error:', err);
      alert(err instanceof Error ? err.message : 'Payment failed. Please try again.');
    }
  };

  const handleManualPayment = async () => {
    // Fallback: mark as paid manually after UPI QR scan
    if (!user || !fullOrderId) return;

    await supabase.from('orders').update({
      payment_status: 'paid',
      status: 'confirmed',
    }).eq('id', fullOrderId);

    await supabase.from('notifications').insert({
      user_id: user.id,
      title: 'Payment Received!',
      message: `Payment for order #${orderId} has been confirmed. We'll dispatch your order soon.`,
      type: 'success',
      reference_id: fullOrderId,
      reference_type: 'order',
    });

    clearCart();
    setStep('success');
  };

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-stone-50 pt-20 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center bg-white rounded-3xl p-10 shadow-xl">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${paymentStatus === 'success' ? 'bg-green-100' : 'bg-blue-100'}`}>
            {paymentStatus === 'success' ? (
              <CheckCircle size={40} className="text-green-600" />
            ) : (
              <CheckCircle size={40} className="text-blue-600" />
            )}
          </div>
          <h2 className="text-3xl font-black text-green-900 font-heading mb-3">
            {paymentStatus === 'success' ? 'Payment Successful!' : 'Order Confirmed!'}
          </h2>
          <p className="text-stone-600 mb-2">Order ID: <strong className="text-green-700">#{orderId}</strong></p>
          <p className="text-stone-500 text-sm mb-8">
            {paymentStatus === 'success'
              ? 'Your payment was successful! We\'ll dispatch your fresh organic products within 24 hours.'
              : 'Your order has been placed. We\'ll confirm payment and dispatch your products soon.'}
          </p>
          <div className="space-y-3">
            <button onClick={() => onNavigate('dashboard')} className="btn-primary w-full py-3">
              Track My Order
            </button>
            <button onClick={() => onNavigate('shop')} className="w-full py-3 border-2 border-stone-200 rounded-full text-stone-600 hover:bg-stone-50 font-semibold transition-colors">
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'payment') {
    return (
      <div className="min-h-screen bg-stone-50 pt-20 px-4">
        <div className="max-w-lg mx-auto py-12">
          <div className="bg-white rounded-3xl overflow-hidden shadow-xl">
            <div className="bg-green-700 p-6 text-white text-center">
              <h2 className="text-2xl font-black font-heading">Complete Payment</h2>
              <p className="text-green-200 text-sm mt-1">Order #{orderId}</p>
            </div>
            <div className="p-8">
              <div className="flex justify-center mb-6">
                <UpiQrCode className="w-48 h-48" amount={grandTotal} orderId={orderId} />
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleRazorpayPayment}
                  disabled={paymentStatus === 'processing'}
                  className="btn-primary w-full py-3.5 text-base flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {paymentStatus === 'processing' ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard size={18} />
                      Pay with Razorpay
                    </>
                  )}
                </button>

                <div className="relative flex items-center justify-center my-4">
                  <div className="border-t border-stone-200 flex-1" />
                  <span className="px-4 text-xs text-stone-400 bg-white">OR</span>
                  <div className="border-t border-stone-200 flex-1" />
                </div>

                <button
                  onClick={handleManualPayment}
                  className="w-full py-3 border-2 border-stone-200 rounded-full text-stone-600 hover:bg-stone-50 font-semibold transition-colors"
                >
                  I've Completed the UPI Payment
                </button>
              </div>

              <p className="text-xs text-stone-400 text-center mt-4">
                Pay using UPI, Credit Card, Net Banking, or Wallets
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-stone-50 pt-20 flex items-center justify-center px-4">
        <div className="text-center bg-white rounded-3xl p-10 shadow-sm">
          <ShoppingBag size={64} className="text-stone-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-stone-600 mb-3">Your cart is empty</h2>
          <p className="text-stone-400 mb-6">Add some fresh organic products to get started!</p>
          <button onClick={() => onNavigate('shop')} className="btn-primary">
            Shop Now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 pt-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <button
          onClick={() => onNavigate('shop')}
          className="flex items-center gap-2 text-stone-500 hover:text-green-700 mb-6 transition-colors"
        >
          <ArrowLeft size={18} />
          Continue Shopping
        </button>

        <h1 className="text-3xl font-black text-green-900 font-heading mb-8">
          {step === 'cart' ? 'Shopping Cart' : 'Delivery Details'}
        </h1>

        {step === 'cart' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Items */}
            <div className="lg:col-span-2 space-y-4">
              {items.map(item => (
                <div key={item.product.id} className="bg-white rounded-2xl p-5 flex items-center gap-4 shadow-sm border border-stone-100">
                  <img
                    src={item.product.image_url || ''}
                    alt={item.product.name}
                    className="w-20 h-20 object-cover rounded-xl flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-stone-800">{item.product.name}</h3>
                    <p className="text-sm text-stone-500">₹{item.product.price}/{item.product.unit}</p>
                    {item.product.stock !== undefined && item.product.stock < 5 && (
                      <span className="text-xs text-amber-600 font-medium">Only {item.product.stock} left</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      className="w-8 h-8 rounded-full border border-stone-200 flex items-center justify-center hover:bg-stone-100 transition-colors"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-8 text-center font-bold">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      disabled={item.product.stock !== undefined && item.quantity >= item.product.stock}
                      className="w-8 h-8 rounded-full border border-stone-200 flex items-center justify-center hover:bg-stone-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-green-700 text-lg">₹{(item.product.price * item.quantity).toFixed(0)}</p>
                    <button
                      onClick={() => removeItem(item.product.id)}
                      className="mt-1 text-red-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100 sticky top-24">
                <h3 className="font-bold text-stone-800 text-lg mb-5">Order Summary</h3>
                <div className="space-y-3 mb-5">
                  <div className="flex justify-between text-sm">
                    <span className="text-stone-600">Subtotal</span>
                    <span className="font-semibold">₹{total}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-stone-600">Delivery</span>
                    <span className={isEligibleForFreeDelivery ? 'text-green-600 font-semibold' : 'font-semibold'}>
                      {isEligibleForFreeDelivery ? 'FREE' : `₹${deliveryFee}`}
                    </span>
                  </div>
                  {!isEligibleForFreeDelivery && (
                    <p className="text-xs text-stone-400">Free delivery on orders above ₹{freeDeliveryMin}</p>
                  )}
                  {eligibility?.is_serviceable && eligibility?.hub_name && (
                    <p className="text-xs text-green-600 flex items-center gap-1">
                      <MapPin size={12} />
                      Delivery from {eligibility.hub_name}
                    </p>
                  )}
                  <div className="border-t border-stone-100 pt-3 flex justify-between font-black text-lg">
                    <span>Total</span>
                    <span className="text-green-700">₹{grandTotal}</span>
                  </div>
                </div>
                <button
                  onClick={() => setStep('details')}
                  className="btn-primary w-full py-3 text-base"
                >
                  Proceed to Checkout
                </button>
                <div className="flex items-center gap-2 mt-4 text-xs text-stone-400 justify-center">
                  <Leaf size={12} className="text-green-500" />
                  Organic, fresh, farm-to-home delivery
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 'details' && (
          <div className="max-w-xl mx-auto">
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-stone-100">
              <h3 className="font-bold text-xl text-stone-800 mb-6">Delivery Details</h3>

              {/* Delivery Zone Checker */}
              <div className="mb-6">
                <DeliveryZoneChecker
                  onNavigate={onNavigate}
                  onDeliveryChange={(charge, serviceable) => {
                    setDeliveryCharge(charge);
                    setIsServiceable(serviceable);
                  }}
                />
              </div>

              {/* Show warning if not serviceable */}
              {selectedAddress && !isServiceable && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-red-800 font-medium text-sm">
                    Sorry, we currently do not deliver to this location.
                  </p>
                  <p className="text-red-600 text-xs mt-1">
                    For bulk orders and special delivery requests, please{' '}
                    <button
                      onClick={() => onNavigate('contact')}
                      className="underline font-medium"
                    >
                      contact us
                    </button>
                  </p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-2">Full Name *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Your full name"
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-2">Phone Number *</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                    placeholder="10-digit mobile number"
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-2">Delivery Address *</label>
                  <textarea
                    value={form.address}
                    onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                    placeholder="Full address with pincode"
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm resize-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-2">Special Notes</label>
                  <input
                    type="text"
                    value={form.notes}
                    onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                    placeholder="Any special requests or instructions"
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                  />
                </div>
              </div>

              <div className="mt-6 bg-stone-50 rounded-xl p-4 text-sm">
                <div className="flex justify-between mb-2">
                  <span className="text-stone-600">Subtotal</span>
                  <span className="font-semibold">₹{total}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-stone-600">Delivery</span>
                  <span className={deliveryFee === 0 ? 'text-green-600 font-semibold' : 'font-semibold'}>
                    {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
                  </span>
                </div>
                <div className="border-t border-stone-200 pt-2 mt-2 flex justify-between font-black text-lg">
                  <span>Total</span>
                  <span className="text-green-700">₹{grandTotal}</span>
                </div>
                {eligibility?.estimated_hours && (
                  <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                    <MapPin size={12} />
                    Estimated delivery: {eligibility.estimated_hours <= 24 ? 'Next day' : `${Math.ceil(eligibility.estimated_hours / 24)} days`}
                  </p>
                )}
                <p className="text-xs text-stone-400 mt-1">Secure payment via Razorpay</p>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setStep('cart')}
                  className="flex-1 py-3 border-2 border-stone-200 rounded-full font-semibold text-stone-600 hover:bg-stone-50 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handlePlaceOrder}
                  disabled={loading || !form.name || !form.phone || !form.address || (selectedAddress && !isServiceable)}
                  className="flex-1 btn-primary py-3 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Placing...
                    </>
                  ) : (
                    'Place Order'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
