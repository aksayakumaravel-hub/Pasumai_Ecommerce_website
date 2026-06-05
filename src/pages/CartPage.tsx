import { useState } from 'react';
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft, Leaf } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import UpiQrCode from '../components/UpiQrCode';

type CartPageProps = {
  onNavigate: (page: string) => void;
};

type CheckoutStep = 'cart' | 'details' | 'payment' | 'success';

export default function CartPage({ onNavigate }: CartPageProps) {
  const { items, removeItem, updateQuantity, clearCart, total } = useCart();
  const { user } = useAuth();
  const [step, setStep] = useState<CheckoutStep>('cart');
  const [loading, setLoading] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [form, setForm] = useState({
    name: '',
    phone: '',
    address: '',
    notes: '',
  });

  const deliveryFee = total < 500 ? 50 : 0;
  const grandTotal = total + deliveryFee;

  const handlePlaceOrder = async () => {
    if (!user) {
      onNavigate('login');
      return;
    }
    setLoading(true);
    try {
      const { data: order, error } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          total_amount: grandTotal,
          payment_method: 'upi',
          payment_status: 'pending',
          delivery_name: form.name,
          delivery_phone: form.phone,
          delivery_address: form.address,
          notes: form.notes,
          estimated_delivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
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

      // Reduce stock for each product atomically
      await Promise.all(
        items.map(item =>
          supabase.rpc('reduce_product_stock', {
            p_product_id: item.product.id,
            p_quantity: item.quantity,
          })
        )
      );

      await supabase.from('notifications').insert({
        user_id: user.id,
        title: 'Order Placed Successfully!',
        message: `Your order #${order.id.slice(0, 8)} has been placed. Total: ₹${grandTotal}. Please complete UPI payment to confirm dispatch.`,
        type: 'success',
        reference_id: order.id,
        reference_type: 'order',
      });

      setOrderId(order.id.slice(0, 8).toUpperCase());
      setStep('payment');
    } catch (err) {
      console.error(err);
      alert('Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentDone = async () => {
    clearCart();
    setStep('success');
  };

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-stone-50 pt-20 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center bg-white rounded-3xl p-10 shadow-xl">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-3xl font-black text-green-900 font-heading mb-3">Order Confirmed!</h2>
          <p className="text-stone-600 mb-2">Order ID: <strong className="text-green-700">#{orderId}</strong></p>
          <p className="text-stone-500 text-sm mb-8">
            Your order has been placed. We'll confirm payment and dispatch your fresh organic products within 24 hours.
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
        <div className="max-w-md mx-auto py-12">
          <div className="bg-white rounded-3xl overflow-hidden shadow-xl">
            <div className="bg-green-700 p-6 text-white text-center">
              <h2 className="text-2xl font-black font-heading">Complete Payment</h2>
              <p className="text-green-200 text-sm mt-1">Order #{orderId}</p>
            </div>
            <div className="p-8">
              <div className="flex justify-center mb-6">
                <UpiQrCode className="w-48 h-48" amount={grandTotal} orderId={orderId} />
              </div>

              <button
                onClick={handlePaymentDone}
                className="btn-primary w-full py-3 text-base"
              >
                I've Completed the Payment
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-stone-50 pt-20 flex items-center justify-center px-4">
        <div className="text-center">
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
                    {item.product.is_organic && (
                      <span className="organic-badge text-xs mt-1 inline-block">Organic</span>
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
                      className="w-8 h-8 rounded-full border border-stone-200 flex items-center justify-center hover:bg-stone-100 transition-colors"
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
                    <span className={deliveryFee === 0 ? 'text-green-600 font-semibold' : 'font-semibold'}>
                      {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
                    </span>
                  </div>
                  {deliveryFee > 0 && (
                    <p className="text-xs text-stone-400">Free delivery on orders above ₹500</p>
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
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
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
                  <span className="text-stone-600">Order Total</span>
                  <span className="font-black text-green-700 text-lg">₹{grandTotal}</span>
                </div>
                <p className="text-xs text-stone-400">Payment via UPI after placing order</p>
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
                  disabled={loading || !form.name || !form.phone || !form.address}
                  className="flex-1 btn-primary py-3 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? 'Placing Order...' : 'Place Order'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
