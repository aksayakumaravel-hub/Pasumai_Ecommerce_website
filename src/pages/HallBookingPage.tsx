import { useState } from 'react';
import { Calendar, Users, Check, Wind, Trees, Star, ArrowRight, Clock, MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import UpiQrCode from '../components/UpiQrCode';

type HallBookingPageProps = {
  onNavigate: (page: string) => void;
};

const halls = [
  {
    id: 'party_hall',
    name: 'Open Garden Party Hall',
    tagline: 'Celebrate Under the Sky',
    desc: 'A sprawling open-air garden hall perfect for weddings, birthday celebrations, family gatherings, and festive events. Surrounded by lush greenery with a natural ambience you can\'t find elsewhere.',
    pricePerDay: 15000,
    maxGuests: 200,
    img: 'https://images.pexels.com/photos/1543762/pexels-photo-1543762.jpeg',
    imgs: [
      'https://images.pexels.com/photos/1543762/pexels-photo-1543762.jpeg',
      'https://images.pexels.com/photos/289347/pexels-photo-289347.jpeg',
      'https://images.pexels.com/photos/974314/pexels-photo-974314.jpeg',
    ],
    icon: Trees,
    color: 'from-green-600 to-emerald-700',
    amenities: ['Open Air Garden', '200 Person Capacity', 'Festoon Lighting', 'Parking Available', 'Catering Space', 'Stage Area', 'Sound System Ready', 'Farm Backdrop'],
    events: ['Weddings', 'Birthday Parties', 'Family Functions', 'Anniversaries', 'Festivals', 'Photo Shoots'],
    rating: 4.9,
    reviews: 56,
  },
  {
    id: 'conference_hall',
    name: 'AC Conference Hall',
    tagline: 'Professional Meets Peaceful',
    desc: 'A fully air-conditioned conference hall equipped for corporate meetings, seminars, training sessions, and workshops. Combines professional amenities with the calming atmosphere of our organic farm.',
    pricePerDay: 8000,
    maxGuests: 80,
    img: 'https://images.pexels.com/photos/2608517/pexels-photo-2608517.jpeg',
    imgs: [
      'https://images.pexels.com/photos/2608517/pexels-photo-2608517.jpeg',
      'https://images.pexels.com/photos/1181396/pexels-photo-1181396.jpeg',
      'https://images.pexels.com/photos/260931/pexels-photo-260931.jpeg',
    ],
    icon: Wind,
    color: 'from-blue-600 to-indigo-700',
    amenities: ['Full AC', '80 Person Capacity', 'Projector & Screen', 'WiFi Included', 'Whiteboard', 'PA System', 'Organic Refreshments', 'Parking'],
    events: ['Corporate Meetings', 'Training Sessions', 'Seminars', 'Workshops', 'Team Building', 'Product Launches'],
    rating: 4.8,
    reviews: 34,
  },
];

type BookingStep = 'select' | 'form' | 'payment' | 'success';

export default function HallBookingPage({ onNavigate }: HallBookingPageProps) {
  const { user } = useAuth();
  const [selected, setSelected] = useState<typeof halls[0] | null>(null);
  const [step, setStep] = useState<BookingStep>('select');
  const [activeImg, setActiveImg] = useState(0);
  const [loading, setLoading] = useState(false);
  const [bookingId, setBookingId] = useState('');
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    eventDate: '',
    endDate: '',
    eventType: '',
    guestCount: 50,
    requests: '',
  });

  const days = form.eventDate && form.endDate
    ? Math.max(1, Math.ceil((new Date(form.endDate).getTime() - new Date(form.eventDate).getTime()) / 86400000) + 1)
    : 1;
  const totalAmount = selected ? selected.pricePerDay * days : 0;

  const handleBook = (hall: typeof halls[0]) => {
    if (!user) { onNavigate('login'); return; }
    setSelected(hall);
    setActiveImg(0);
    setStep('form');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async () => {
    if (!user || !selected) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('hall_bookings')
        .insert({
          user_id: user.id,
          guest_name: form.name,
          guest_phone: form.phone,
          guest_email: form.email,
          hall_type: selected.id,
          event_date: form.eventDate,
          end_date: form.endDate || form.eventDate,
          event_type: form.eventType,
          guest_count: form.guestCount,
          total_amount: totalAmount,
          payment_status: 'pending',
          special_requests: form.requests,
        })
        .select()
        .single();

      if (error) throw error;

      await supabase.from('notifications').insert({
        user_id: user.id,
        title: `${selected.name} Booking Received!`,
        message: `Your booking for ${selected.name} on ${form.eventDate} is pending confirmation. Total: ₹${totalAmount.toLocaleString()}. Please complete payment.`,
        type: 'success',
        reference_id: data.id,
        reference_type: 'hall_booking',
      });

      setBookingId(data.id.slice(0, 8).toUpperCase());
      setStep('payment');
    } catch (err) {
      console.error(err);
      alert('Booking failed. Please try again or call 9952814029.');
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
            We'll confirm your booking within 2 hours. Our team will call you at <strong>{form.phone}</strong>.
          </p>
          <button onClick={() => onNavigate('dashboard')} className="btn-primary w-full py-3 mb-3">
            View My Bookings
          </button>
          <button
            onClick={() => { setStep('select'); setSelected(null); }}
            className="w-full py-3 border-2 border-stone-200 rounded-full text-stone-600 font-semibold hover:bg-stone-50 transition-colors"
          >
            Back to Halls
          </button>
        </div>
      </div>
    );
  }

  if (step === 'payment' && selected) {
    return (
      <div className="min-h-screen bg-stone-50 pt-20 px-4">
        <div className="max-w-lg mx-auto py-12">
          <div className="bg-white rounded-3xl overflow-hidden shadow-xl">
            <div className={`bg-gradient-to-r ${selected.color} p-6 text-white text-center`}>
              <h2 className="text-2xl font-black font-heading">Complete Payment</h2>
              <p className="text-white/80 text-sm mt-1">{selected.name} • {days} day{days > 1 ? 's' : ''}</p>
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

  if (step === 'form' && selected) {
    const HallIcon = selected.icon;
    return (
      <div className="min-h-screen bg-stone-50 pt-24 px-4">
        <div className="max-w-5xl mx-auto py-8">
          <button onClick={() => setStep('select')} className="flex items-center gap-2 text-stone-500 hover:text-green-700 mb-6 transition-colors text-sm">
            ← Back to Halls
          </button>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Hall Preview */}
            <div>
              <div className="rounded-3xl overflow-hidden shadow-xl mb-3">
                <img src={selected.imgs[activeImg]} alt={selected.name} className="w-full h-72 object-cover" />
              </div>
              <div className="flex gap-2 mb-5">
                {selected.imgs.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(i)}
                    className={`rounded-xl overflow-hidden border-2 transition-colors ${activeImg === i ? 'border-green-500' : 'border-transparent'}`}
                  >
                    <img src={img} alt="" className="w-20 h-14 object-cover" />
                  </button>
                ))}
              </div>
              <div className="bg-white rounded-2xl p-5 border border-stone-100 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${selected.color} flex items-center justify-center`}>
                    <HallIcon size={18} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-black text-green-900 font-heading">{selected.name}</h3>
                    <div className="flex items-center gap-1 text-xs text-stone-500">
                      <Star size={10} className="text-yellow-400 fill-yellow-400" />
                      {selected.rating} ({selected.reviews} reviews)
                    </div>
                  </div>
                </div>
                <p className="text-stone-600 text-sm mb-3">{selected.desc}</p>
                <div className="flex flex-wrap gap-1.5">
                  {selected.amenities.map(a => (
                    <span key={a} className="flex items-center gap-1 text-xs bg-green-50 text-green-700 px-2.5 py-1 rounded-full">
                      <Check size={10} />{a}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Booking Form */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-stone-100">
              <h3 className="font-bold text-xl text-stone-800 mb-6">Book {selected.name}</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-stone-700 mb-2">Event Date *</label>
                    <input
                      type="date"
                      value={form.eventDate}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={e => setForm(f => ({ ...f, eventDate: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-stone-700 mb-2">End Date</label>
                    <input
                      type="date"
                      value={form.endDate}
                      min={form.eventDate || new Date().toISOString().split('T')[0]}
                      onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-2">Event Type</label>
                  <select
                    value={form.eventType}
                    onChange={e => setForm(f => ({ ...f, eventType: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm bg-white"
                  >
                    <option value="">Select event type</option>
                    {selected.events.map(ev => <option key={ev} value={ev}>{ev}</option>)}
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-2">
                    Expected Guests (max {selected.maxGuests})
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setForm(f => ({ ...f, guestCount: Math.max(10, f.guestCount - 10) }))}
                      className="w-10 h-10 rounded-full border border-stone-200 flex items-center justify-center hover:bg-stone-100 transition-colors font-bold"
                    >
                      -
                    </button>
                    <span className="font-bold text-lg w-12 text-center">{form.guestCount}</span>
                    <button
                      onClick={() => setForm(f => ({ ...f, guestCount: Math.min(selected.maxGuests, f.guestCount + 10) }))}
                      className="w-10 h-10 rounded-full border border-stone-200 flex items-center justify-center hover:bg-stone-100 transition-colors font-bold"
                    >
                      +
                    </button>
                    <span className="text-sm text-stone-500">persons</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-2">Your Name *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Full name"
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-2">Phone *</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="Mobile number"
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="your@email.com"
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-2">Special Requests</label>
                  <textarea
                    value={form.requests}
                    onChange={e => setForm(f => ({ ...f, requests: e.target.value }))}
                    placeholder="Decoration, catering preferences, AV needs..."
                    rows={2}
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm resize-none"
                  />
                </div>
              </div>

              {form.eventDate && (
                <div className="mt-5 bg-green-50 rounded-xl p-4 border border-green-200">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-stone-600">
                      ₹{selected.pricePerDay.toLocaleString()} × {days} day{days > 1 ? 's' : ''}
                    </span>
                    <span className="font-black text-green-800 text-lg">₹{totalAmount.toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-stone-500">Payment via UPI after booking</p>
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={loading || !form.name || !form.phone || !form.eventDate}
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
      <div className="relative bg-green-900 py-20 overflow-hidden">
        <img
          src="https://images.pexels.com/photos/1543762/pexels-photo-1543762.jpeg"
          alt="Hall Booking"
          className="absolute inset-0 w-full h-full object-cover opacity-30"
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-black text-white font-heading mb-4">
            Event Venues
          </h1>
          <p className="text-green-200 text-lg max-w-2xl mx-auto">
            Host your dream events at Pasumai — from open-air garden celebrations to professional corporate meets.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Quick info strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
          {[
            { icon: Users, label: 'Up to 200 Guests', sub: 'Party hall capacity' },
            { icon: Wind, label: 'Fully AC', sub: 'Conference hall' },
            { icon: MapPin, label: 'Kalladipatti', sub: 'Dindigul, TN' },
            { icon: Clock, label: 'Flexible Hours', sub: 'Full day bookings' },
          ].map(i => (
            <div key={i.label} className="bg-white rounded-2xl p-5 text-center shadow-sm border border-stone-100">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                <i.icon size={20} className="text-green-700" />
              </div>
              <p className="font-bold text-stone-800 text-sm">{i.label}</p>
              <p className="text-stone-400 text-xs mt-0.5">{i.sub}</p>
            </div>
          ))}
        </div>

        {/* Hall cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {halls.map(hall => {
            const HallIcon = hall.icon;
            return (
              <div key={hall.id} className="group bg-white rounded-3xl overflow-hidden shadow-sm border border-stone-100 card-hover">
                <div className="relative overflow-hidden h-72">
                  <img
                    src={hall.img}
                    alt={hall.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className={`absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent`} />
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1">
                    <Star size={12} className="text-yellow-400 fill-yellow-400" />
                    <span className="text-xs font-bold">{hall.rating}</span>
                    <span className="text-xs text-stone-500">({hall.reviews})</span>
                  </div>
                  <div className="absolute bottom-5 left-5">
                    <div className={`inline-flex items-center gap-2 bg-gradient-to-r ${hall.color} text-white px-4 py-2 rounded-full text-sm font-bold mb-2`}>
                      <HallIcon size={14} />
                      {hall.tagline}
                    </div>
                    <h3 className="text-white font-black text-2xl font-heading">{hall.name}</h3>
                  </div>
                </div>

                <div className="p-6">
                  <p className="text-stone-600 text-sm leading-relaxed mb-5">{hall.desc}</p>

                  <div className="flex flex-wrap gap-1.5 mb-5">
                    {hall.amenities.slice(0, 5).map(a => (
                      <span key={a} className="text-xs bg-stone-100 text-stone-600 px-2.5 py-1 rounded-full">{a}</span>
                    ))}
                    {hall.amenities.length > 5 && (
                      <span className="text-xs bg-stone-100 text-stone-600 px-2.5 py-1 rounded-full">+{hall.amenities.length - 5} more</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <span className="text-3xl font-black text-green-700">₹{hall.pricePerDay.toLocaleString()}</span>
                      <span className="text-stone-400 text-sm ml-1">/day</span>
                    </div>
                    <span className="text-stone-500 text-sm flex items-center gap-1">
                      <Users size={14} />
                      Up to {hall.maxGuests} guests
                    </span>
                  </div>

                  <div className="mb-5">
                    <p className="text-xs text-stone-500 font-medium mb-2">PERFECT FOR</p>
                    <div className="flex flex-wrap gap-1.5">
                      {hall.events.map(ev => (
                        <span key={ev} className="text-xs bg-green-50 text-green-700 px-2.5 py-1 rounded-full font-medium">{ev}</span>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => handleBook(hall)}
                    className="btn-primary w-full flex items-center justify-center gap-2"
                  >
                    <Calendar size={16} />
                    Book This Venue
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Combo offer */}
        <div className="mt-16 bg-gradient-to-r from-green-800 to-emerald-900 rounded-3xl p-10 text-white text-center">
          <h3 className="text-3xl font-black font-heading mb-3">Bundle & Save!</h3>
          <p className="text-green-200 text-lg mb-6 max-w-xl mx-auto">
            Book both the Party Hall and Conference Hall together for a complete event experience. Contact us for special bundle pricing.
          </p>
          <a
            href="https://wa.me/919952814029?text=Hi, I'm interested in booking both the Party Hall and Conference Hall at Pasumai Farm."
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-white text-green-800 font-bold px-8 py-3 rounded-full hover:bg-green-50 transition-colors"
          >
            WhatsApp Us for Bundle Deal
          </a>
        </div>
      </div>
    </div>
  );
}
