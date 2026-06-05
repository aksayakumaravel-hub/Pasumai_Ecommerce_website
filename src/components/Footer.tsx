import { Phone, Mail, MapPin, Heart, Leaf } from 'lucide-react';
import FarmLogo from './FarmLogo';

type FooterProps = {
  onNavigate: (page: string) => void;
};

export default function Footer({ onNavigate }: FooterProps) {
  return (
    <footer className="bg-green-950 text-white">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-6">
              <FarmLogo className="h-16 w-16" />
              <div>
                <p className="font-black text-lg font-heading leading-tight">PASUMAI</p>
                <p className="text-green-400 text-sm font-medium">INTEGRATED FARM</p>
              </div>
            </div>
            <p className="text-stone-400 text-sm leading-relaxed mb-4">
              4+ acres of organic farming, 5+ years of experience, 50+ families served with love. Your sanctuary for peace, fresh food, and unforgettable memories.
            </p>
            <div className="flex items-center gap-2 text-green-400 mb-2">
              <Leaf size={16} />
              <span className="text-sm font-medium">100% Organic & Sustainable</span>
            </div>
            <div className="flex items-center gap-2 text-stone-500 text-xs">
              <MapPin size={12} />
              Kalladipatti, Dindigul – 624219
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-white mb-5 font-heading">Quick Links</h4>
            <ul className="space-y-3">
              {[
                { label: 'Home', page: 'home' },
                { label: 'Organic Shop', page: 'shop' },
                { label: 'Cottage Stays', page: 'cottages' },
                { label: 'Farm Visits', page: 'farm-visits' },
                { label: 'Party & Conference Halls', page: 'halls' },
                { label: 'Gallery', page: 'gallery' },
                { label: 'Contact Us', page: 'contact' },
              ].map(link => (
                <li key={link.page}>
                  <button
                    onClick={() => onNavigate(link.page)}
                    className="text-stone-400 hover:text-green-400 text-sm transition-colors duration-200"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Experiences */}
          <div>
            <h4 className="font-bold text-white mb-5 font-heading">Experiences</h4>
            <ul className="space-y-3 text-stone-400 text-sm">
              <li className="hover:text-green-400 cursor-pointer transition-colors" onClick={() => onNavigate('cottages')}>Luxury Eco Cottages</li>
              <li className="hover:text-green-400 cursor-pointer transition-colors" onClick={() => onNavigate('cottages')}>Swimming Pool</li>
              <li className="hover:text-green-400 cursor-pointer transition-colors" onClick={() => onNavigate('halls')}>Open Garden Party Hall</li>
              <li className="hover:text-green-400 cursor-pointer transition-colors" onClick={() => onNavigate('halls')}>AC Conference Hall</li>
              <li className="hover:text-green-400 cursor-pointer transition-colors" onClick={() => onNavigate('farm-visits')}>Guided Farm Tours</li>
              <li className="hover:text-green-400 cursor-pointer transition-colors" onClick={() => onNavigate('farm-visits')}>Organic Farming Workshops</li>
              <li className="hover:text-green-400 cursor-pointer transition-colors" onClick={() => onNavigate('farm-visits')}>Animal Care Activities</li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-bold text-white mb-5 font-heading">Contact Us</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <Phone size={16} className="text-green-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-stone-300 text-sm">M. Kumaravel (Ex-Army)</p>
                  <a href="tel:9952814029" className="text-green-400 text-sm font-medium hover:text-green-300 transition-colors">
                    9952814029
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Mail size={16} className="text-green-400 mt-0.5 flex-shrink-0" />
                <a
                  href="mailto:mkumaran3577@gmail.com"
                  className="text-stone-300 text-sm hover:text-green-400 transition-colors break-all"
                >
                  mkumaran3577@gmail.com
                </a>
              </li>
              <li className="flex items-start gap-3">
                <MapPin size={16} className="text-green-400 mt-0.5 flex-shrink-0" />
                <p className="text-stone-400 text-sm">Tamil Nadu, India</p>
              </li>
            </ul>

            <div className="mt-6 p-3 bg-green-900/50 rounded-xl border border-green-800">
              <a
                href="https://wa.me/919952814029"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-green-400 hover:text-green-300 font-medium text-sm transition-colors"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Chat on WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-green-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-stone-500 text-sm">
            &copy; {new Date().getFullYear()} Pasumai Integrated Farm. All rights reserved.
          </p>
          <p className="text-stone-500 text-sm flex items-center gap-1">
            Made with <Heart size={12} className="text-red-400 fill-red-400" /> for organic living
          </p>
        </div>
      </div>
    </footer>
  );
}
