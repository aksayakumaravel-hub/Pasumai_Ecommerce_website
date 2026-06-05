import { useState } from 'react';
import { Phone, Mail, MapPin, Send, MessageSquare, Check, Facebook, Instagram, Youtube } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function ContactPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { error: dbError } = await supabase
        .from('contact_messages')
        .insert({
          name: form.name,
          email: form.email,
          phone: form.phone,
          subject: form.subject,
          message: form.message,
        });
      if (dbError) throw dbError;
      setSuccess(true);
      setForm({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch {
      setError('Failed to send message. Please try WhatsApp or email us directly.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 pt-20">
      {/* Hero */}
      <div className="relative bg-green-900 py-20 overflow-hidden">
        <img
          src="https://images.pexels.com/photos/460621/pexels-photo-460621.jpeg"
          alt="Contact"
          className="absolute inset-0 w-full h-full object-cover opacity-20"
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-black text-white font-heading mb-4">Get In Touch</h1>
          <p className="text-green-200 text-lg max-w-2xl mx-auto">
            We'd love to hear from you. Visit us, call us, or send a message — we reply fast!
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

          {/* Contact Info Column */}
          <div className="space-y-5">
            <div>
              <h2 className="text-2xl font-black text-green-900 font-heading mb-2">Contact Info</h2>
              <p className="text-stone-600 text-sm">Reach us through any channel below.</p>
            </div>

            {/* Contact cards */}
            {[
              {
                icon: Phone,
                title: 'Phone / WhatsApp',
                content: '9952814029',
                subtitle: 'M. Kumaravel (Ex-Army)',
                href: 'tel:9952814029',
                color: 'bg-green-100 text-green-700',
              },
              {
                icon: Mail,
                title: 'Email',
                content: 'mkumaran3577@gmail.com',
                subtitle: 'We reply within 24 hours',
                href: 'mailto:mkumaran3577@gmail.com',
                color: 'bg-blue-100 text-blue-700',
              },
              {
                icon: MapPin,
                title: 'Farm Location',
                content: 'Kalladipatti, Dindigul',
                subtitle: 'Tamil Nadu – 624219',
                href: 'https://share.google/QWl3Vb8QLOcrQsJrg',
                color: 'bg-amber-100 text-amber-700',
              },
            ].map(item => (
              <a
                key={item.title}
                href={item.href}
                target={item.icon === MapPin ? '_blank' : undefined}
                rel={item.icon === MapPin ? 'noopener noreferrer' : undefined}
                className="flex items-start gap-4 bg-white rounded-2xl p-5 shadow-sm border border-stone-100 card-hover group"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${item.color}`}>
                  <item.icon size={22} />
                </div>
                <div>
                  <p className="text-xs text-stone-400 font-medium mb-0.5">{item.title}</p>
                  <p className="font-bold text-stone-800 group-hover:text-green-700 transition-colors">{item.content}</p>
                  <p className="text-xs text-stone-500 mt-0.5">{item.subtitle}</p>
                </div>
              </a>
            ))}

            {/* WhatsApp CTA */}
            <a
              href="https://wa.me/919952814029"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 bg-green-500 hover:bg-green-600 text-white rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <MessageSquare size={20} />
              </div>
              <div>
                <p className="font-bold">Chat on WhatsApp</p>
                <p className="text-green-100 text-sm">Fastest response guaranteed</p>
              </div>
            </a>

            {/* Social Media */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100">
              <p className="text-sm font-semibold text-stone-700 mb-4">Follow Us</p>
              <div className="flex gap-3">
                {[
                  { icon: Facebook, label: 'Facebook', color: 'hover:bg-blue-50 hover:text-blue-600' },
                  { icon: Instagram, label: 'Instagram', color: 'hover:bg-pink-50 hover:text-pink-600' },
                  { icon: Youtube, label: 'YouTube', color: 'hover:bg-red-50 hover:text-red-600' },
                ].map(s => (
                  <button
                    key={s.label}
                    title={s.label}
                    className={`w-10 h-10 rounded-xl border border-stone-200 flex items-center justify-center text-stone-500 transition-colors ${s.color}`}
                  >
                    <s.icon size={18} />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Form + Map Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact Form */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-stone-100">
              <h2 className="text-2xl font-black text-green-900 font-heading mb-2">Send Us a Message</h2>
              <p className="text-stone-500 text-sm mb-8">
                Your message goes directly to our team at mkumaran3577@gmail.com
              </p>

              {success ? (
                <div className="text-center py-10">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check size={36} className="text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-green-900 mb-2">Message Sent!</h3>
                  <p className="text-stone-500 mb-6 text-sm">
                    Thank you! We'll reply to <strong>{form.email || 'your email'}</strong> within 24 hours.
                  </p>
                  <button onClick={() => setSuccess(false)} className="btn-primary px-8">
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-semibold text-stone-700 mb-2">Your Name *</label>
                      <input
                        type="text"
                        required
                        value={form.name}
                        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                        placeholder="Full name"
                        className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-stone-700 mb-2">Email Address *</label>
                      <input
                        type="email"
                        required
                        value={form.email}
                        onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                        placeholder="your@email.com"
                        className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-semibold text-stone-700 mb-2">Phone</label>
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                        placeholder="Mobile number"
                        className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-stone-700 mb-2">Enquiry Type</label>
                      <select
                        value={form.subject}
                        onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                        className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm bg-white"
                      >
                        <option value="">Select a topic</option>
                        <option value="Cottage Booking">Cottage Booking</option>
                        <option value="Farm Visit">Farm Visit</option>
                        <option value="Organic Products">Organic Products</option>
                        <option value="Party Hall Booking">Party Hall Booking</option>
                        <option value="Conference Hall Booking">Conference Hall Booking</option>
                        <option value="General Inquiry">General Inquiry</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-stone-700 mb-2">Your Message *</label>
                    <textarea
                      required
                      value={form.message}
                      onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                      placeholder="Tell us how we can help you..."
                      rows={5}
                      className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm resize-none"
                    />
                  </div>
                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-3">{error}</div>
                  )}
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full py-4 text-base flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Sending...' : <><Send size={18} />Send Message</>}
                  </button>
                </form>
              )}
            </div>

            {/* Google Maps — Kalladipatti, Dindigul */}
            <div className="rounded-3xl overflow-hidden shadow-sm border border-stone-100 h-72 relative">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d7876.388490237!2d77.888!3d10.36!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3b00cf3c2f5b5555%3A0x0!2sKalladipatti%2C%20Dindigul%2C%20Tamil%20Nadu%20624219!5e0!3m2!1sen!2sin!4v1685000000000!5m2!1sen!2sin"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Pasumai Farm Location — Kalladipatti, Dindigul"
              />
              <div className="absolute bottom-4 left-4 right-4">
                <a
                  href="https://share.google/QWl3Vb8QLOcrQsJrg"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-white rounded-xl px-4 py-2.5 shadow-lg w-fit text-sm font-semibold text-green-800 hover:bg-green-50 transition-colors"
                >
                  <MapPin size={16} className="text-red-500" />
                  Kalladipatti, Dindigul — 624219
                  <span className="text-stone-400 text-xs ml-1">Open in Maps →</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
