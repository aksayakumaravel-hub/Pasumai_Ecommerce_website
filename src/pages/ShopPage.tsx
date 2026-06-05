import { useState, useEffect } from 'react';
import { Search, Star, ShoppingCart, Leaf, Filter, Plus, Minus, Check } from 'lucide-react';
import { supabase, Product } from '../lib/supabase';
import { useCart } from '../context/CartContext';

type ShopPageProps = {
  onNavigate: (page: string) => void;
};

const categories = ['All', 'Fruits', 'Vegetables', 'Poultry', 'Eggs & Dairy', 'Organic Products'];

export default function ShopPage({ onNavigate }: ShopPageProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [filtered, setFiltered] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('All');
  const [addedItems, setAddedItems] = useState<Set<string>>(new Set());
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const { addItem, count } = useCart();

  useEffect(() => {
    supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        const prods = data || [];
        setProducts(prods);
        setFiltered(prods);
        const q: Record<string, number> = {};
        prods.forEach(p => { q[p.id] = 1; });
        setQuantities(q);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let result = products;
    if (selectedCat !== 'All') {
      result = result.filter(p => p.category === selectedCat);
    }
    if (search) {
      result = result.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.description || '').toLowerCase().includes(search.toLowerCase())
      );
    }
    setFiltered(result);
  }, [search, selectedCat, products]);

  const handleAdd = (product: Product) => {
    addItem(product, quantities[product.id] || 1);
    setAddedItems(prev => new Set([...prev, product.id]));
    setTimeout(() => {
      setAddedItems(prev => {
        const next = new Set(prev);
        next.delete(product.id);
        return next;
      });
    }, 2000);
  };

  const updateQty = (id: string, delta: number) => {
    setQuantities(prev => ({ ...prev, [id]: Math.max(1, (prev[id] || 1) + delta) }));
  };

  return (
    <div className="min-h-screen bg-stone-50 pt-20">
      {/* Hero Banner */}
      <div className="relative bg-green-900 py-20 overflow-hidden">
        <img
          src="https://images.pexels.com/photos/1458694/pexels-photo-1458694.jpeg"
          alt="Organic Shop"
          className="absolute inset-0 w-full h-full object-cover opacity-30"
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-green-500/20 border border-green-400/30 text-green-300 text-sm font-medium px-4 py-2 rounded-full mb-6">
            <Leaf size={14} />
            Farm to Doorstep
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white font-heading mb-4">
            Organic Farm Store
          </h1>
          <p className="text-green-200 text-lg max-w-2xl mx-auto">
            Pure, fresh, chemical-free produce harvested daily from our certified organic farm.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Search & Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-10">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search organic products..."
              className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-stone-200 bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <Filter size={16} className="text-stone-400 flex-shrink-0" />
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCat(cat)}
                className={`flex-shrink-0 px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-200 ${
                  selectedCat === cat
                    ? 'bg-green-600 text-white shadow-green'
                    : 'bg-white text-stone-600 border border-stone-200 hover:border-green-400 hover:text-green-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Cart summary bar */}
        {count > 0 && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                <ShoppingCart size={18} className="text-white" />
              </div>
              <span className="font-semibold text-green-800">{count} items in cart</span>
            </div>
            <button
              onClick={() => onNavigate('cart')}
              className="btn-primary text-sm py-2 px-5"
            >
              View Cart
            </button>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-3xl overflow-hidden animate-pulse">
                <div className="h-48 bg-stone-200" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-stone-200 rounded w-3/4" />
                  <div className="h-4 bg-stone-200 rounded w-1/2" />
                  <div className="h-10 bg-stone-200 rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Leaf size={48} className="text-stone-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-stone-600 mb-2">No products found</h3>
            <p className="text-stone-400">Try a different search or category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filtered.map(product => (
              <div
                key={product.id}
                className="group bg-white rounded-3xl overflow-hidden shadow-sm border border-stone-100 card-hover"
              >
                <div className="relative overflow-hidden">
                  <img
                    src={product.image_url || 'https://images.pexels.com/photos/1458694/pexels-photo-1458694.jpeg'}
                    alt={product.name}
                    className="w-full h-52 object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3 flex gap-2">
                    {product.is_organic && <span className="organic-badge text-xs">Organic</span>}
                    {product.stock < 10 && product.stock > 0 && (
                      <span className="bg-red-100 text-red-600 text-xs font-semibold px-2.5 py-1 rounded-full">
                        Low Stock
                      </span>
                    )}
                  </div>
                  {product.original_price && (
                    <div className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                      {Math.round(((product.original_price - product.price) / product.original_price) * 100)}% OFF
                    </div>
                  )}
                </div>

                <div className="p-5">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold text-stone-800 text-base leading-tight">{product.name}</h3>
                  </div>

                  {product.description && (
                    <p className="text-stone-500 text-xs mb-3 line-clamp-2 leading-relaxed">
                      {product.description}
                    </p>
                  )}

                  <div className="flex items-center gap-1 mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={12}
                        className={i < Math.floor(product.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-stone-200 fill-stone-200'}
                      />
                    ))}
                    <span className="text-xs text-stone-400 ml-1">({product.reviews_count})</span>
                  </div>

                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-xl font-black text-green-700">₹{product.price}</span>
                    <span className="text-xs text-stone-400">/{product.unit}</span>
                    {product.original_price && (
                      <span className="text-sm text-stone-400 line-through">₹{product.original_price}</span>
                    )}
                  </div>

                  {/* Quantity selector */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center border border-stone-200 rounded-full overflow-hidden">
                      <button
                        onClick={() => updateQty(product.id, -1)}
                        className="px-3 py-1.5 hover:bg-stone-100 transition-colors"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="px-3 py-1.5 font-semibold text-sm min-w-[2rem] text-center">
                        {quantities[product.id] || 1}
                      </span>
                      <button
                        onClick={() => updateQty(product.id, 1)}
                        className="px-3 py-1.5 hover:bg-stone-100 transition-colors"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => handleAdd(product)}
                    disabled={product.stock === 0}
                    className={`w-full py-2.5 rounded-full font-semibold text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
                      addedItems.has(product.id)
                        ? 'bg-green-100 text-green-700'
                        : product.stock === 0
                        ? 'bg-stone-100 text-stone-400 cursor-not-allowed'
                        : 'bg-green-600 text-white hover:bg-green-700 hover:shadow-green'
                    }`}
                  >
                    {addedItems.has(product.id) ? (
                      <>
                        <Check size={16} />
                        Added!
                      </>
                    ) : product.stock === 0 ? (
                      'Out of Stock'
                    ) : (
                      <>
                        <ShoppingCart size={16} />
                        Add to Cart
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
