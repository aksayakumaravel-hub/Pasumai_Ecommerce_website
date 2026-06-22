import { useState, useEffect, useRef } from 'react';
import { ChevronDown, Star, Leaf, Home, Calendar, ArrowRight, Play, Quote, ShieldCheck, Truck, Award, Users, MapPin, Phone, Mail, Sprout, Heart } from 'lucide-react';
import FarmBanner from '../components/FarmBanner';

type HomePageProps = {
  onNavigate: (page: string) => void;
};

const testimonials = [
  {
    name: 'Pooja',
    location: 'Chennai',
    rating: 5,
    text: 'The cottage stay was absolutely magical! Waking up to the sound of nature with fresh organic breakfast was a dream. Will definitely come back!',
    avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?w=100',
  },
  {
    name: 'Aksaya',
    location: 'Coimbatore',
    rating: 5,
    text: 'The organic vegetables are incredibly fresh and flavorful. You can really taste the difference. The farm delivery service is punctual and reliable.',
    avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?w=100',
  },
  {
    name: 'Anitha',
    location: 'Bangalore',
    rating: 4.6,
    text: 'Brought my family for the farm visit. Kids loved feeding the animals and learning about organic farming. A truly enriching experience for everyone.',
    avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?w=100',
  },
];

const features = [
  { icon: Leaf, title: '100% Organic', desc: 'No pesticides, chemicals, or artificial inputs. Pure nature.' },
  { icon: ShieldCheck, title: 'Farm Certified', desc: 'Fully certified organic farm with transparent processes.' },
  { icon: Truck, title: 'Fresh Delivery', desc: 'Farm-fresh products delivered to your doorstep daily.' },
  { icon: Award, title: 'Award Winning', desc: 'Recognized as the best eco-farm destination in Tamil Nadu.' },
];

const products = [
  { name: 'Taiwan Pink Guava', price: '₹70/kg', img: 'https://images.pexels.com/photos/8668726/pexels-photo-8668726.jpeg' },
  { name: 'Organic Farm Eggs', price: '₹25/egg', img: 'https://images.pexels.com/photos/162712/egg-white-food-protein-162712.jpeg' },
  { name: 'Fresh Spinach', price: '₹40/bunch', img: 'https://images.pexels.com/photos/2325843/pexels-photo-2325843.jpeg' },
  { name: 'Country Chicken', price: '₹750/kg', img: 'https://images.pexels.com/photos/37663514/pexels-photo-37663514.jpeg' },
];

export default function HomePage({ onNavigate }: HomePageProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isVisible, setIsVisible] = useState<Record<string, boolean>>({});
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide(s => (s + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting && entry.target.id) {
            setIsVisible(prev => ({ ...prev, [entry.target.id]: true }));
          }
        });
      },
      { threshold: 0.15 }
    );

    Object.values(sectionRefs.current).forEach(ref => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, []);

  const setRef = (id: string) => (el: HTMLElement | null) => {
    sectionRefs.current[id] = el;
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0">
          <img
            src="https://images.pexels.com/photos/974314/pexels-photo-974314.jpeg"
            alt="Farm"
            className="w-full h-full object-cover scale-110 animate-[scale_20s_ease-in-out_infinite_alternate]"
          />
          <div className="absolute inset-0 hero-overlay" />
          <div className="absolute inset-0 bg-gradient-to-r from-green-950/60 via-transparent to-green-950/30" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto pt-20">
          <div className="inline-flex items-center gap-2 bg-green-500/20 backdrop-blur-sm border border-green-400/30 text-green-300 text-sm font-medium px-4 py-2 rounded-full mb-8 animate-fadeInUp">
            <Leaf size={14} />
            100% Organic & Sustainable Farm
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white font-heading leading-tight mb-6 text-shadow-lg animate-fadeInUp delay-100">
            Experience
            <span className="text-green-400"> Organic</span>
            <br />
            Living
          </h1>

          <p className="text-xl sm:text-2xl text-white/80 font-light mb-4 animate-fadeInUp delay-200">
            Fresh From Farm to Home
          </p>
          <p className="text-lg text-white/60 max-w-2xl mx-auto mb-10 animate-fadeInUp delay-300">
            Reconnect with nature at Pasumai Integrated Farm — luxury eco-cottages, organic products, guided farm tours, and unforgettable experiences.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fadeInUp delay-400">
            <button
              onClick={() => onNavigate('cottages')}
              className="btn-primary text-base px-8 py-4 flex items-center gap-2"
            >
              <Home size={18} />
              Book Cottage Stay
            </button>
            <button
              onClick={() => onNavigate('shop')}
              className="btn-outline text-base px-8 py-4 flex items-center gap-2"
            >
              <Leaf size={18} />
              Shop Organic
            </button>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-3 gap-4 sm:gap-6 max-w-lg mx-auto animate-fadeInUp delay-500">
            {[
              { value: '4+', label: 'Acres of Organic Farm' },
              { value: '50+', label: 'Families Served' },
              { value: '5+', label: 'Years Experience' },
            ].map(stat => (
              <div key={stat.label} className="glass rounded-2xl p-4 text-center">
                <p className="text-2xl font-black text-green-400 font-heading">{stat.value}</p>
                <p className="text-white/70 text-xs mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <button
          onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/50 hover:text-white transition-colors animate-bounce"
        >
          <ChevronDown size={32} />
        </button>
      </section>

      {/* About / Story Section */}
      <section
        id="about"
        ref={setRef('about')}
        className="py-20 bg-gradient-nature"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`grid grid-cols-1 lg:grid-cols-2 gap-16 items-center transition-all duration-1000 ${isVisible['about'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div>
              <div className="inline-flex items-center gap-2 text-green-600 font-semibold text-sm mb-4">
                <Leaf size={16} />
                OUR STORY
              </div>
              <h2 className="section-heading">
                Where Tradition
                <br />
                <span className="text-green-600">Meets Modern</span>
                <br />
                Agriculture
              </h2>
              <p className="text-stone-600 leading-relaxed mb-6">
                Founded by M. Kumaravel (Ex-Army), Pasumai Integrated Farm is a labor of love spanning <strong>4+ acres of certified organic land</strong> in Kalladipatti, Dindigul District, Tamil Nadu. For over 5 years, we've grown premium fruits, vegetables, and raised happy animals the natural way — with zero chemicals.
              </p>
              <p className="text-stone-600 leading-relaxed mb-8">
                Our philosophy: farming is not just a livelihood, it's a way of life. We've served <strong>50+ families</strong> with fresh, honest produce and invite you to experience this beautiful life — through our luxury eco-cottages, organic shop, and guided farm experiences.
              </p>
              <div className="flex flex-wrap gap-3">
                <span className="organic-badge text-sm py-1.5">&#127807; 4+ Acres Organic</span>
                <span className="organic-badge text-sm py-1.5">&#127807; 5+ Years Experience</span>
                <span className="organic-badge text-sm py-1.5">&#127807; Dindigul, Tamil Nadu</span>
              </div>
            </div>
            <div className="relative">
              <FarmBanner className="rounded-3xl shadow-2xl w-full object-cover" />
              <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl p-5 shadow-xl border border-green-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <Heart size={20} className="text-green-600" />
                  </div>
                  <div>
                    <p className="font-bold text-green-900 text-sm">50+ Families</p>
                    <p className="text-stone-500 text-xs">Served with love</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section
        id="stats"
        ref={setRef('stats')}
        className="py-20 bg-green-950 relative overflow-hidden"
      >
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-green-400 rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-green-400 rounded-full translate-x-1/2 translate-y-1/2" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`text-center mb-14 transition-all duration-1000 ${isVisible['stats'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="inline-flex items-center gap-2 text-green-400 font-semibold text-sm mb-3 bg-green-900/60 px-4 py-2 rounded-full border border-green-700">
              <Leaf size={14} />
              OUR IMPACT IN NUMBERS
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white font-heading">
              Growing with <span className="text-green-400">Purpose</span>
            </h2>
            <p className="text-green-200/70 max-w-xl mx-auto mt-3">Every acre we farm, every family we serve — a commitment to nature and community.</p>
          </div>

          <div className={`grid grid-cols-2 lg:grid-cols-4 gap-6 transition-all duration-1000 delay-200 ${isVisible['stats'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            {[
              { icon: Sprout, value: '4+', label: 'Acres of Organic Farming', sub: 'Chemical-free, certified land', color: 'from-green-500 to-emerald-600' },
              { icon: Calendar, value: '5+', label: 'Years of Experience', sub: 'Farming since 2019', color: 'from-teal-500 to-cyan-600' },
              { icon: Heart, value: '50+', label: 'Families Served', sub: 'With love & organic care', color: 'from-rose-500 to-pink-600' },
              { icon: Award, value: '100%', label: 'Organic & Pure', sub: 'No pesticides, ever', color: 'from-amber-500 to-orange-600' },
            ].map((stat, i) => (
              <div
                key={stat.label}
                className="relative bg-green-900/50 backdrop-blur-sm border border-green-700/50 rounded-3xl p-7 text-center group hover:-translate-y-2 transition-transform duration-300"
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                  <stat.icon size={24} className="text-white" />
                </div>
                <p className="text-4xl font-black text-white font-heading mb-2">{stat.value}</p>
                <p className="text-green-300 font-semibold text-sm mb-1">{stat.label}</p>
                <p className="text-green-500 text-xs">{stat.sub}</p>
              </div>
            ))}
          </div>

          <div className={`mt-12 flex flex-col sm:flex-row items-center justify-center gap-6 transition-all duration-1000 delay-400 ${isVisible['stats'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="flex items-center gap-3 text-green-300">
              <Phone size={16} className="text-green-400" />
              <a href="tel:9952814029" className="font-semibold hover:text-white transition-colors">9952814029</a>
            </div>
            <div className="w-px h-5 bg-green-700 hidden sm:block" />
            <div className="flex items-center gap-3 text-green-300">
              <Mail size={16} className="text-green-400" />
              <a href="mailto:mkumaran3577@gmail.com" className="font-semibold hover:text-white transition-colors">mkumaran3577@gmail.com</a>
            </div>
            <div className="w-px h-5 bg-green-700 hidden sm:block" />
            <div className="flex items-center gap-3 text-green-300">
              <MapPin size={16} className="text-green-400" />
              <span className="font-semibold text-sm">Kalladipatti, Dindigul, Tamil Nadu</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section
        id="features"
        ref={setRef('features')}
        className="py-20 bg-white"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`text-center mb-14 transition-all duration-1000 ${isVisible['features'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <h2 className="section-heading">Why Choose Pasumai?</h2>
            <p className="section-subheading">We believe in transparency, quality, and a genuine connection with the earth.</p>
          </div>
          <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 transition-all duration-1000 delay-200 ${isVisible['features'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            {features.map(f => (
              <div key={f.title} className="group bg-gradient-to-b from-green-50 to-white rounded-3xl p-8 text-center card-hover border border-green-100">
                <div className="w-16 h-16 bg-green-600 rounded-2xl flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-transform duration-300">
                  <f.icon size={28} className="text-white" />
                </div>
                <h3 className="font-bold text-green-900 text-lg mb-3 font-heading">{f.title}</h3>
                <p className="text-stone-600 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Experiences Section */}
      <section
        id="experiences"
        ref={setRef('experiences')}
        className="py-20 bg-green-950 text-white"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`text-center mb-14 transition-all duration-1000 ${isVisible['experiences'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <h2 className="text-4xl md:text-5xl font-black font-heading mb-4">
              Our <span className="text-green-400">Premium</span> Experiences
            </h2>
            <p className="text-green-200/70 max-w-2xl mx-auto">More than a farm — a destination for the soul.</p>
          </div>

          <div className={`grid grid-cols-1 md:grid-cols-3 gap-8 transition-all duration-1000 delay-200 ${isVisible['experiences'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            {[
              {
                img: 'https://images.pexels.com/photos/1115804/pexels-photo-1115804.jpeg',
                title: 'Luxury Eco Cottages',
                desc: 'Sleep under the stars in our premium eco-cottages surrounded by nature. Includes pool access and garden views.',
                badge: 'From ₹2999/night',
                page: 'cottages',
              },
              {
                img: 'https://images.pexels.com/photos/735968/pexels-photo-735968.jpeg',
                title: 'Guided Farm Experiences',
                desc: 'Get hands-on with organic farming, animal care, and discover where your food comes from with expert guides.',
                badge: 'From ₹299/person',
                page: 'farm-visits',
              },
              {
                img: 'https://images.pexels.com/photos/1543762/pexels-photo-1543762.jpeg',
                title: 'Events & Conferences',
                desc: 'Host memorable events in our open garden party hall or book our AC conference meeting hall for corporate gatherings.',
                badge: 'Custom Packages',
                page: 'cottages',
              },
            ].map(exp => (
              <div
                key={exp.title}
                className="group relative rounded-3xl overflow-hidden cursor-pointer card-hover"
                onClick={() => onNavigate(exp.page)}
              >
                <img
                  src={exp.img}
                  alt={exp.title}
                  className="w-full h-72 object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <span className="inline-block bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full mb-3">
                    {exp.badge}
                  </span>
                  <h3 className="text-white font-bold text-xl font-heading mb-2">{exp.title}</h3>
                  <p className="text-white/70 text-sm">{exp.desc}</p>
                  <div className="flex items-center gap-2 text-green-400 text-sm font-semibold mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <span>Explore</span>
                    <ArrowRight size={14} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Products Showcase */}
      <section
        id="products"
        ref={setRef('products')}
        className="py-20 bg-white"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`text-center mb-14 transition-all duration-1000 ${isVisible['products'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="inline-flex items-center gap-2 text-green-600 font-semibold text-sm mb-3">
              <Leaf size={16} />
              ORGANIC STORE
            </div>
            <h2 className="section-heading">Farm-Fresh Products</h2>
            <p className="section-subheading">Harvested daily and delivered fresh to your doorstep.</p>
          </div>

          <div className={`grid grid-cols-2 lg:grid-cols-4 gap-6 transition-all duration-1000 delay-200 ${isVisible['products'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            {products.map(p => (
              <div
                key={p.name}
                className="group bg-white rounded-3xl overflow-hidden shadow-sm border border-stone-100 card-hover cursor-pointer"
                onClick={() => onNavigate('shop')}
              >
                <div className="relative overflow-hidden">
                  <img
                    src={p.img}
                    alt={p.name}
                    className="w-full h-44 object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="organic-badge text-xs">Organic</span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-stone-800 text-sm mb-1">{p.name}</h3>
                  <p className="text-green-600 font-bold">{p.price}</p>
                  <div className="flex items-center gap-1 mt-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={10} className="text-yellow-400 fill-yellow-400" />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className={`text-center mt-10 transition-all duration-1000 delay-300 ${isVisible['products'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <button
              onClick={() => onNavigate('shop')}
              className="btn-primary inline-flex items-center gap-2"
            >
              View All Products
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* Swimming Pool CTA */}
      <section className="relative py-32 parallax-section" style={{ backgroundImage: 'url(https://images.pexels.com/photos/261102/pexels-photo-261102.jpeg)' }}>
        <div className="absolute inset-0 bg-gradient-to-r from-green-950/90 via-green-900/70 to-transparent" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-xl">
            <h2 className="text-4xl md:text-5xl font-black text-white font-heading mb-6">
              Dive Into
              <span className="text-green-400"> Paradise</span>
            </h2>
            <p className="text-white/80 text-lg mb-8">
              Our pristine swimming pool nestled amidst lush greenery offers the perfect escape. Included with all cottage stays.
            </p>
            <button
              onClick={() => onNavigate('cottages')}
              className="btn-primary text-base px-8 py-4 flex items-center gap-2 inline-flex"
            >
              <Calendar size={18} />
              Book Your Stay
            </button>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section
        id="testimonials"
        ref={setRef('testimonials')}
        className="py-20 bg-gradient-nature"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`text-center mb-14 transition-all duration-1000 ${isVisible['testimonials'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <h2 className="section-heading">What Guests Say</h2>
            <p className="section-subheading">Real stories from real people who experienced the Pasumai difference.</p>
          </div>

          <div className={`grid grid-cols-1 md:grid-cols-3 gap-8 transition-all duration-1000 delay-200 ${isVisible['testimonials'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            {testimonials.map((t, i) => (
              <div
                key={t.name}
                className={`bg-white rounded-3xl p-8 shadow-sm border border-green-100 card-hover transition-all duration-500 ${
                  currentSlide === i ? 'ring-2 ring-green-500 shadow-green' : ''
                }`}
              >
                <Quote size={28} className="text-green-200 mb-4" />
                <p className="text-stone-700 leading-relaxed mb-6 text-sm">{t.text}</p>
                <div className="flex items-center gap-4">
                  <img
                    src={t.avatar}
                    alt={t.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-bold text-stone-800 text-sm">{t.name}</p>
                    <p className="text-stone-500 text-xs">{t.location}</p>
                    <div className="flex gap-0.5 mt-1">
                      {[...Array(t.rating)].map((_, j) => (
                        <Star key={j} size={12} className="text-yellow-400 fill-yellow-400" />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section
        id="cta"
        ref={setRef('cta')}
        className="py-24 bg-green-700"
      >
        <div className={`max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center transition-all duration-1000 ${isVisible['cta'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <h2 className="text-4xl md:text-5xl font-black text-white font-heading mb-6">
            Book Your Peaceful Farm Stay Today
          </h2>
          <p className="text-white/80 text-lg mb-10 max-w-2xl mx-auto">
            Escape the city. Reconnect with nature. Create memories that last a lifetime at Pasumai Integrated Farm.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => onNavigate('cottages')}
              className="bg-white text-green-700 font-bold px-8 py-4 rounded-full hover:bg-green-50 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg flex items-center gap-2"
            >
              <Home size={18} />
              Book Cottage Stay
            </button>
            <button
              onClick={() => onNavigate('farm-visits')}
              className="btn-outline flex items-center gap-2 px-8 py-4"
            >
              <Play size={18} />
              Plan Farm Visit
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
