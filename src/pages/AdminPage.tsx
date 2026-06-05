import { useState, useEffect, useRef } from 'react';
import {
  Users, ShoppingBag, Home, Calendar, MessageSquare, Package, Trash2,
  Check, X, Bell, Image, BarChart3, Edit, Wind, Tag, Plus,
  ArrowUpDown, Eye, Upload, RefreshCw, TrendingUp, Star,
  DollarSign, ChevronRight, Filter, Search, Save, AlertTriangle,
  Layers, Video, FileImage, ToggleLeft, ToggleRight, Send
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  supabase, Order, CottageBooking, FarmVisit, HallBooking,
  ContactMessage, Product, GalleryItem, ProductCategory
} from '../lib/supabase';

type AdminPageProps = {
  onNavigate: (page: string) => void;
};

type AdminTab =
  | 'dashboard' | 'orders' | 'cottages' | 'visits' | 'halls'
  | 'messages' | 'products' | 'categories' | 'gallery' | 'notifications';

const statusOptions = {
  orders: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
  bookings: ['pending', 'confirmed', 'cancelled', 'completed'],
};

const statusColors: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700 border border-amber-200',
  confirmed: 'bg-blue-100 text-blue-700 border border-blue-200',
  processing: 'bg-purple-100 text-purple-700 border border-purple-200',
  shipped: 'bg-cyan-100 text-cyan-700 border border-cyan-200',
  delivered: 'bg-green-100 text-green-700 border border-green-200',
  cancelled: 'bg-red-100 text-red-700 border border-red-200',
  completed: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
};

const emptyProduct: Partial<Product> = {
  name: '', description: '', price: 0, original_price: undefined,
  stock: 0, unit: 'kg', category: '', image_url: '',
  images: [], video_url: '', badge: '',
  is_organic: true, is_active: true, rating: 4.5, reviews_count: 0,
};

function StatCard({ label, value, sub, icon: Icon, color, onClick }: {
  label: string; value: number | string; sub: string;
  icon: React.ElementType; color: string; onClick?: () => void;
}) {
  return (
    <div
      className={`bg-white rounded-2xl p-5 shadow-sm border border-stone-100 ${onClick ? 'cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all' : ''}`}
      onClick={onClick}
    >
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-3 ${color}`}>
        <Icon size={20} />
      </div>
      <p className="text-3xl font-black text-stone-800">{value}</p>
      <p className="text-stone-500 text-sm mt-0.5">{label}</p>
      <p className="text-xs text-stone-400 mt-1">{sub}</p>
    </div>
  );
}

export default function AdminPage({ onNavigate }: AdminPageProps) {
  const { user, profile } = useAuth();
  const [tab, setTab] = useState<AdminTab>('dashboard');
  const [orders, setOrders] = useState<Order[]>([]);
  const [cottageBookings, setCottageBookings] = useState<CottageBooking[]>([]);
  const [farmVisits, setFarmVisits] = useState<FarmVisit[]>([]);
  const [hallBookings, setHallBookings] = useState<HallBooking[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMsg, setSelectedMsg] = useState<ContactMessage | null>(null);
  const [editProduct, setEditProduct] = useState<Partial<Product> | null>(null);
  const [editCategory, setEditCategory] = useState<Partial<ProductCategory> | null>(null);
  const [galleryForm, setGalleryForm] = useState({ title: '', media_url: '', media_type: 'image', category: '', description: '' });
  const [notifForm, setNotifForm] = useState({ user_id: '', title: '', message: '', type: 'info' });
  const [notifSending, setNotifSending] = useState(false);
  const [stockUpdates, setStockUpdates] = useState<Record<string, number>>({});
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [productSearch, setProductSearch] = useState('');
  const [orderSearch, setOrderSearch] = useState('');
  const [imagesInput, setImagesInput] = useState('');

  useEffect(() => {
    if (!user || profile?.role !== 'admin') return;
    fetchAll();
  }, [user, profile]);

  const fetchAll = async () => {
    setLoading(true);
    const [ordRes, cotRes, visRes, halRes, msgRes, prodRes, catRes, galRes] = await Promise.all([
      supabase.from('orders').select('*, order_items(*)').order('created_at', { ascending: false }),
      supabase.from('cottage_bookings').select('*').order('created_at', { ascending: false }),
      supabase.from('farm_visits').select('*').order('created_at', { ascending: false }),
      supabase.from('hall_bookings').select('*').order('created_at', { ascending: false }),
      supabase.from('contact_messages').select('*').order('created_at', { ascending: false }),
      supabase.from('products').select('*').order('created_at', { ascending: false }),
      supabase.from('product_categories').select('*').order('sort_order', { ascending: true }),
      supabase.from('gallery_items').select('*').order('sort_order', { ascending: true }),
    ]);
    setOrders(ordRes.data || []);
    setCottageBookings(cotRes.data || []);
    setFarmVisits(visRes.data || []);
    setHallBookings(halRes.data || []);
    setMessages(msgRes.data || []);
    setProducts(prodRes.data || []);
    setCategories(catRes.data || []);
    setGallery(galRes.data || []);
    const stockInit: Record<string, number> = {};
    (prodRes.data || []).forEach((p: Product) => { stockInit[p.id] = p.stock; });
    setStockUpdates(stockInit);
    setLoading(false);
  };

  if (!user || profile?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-stone-50 pt-20 flex items-center justify-center">
        <div className="text-center bg-white rounded-3xl p-12 shadow-xl max-w-md mx-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X size={32} className="text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-stone-700 mb-2">Access Restricted</h2>
          <p className="text-stone-400 mb-6">This panel is for administrators only.</p>
          <button onClick={() => onNavigate('home')} className="btn-primary">Go Home</button>
        </div>
      </div>
    );
  }

  const showSuccess = (msg: string) => {
    setSaveSuccess(msg);
    setTimeout(() => setSaveSuccess(null), 3000);
  };

  // ── Status updates ──
  const updateOrderStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('orders').update({ status }).eq('id', id);
    if (!error) {
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status: status as Order['status'] } : o));
      showSuccess('Order status updated');
    }
  };

  const updateBookingStatus = async (table: string, id: string, status: string, userId: string, name: string) => {
    const { error } = await supabase.from(table).update({ status }).eq('id', id);
    if (!error) {
      if (table === 'cottage_bookings') setCottageBookings(prev => prev.map(b => b.id === id ? { ...b, status: status as CottageBooking['status'] } : b));
      if (table === 'farm_visits') setFarmVisits(prev => prev.map(v => v.id === id ? { ...v, status: status as FarmVisit['status'] } : v));
      if (table === 'hall_bookings') setHallBookings(prev => prev.map(h => h.id === id ? { ...h, status: status as HallBooking['status'] } : h));

      await supabase.from('notifications').insert({
        user_id: userId,
        title: `Booking ${status.charAt(0).toUpperCase() + status.slice(1)}`,
        message: `Your ${name} booking has been ${status} by Pasumai Farm. ${status === 'confirmed' ? 'We look forward to hosting you!' : ''}`,
        type: status === 'confirmed' ? 'success' : status === 'cancelled' ? 'error' : 'info',
      });
      showSuccess('Booking updated & customer notified');
    }
  };

  // ── Messages ──
  const markMsgRead = async (msg: ContactMessage, read: boolean) => {
    await supabase.from('contact_messages').update({ is_read: read }).eq('id', msg.id);
    setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, is_read: read } : m));
    setSelectedMsg(prev => prev?.id === msg.id ? { ...prev, is_read: read } : prev);
  };

  const deleteMsg = async (id: string) => {
    if (!confirm('Delete this message?')) return;
    await supabase.from('contact_messages').delete().eq('id', id);
    setMessages(prev => prev.filter(m => m.id !== id));
    setSelectedMsg(null);
  };

  // ── Products ──
  const saveProduct = async () => {
    if (!editProduct) return;
    const imagesArr = imagesInput ? imagesInput.split('\n').map(s => s.trim()).filter(Boolean) : (editProduct.images || []);
    const payload = { ...editProduct, images: imagesArr };
    if (editProduct.id) {
      const { data, error } = await supabase.from('products').update(payload).eq('id', editProduct.id).select().single();
      if (!error && data) { setProducts(prev => prev.map(p => p.id === data.id ? data : p)); showSuccess('Product saved'); }
    } else {
      const { data, error } = await supabase.from('products').insert({ ...payload, is_active: true }).select().single();
      if (!error && data) { setProducts(prev => [data, ...prev]); showSuccess('Product added'); }
    }
    setEditProduct(null);
    setImagesInput('');
  };

  const deleteProduct = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    await supabase.from('products').delete().eq('id', id);
    setProducts(prev => prev.filter(p => p.id !== id));
    showSuccess('Product deleted');
  };

  const toggleProductActive = async (id: string, current: boolean) => {
    await supabase.from('products').update({ is_active: !current }).eq('id', id);
    setProducts(prev => prev.map(p => p.id === id ? { ...p, is_active: !current } : p));
  };

  const updateStock = async (id: string) => {
    const newStock = stockUpdates[id] ?? 0;
    await supabase.from('products').update({ stock: newStock }).eq('id', id);
    setProducts(prev => prev.map(p => p.id === id ? { ...p, stock: newStock } : p));
    showSuccess('Stock updated');
  };

  const openEditProduct = (p: Partial<Product>) => {
    setEditProduct(p);
    setImagesInput((p.images || []).join('\n'));
  };

  // ── Categories ──
  const saveCategory = async () => {
    if (!editCategory?.name) return;
    if (editCategory.id) {
      const { error } = await supabase.from('product_categories').update(editCategory).eq('id', editCategory.id);
      if (!error) { setCategories(prev => prev.map(c => c.id === editCategory.id ? { ...c, ...editCategory } as ProductCategory : c)); showSuccess('Category updated'); }
    } else {
      const { data, error } = await supabase.from('product_categories').insert({ ...editCategory, is_active: true }).select().single();
      if (!error && data) { setCategories(prev => [...prev, data]); showSuccess('Category added'); }
    }
    setEditCategory(null);
  };

  const deleteCategory = async (id: string) => {
    if (!confirm('Delete this category?')) return;
    await supabase.from('product_categories').delete().eq('id', id);
    setCategories(prev => prev.filter(c => c.id !== id));
  };

  // ── Gallery ──
  const addGalleryItem = async () => {
    if (!galleryForm.media_url) return;
    const { data, error } = await supabase.from('gallery_items').insert({
      ...galleryForm, is_active: true, sort_order: gallery.length
    }).select().single();
    if (!error && data) {
      setGallery(prev => [...prev, data]);
      setGalleryForm({ title: '', media_url: '', media_type: 'image', category: '', description: '' });
      showSuccess('Added to gallery');
    }
  };

  const deleteGalleryItem = async (id: string) => {
    await supabase.from('gallery_items').delete().eq('id', id);
    setGallery(prev => prev.filter(g => g.id !== id));
    showSuccess('Removed from gallery');
  };

  // ── Send Notification ──
  const sendNotification = async () => {
    if (!notifForm.title || !notifForm.message) return;
    setNotifSending(true);
    try {
      if (notifForm.user_id) {
        await supabase.from('notifications').insert({ ...notifForm });
      } else {
        const { data: allProfiles } = await supabase.from('profiles').select('id');
        if (allProfiles && allProfiles.length > 0) {
          await supabase.from('notifications').insert(
            allProfiles.map(p => ({ user_id: p.id, title: notifForm.title, message: notifForm.message, type: notifForm.type }))
          );
        }
      }
      setNotifForm({ user_id: '', title: '', message: '', type: 'info' });
      showSuccess('Notification sent!');
    } finally {
      setNotifSending(false);
    }
  };

  const totalRevenue =
    orders.reduce((s, o) => s + Number(o.total_amount), 0) +
    cottageBookings.reduce((s, b) => s + Number(b.total_amount), 0) +
    farmVisits.reduce((s, v) => s + Number(v.total_amount), 0) +
    hallBookings.reduce((s, h) => s + Number(h.total_amount), 0);

  const tabs: { id: AdminTab; label: string; icon: React.ElementType; count?: number }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'orders', label: 'Orders', icon: ShoppingBag, count: orders.filter(o => o.status === 'pending').length },
    { id: 'cottages', label: 'Cottages', icon: Home, count: cottageBookings.filter(b => b.status === 'pending').length },
    { id: 'visits', label: 'Farm Visits', icon: Calendar, count: farmVisits.filter(v => v.status === 'pending').length },
    { id: 'halls', label: 'Halls', icon: Wind, count: hallBookings.filter(h => h.status === 'pending').length },
    { id: 'messages', label: 'Messages', icon: MessageSquare, count: messages.filter(m => !m.is_read).length },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'categories', label: 'Categories', icon: Tag },
    { id: 'gallery', label: 'Gallery', icon: Image },
    { id: 'notifications', label: 'Notify', icon: Bell },
  ];

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    (p.category || '').toLowerCase().includes(productSearch.toLowerCase())
  );

  const filteredOrders = orders.filter(o =>
    o.id.toLowerCase().includes(orderSearch.toLowerCase()) ||
    (o.delivery_name || '').toLowerCase().includes(orderSearch.toLowerCase()) ||
    (o.delivery_phone || '').includes(orderSearch)
  );

  return (
    <div className="min-h-screen bg-stone-50 pt-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-950 to-green-900 text-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-600/40 backdrop-blur rounded-2xl flex items-center justify-center border border-green-500/30">
              <BarChart3 size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-black font-heading">Admin Control Panel</h1>
              <p className="text-green-400 text-sm">Pasumai Integrated Farm — Full Management</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-white font-semibold text-sm">{profile?.full_name || 'Admin'}</p>
              <p className="text-green-400 text-xs">Administrator</p>
            </div>
            <button
              onClick={fetchAll}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
              title="Refresh data"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Success toast */}
      {saveSuccess && (
        <div className="fixed top-24 right-4 z-50 bg-green-600 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 animate-fadeInUp">
          <Check size={16} />
          {saveSuccess}
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white border-b border-stone-200 sticky top-20 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex overflow-x-auto scrollbar-hide">
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-4 py-4 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                  tab === t.id
                    ? 'border-green-600 text-green-700 bg-green-50/50'
                    : 'border-transparent text-stone-500 hover:text-stone-700 hover:bg-stone-50'
                }`}
              >
                <t.icon size={15} />
                {t.label}
                {t.count !== undefined && t.count > 0 && (
                  <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 font-bold min-w-[18px] text-center">
                    {t.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => <div key={i} className="h-28 bg-white rounded-2xl animate-pulse border border-stone-100" />)}
          </div>
        ) : (
          <>
            {/* ── Dashboard ── */}
            {tab === 'dashboard' && (
              <div className="space-y-6">
                {/* KPI Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard label="Total Orders" value={orders.length} sub={`${orders.filter(o => o.status === 'pending').length} pending`} icon={ShoppingBag} color="text-green-700 bg-green-100" onClick={() => setTab('orders')} />
                  <StatCard label="Cottage Bookings" value={cottageBookings.length} sub={`${cottageBookings.filter(b => b.status === 'confirmed').length} confirmed`} icon={Home} color="text-blue-700 bg-blue-100" onClick={() => setTab('cottages')} />
                  <StatCard label="Farm Visits" value={farmVisits.length} sub={`${farmVisits.filter(v => v.status === 'pending').length} pending`} icon={Calendar} color="text-amber-700 bg-amber-100" onClick={() => setTab('visits')} />
                  <StatCard label="Hall Bookings" value={hallBookings.length} sub={`${hallBookings.filter(h => h.status === 'pending').length} pending`} icon={Wind} color="text-indigo-700 bg-indigo-100" onClick={() => setTab('halls')} />
                </div>

                {/* Revenue + Messages */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Revenue Snapshot */}
                  <div className="md:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-stone-100">
                    <div className="flex items-center justify-between mb-5">
                      <h3 className="font-bold text-stone-800 flex items-center gap-2">
                        <TrendingUp size={18} className="text-green-600" /> Revenue Overview
                      </h3>
                      <span className="text-2xl font-black text-green-700">₹{totalRevenue.toLocaleString()}</span>
                    </div>
                    <div className="space-y-3">
                      {[
                        { label: 'Product Orders', amount: orders.reduce((s, o) => s + Number(o.total_amount), 0), color: 'bg-green-500', width: orders.reduce((s, o) => s + Number(o.total_amount), 0) },
                        { label: 'Cottage Stays', amount: cottageBookings.reduce((s, b) => s + Number(b.total_amount), 0), color: 'bg-blue-500', width: cottageBookings.reduce((s, b) => s + Number(b.total_amount), 0) },
                        { label: 'Farm Visits', amount: farmVisits.reduce((s, v) => s + Number(v.total_amount), 0), color: 'bg-amber-500', width: farmVisits.reduce((s, v) => s + Number(v.total_amount), 0) },
                        { label: 'Hall Bookings', amount: hallBookings.reduce((s, h) => s + Number(h.total_amount), 0), color: 'bg-indigo-500', width: hallBookings.reduce((s, h) => s + Number(h.total_amount), 0) },
                      ].map(r => (
                        <div key={r.label}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-stone-600">{r.label}</span>
                            <span className="font-bold text-stone-800">₹{r.amount.toLocaleString()}</span>
                          </div>
                          <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${r.color}`}
                              style={{ width: totalRevenue > 0 ? `${(r.width / totalRevenue) * 100}%` : '0%' }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="space-y-4">
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100">
                      <h3 className="font-bold text-stone-700 text-sm mb-3 flex items-center gap-2">
                        <MessageSquare size={14} className="text-green-600" /> Unread Messages
                      </h3>
                      {messages.filter(m => !m.is_read).slice(0, 3).map(m => (
                        <div
                          key={m.id}
                          className="py-2 border-b border-stone-50 last:border-0 cursor-pointer hover:bg-stone-50 rounded-lg px-2 -mx-2 transition-colors"
                          onClick={() => { setTab('messages'); setSelectedMsg(m); }}
                        >
                          <p className="font-semibold text-stone-800 text-xs">{m.name}</p>
                          <p className="text-stone-400 text-xs truncate">{m.message}</p>
                        </div>
                      ))}
                      {messages.filter(m => !m.is_read).length === 0 && (
                        <p className="text-stone-400 text-xs">No unread messages</p>
                      )}
                      <button onClick={() => setTab('messages')} className="text-green-600 text-xs mt-2 hover:underline flex items-center gap-1">
                        View all <ChevronRight size={10} />
                      </button>
                    </div>
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100">
                      <h3 className="font-bold text-stone-700 text-sm mb-2 flex items-center gap-2">
                        <Package size={14} className="text-green-600" /> Inventory
                      </h3>
                      <p className="text-3xl font-black text-stone-800">{products.filter(p => p.is_active).length}</p>
                      <p className="text-xs text-stone-400">active products</p>
                      {products.filter(p => p.stock === 0 && p.is_active).length > 0 && (
                        <div className="mt-2 flex items-center gap-1 text-red-600 text-xs font-medium">
                          <AlertTriangle size={12} /> {products.filter(p => p.stock === 0 && p.is_active).length} out of stock
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Low stock alert */}
                {products.filter(p => p.stock < 5 && p.is_active).length > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
                    <h3 className="font-bold text-amber-800 mb-3 flex items-center gap-2 text-sm">
                      <AlertTriangle size={16} /> Low Stock Alert — Action Required
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {products.filter(p => p.stock < 5 && p.is_active).map(p => (
                        <button
                          key={p.id}
                          onClick={() => setTab('products')}
                          className={`text-xs px-3 py-1.5 rounded-full font-medium ${p.stock === 0 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800'}`}
                        >
                          {p.name} — {p.stock === 0 ? 'OUT OF STOCK' : `${p.stock} left`}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Orders ── */}
            {tab === 'orders' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="relative flex-1 max-w-sm">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                    <input
                      value={orderSearch}
                      onChange={e => setOrderSearch(e.target.value)}
                      placeholder="Search orders..."
                      className="w-full pl-9 pr-4 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <span className="text-sm text-stone-500">{filteredOrders.length} orders</span>
                </div>
                {filteredOrders.map(order => (
                  <div key={order.id} className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
                    <div className="flex flex-wrap items-start justify-between p-5 gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-bold text-stone-800">#{order.id.slice(0, 8).toUpperCase()}</p>
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColors[order.status]}`}>
                            {order.status}
                          </span>
                        </div>
                        <p className="text-xs text-stone-400">{new Date(order.created_at).toLocaleString('en-IN')}</p>
                        {order.delivery_name && <p className="text-sm text-stone-600 mt-1">{order.delivery_name} • {order.delivery_phone}</p>}
                        {order.delivery_address && <p className="text-xs text-stone-400 mt-0.5 max-w-xs truncate">{order.delivery_address}</p>}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className="font-black text-green-700 text-xl">₹{Number(order.total_amount).toLocaleString()}</span>
                        <select
                          value={order.status}
                          onChange={e => updateOrderStatus(order.id, e.target.value)}
                          className="text-xs px-3 py-1.5 rounded-xl font-medium border border-stone-200 bg-white focus:ring-2 focus:ring-green-500 cursor-pointer"
                        >
                          {statusOptions.orders.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                    </div>
                    {order.order_items && order.order_items.length > 0 && (
                      <div className="px-5 pb-4 border-t border-stone-100 pt-3">
                        <div className="space-y-1">
                          {order.order_items.map(item => (
                            <div key={item.id} className="flex justify-between text-sm text-stone-600">
                              <span>{item.product_name} × {item.quantity}</span>
                              <span className="font-medium text-stone-800">₹{(item.price * item.quantity).toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {filteredOrders.length === 0 && (
                  <div className="text-center py-16 text-stone-400">
                    <ShoppingBag size={40} className="mx-auto mb-3 opacity-50" />
                    <p>No orders found</p>
                  </div>
                )}
              </div>
            )}

            {/* ── Cottage Bookings ── */}
            {tab === 'cottages' && (
              <div className="space-y-4">
                <h2 className="font-bold text-stone-800 text-lg">{cottageBookings.length} Cottage Bookings</h2>
                {cottageBookings.map(b => (
                  <div key={b.id} className="bg-white rounded-2xl border border-stone-100 p-5 shadow-sm">
                    <div className="flex flex-wrap justify-between gap-3 mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-bold text-stone-800">{b.cottage_type}</p>
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColors[b.status]}`}>{b.status}</span>
                        </div>
                        <p className="text-xs text-stone-400">#{b.id.slice(0, 8).toUpperCase()}</p>
                        <p className="text-sm text-stone-600 mt-1">{b.guest_name} • {b.guest_phone}</p>
                        {b.guest_email && <p className="text-xs text-stone-400">{b.guest_email}</p>}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className="font-black text-green-700 text-xl">₹{Number(b.total_amount).toLocaleString()}</span>
                        <select
                          value={b.status}
                          onChange={e => updateBookingStatus('cottage_bookings', b.id, e.target.value, b.user_id, b.cottage_type)}
                          className="text-xs px-3 py-1.5 rounded-xl font-medium border border-stone-200 bg-white focus:ring-2 focus:ring-green-500"
                        >
                          {statusOptions.bookings.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-stone-600 bg-stone-50 rounded-xl p-3">
                      <span>Check-in: <strong>{new Date(b.check_in).toLocaleDateString('en-IN')}</strong></span>
                      <span>Check-out: <strong>{new Date(b.check_out).toLocaleDateString('en-IN')}</strong></span>
                      <span>{b.guests_count} guests</span>
                    </div>
                    {b.special_requests && <p className="text-xs text-stone-500 mt-2 italic">"{b.special_requests}"</p>}
                  </div>
                ))}
              </div>
            )}

            {/* ── Farm Visits ── */}
            {tab === 'visits' && (
              <div className="space-y-4">
                <h2 className="font-bold text-stone-800 text-lg">{farmVisits.length} Farm Visit Bookings</h2>
                {farmVisits.map(v => (
                  <div key={v.id} className="bg-white rounded-2xl border border-stone-100 p-5 shadow-sm">
                    <div className="flex flex-wrap justify-between gap-3 mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-bold text-stone-800">{v.visit_type}</p>
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColors[v.status]}`}>{v.status}</span>
                        </div>
                        <p className="text-xs text-stone-400">#{v.id.slice(0, 8).toUpperCase()}</p>
                        <p className="text-sm text-stone-600 mt-1">{v.visitor_name} • {v.visitor_phone}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className="font-black text-green-700 text-xl">₹{Number(v.total_amount).toLocaleString()}</span>
                        <select
                          value={v.status}
                          onChange={e => updateBookingStatus('farm_visits', v.id, e.target.value, v.user_id, v.visit_type)}
                          className="text-xs px-3 py-1.5 rounded-xl font-medium border border-stone-200 bg-white focus:ring-2 focus:ring-green-500"
                        >
                          {statusOptions.bookings.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-stone-600 bg-stone-50 rounded-xl p-3">
                      <span>Date: <strong>{new Date(v.visit_date).toLocaleDateString('en-IN')}</strong></span>
                      <span>Time: <strong>{v.time_slot}</strong></span>
                      <span>{v.group_size} persons</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── Hall Bookings ── */}
            {tab === 'halls' && (
              <div className="space-y-4">
                <h2 className="font-bold text-stone-800 text-lg">{hallBookings.length} Hall Bookings</h2>
                {hallBookings.map(h => (
                  <div key={h.id} className="bg-white rounded-2xl border border-stone-100 p-5 shadow-sm">
                    <div className="flex flex-wrap justify-between gap-3 mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-bold text-stone-800">
                            {h.hall_type === 'party_hall' ? '🎉 Party Hall' : '💼 Conference Hall'}
                          </p>
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColors[h.status]}`}>{h.status}</span>
                        </div>
                        <p className="text-xs text-stone-400">#{h.id.slice(0, 8).toUpperCase()}</p>
                        <p className="text-sm text-stone-600 mt-1">{h.guest_name} • {h.guest_phone}</p>
                        {h.event_type && <p className="text-xs text-stone-500">Event: {h.event_type}</p>}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className="font-black text-green-700 text-xl">₹{Number(h.total_amount).toLocaleString()}</span>
                        <select
                          value={h.status}
                          onChange={e => updateBookingStatus('hall_bookings', h.id, e.target.value, h.user_id, h.hall_type === 'party_hall' ? 'Party Hall' : 'Conference Hall')}
                          className="text-xs px-3 py-1.5 rounded-xl font-medium border border-stone-200 bg-white focus:ring-2 focus:ring-green-500"
                        >
                          {statusOptions.bookings.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-stone-600 bg-stone-50 rounded-xl p-3">
                      <span>Date: <strong>{new Date(h.event_date).toLocaleDateString('en-IN')}</strong></span>
                      {h.end_date && h.end_date !== h.event_date && (
                        <span>End: <strong>{new Date(h.end_date).toLocaleDateString('en-IN')}</strong></span>
                      )}
                      <span>{h.guest_count} guests</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── Messages ── */}
            {tab === 'messages' && (
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-2 space-y-2">
                  <p className="text-sm font-semibold text-stone-500 mb-3">{messages.length} Messages • {messages.filter(m => !m.is_read).length} unread</p>
                  {messages.map(msg => (
                    <div
                      key={msg.id}
                      className={`bg-white rounded-2xl p-4 shadow-sm border cursor-pointer transition-all hover:border-green-300 ${
                        selectedMsg?.id === msg.id ? 'border-green-500 bg-green-50/30' : msg.is_read ? 'border-stone-100' : 'border-green-200 bg-green-50/20'
                      }`}
                      onClick={() => { setSelectedMsg(msg); if (!msg.is_read) markMsgRead(msg, true); }}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <p className={`font-semibold text-sm ${msg.is_read ? 'text-stone-600' : 'text-stone-800'}`}>{msg.name}</p>
                        <div className="flex items-center gap-2">
                          {!msg.is_read && <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0" />}
                          <span className="text-xs text-stone-400 whitespace-nowrap">{new Date(msg.created_at).toLocaleDateString('en-IN')}</span>
                        </div>
                      </div>
                      <p className="text-xs text-stone-400">{msg.email}</p>
                      {msg.subject && <p className="text-xs font-medium text-stone-600 mt-1 truncate">{msg.subject}</p>}
                      <p className="text-xs text-stone-500 line-clamp-2 mt-1">{msg.message}</p>
                    </div>
                  ))}
                  {messages.length === 0 && (
                    <div className="text-center py-12 text-stone-400">
                      <MessageSquare size={36} className="mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No messages yet</p>
                    </div>
                  )}
                </div>

                {selectedMsg ? (
                  <div className="lg:col-span-3 bg-white rounded-2xl p-6 shadow-sm border border-stone-100 sticky top-28 h-fit">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold text-stone-800 text-lg">{selectedMsg.name}</h3>
                        <p className="text-stone-500 text-sm">{selectedMsg.email}</p>
                        {selectedMsg.phone && <p className="text-stone-400 text-sm">{selectedMsg.phone}</p>}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => markMsgRead(selectedMsg, !selectedMsg.is_read)}
                          className="p-2 rounded-xl hover:bg-stone-100 transition-colors text-stone-500"
                          title={selectedMsg.is_read ? 'Mark unread' : 'Mark read'}
                        >
                          <Eye size={16} />
                        </button>
                        <button onClick={() => deleteMsg(selectedMsg.id)} className="p-2 rounded-xl hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    {selectedMsg.subject && (
                      <div className="mb-3 p-3 bg-stone-50 rounded-xl">
                        <p className="text-xs text-stone-400 font-medium uppercase tracking-wide">Subject</p>
                        <p className="text-stone-700 font-semibold">{selectedMsg.subject}</p>
                      </div>
                    )}
                    <p className="text-stone-700 leading-relaxed whitespace-pre-wrap">{selectedMsg.message}</p>
                    <p className="text-xs text-stone-400 mt-4">{new Date(selectedMsg.created_at).toLocaleString('en-IN')}</p>
                    <div className="flex gap-2 mt-4">
                      <a
                        href={`mailto:${selectedMsg.email}?subject=Re: ${selectedMsg.subject || 'Your inquiry at Pasumai Farm'}`}
                        className="flex-1 btn-primary py-2.5 text-sm text-center"
                      >
                        Reply via Email
                      </a>
                      {selectedMsg.phone && (
                        <a
                          href={`https://wa.me/91${selectedMsg.phone}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 py-2.5 text-sm text-center bg-green-100 text-green-700 rounded-full font-semibold hover:bg-green-200 transition-colors"
                        >
                          WhatsApp
                        </a>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="lg:col-span-3 bg-white rounded-2xl border border-stone-100 flex items-center justify-center h-64 text-stone-300">
                    <div className="text-center">
                      <MessageSquare size={40} className="mx-auto mb-2" />
                      <p className="text-sm">Select a message to read</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Products ── */}
            {tab === 'products' && (
              <div className="space-y-6">
                <div className="flex flex-wrap justify-between items-center gap-3">
                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                    <input
                      value={productSearch}
                      onChange={e => setProductSearch(e.target.value)}
                      placeholder="Search products..."
                      className="pl-9 pr-4 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 w-64"
                    />
                  </div>
                  <button
                    onClick={() => openEditProduct({ ...emptyProduct })}
                    className="btn-primary text-sm py-2.5 px-5 flex items-center gap-2"
                  >
                    <Plus size={14} /> Add Product
                  </button>
                </div>

                {/* Product Edit Form */}
                {editProduct !== null && (
                  <div className="bg-white rounded-2xl p-6 border-2 border-green-200 shadow-sm">
                    <h4 className="font-bold text-stone-800 mb-5 text-lg flex items-center gap-2">
                      <Package size={18} className="text-green-600" />
                      {editProduct.id ? 'Edit Product' : 'Add New Product'}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="text-xs font-semibold text-stone-500 mb-1 block uppercase tracking-wide">Product Name *</label>
                        <input className="w-full px-4 py-3 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="e.g. Taiwan Pink Guava" value={editProduct.name || ''} onChange={e => setEditProduct(p => ({ ...p, name: e.target.value }))} />
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-xs font-semibold text-stone-500 mb-1 block uppercase tracking-wide">Description</label>
                        <textarea className="w-full px-4 py-3 border border-stone-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="Product description..." rows={2} value={editProduct.description || ''} onChange={e => setEditProduct(p => ({ ...p, description: e.target.value }))} />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-stone-500 mb-1 block uppercase tracking-wide">Price (₹) *</label>
                        <input className="w-full px-4 py-3 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500" type="number" min="0" placeholder="0" value={editProduct.price || ''} onChange={e => setEditProduct(p => ({ ...p, price: Number(e.target.value) }))} />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-stone-500 mb-1 block uppercase tracking-wide">Original Price (₹)</label>
                        <input className="w-full px-4 py-3 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500" type="number" min="0" placeholder="For showing discount" value={editProduct.original_price || ''} onChange={e => setEditProduct(p => ({ ...p, original_price: Number(e.target.value) || undefined }))} />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-stone-500 mb-1 block uppercase tracking-wide">Stock Quantity *</label>
                        <input className="w-full px-4 py-3 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500" type="number" min="0" placeholder="0" value={editProduct.stock !== undefined ? editProduct.stock : ''} onChange={e => setEditProduct(p => ({ ...p, stock: Number(e.target.value) }))} />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-stone-500 mb-1 block uppercase tracking-wide">Unit</label>
                        <input className="w-full px-4 py-3 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="kg, bunch, tray, piece" value={editProduct.unit || ''} onChange={e => setEditProduct(p => ({ ...p, unit: e.target.value }))} />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-stone-500 mb-1 block uppercase tracking-wide">Category</label>
                        <select className="w-full px-4 py-3 border border-stone-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500" value={editProduct.category || ''} onChange={e => setEditProduct(p => ({ ...p, category: e.target.value }))}>
                          <option value="">Select category</option>
                          {categories.map(c => <option key={c.id} value={c.name}>{c.icon} {c.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-stone-500 mb-1 block uppercase tracking-wide">Badge Label</label>
                        <input className="w-full px-4 py-3 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="e.g. New, Bestseller, Limited" value={editProduct.badge || ''} onChange={e => setEditProduct(p => ({ ...p, badge: e.target.value }))} />
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-xs font-semibold text-stone-500 mb-1 block uppercase tracking-wide">Main Image URL</label>
                        <input className="w-full px-4 py-3 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="https://..." value={editProduct.image_url || ''} onChange={e => setEditProduct(p => ({ ...p, image_url: e.target.value }))} />
                        {editProduct.image_url && (
                          <img src={editProduct.image_url} alt="preview" className="mt-2 w-20 h-16 object-cover rounded-lg border border-stone-200" onError={e => (e.currentTarget.style.display = 'none')} />
                        )}
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-xs font-semibold text-stone-500 mb-1 block uppercase tracking-wide">Additional Images (one URL per line)</label>
                        <textarea
                          className="w-full px-4 py-3 border border-stone-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
                          placeholder="https://image1.jpg&#10;https://image2.jpg&#10;https://image3.jpg"
                          rows={3}
                          value={imagesInput}
                          onChange={e => setImagesInput(e.target.value)}
                        />
                        {imagesInput && (
                          <div className="flex gap-2 mt-2 flex-wrap">
                            {imagesInput.split('\n').map(u => u.trim()).filter(Boolean).map((url, i) => (
                              <img key={i} src={url} alt="" className="w-14 h-12 object-cover rounded-lg border border-stone-200" onError={e => (e.currentTarget.style.display = 'none')} />
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-xs font-semibold text-stone-500 mb-1 block uppercase tracking-wide">Video URL (optional)</label>
                        <input className="w-full px-4 py-3 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="YouTube or direct video URL" value={editProduct.video_url || ''} onChange={e => setEditProduct(p => ({ ...p, video_url: e.target.value }))} />
                      </div>
                      <div className="md:col-span-2 flex flex-wrap items-center gap-6">
                        <label className="flex items-center gap-2.5 text-sm cursor-pointer">
                          <input type="checkbox" checked={editProduct.is_organic ?? true} onChange={e => setEditProduct(p => ({ ...p, is_organic: e.target.checked }))} className="w-4 h-4 rounded accent-green-600" />
                          <span className="font-medium text-stone-700">Organic Product</span>
                        </label>
                        <label className="flex items-center gap-2.5 text-sm cursor-pointer">
                          <input type="checkbox" checked={editProduct.is_active ?? true} onChange={e => setEditProduct(p => ({ ...p, is_active: e.target.checked }))} className="w-4 h-4 rounded accent-green-600" />
                          <span className="font-medium text-stone-700">Active / Visible in Shop</span>
                        </label>
                      </div>
                    </div>
                    <div className="flex gap-3 mt-6">
                      <button onClick={saveProduct} className="btn-primary text-sm py-3 px-6 flex items-center gap-2">
                        <Save size={14} /> {editProduct.id ? 'Save Changes' : 'Add Product'}
                      </button>
                      <button onClick={() => { setEditProduct(null); setImagesInput(''); }} className="py-3 px-6 border border-stone-200 rounded-full text-sm text-stone-600 hover:bg-stone-50 transition-colors">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Products Table */}
                <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-stone-50 border-b border-stone-200">
                        <tr>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide">Product</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide">Price</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide">
                            <span className="flex items-center gap-1"><ArrowUpDown size={10} />Stock</span>
                          </th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide">Visibility</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredProducts.map(p => (
                          <tr key={p.id} className="border-b border-stone-50 hover:bg-stone-50/60 transition-colors">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                {p.image_url ? (
                                  <img src={p.image_url} alt="" className="w-11 h-11 rounded-xl object-cover flex-shrink-0 border border-stone-100" onError={e => (e.currentTarget.style.display = 'none')} />
                                ) : (
                                  <div className="w-11 h-11 rounded-xl bg-stone-100 flex items-center justify-center flex-shrink-0">
                                    <Package size={16} className="text-stone-400" />
                                  </div>
                                )}
                                <div>
                                  <p className="font-semibold text-stone-800 text-sm">{p.name}</p>
                                  <p className="text-stone-400 text-xs">{p.category || 'No category'}</p>
                                  {p.badge && <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">{p.badge}</span>}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <p className="font-bold text-green-700 text-sm">₹{p.price}/{p.unit}</p>
                              {p.original_price && <p className="text-stone-400 text-xs line-through">₹{p.original_price}</p>}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  min="0"
                                  value={stockUpdates[p.id] ?? p.stock}
                                  onChange={e => setStockUpdates(prev => ({ ...prev, [p.id]: Number(e.target.value) }))}
                                  className={`w-16 px-2 py-1.5 border rounded-lg text-sm text-center focus:outline-none focus:ring-1 focus:ring-green-500 ${
                                    p.stock === 0 ? 'border-red-300 bg-red-50 text-red-700' : p.stock < 5 ? 'border-amber-300 bg-amber-50' : 'border-stone-200'
                                  }`}
                                />
                                <button onClick={() => updateStock(p.id)} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Save stock">
                                  <Check size={14} />
                                </button>
                              </div>
                              {p.stock === 0 && <p className="text-xs text-red-500 mt-0.5 font-medium">OUT OF STOCK</p>}
                            </td>
                            <td className="px-4 py-3">
                              <button
                                onClick={() => toggleProductActive(p.id, p.is_active)}
                                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                                  p.is_active ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                                }`}
                              >
                                {p.is_active ? <ToggleRight size={13} /> : <ToggleLeft size={13} />}
                                {p.is_active ? 'Visible' : 'Hidden'}
                              </button>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex gap-1">
                                <button onClick={() => openEditProduct(p)} className="p-1.5 text-stone-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                                  <Edit size={14} />
                                </button>
                                <button onClick={() => deleteProduct(p.id)} className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {filteredProducts.length === 0 && (
                      <div className="text-center py-12 text-stone-400">
                        <Package size={36} className="mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No products found</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ── Categories ── */}
            {tab === 'categories' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-stone-800 text-lg">Product Categories ({categories.length})</h3>
                  <button onClick={() => setEditCategory({ name: '', icon: '', color: 'green', sort_order: categories.length })} className="btn-primary text-sm py-2.5 px-5 flex items-center gap-2">
                    <Plus size={14} /> Add Category
                  </button>
                </div>

                {editCategory !== null && (
                  <div className="bg-white rounded-2xl p-6 border-2 border-green-200 shadow-sm">
                    <h4 className="font-bold text-stone-800 mb-4 flex items-center gap-2"><Tag size={16} className="text-green-600" /> {editCategory.id ? 'Edit' : 'Add'} Category</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-stone-500 mb-1 block uppercase tracking-wide">Category Name *</label>
                        <input className="w-full px-4 py-3 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="e.g. Fruits" value={editCategory.name || ''} onChange={e => setEditCategory(c => ({ ...c, name: e.target.value }))} />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-stone-500 mb-1 block uppercase tracking-wide">Icon (emoji)</label>
                        <input className="w-full px-4 py-3 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="🍎 🥬 🥚 🐔" value={editCategory.icon || ''} onChange={e => setEditCategory(c => ({ ...c, icon: e.target.value }))} />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-stone-500 mb-1 block uppercase tracking-wide">Color Theme</label>
                        <input className="w-full px-4 py-3 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="green, blue, amber..." value={editCategory.color || ''} onChange={e => setEditCategory(c => ({ ...c, color: e.target.value }))} />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-stone-500 mb-1 block uppercase tracking-wide">Display Order</label>
                        <input className="w-full px-4 py-3 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500" type="number" value={editCategory.sort_order ?? 0} onChange={e => setEditCategory(c => ({ ...c, sort_order: Number(e.target.value) }))} />
                      </div>
                    </div>
                    <div className="flex gap-3 mt-5">
                      <button onClick={saveCategory} className="btn-primary text-sm py-2.5 px-5 flex items-center gap-2"><Save size={14} /> Save</button>
                      <button onClick={() => setEditCategory(null)} className="py-2.5 px-5 border border-stone-200 rounded-full text-sm text-stone-600 hover:bg-stone-50 transition-colors">Cancel</button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {categories.map(cat => (
                    <div key={cat.id} className="bg-white rounded-2xl p-5 border border-stone-100 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-3xl">{cat.icon || '📦'}</span>
                        <div className="flex gap-1">
                          <button onClick={() => setEditCategory(cat)} className="p-1.5 hover:bg-stone-100 rounded-lg text-stone-400 transition-colors"><Edit size={13} /></button>
                          <button onClick={() => deleteCategory(cat.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-400 transition-colors"><Trash2 size={13} /></button>
                        </div>
                      </div>
                      <p className="font-bold text-stone-800">{cat.name}</p>
                      <p className="text-stone-400 text-xs mt-1">Order #{cat.sort_order} • {cat.color}</p>
                      <div className={`mt-2 h-1 rounded-full bg-${cat.color}-400 opacity-60`} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Gallery ── */}
            {tab === 'gallery' && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl p-6 border border-stone-100 shadow-sm">
                  <h3 className="font-bold text-stone-800 mb-5 text-lg flex items-center gap-2">
                    <Upload size={18} className="text-green-600" /> Add Media to Gallery
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-stone-500 mb-1 block uppercase tracking-wide">Title</label>
                      <input className="w-full px-4 py-3 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="e.g. Sunrise at the Farm" value={galleryForm.title} onChange={e => setGalleryForm(f => ({ ...f, title: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-stone-500 mb-1 block uppercase tracking-wide">Category</label>
                      <input className="w-full px-4 py-3 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="Farm, Cottage, Nature, Event..." value={galleryForm.category} onChange={e => setGalleryForm(f => ({ ...f, category: e.target.value }))} />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-xs font-semibold text-stone-500 mb-1 block uppercase tracking-wide">Media URL *</label>
                      <input className="w-full px-4 py-3 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="https://... (image or video URL)" value={galleryForm.media_url} onChange={e => setGalleryForm(f => ({ ...f, media_url: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-stone-500 mb-1 block uppercase tracking-wide">Description</label>
                      <input className="w-full px-4 py-3 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="Short description..." value={galleryForm.description} onChange={e => setGalleryForm(f => ({ ...f, description: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-stone-500 mb-1 block uppercase tracking-wide">Type</label>
                      <div className="flex gap-3">
                        {(['image', 'video'] as const).map(t => (
                          <button
                            key={t}
                            onClick={() => setGalleryForm(f => ({ ...f, media_type: t }))}
                            className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-colors flex-1 justify-center ${
                              galleryForm.media_type === t ? 'bg-green-600 text-white border-green-600' : 'border-stone-200 text-stone-600 hover:border-green-300'
                            }`}
                          >
                            {t === 'image' ? <FileImage size={15} /> : <Video size={15} />}
                            {t === 'image' ? 'Photo' : 'Video'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  {galleryForm.media_url && (
                    <div className="mt-4 p-3 bg-stone-50 rounded-xl border border-stone-200 inline-block">
                      <p className="text-xs text-stone-500 mb-2 font-medium">Preview</p>
                      <img
                        src={galleryForm.media_url}
                        alt="preview"
                        className="w-36 h-28 object-cover rounded-xl border border-stone-200"
                        onError={e => (e.currentTarget.style.display = 'none')}
                      />
                    </div>
                  )}
                  <button
                    onClick={addGalleryItem}
                    disabled={!galleryForm.media_url}
                    className="btn-primary text-sm py-3 px-6 mt-5 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus size={14} /> Add to Gallery
                  </button>
                </div>

                <div>
                  <p className="text-sm font-semibold text-stone-500 mb-4">{gallery.length} items in gallery</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {gallery.map(item => (
                      <div key={item.id} className="relative group rounded-2xl overflow-hidden bg-stone-100 border border-stone-200 shadow-sm" style={{ aspectRatio: '1' }}>
                        <img src={item.media_url} alt={item.title || ''} className="w-full h-full object-cover" onError={e => (e.currentTarget.style.display = 'none')} />
                        {item.media_type === 'video' && (
                          <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm rounded-full p-1.5">
                            <Video size={12} className="text-white" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                          <p className="text-white text-xs text-center truncate w-full">{item.title || item.category || 'Gallery item'}</p>
                          <button
                            onClick={() => deleteGalleryItem(item.id)}
                            className="p-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        {item.category && (
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                            <p className="text-white text-xs truncate">{item.category}</p>
                          </div>
                        )}
                      </div>
                    ))}
                    {gallery.length === 0 && (
                      <div className="col-span-full text-center py-16 text-stone-400">
                        <Image size={40} className="mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No gallery items yet. Add your first photo above!</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ── Notifications ── */}
            {tab === 'notifications' && (
              <div className="max-w-2xl space-y-6">
                <div className="bg-white rounded-2xl p-6 border border-stone-100 shadow-sm">
                  <h3 className="font-bold text-stone-800 text-lg mb-1 flex items-center gap-2">
                    <Send size={18} className="text-green-600" /> Send Customer Notification
                  </h3>
                  <p className="text-stone-400 text-sm mb-5">Leave "User ID" empty to broadcast to all customers.</p>

                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-semibold text-stone-500 mb-1 block uppercase tracking-wide">User ID (optional — leave blank for all)</label>
                      <input
                        className="w-full px-4 py-3 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="Specific user UUID (or leave blank to notify everyone)"
                        value={notifForm.user_id}
                        onChange={e => setNotifForm(f => ({ ...f, user_id: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-stone-500 mb-1 block uppercase tracking-wide">Notification Title *</label>
                      <input
                        className="w-full px-4 py-3 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="e.g. New Harvest Available!"
                        value={notifForm.title}
                        onChange={e => setNotifForm(f => ({ ...f, title: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-stone-500 mb-1 block uppercase tracking-wide">Message *</label>
                      <textarea
                        className="w-full px-4 py-3 border border-stone-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="Write your message to customers..."
                        rows={4}
                        value={notifForm.message}
                        onChange={e => setNotifForm(f => ({ ...f, message: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-stone-500 mb-1 block uppercase tracking-wide">Type</label>
                      <div className="flex flex-wrap gap-2">
                        {(['info', 'success', 'warning', 'error'] as const).map(t => (
                          <button
                            key={t}
                            onClick={() => setNotifForm(f => ({ ...f, type: t }))}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                              notifForm.type === t
                                ? t === 'info' ? 'bg-blue-600 text-white'
                                  : t === 'success' ? 'bg-green-600 text-white'
                                  : t === 'warning' ? 'bg-amber-500 text-white'
                                  : 'bg-red-500 text-white'
                                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                            }`}
                          >
                            {t.charAt(0).toUpperCase() + t.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={sendNotification}
                    disabled={notifSending || !notifForm.title || !notifForm.message}
                    className="btn-primary w-full py-3 mt-5 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <Send size={16} />
                    {notifSending ? 'Sending...' : notifForm.user_id ? 'Send to User' : 'Broadcast to All Customers'}
                  </button>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-2xl p-5">
                  <h4 className="font-bold text-green-800 text-sm mb-2">Quick Templates</h4>
                  <div className="space-y-2">
                    {[
                      { title: 'New Harvest Ready!', message: 'Fresh organic produce from Pasumai Farm is now available! Shop now for the best quality fruits and vegetables.' },
                      { title: 'Weekend Special Offer', message: 'Special discounts this weekend at Pasumai Farm. Book your cottage stay or order fresh organics today!' },
                      { title: 'Booking Reminder', message: 'Your upcoming booking at Pasumai Integrated Farm is confirmed. We look forward to welcoming you!' },
                    ].map(t => (
                      <button
                        key={t.title}
                        onClick={() => setNotifForm(f => ({ ...f, title: t.title, message: t.message }))}
                        className="w-full text-left p-3 bg-white rounded-xl border border-green-100 hover:border-green-300 transition-colors"
                      >
                        <p className="font-semibold text-stone-700 text-sm">{t.title}</p>
                        <p className="text-stone-400 text-xs truncate">{t.message}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
