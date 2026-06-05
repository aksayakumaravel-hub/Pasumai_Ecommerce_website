import { useState } from 'react';
import { Calendar, Users, Star, Waves, Trees, Wind, Check, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import UpiQrCode from '../components/UpiQrCode';

type CottagesPageProps = {
  onNavigate: (page: string) => void;
};

const cottages = [
  {
    id: 'standard',
    name: 'Garden View Cottage',
    desc: 'A cozy cottage with lush garden views, perfect for couples and solo travelers seeking peace.',
    price: 2999,
    maxGuests: 2,
    img: 'https://images.pexels.com/photos/1115804/pexels-photo-1115804.jpeg',
    imgs: [
      'https://images.pexels.com/photos/1115804/pexels-photo-1115804.jpeg',
      'https://images.pexels.com/photos/261102/pexels-photo-261102.jpeg',
      'https://images.pexels.com/photos/1543762/pexels-photo-1543762.jpeg',
    ],
    amenities: ['Queen Bed', 'AC', 'Hot Water', 'Garden View', 'Pool Access', 'Farm Breakfast'],
    rating: 4.9,
    reviews: 87,
  },
  {
    id: 'family',
    name: 'Family Farm Cottage',
    desc: 'Spacious family cottage with extra beds, ideal for families and small groups wanting a complete farm experience.',
    price: 4999,
    maxGuests: 6,
    img: 'https://images.pexels.com/photos/2351649/pexels-photo-2351649.jpeg',
    imgs: [
      'https://images.pexels.com/photos/2351649/pexels-photo-2351649.jpeg',
      'https://images.pexels.com/photos/261102/pexels-photo-261102.jpeg',
      'https://images.pexels.com/photos/1227513/pexels-photo-1227513.jpeg',
    ],
    amenities: ['2 Bedrooms', 'AC', 'Hot Water', 'Farm View', 'Pool Access', 'Campfire', 'Organic Breakfast'],
    rating: 4.8,
    reviews: 124,
  },
  {
    id: 'luxury',
    name: 'Luxury Eco Suite',
    desc: 'Our premium suite with panoramic farm views, private garden, and exclusive amenities for a truly luxurious stay.',
    price: 7999,
    maxGuests: 4,
    img: 'https://images.pexels.com/photos/1179156/pexels-photo-1179156.jpeg',
    imgs: [
      'https://images.pexels.com/photos/1179156/pexels-photo-1179156.jpeg',
      'https://images.pexels.com/photos/261102/pexels-photo-261102.jpeg',
      'https://images.pexels.com/photos/289347/pexels-photo-289347.jpeg',
    ],
    amenities: ['King Bed', 'AC', 'Jacuzzi', 'Private Garden', 'Pool Access', 'Campfire', 'Chef Breakfast', 'Farm Tour'],
    rating: 5.0,
    reviews: 43,
  },
];

const facilities = [
  { icon: Waves, title: 'Swimming Pool', desc: 'Pristine pool surrounded by nature, open 6am–9pm' },
  { icon: Trees, title: 'Open Garden Hall', desc: 'Beautiful garden party hall for events up to 200 guests' },
  { icon: Wind, title: 'AC Conference Hall', desc: 'Professional conference room for meetings & seminars' },
];

type BookingStep = 'select' | 'form' | 'payment' | 'success';

export default function CottagesPage({ onNavigate }: CottagesPageProps) {
  const { user } = useAuth();
  const [selectedCottage, setSelectedCottage] = useState<typeof cottages[0] | null>(null);
  const [step, setStep] = useState<BookingStep>('select');
  const [selectedImg, setSelectedImg] = useState(0);
  const [loading, setLoading] = useState(false);
  const [bookingId, setBookingId] = useState('');
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    checkIn: '',
    checkOut: '',
    guests: 1,
    requests: '',
  });

  const nights = form.checkIn && form.checkOut
    ? Math.max(1, Math.ceil((new Date(form.checkOut).getTime() - new Date(form.checkIn).getTime()) / (1000 * 60 * 60 * 24)))
    : 1;
  const totalAmount = selectedCottage ? selectedCottage.price * nights : 0;

  const handleBook = (cottage: typeof cottages[0]) => {
    if (!user) {
      onNavigate('login');
      return;
    }
    setSelectedCottage(cottage);
    setSelectedImg(0);
    setStep('form');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async () => {
    if (!user || !selectedCottage) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('cottage_bookings')
        .insert({
          user_id: user.id,
          guest_name: form.name,
          guest_phone: form.phone,
          guest_email: form.email,
          cottage_type: selectedCottage.name,
          check_in: form.checkIn,
          check_out: form.checkOut,
          guests_count: form.guests,
          total_amount: totalAmount,
          payment_status: 'pending',
          special_requests: form.requests,
        })
        .select()
        .single();

      if (error) throw error;

      await supabase.from('notifications').insert({
        user_id: user.id,
        title: 'Cottage Booking Received!',
        message: `Your booking for ${selectedCottage.name} (${form.checkIn} to ${form.checkOut}) is pending confirmation. Please complete payment.`,
        type: 'success',
        reference_id: data.id,
        reference_type: 'cottage_booking',
      });

      setBookingId(data.id.slice(0, 8).toUpperCase());
      setStep('payment');
    } catch (err) {
      console.error(err);
      alert('Booking failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-stone-50 pt-20 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center bg-white rounded-3xl p-10 shadow-xl">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check size={36} className="text-green-600" />
          </div>
          <h2 className="text-3xl font-black text-green-900 font-heading mb-3">Booking Confirmed!</h2>
          <p className="text-stone-600 mb-2">Booking ID: <strong className="text-green-700">#{bookingId}</strong></p>
          <p className="text-stone-500 text-sm mb-8">
            We'll confirm your booking within 2 hours. Our team will contact you at {form.phone}.
          </p>
          <button onClick={() => onNavigate('dashboard')} className="btn-primary w-full py-3 mb-3">
            View My Bookings
          </button>
          <button onClick={() => { setStep('select'); setSelectedCottage(null); }} className="w-full py-3 border-2 border-stone-200 rounded-full text-stone-600 font-semibold hover:bg-stone-50 transition-colors">
            Back to Cottages
          </button>
        </div>
      </div>
    );
  }

  if (step === 'payment' && selectedCottage) {
    return (
      <div className="min-h-screen bg-stone-50 pt-20 px-4">
        <div className="max-w-lg mx-auto py-12">
          <div className="bg-white rounded-3xl overflow-hidden shadow-xl">
            <div className="bg-green-700 p-6 text-white text-center">
              <h2 className="text-2xl font-black font-heading">Complete Payment</h2>
              <p className="text-green-200 text-sm mt-1">{selectedCottage.name} • {nights} night{nights > 1 ? 's' : ''}</p>
            </div>
            <div className="p-8 flex flex-col items-center">
              <UpiQrCode className="w-48 h-48" amount={totalAmount} orderId={bookingId} />
              <button onClick={() => setStep('success')} className="btn-primary w-full py-3 text-base mt-6">
                I've Completed the Payment
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'form' && selectedCottage) {
    return (
      <div className="min-h-screen bg-stone-50 pt-24 px-4">
        <div className="max-w-5xl mx-auto py-8">
          <button onClick={() => setStep('select')} className="flex items-center gap-2 text-stone-500 hover:text-green-700 mb-6 transition-colors text-sm">
            ← Back to Cottages
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Cottage Preview */}
            <div>
              <div className="rounded-3xl overflow-hidden shadow-xl mb-4">
                <img
                  src={selectedCottage.imgs[selectedImg]}
                  alt={selectedCottage.name}
                  className="w-full h-72 object-cover"
                />
              </div>
              <div className="flex gap-3">
                {selectedCottage.imgs.map((img, i) => (
                  <button key={i} onClick={() => setSelectedImg(i)} className={`rounded-xl overflow-hidden border-2 transition-colors ${selectedImg === i ? 'border-green-500' : 'border-transparent'}`}>
                    <img src={img} alt="" className="w-20 h-16 object-cover" />
                  </button>
                ))}
              </div>
              <div className="mt-6 bg-white rounded-2xl p-5 border border-stone-100">
                <h3 className="font-black text-green-900 text-xl font-heading mb-1">{selectedCottage.name}</h3>
                <div className="flex items-center gap-1 mb-3">
                  <Star size={14} className="text-yellow-400 fill-yellow-400" />
                  <span className="font-semibold text-sm">{selectedCottage.rating}</span>
                  <span className="text-stone-400 text-sm">({selectedCottage.reviews} reviews)</span>
                </div>
                <p className="text-stone-600 text-sm mb-4">{selectedCottage.desc}</p>
                <div className="flex flex-wrap gap-2">
                  {selectedCottage.amenities.map(a => (
                    <span key={a} className="flex items-center gap-1 text-xs bg-green-50 text-green-700 px-2.5 py-1 rounded-full">
                      <Check size={10} />
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Booking Form */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-stone-100">
              <h3 className="font-bold text-xl text-stone-800 mb-6">Book Your Stay</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-stone-700 mb-2">Check-in *</label>
                    <input
                      type="date"
                      value={form.checkIn}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={e => setForm(f => ({ ...f, checkIn: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-stone-700 mb-2">Check-out *</label>
                    <input
                      type="date"
                      value={form.checkOut}
                      min={form.checkIn || new Date().toISOString().split('T')[0]}
                      onChange={e => setForm(f => ({ ...f, checkOut: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-2">Guests (max {selectedCottage.maxGuests})</label>
                  <div className="flex items-center border border-stone-200 rounded-xl overflow-hidden w-fit">
                    <button onClick={() => setForm(f => ({ ...f, guests: Math.max(1, f.guests - 1) }))} className="px-4 py-3 hover:bg-stone-100 transition-colors">-</button>
                    <span className="px-6 py-3 font-bold">{form.guests}</span>
                    <button onClick={() => setForm(f => ({ ...f, guests: Math.min(selectedCottage.maxGuests, f.guests + 1) }))} className="px-4 py-3 hover:bg-stone-100 transition-colors">+</button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-2">Your Name *</label>
                  <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Full name" className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-2">Phone *</label>
                  <input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="Mobile number" className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-2">Email</label>
                  <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="your@email.com" className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-2">Special Requests</label>
                  <textarea value={form.requests} onChange={e => setForm(f => ({ ...f, requests: e.target.value }))} placeholder="Dietary needs, room preferences, etc." rows={2} className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm resize-none" />
                </div>
              </div>

              {form.checkIn && form.checkOut && (
                <div className="mt-5 bg-green-50 rounded-xl p-4 border border-green-200">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-stone-600">₹{selectedCottage.price} × {nights} nights</span>
                    <span className="font-bold text-green-800">₹{totalAmount.toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-stone-500">Payment via UPI after booking</p>
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={loading || !form.name || !form.phone || !form.checkIn || !form.checkOut}
                className="btn-primary w-full py-3 text-base mt-5 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? 'Booking...' : `Book for ₹${totalAmount.toLocaleString()}`}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 pt-20">
      {/* Hero */}
      <div className="relative bg-green-900 py-20">
        <img src="https://images.pexels.com/photos/1115804/pexels-photo-1115804.jpeg" alt="Cottages" className="absolute inset-0 w-full h-full object-cover opacity-30" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-black text-white font-heading mb-4">Luxury Eco Cottages</h1>
          <p className="text-green-200 text-lg max-w-2xl mx-auto">Sleep under the stars, wake to birdsong, and start your day with fresh organic breakfast.</p>
        </div>
      </div>

      {/* Cottages Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-20">
          {cottages.map(cottage => (
            <div key={cottage.id} className="group bg-white rounded-3xl overflow-hidden shadow-sm border border-stone-100 card-hover">
              <div className="relative overflow-hidden">
                <img src={cottage.img} alt={cottage.name} className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute top-4 left-4">
                  <span className="bg-green-600 text-white text-xs font-bold px-3 py-1.5 rounded-full">From ₹{cottage.price.toLocaleString()}/night</span>
                </div>
                <div className="absolute top-4 right-4 flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-full px-2.5 py-1">
                  <Star size={12} className="text-yellow-400 fill-yellow-400" />
                  <span className="text-xs font-bold">{cottage.rating}</span>
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-2 text-stone-400 text-sm mb-2">
                  <Users size={14} />
                  Up to {cottage.maxGuests} guests
                </div>
                <h3 className="font-black text-green-900 text-xl font-heading mb-2">{cottage.name}</h3>
                <p className="text-stone-600 text-sm mb-4 leading-relaxed">{cottage.desc}</p>
                <div className="flex flex-wrap gap-1.5 mb-5">
                  {cottage.amenities.slice(0, 4).map(a => (
                    <span key={a} className="text-xs bg-stone-100 text-stone-600 px-2.5 py-1 rounded-full">{a}</span>
                  ))}
                  {cottage.amenities.length > 4 && (
                    <span className="text-xs bg-stone-100 text-stone-600 px-2.5 py-1 rounded-full">+{cottage.amenities.length - 4} more</span>
                  )}
                </div>
                <button
                  onClick={() => handleBook(cottage)}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  <Calendar size={16} />
                  Book This Cottage
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Facilities */}
        <div className="text-center mb-12">
          <h2 className="section-heading">Farm Facilities</h2>
          <p className="section-subheading">Everything you need for an unforgettable stay.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {facilities.map(f => (
            <div key={f.title} className="bg-white rounded-3xl p-8 text-center shadow-sm border border-stone-100 card-hover">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <f.icon size={28} className="text-green-700" />
              </div>
              <h3 className="font-bold text-green-900 text-lg mb-2 font-heading">{f.title}</h3>
              <p className="text-stone-600 text-sm">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Pool section */}
        <div className="mt-16 rounded-3xl overflow-hidden relative h-80">
          <img src="https://images.pexels.com/photos/261102/pexels-photo-261102.jpeg" alt="Swimming Pool" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-green-950/80 via-green-900/50 to-transparent flex items-center">
            <div className="p-10">
              <h3 className="text-3xl font-black text-white font-heading mb-3">Swimming Pool</h3>
              <p className="text-green-200 text-sm max-w-xs">Dive into our pristine pool surrounded by lush green trees. Open 6 AM to 9 PM for all cottage guests.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
