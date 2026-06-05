import { useState, useEffect } from 'react';
import { X, Play, Image, Film, Grid3X3 } from 'lucide-react';
import { supabase, GalleryItem } from '../lib/supabase';

const categories = ['All', 'Farm', 'Nature', 'Products', 'Cottage', 'Animals', 'Events', 'Amenities'];

export default function GalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [filtered, setFiltered] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCat, setSelectedCat] = useState('All');
  const [selectedType, setSelectedType] = useState<'all' | 'image' | 'video'>('all');
  const [lightboxItem, setLightboxItem] = useState<GalleryItem | null>(null);

  useEffect(() => {
    supabase
      .from('gallery_items')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .then(({ data }) => {
        setItems(data || []);
        setFiltered(data || []);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let result = items;
    if (selectedCat !== 'All') {
      result = result.filter(i => i.category === selectedCat);
    }
    if (selectedType !== 'all') {
      result = result.filter(i => i.media_type === selectedType);
    }
    setFiltered(result);
  }, [selectedCat, selectedType, items]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxItem(null);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  return (
    <div className="min-h-screen bg-stone-950 pt-20">
      {/* Hero */}
      <div className="relative py-20 bg-green-900">
        <img
          src="https://images.pexels.com/photos/1227513/pexels-photo-1227513.jpeg"
          alt="Gallery"
          className="absolute inset-0 w-full h-full object-cover opacity-30"
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-black text-white font-heading mb-4">Farm Gallery</h1>
          <p className="text-green-200 text-lg max-w-2xl mx-auto">A visual journey through our organic farm — from sunrise harvests to peaceful evenings.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          {/* Type toggle */}
          <div className="flex bg-stone-800 rounded-full p-1 w-fit">
            {[
              { value: 'all', label: 'All', icon: Grid3X3 },
              { value: 'image', label: 'Photos', icon: Image },
              { value: 'video', label: 'Videos', icon: Film },
            ].map(t => (
              <button
                key={t.value}
                onClick={() => setSelectedType(t.value as typeof selectedType)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  selectedType === t.value
                    ? 'bg-green-600 text-white'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                <t.icon size={14} />
                {t.label}
              </button>
            ))}
          </div>

          {/* Category filter */}
          <div className="flex gap-2 flex-wrap">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCat(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  selectedCat === cat
                    ? 'bg-green-600 text-white'
                    : 'bg-stone-800 text-stone-400 hover:text-white hover:bg-stone-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="rounded-2xl bg-stone-800 animate-pulse aspect-square" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Image size={48} className="text-stone-600 mx-auto mb-4" />
            <p className="text-stone-500">No media found for this filter.</p>
          </div>
        ) : (
          <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
            {filtered.map(item => (
              <div
                key={item.id}
                className="group relative rounded-2xl overflow-hidden cursor-pointer break-inside-avoid"
                onClick={() => setLightboxItem(item)}
              >
                <img
                  src={item.media_url}
                  alt={item.title || 'Gallery'}
                  className="w-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-white text-center px-4">
                    {item.media_type === 'video' && (
                      <Play size={36} className="mx-auto mb-2 text-white fill-white" />
                    )}
                    {item.title && (
                      <p className="text-sm font-semibold">{item.title}</p>
                    )}
                    {item.category && (
                      <span className="text-xs text-white/60">{item.category}</span>
                    )}
                  </div>
                </div>
                {item.media_type === 'video' && (
                  <div className="absolute top-3 right-3 bg-black/60 rounded-full p-1.5">
                    <Play size={14} className="text-white fill-white" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxItem && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
          onClick={() => setLightboxItem(null)}
        >
          <button
            onClick={() => setLightboxItem(null)}
            className="absolute top-4 right-4 text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <X size={28} />
          </button>

          <div
            className="max-w-5xl w-full max-h-[90vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {lightboxItem.media_type === 'image' ? (
              <img
                src={lightboxItem.media_url}
                alt={lightboxItem.title || ''}
                className="max-h-[80vh] object-contain rounded-2xl mx-auto"
              />
            ) : (
              <video
                src={lightboxItem.media_url}
                controls
                autoPlay
                className="max-h-[80vh] w-full rounded-2xl"
              />
            )}
            {(lightboxItem.title || lightboxItem.description) && (
              <div className="mt-4 text-center">
                {lightboxItem.title && (
                  <h3 className="text-white font-bold text-lg">{lightboxItem.title}</h3>
                )}
                {lightboxItem.description && (
                  <p className="text-white/60 text-sm mt-1">{lightboxItem.description}</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
