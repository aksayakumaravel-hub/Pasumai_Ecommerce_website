import { useState } from 'react';
import { Calendar, Users, Clock, Check, Leaf, TreePine, Egg, Camera } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import UpiQrCode from '../components/UpiQrCode';

type FarmVisitsPageProps = {
  onNavigate: (page: string) => void;
};

const visitPackages = [
  {
    id: 'basic',
    name: 'Farm Discovery Walk',
    desc: 'A 2-hour guided walk through our organic farm. Perfect for first-time visitors and curious minds.',
    price: 299,
    duration: '2 hours',
    includes: ['Guided farm tour', 'Organic fruit tasting', 'Meet farm animals', 'Q&A with farmer'],
    img: 'https://images.pexels.com/photos/974314/pexels-photo-974314.jpeg',
    color: 'from-green-400 to-green-600',
  },
  {
    id: 'family',
    name: 'Family Farm Adventure',
    desc: 'A fun-filled half-day experience for the whole family. Kids especially love the animal care and harvest activities.',
    price: 599,
    duration: '4 hours',
    includes: ['Farm tour', 'Animal feeding', 'Egg collection', 'Organic lunch', 'Kids farming activity', 'Fruit picking'],
    img: 'https://images.pexels.com/photos/735968/pexels-photo-735968.jpeg',
    color: 'from-amber-400 to-amber-600',
    popular: true,
  },
  {
    id: 'school',
    name: 'School & Group Visit',
    desc: 'Educational farm visit for schools, colleges, and groups. Custom curriculum available.',
    price: 199,
    duration: '3 hours',
    includes: ['Educational tour', 'Farming demonstration', 'Organic farming talk', 'Certificate of participation'],
    img: 'https://images.pexels.com/photos/1458694/pexels-photo-1458694.jpeg',
    color: 'from-blue-400 to-blue-600',
    note: 'Per person (min 15)',
  },
  {
    id: 'workshop',
    name: 'Organic Farming Workshop',
    desc: 'Hands-on full-day workshop on organic farming techniques, composting, and sustainable agriculture.',
    price: 1499,
    duration: 'Full day',
    includes: ['Practical farming session', 'Composting workshop', 'Seed saving', 'Organic lunch & snacks', 'Workshop kit', 'Certificate'],
    img: 'https://images.pexels.com/photos/1227513/pexels-photo-1227513.jpeg',
    color: 'from-emerald-400 to-emerald-600',
  },
];

const timeSlots = ['8:00 AM', '10:00 AM', '12:00 PM', '2:00 PM', '4:00 PM'];

const activities = [
  { icon: Leaf, title: 'Organic Farming', desc: 'Learn sustainable farming from experts' },
  { icon: Egg, title: 'Egg Collection', desc: 'Collect fresh eggs from our happy hens' },
  { icon: TreePine, title: 'Fruit Picking', desc: 'Harvest fresh guavas and seasonal fruits' },
  { icon: Camera, title: 'Drone Views', desc: 'Aerial photography of the beautiful farm' },
];

type BookingStep = 'select' | 'form' | 'payment' | 'success';

export default function FarmVisitsPage({ onNavigate }: FarmVisitsPageProps) {
  const { user } = useAuth();
  const [selected, setSelected] = useState<typeof visitPackages[0] | null>(null);
  const [step, setStep] = useState<BookingStep>('select');
  const [loading, setLoading] = useState(false);
  const [bookingId, setBookingId] = useState('');
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    visitDate: '',
    timeSlot: '',
    groupSize: 1,
    notes: '',
  });

  const totalAmount = selected ? selected.price * form.groupSize : 0;

  const handleSelect = (pkg: typeof visitPackages[0]) => {
    if (!user) {
      onNavigate('login');
      return;
    }
    setSelected(pkg);
    setStep('form');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async () => {
    if (!user || !selected) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('farm_visits')
        .insert({
          user_id: user.id,
          visitor_name: form.name,
          visitor_phone: form.phone,
          visitor_email: form.email,
          visit_type: selected.name,
          visit_date: form.visitDate,
          time_slot: form.timeSlot,
          group_size: form.groupSize,
          total_amount: totalAmount,
          payment_status: 'pending',
          notes: form.notes,
        })
        .select()
        .single();

      if (error) throw error;

      await supabase.from('notifications').insert({
        user_id: user.id,
        title: 'Farm Visit Booked!',
        message: `Your ${selected.name} on ${form.visitDate} at ${form.timeSlot} is confirmed. Please complete payment.`,
        type: 'success',
        reference_id: data.id,
        reference_type: 'farm_visit',
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
          <h2 className="text-3xl font-black text-green-900 font-heading mb-3">Visit Booked!</h2>
          <p className="text-stone-600 mb-2">Booking ID: <strong className="text-green-700">#{bookingId}</strong></p>
          <p className="text-stone-500 text-sm mb-8">See you at the farm! Our team will contact you the day before to confirm.</p>
          <button onClick={() => onNavigate('dashboard')} className="btn-primary w-full py-3 mb-3">View My Bookings</button>
          <button onClick={() => { setStep('select'); setSelected(null); }} className="w-full py-3 border-2 border-stone-200 rounded-full text-stone-600 font-semibold hover:bg-stone-50 transition-colors">Back to Packages</button>
        </div>
      </div>
    );
  }

  if (step === 'payment' && selected) {
    return (
      <div className="min-h-screen bg-stone-50 pt-20 px-4">
        <div className="max-w-lg mx-auto py-12">
          <div className="bg-white rounded-3xl overflow-hidden shadow-xl">
            <div className="bg-green-700 p-6 text-white text-center">
              <h2 className="text-2xl font-black font-heading">Complete Payment</h2>
              <p className="text-green-200 text-sm mt-1">{selected.name} • {form.groupSize} persons</p>
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
    return (
      <div className="min-h-screen bg-stone-50 pt-24 px-4">
        <div className="max-w-xl mx-auto py-8">
          <button onClick={() => setStep('select')} className="flex items-center gap-2 text-stone-500 hover:text-green-700 mb-6 transition-colors text-sm">
            ← Back to Packages
          </button>
          <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-stone-100">
            <div className={`h-48 bg-gradient-to-br ${selected.color} relative`}>
              <img src={selected.img} alt={selected.name} className="w-full h-full object-cover mix-blend-overlay opacity-50" />
              <div className="absolute inset-0 flex items-end p-6">
                <div>
                  <h3 className="text-white font-black text-2xl font-heading">{selected.name}</h3>
                  <p className="text-white/80 text-sm">{selected.duration} • ₹{selected.price}/person</p>
                </div>
              </div>
            </div>
            <div className="p-8">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-stone-700 mb-2">Visit Date *</label>
                    <input type="date" value={form.visitDate} min={new Date().toISOString().split('T')[0]} onChange={e => setForm(f => ({ ...f, visitDate: e.target.value }))} className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-stone-700 mb-2">Time Slot *</label>
                    <select value={form.timeSlot} onChange={e => setForm(f => ({ ...f, timeSlot: e.target.value }))} className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm bg-white">
                      <option value="">Select time</option>
                      {timeSlots.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-2">Group Size</label>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setForm(f => ({ ...f, groupSize: Math.max(1, f.groupSize - 1) }))} className="w-10 h-10 rounded-full border border-stone-200 flex items-center justify-center hover:bg-stone-100 transition-colors">-</button>
                    <span className="font-bold text-lg w-8 text-center">{form.groupSize}</span>
                    <button onClick={() => setForm(f => ({ ...f, groupSize: Math.min(50, f.groupSize + 1) }))} className="w-10 h-10 rounded-full border border-stone-200 flex items-center justify-center hover:bg-stone-100 transition-colors">+</button>
                    <span className="text-sm text-stone-500 ml-2">persons</span>
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
                  <label className="block text-sm font-semibold text-stone-700 mb-2">Special Notes</label>
                  <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Any dietary requirements, disabilities, etc." rows={2} className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm resize-none" />
                </div>
              </div>

              <div className="mt-5 bg-green-50 rounded-xl p-4 border border-green-200">
                <div className="flex justify-between">
                  <span className="text-stone-600 text-sm">₹{selected.price} × {form.groupSize} persons</span>
                  <span className="font-black text-green-700">₹{totalAmount.toLocaleString()}</span>
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={loading || !form.name || !form.phone || !form.visitDate || !form.timeSlot}
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
      <div className="relative bg-green-900 py-20">
        <img src="https://images.pexels.com/photos/974314/pexels-photo-974314.jpeg" alt="Farm" className="absolute inset-0 w-full h-full object-cover opacity-30" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-black text-white font-heading mb-4">Farm Visit Experiences</h1>
          <p className="text-green-200 text-lg max-w-2xl mx-auto">Step onto the farm, get your hands in the soil, and discover where your food comes from.</p>
        </div>
      </div>

      {/* Activities highlights */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          {activities.map(a => (
            <div key={a.title} className="bg-white rounded-2xl p-5 text-center shadow-sm border border-stone-100 card-hover">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <a.icon size={24} className="text-green-700" />
              </div>
              <h4 className="font-bold text-stone-800 text-sm mb-1">{a.title}</h4>
              <p className="text-stone-500 text-xs">{a.desc}</p>
            </div>
          ))}
        </div>

        <div className="text-center mb-12">
          <h2 className="section-heading">Visit Packages</h2>
          <p className="section-subheading">Choose the perfect farm experience for you and your family.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {visitPackages.map(pkg => (
            <div key={pkg.id} className={`group relative bg-white rounded-3xl overflow-hidden shadow-sm border card-hover ${pkg.popular ? 'border-green-500 ring-2 ring-green-500' : 'border-stone-100'}`}>
              {pkg.popular && (
                <div className="absolute top-4 right-4 z-10 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                  Most Popular
                </div>
              )}
              <div className="relative h-48 overflow-hidden">
                <img src={pkg.img} alt={pkg.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className={`absolute inset-0 bg-gradient-to-br ${pkg.color} opacity-60`} />
                <div className="absolute bottom-4 left-4">
                  <div className="flex items-center gap-2 text-white">
                    <Clock size={14} />
                    <span className="text-sm font-medium">{pkg.duration}</span>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-black text-green-900 text-xl font-heading">{pkg.name}</h3>
                  <div className="text-right">
                    <p className="text-2xl font-black text-green-700">₹{pkg.price}</p>
                    <p className="text-xs text-stone-400">{pkg.note || 'per person'}</p>
                  </div>
                </div>
                <p className="text-stone-600 text-sm mb-4 leading-relaxed">{pkg.desc}</p>
                <div className="space-y-1.5 mb-5">
                  {pkg.includes.map(inc => (
                    <div key={inc} className="flex items-center gap-2 text-sm text-stone-700">
                      <Check size={14} className="text-green-600 flex-shrink-0" />
                      {inc}
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => handleSelect(pkg)}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  <Calendar size={16} />
                  Book This Package
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Farm gallery strip */}
        <div className="mt-16 grid grid-cols-3 gap-4 rounded-3xl overflow-hidden h-64">
          <img src="https://images.pexels.com/photos/735968/pexels-photo-735968.jpeg" alt="Farm" className="w-full h-full object-cover" />
          <img src="https://images.pexels.com/photos/974314/pexels-photo-974314.jpeg" alt="Farm" className="w-full h-full object-cover" />
          <img src="https://images.pexels.com/photos/1458694/pexels-photo-1458694.jpeg" alt="Farm" className="w-full h-full object-cover" />
        </div>
      </div>
    </div>
  );
}
