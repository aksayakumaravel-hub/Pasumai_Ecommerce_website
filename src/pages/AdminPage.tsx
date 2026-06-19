import { useState, useEffect, useRef } from 'react';
import {
  Users, ShoppingBag, Home, Calendar, MessageSquare, Package, Trash2,
  Check, X, Bell, Image, BarChart3, Edit, Wind, Tag, Plus,
  ArrowUpDown, Eye, Upload, RefreshCw, TrendingUp, Star,
  ChevronRight, Search, Save, AlertTriangle,
  Layers, Video, FileImage, ToggleLeft, ToggleRight, Send,
  DollarSign, Loader2, XCircle, UserCog, Building2, Settings
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  supabase, Order, CottageBooking, FarmVisit, HallBooking,
  ContactMessage, Product, GalleryItem, ProductCategory, Profile, Cottage
} from '../lib/supabase';
import { uploadFile, validateFile, compressImage, uploadMultipleFiles, deleteFile } from '../lib/storage';

type AdminPageProps = {
  onNavigate: (page: string) => void;
};

type AdminTab =
  | 'dashboard' | 'orders' | 'cottages' | 'visits' | 'halls'
  | 'messages' | 'products' | 'categories' | 'gallery' | 'notifications'
  | 'users' | 'cottage-manage';

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

const emptyCottage: Partial<Cottage> = {
  name: '', description: '', price_per_night: 0, max_guests: 2,
  images: [], video_url: '', amenities: [],
  rating: 4.8, reviews_count: 0, is_active: true, sort_order: 0,
};

function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed top-24 right-4 z-50 px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 animate-fadeInUp ${
      type === 'success' ? 'bg-green-600 text-white' : 'bg-red-500 text-white'
    }`}>
      {type === 'success' ? <Check size={16} /> : <X size={16} />}
      {message}
      <button onClick={onClose} className="ml-2 hover:opacity-70">
        <X size={14} />
      </button>
    </div>
  );
}

function ImageUploader({
  bucket,
  currentUrl,
  onUpload,
  label = 'Upload Image',
  multiple = false,
}: {
  bucket: 'product-images' | 'gallery' | 'cottage-images' | 'hall-images';
  currentUrl?: string;
  onUpload: (urls: string[]) => void;
  label?: string;
  multiple?: boolean;
}) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    setUploading(true);
    try {
      const urls: string[] = [];
      for (const file of fileArray) {
        const validation = validateFile(file, { maxSizeMB: 10 });
        if (!validation.valid) {
          alert(validation.error);
          continue;
        }
        const compressed = await compressImage(file);
        const result = await uploadFile(bucket, compressed);
        if (result.success && result.url) {
          urls.push(result.url);
        }
      }
      if (urls.length > 0) {
        onUpload(urls);
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide">{label}</label>
      <div
        className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer ${
          dragOver ? 'border-green-500 bg-green-50' : 'border-stone-200 hover:border-green-300'
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          multiple={multiple}
          accept="image/*"
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
        {uploading ? (
          <div className="flex items-center justify-center gap-2 text-stone-500">
            <Loader2 size={24} className="animate-spin" />
            Uploading...
          </div>
        ) : currentUrl && !multiple ? (
          <div className="relative inline-block">
            <img src={currentUrl} alt="Preview" className="w-32 h-24 object-cover rounded-lg" />
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity rounded-lg">
              <Upload size={20} className="text-white" />
            </div>
          </div>
        ) : (
          <div className="text-stone-400">
            <Upload size={24} className="mx-auto mb-2" />
            <p className="text-sm">Drag & drop or click to upload</p>
            <p className="text-xs mt-1">Max 10MB • JPG, PNG, WebP</p>
          </div>
        )}
      </div>
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
  const [users, setUsers] = useState<Profile[]>([]);
  const [cottages, setCottages] = useState<Cottage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMsg, setSelectedMsg] = useState<ContactMessage | null>(null);
  const [editProduct, setEditProduct] = useState<Partial<Product> | null>(null);
  const [editCategory, setEditCategory] = useState<Partial<ProductCategory> | null>(null);
  const [editCottage, setEditCottage] = useState<Partial<Cottage> | null>(null);
  const [galleryForm, setGalleryForm] = useState({ title: '', media_url: '', media_type: 'image', category: '', description: '' });
  const [notifForm, setNotifForm] = useState({ user_id: '', title: '', message: '', type: 'info' });
  const [stockUpdates, setStockUpdates] = useState<Record<string, number>>({});
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [productSearch, setProductSearch] = useState('');
  const [orderSearch, setOrderSearch] = useState('');
  const [imagesInput, setImagesInput] = useState('');
  const [amenitiesInput, setAmenitiesInput] = useState('');

  useEffect(() => {
    if (!user || profile?.role !== 'admin') return;
    fetchAll();
  }, [user, profile]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
  };

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [ordRes, cotRes, visRes, halRes, msgRes, prodRes, catRes, galRes, userRes, cottageRes] = await Promise.all([
        supabase.from('orders').select('*, order_items(*)').order('created_at', { ascending: false }),
        supabase.from('cottage_bookings').select('*').order('created_at', { ascending: false }),
        supabase.from('farm_visits').select('*').order('created_at', { ascending: false }),
        supabase.from('hall_bookings').select('*').order('created_at', { ascending: false }),
        supabase.from('contact_messages').select('*').order('created_at', { ascending: false }),
        supabase.from('products').select('*').order('created_at', { ascending: false }),
        supabase.from('product_categories').select('*').order('sort_order', { ascending: true }),
        supabase.from('gallery_items').select('*').order('sort_order', { ascending: true }),
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('cottages').select('*').order('sort_order', { ascending: true }),
      ]);
      setOrders(ordRes.data || []);
      setCottageBookings(cotRes.data || []);
      setFarmVisits(visRes.data || []);
      setHallBookings(halRes.data || []);
      setMessages(msgRes.data || []);
      setProducts(prodRes.data || []);
      setCategories(catRes.data || []);
      setGallery(galRes.data || []);
      setUsers(userRes.data || []);
      setCottages(cottageRes.data || []);
      const stockInit: Record<string, number> = {};
      (prodRes.data || []).forEach((p: Product) => { stockInit[p.id] = p.stock; });
      setStockUpdates(stockInit);
    } finally {
      setLoading(false);
    }
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

  const updateOrderStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('orders').update({ status }).eq('id', id);
    if (!error) {
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status: status as Order['status'] } : o));
      showToast('Order status updated');
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
        message: `Your ${name} booking has been ${status} by Pasumai Farm.`,
        type: status === 'confirmed' ? 'success' : status === 'cancelled' ? 'error' : 'info',
      });
      showToast('Booking updated & customer notified');
    }
  };

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
    showToast('Message deleted');
  };

  const saveProduct = async () => {
    if (!editProduct) return;
    const imagesArr = imagesInput ? imagesInput.split('\n').map(s => s.trim()).filter(Boolean) : (editProduct.images || []);
    const payload = { ...editProduct, images: imagesArr };
    if (editProduct.id) {
      const { data, error } = await supabase.from('products').update(payload).eq('id', editProduct.id).select().single();
      if (!error && data) { setProducts(prev => prev.map(p => p.id === data.id ? data : p)); showToast('Product saved'); }
    } else {
      const { data, error } = await supabase.from('products').insert({ ...payload, is_active: true }).select().single();
      if (!error && data) { setProducts(prev => [data, ...prev]); showToast('Product added'); }
    }
    setEditProduct(null);
    setImagesInput('');
  };

  const deleteProduct = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    await supabase.from('products').delete().eq('id', id);
    setProducts(prev => prev.filter(p => p.id !== id));
    showToast('Product deleted');
  };

  const toggleProductActive = async (id: string, current: boolean) => {
    await supabase.from('products').update({ is_active: !current }).eq('id', id);
    setProducts(prev => prev.map(p => p.id === id ? { ...p, is_active: !current } : p));
  };

  const updateStock = async (id: string) => {
    const newStock = stockUpdates[id] ?? 0;
    await supabase.from('products').update({ stock: newStock }).eq('id', id);
    setProducts(prev => prev.map(p => p.id === id ? { ...p, stock: newStock } : p));
    showToast('Stock updated');
  };

  const openEditProduct = (p: Partial<Product>) => {
    setEditProduct(p);
    setImagesInput((p.images || []).join('\n'));
  };

  const saveCategory = async () => {
    if (!editCategory?.name) return;
    if (editCategory.id) {
      await supabase.from('product_categories').update(editCategory).eq('id', editCategory.id);
      setCategories(prev => prev.map(c => c.id === editCategory.id ? { ...c, ...editCategory } as ProductCategory : c));
      showToast('Category updated');
    } else {
      const { data, error } = await supabase.from('product_categories').insert({ ...editCategory, is_active: true }).select().single();
      if (!error && data) { setCategories(prev => [...prev, data]); showToast('Category added'); }
    }
    setEditCategory(null);
  };

  const deleteCategory = async (id: string) => {
    if (!confirm('Delete this category?')) return;
    await supabase.from('product_categories').delete().eq('id', id);
    setCategories(prev => prev.filter(c => c.id !== id));
  };

  const addGalleryItem = async () => {
    if (!galleryForm.media_url) return;
    const { data, error } = await supabase.from('gallery_items').insert({
      ...galleryForm, is_active: true, sort_order: gallery.length
    }).select().single();
    if (!error && data) {
      setGallery(prev => [...prev, data]);
      setGalleryForm({ title: '', media_url: '', media_type: 'image', category: '', description: '' });
      showToast('Added to gallery');
    }
  };

  const deleteGalleryItem = async (id: string) => {
    await supabase.from('gallery_items').delete().eq('id', id);
    setGallery(prev => prev.filter(g => g.id !== id));
    showToast('Removed from gallery');
  };

  const sendNotification = async () => {
    if (!notifForm.title || !notifForm.message) return;
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
      showToast('Notification sent!');
    } catch (err) {
      showToast('Failed to send notification', 'error');
    }
  };

  // Cottage management
  const saveCottage = async () => {
    if (!editCottage?.name) return;
    const amenitiesArr = amenitiesInput ? amenitiesInput.split(',').map(s => s.trim()).filter(Boolean) : (editCottage.amenities || []);
    const payload = { ...editCottage, amenities: amenitiesArr };

    if (editCottage.id) {
      const { data, error } = await supabase.from('cottages').update(payload).eq('id', editCottage.id).select().single();
      if (!error && data) { setCottages(prev => prev.map(c => c.id === data.id ? data : c)); showToast('Cottage saved'); }
    } else {
      const { data, error } = await supabase.from('cottages').insert({ ...payload, is_active: true }).select().single();
      if (!error && data) { setCottages(prev => [...prev, data]); showToast('Cottage added'); }
    }
    setEditCottage(null);
    setAmenitiesInput('');
  };

  const deleteCottage = async (id: string) => {
    if (!confirm('Delete this cottage?')) return;
    await supabase.from('cottages').delete().eq('id', id);
    setCottages(prev => prev.filter(c => c.id !== id));
    showToast('Cottage deleted');
  };

  // User role update
  const updateUserRole = async (id: string, role: 'customer' | 'admin') => {
    await supabase.from('profiles').update({ role }).eq('id', id);
    setUsers(prev => prev.map(u => u.id === id ? { ...u, role } : u));
    showToast('User role updated');
  };

  const totalRevenue =
    orders.reduce((s, o) => s + Number(o.total_amount), 0) +
    cottageBookings.reduce((s, b) => s + Number(b.total_amount), 0) +
    farmVisits.reduce((s, v) => s + Number(v.total_amount), 0) +
    hallBookings.reduce((s, h) => s + Number(h.total_amount), 0);

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    (p.category || '').toLowerCase().includes(productSearch.toLowerCase())
  );

  const filteredOrders = orders.filter(o =>
    o.id.toLowerCase().includes(orderSearch.toLowerCase()) ||
    (o.delivery_name || '').toLowerCase().includes(orderSearch.toLowerCase()) ||
    (o.delivery_phone || '').includes(orderSearch)
  );

  const tabs: { id: AdminTab; label: string; icon: React.ElementType; count?: number }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'orders', label: 'Orders', icon: ShoppingBag, count: orders.filter(o => o.status === 'pending').length },
    { id: 'cottages', label: 'Cottage Bookings', icon: Calendar, count: cottageBookings.filter(b => b.status === 'pending').length },
    { id: 'cottage-manage', label: 'Manage Cottages', icon: Building2 },
    { id: 'visits', label: 'Farm Visits', icon: Calendar, count: farmVisits.filter(v => v.status === 'pending').length },
    { id: 'halls', label: 'Halls', icon: Wind, count: hallBookings.filter(h => h.status === 'pending').length },
    { id: 'messages', label: 'Messages', icon: MessageSquare, count: messages.filter(m => !m.is_read).length },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'categories', label: 'Categories', icon: Tag },
    { id: 'gallery', label: 'Gallery', icon: Image },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'notifications', label: 'Notify', icon: Bell },
  ];

  return (
    <div className="min-h-screen bg-stone-50 pt-20">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="bg-gradient-to-r from-green-950 to-green-900 text-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-600/40 backdrop-blur rounded-2xl flex items-center justify-center border border-green-500/30">
              <Settings size={22} />
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
            <button onClick={fetchAll} className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors" title="Refresh">
              <RefreshCw size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-stone-200 sticky top-20 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 overflow-x-auto scrollbar-hide">
          <div className="flex">
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
                <span className="hidden sm:inline">{t.label}</span>
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
          <div className="flex items-center justify-center py-20">
            <Loader2 size={40} className="animate-spin text-green-600" />
          </div>
        ) : (
          <>
            {/* DASHBOARD */}
            {tab === 'dashboard' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-3 text-green-700 bg-green-100">
                      <DollarSign size={20} />
                    </div>
                    <p className="text-3xl font-black text-stone-800">₹{totalRevenue.toLocaleString()}</p>
                    <p className="text-stone-500 text-sm mt-0.5">Total Revenue</p>
                  </div>
                  <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setTab('orders')}>
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-3 text-blue-700 bg-blue-100">
                      <ShoppingBag size={20} />
                    </div>
                    <p className="text-3xl font-black text-stone-800">{orders.length}</p>
                    <p className="text-stone-500 text-sm mt-0.5">Total Orders</p>
                    <p className="text-xs text-stone-400">{orders.filter(o => o.payment_status === 'paid').length} paid</p>
                  </div>
                  <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setTab('products')}>
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-3 text-amber-700 bg-amber-100">
                      <Package size={20} />
                    </div>
                    <p className="text-3xl font-black text-stone-800">{products.filter(p => p.is_active).length}</p>
                    <p className="text-stone-500 text-sm mt-0.5">Active Products</p>
                  </div>
                  <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setTab('users')}>
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-3 text-purple-700 bg-purple-100">
                      <Users size={20} />
                    </div>
                    <p className="text-3xl font-black text-stone-800">{users.length}</p>
                    <p className="text-stone-500 text-sm mt-0.5">Registered Users</p>
                    <p className="text-xs text-stone-400">{users.filter(u => u.role === 'admin').length} admins</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { label: 'Cottage Bookings', value: cottageBookings.length, pending: cottageBookings.filter(b => b.status === 'pending').length, icon: Home, color: 'green', tab: 'cottages' as AdminTab },
                    { label: 'Farm Visits', value: farmVisits.length, pending: farmVisits.filter(v => v.status === 'pending').length, icon: Calendar, color: 'amber', tab: 'visits' as AdminTab },
                    { label: 'Hall Bookings', value: hallBookings.length, pending: hallBookings.filter(h => h.status === 'pending').length, icon: Wind, color: 'indigo', tab: 'halls' as AdminTab },
                  ].map(s => (
                    <div key={s.label} className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setTab(s.tab)}>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 text-${s.color}-700 bg-${s.color}-100`}>
                        <s.icon size={18} />
                      </div>
                      <p className="text-2xl font-black text-stone-800">{s.value}</p>
                      <p className="text-stone-500 text-sm">{s.label}</p>
                      {s.pending > 0 && (
                        <p className="text-xs text-amber-600 font-medium mt-1">{s.pending} pending approval</p>
                      )}
                    </div>
                  ))}
                </div>

                {/* Recent Orders */}
                <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-stone-100 flex justify-between items-center">
                    <h3 className="font-bold text-stone-800">Recent Orders</h3>
                    <button onClick={() => setTab('orders')} className="text-green-600 text-sm hover:underline">View all</button>
                  </div>
                  <div className="divide-y divide-stone-50">
                    {orders.slice(0, 5).map(order => (
                      <div key={order.id} className="px-5 py-3 flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-stone-800 text-sm">#{order.id.slice(0, 8).toUpperCase()}</p>
                          <p className="text-xs text-stone-500">{order.delivery_name}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-black text-green-700">₹{Number(order.total_amount).toLocaleString()}</span>
                          <span className={`text-xs px-2 py-1 rounded-full ${statusColors[order.status]}`}>{order.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Low Stock Alert */}
                {products.filter(p => p.stock < 5 && p.is_active).length > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
                    <h3 className="font-bold text-amber-800 mb-3 flex items-center gap-2 text-sm">
                      <AlertTriangle size={16} /> Low Stock Alert
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {products.filter(p => p.stock < 5 && p.is_active).map(p => (
                        <button key={p.id} onClick={() => setTab('products')} className={`text-xs px-3 py-1.5 rounded-full font-medium ${p.stock === 0 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800'}`}>
                          {p.name} — {p.stock === 0 ? 'OUT' : `${p.stock} left`}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ORDERS */}
            {tab === 'orders' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="relative flex-1 max-w-sm">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                    <input value={orderSearch} onChange={e => setOrderSearch(e.target.value)} placeholder="Search orders..." className="w-full pl-9 pr-4 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                  </div>
                  <span className="text-sm text-stone-500">{filteredOrders.length} orders</span>
                </div>
                {filteredOrders.map(order => (
                  <div key={order.id} className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
                    <div className="flex flex-wrap items-start justify-between p-5 gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-bold text-stone-800">#{order.id.slice(0, 8).toUpperCase()}</p>
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColors[order.status]}`}>{order.status}</span>
                          {order.payment_status === 'paid' && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Paid</span>
                          )}
                        </div>
                        <p className="text-xs text-stone-400">{new Date(order.created_at).toLocaleString('en-IN')}</p>
                        {order.delivery_name && <p className="text-sm text-stone-600 mt-1">{order.delivery_name} • {order.delivery_phone}</p>}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className="font-black text-green-700 text-xl">₹{Number(order.total_amount).toLocaleString()}</span>
                        <select value={order.status} onChange={e => updateOrderStatus(order.id, e.target.value)} className="text-xs px-3 py-1.5 rounded-xl font-medium border border-stone-200 bg-white focus:ring-2 focus:ring-green-500">
                          {statusOptions.orders.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                    </div>
                    {order.order_items && order.order_items.length > 0 && (
                      <div className="px-5 pb-4 border-t border-stone-100 pt-3">
                        {order.order_items.map(item => (
                          <div key={item.id} className="flex justify-between text-sm text-stone-600 py-0.5">
                            <span>{item.product_name} × {item.quantity}</span>
                            <span className="font-medium">₹{(item.price * item.quantity).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* COTTAGE BOOKINGS */}
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
                          {b.payment_status === 'paid' && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Paid</span>}
                        </div>
                        <p className="text-xs text-stone-400">#{b.id.slice(0, 8).toUpperCase()}</p>
                        <p className="text-sm text-stone-600 mt-1">{b.guest_name} • {b.guest_phone}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className="font-black text-green-700 text-xl">₹{Number(b.total_amount).toLocaleString()}</span>
                        <select value={b.status} onChange={e => updateBookingStatus('cottage_bookings', b.id, e.target.value, b.user_id, b.cottage_type)} className="text-xs px-3 py-1.5 rounded-xl font-medium border border-stone-200 bg-white">
                          {statusOptions.bookings.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-stone-600 bg-stone-50 rounded-xl p-3">
                      <span>Check-in: <strong>{new Date(b.check_in).toLocaleDateString('en-IN')}</strong></span>
                      <span>Check-out: <strong>{new Date(b.check_out).toLocaleDateString('en-IN')}</strong></span>
                      <span>{b.guests_count} guests</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* MANAGE COTTAGES */}
            {tab === 'cottage-manage' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="font-bold text-stone-800 text-lg">{cottages.length} Cottages</h2>
                  <button onClick={() => { setEditCottage({ ...emptyCottage }); setAmenitiesInput(''); }} className="btn-primary text-sm py-2.5 px-5 flex items-center gap-2">
                    <Plus size={14} /> Add Cottage
                  </button>
                </div>

                {editCottage && (
                  <div className="bg-white rounded-2xl p-6 border-2 border-green-200 shadow-sm">
                    <h4 className="font-bold text-stone-800 mb-5">{editCottage.id ? 'Edit' : 'Add'} Cottage</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input className="px-4 py-3 border border-stone-200 rounded-xl text-sm" placeholder="Cottage Name *" value={editCottage.name || ''} onChange={e => setEditCottage(c => ({ ...c, name: e.target.value }))} />
                      <input className="px-4 py-3 border border-stone-200 rounded-xl text-sm" type="number" placeholder="Price per Night (₹) *" value={editCottage.price_per_night ?? ''} onChange={e => setEditCottage(c => ({ ...c, price_per_night: Number(e.target.value) }))} />
                      <input className="px-4 py-3 border border-stone-200 rounded-xl text-sm" type="number" placeholder="Max Guests" value={editCottage.max_guests || ''} onChange={e => setEditCottage(c => ({ ...c, max_guests: Number(e.target.value) }))} />
                      <input className="px-4 py-3 border border-stone-200 rounded-xl text-sm" type="number" placeholder="Sort Order" value={editCottage.sort_order ?? ''} onChange={e => setEditCottage(c => ({ ...c, sort_order: Number(e.target.value) }))} />
                      <textarea className="px-4 py-3 border border-stone-200 rounded-xl text-sm md:col-span-2 resize-none" placeholder="Description" rows={2} value={editCottage.description || ''} onChange={e => setEditCottage(c => ({ ...c, description: e.target.value }))} />
                      <input className="px-4 py-3 border border-stone-200 rounded-xl text-sm" placeholder="Video URL (optional)" value={editCottage.video_url || ''} onChange={e => setEditCottage(c => ({ ...c, video_url: e.target.value }))} />
                      <input className="px-4 py-3 border border-stone-200 rounded-xl text-sm" placeholder="Amenities (comma separated)" value={amenitiesInput} onChange={e => setAmenitiesInput(e.target.value)} />
                      <div className="md:col-span-2 flex items-center gap-4">
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                          <input type="checkbox" checked={editCottage.is_active ?? true} onChange={e => setEditCottage(c => ({ ...c, is_active: e.target.checked }))} className="rounded accent-green-600" />
                          Active & Visible
                        </label>
                      </div>
                    </div>
                    <div className="mt-4">
                      <ImageUploader
                        bucket="cottage-images"
                        multiple
                        onUpload={(urls) => setEditCottage(c => c ? { ...c, images: [...(c.images || []), ...urls] } : c)}
                        label="Add Cottage Images"
                      />
                      {editCottage.images && editCottage.images.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {editCottage.images.map((img, i) => (
                            <div key={i} className="relative">
                              <img src={img} alt="" className="w-20 h-16 object-cover rounded-lg" />
                              <button onClick={() => setEditCottage(c => c ? { ...c, images: c.images?.filter((_, idx) => idx !== i) } : c)} className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs">
                                <X size={10} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-3 mt-5">
                      <button onClick={saveCottage} className="btn-primary text-sm py-2.5 px-6 flex items-center gap-2">
                        <Save size={14} /> {editCottage.id ? 'Save' : 'Add Cottage'}
                      </button>
                      <button onClick={() => setEditCottage(null)} className="py-2.5 px-6 border border-stone-200 rounded-full text-sm text-stone-600 hover:bg-stone-50">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {cottages.map(c => (
                    <div key={c.id} className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
                      {c.images?.[0] && <img src={c.images[0]} alt={c.name} className="w-full h-40 object-cover" />}
                      <div className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-bold text-stone-800">{c.name}</p>
                            <p className="text-green-700 font-bold">₹{c.price_per_night.toLocaleString()}/night</p>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full ${c.is_active ? 'bg-green-100 text-green-700' : 'bg-stone-100 text-stone-500'}`}>
                            {c.is_active ? 'Active' : 'Hidden'}
                          </span>
                        </div>
                        <p className="text-xs text-stone-500 mb-3">{c.max_guests} guests • {c.rating} ⭐</p>
                        <div className="flex gap-2">
                          <button onClick={() => { setEditCottage(c); setAmenitiesInput(c.amenities?.join(', ') || ''); }} className="flex-1 py-2 bg-stone-100 text-stone-600 rounded-lg text-sm font-medium hover:bg-stone-200 transition-colors">
                            Edit
                          </button>
                          <button onClick={() => deleteCottage(c.id)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* FARM VISITS */}
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
                        <p className="text-sm text-stone-600">{v.visitor_name} • {v.visitor_phone}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className="font-black text-green-700">₹{Number(v.total_amount).toLocaleString()}</span>
                        <select value={v.status} onChange={e => updateBookingStatus('farm_visits', v.id, e.target.value, v.user_id, v.visit_type)} className="text-xs px-3 py-1.5 rounded-xl font-medium border border-stone-200 bg-white">
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

            {/* HALL BOOKINGS */}
            {tab === 'halls' && (
              <div className="space-y-4">
                <h2 className="font-bold text-stone-800 text-lg">{hallBookings.length} Hall Bookings</h2>
                {hallBookings.map(h => (
                  <div key={h.id} className="bg-white rounded-2xl border border-stone-100 p-5 shadow-sm">
                    <div className="flex flex-wrap justify-between gap-3 mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-bold text-stone-800">{h.hall_type === 'party_hall' ? 'Party Hall' : 'Conference Hall'}</p>
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColors[h.status]}`}>{h.status}</span>
                        </div>
                        <p className="text-sm text-stone-600">{h.guest_name} • {h.guest_phone}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className="font-black text-green-700">₹{Number(h.total_amount).toLocaleString()}</span>
                        <select value={h.status} onChange={e => updateBookingStatus('hall_bookings', h.id, e.target.value, h.user_id, h.hall_type === 'party_hall' ? 'Party Hall' : 'Conference Hall')} className="text-xs px-3 py-1.5 rounded-xl font-medium border border-stone-200 bg-white">
                          {statusOptions.bookings.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-stone-600 bg-stone-50 rounded-xl p-3">
                      <span>Date: <strong>{new Date(h.event_date).toLocaleDateString('en-IN')}</strong></span>
                      <span>{h.guest_count} guests</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* MESSAGES */}
            {tab === 'messages' && (
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-2 space-y-2">
                  <p className="text-sm font-semibold text-stone-500 mb-3">{messages.length} Messages</p>
                  {messages.map(msg => (
                    <div key={msg.id} className={`bg-white rounded-2xl p-4 shadow-sm border cursor-pointer transition-all hover:border-green-300 ${selectedMsg?.id === msg.id ? 'border-green-500' : msg.is_read ? 'border-stone-100' : 'border-green-200 bg-green-50/20'}`} onClick={() => { setSelectedMsg(msg); if (!msg.is_read) markMsgRead(msg, true); }}>
                      <div className="flex justify-between items-start mb-1">
                        <p className={`font-semibold text-sm ${msg.is_read ? 'text-stone-600' : 'text-stone-800'}`}>{msg.name}</p>
                        {!msg.is_read && <div className="w-2 h-2 bg-green-500 rounded-full" />}
                      </div>
                      <p className="text-xs text-stone-400">{msg.email}</p>
                      <p className="text-xs text-stone-500 line-clamp-2 mt-1">{msg.message}</p>
                    </div>
                  ))}
                </div>
                {selectedMsg && (
                  <div className="lg:col-span-3 bg-white rounded-2xl p-6 shadow-sm border border-stone-100 sticky top-28">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold text-stone-800">{selectedMsg.name}</h3>
                        <p className="text-stone-400 text-sm">{selectedMsg.email}</p>
                      </div>
                      <button onClick={() => deleteMsg(selectedMsg.id)} className="p-2 hover:bg-red-50 rounded-lg text-red-400 hover:text-red-600">
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <p className="text-stone-700 leading-relaxed">{selectedMsg.message}</p>
                    <p className="text-xs text-stone-400 mt-4">{new Date(selectedMsg.created_at).toLocaleString('en-IN')}</p>
                    <div className="flex gap-2 mt-4">
                      <a href={`mailto:${selectedMsg.email}`} className="flex-1 btn-primary py-2.5 text-sm text-center">Reply via Email</a>
                      {selectedMsg.phone && <a href={`https://wa.me/91${selectedMsg.phone}`} target="_blank" rel="noopener noreferrer" className="flex-1 py-2.5 text-sm text-center bg-green-100 text-green-700 rounded-full font-semibold hover:bg-green-200">WhatsApp</a>}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* PRODUCTS */}
            {tab === 'products' && (
              <div className="space-y-6">
                <div className="flex flex-wrap justify-between items-center gap-3">
                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                    <input value={productSearch} onChange={e => setProductSearch(e.target.value)} placeholder="Search products..." className="pl-9 pr-4 py-2.5 border border-stone-200 rounded-xl text-sm w-64" />
                  </div>
                  <button onClick={() => openEditProduct({ ...emptyProduct })} className="btn-primary text-sm py-2.5 px-5 flex items-center gap-2"><Plus size={14} /> Add Product</button>
                </div>

                {editProduct && (
                  <div className="bg-white rounded-2xl p-6 border-2 border-green-200 shadow-sm">
                    <h4 className="font-bold text-stone-800 mb-5">{editProduct.id ? 'Edit' : 'Add'} Product</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input className="px-4 py-3 border border-stone-200 rounded-xl text-sm" placeholder="Product Name *" value={editProduct.name || ''} onChange={e => setEditProduct(p => ({ ...p, name: e.target.value }))} />
                      <input className="px-4 py-3 border border-stone-200 rounded-xl text-sm" type="number" placeholder="Price (₹) *" value={editProduct.price || ''} onChange={e => setEditProduct(p => ({ ...p, price: Number(e.target.value) }))} />
                      <input className="px-4 py-3 border border-stone-200 rounded-xl text-sm" type="number" placeholder="Stock *" value={editProduct.stock ?? ''} onChange={e => setEditProduct(p => ({ ...p, stock: Number(e.target.value) }))} />
                      <input className="px-4 py-3 border border-stone-200 rounded-xl text-sm" placeholder="Unit (kg, bunch, tray)" value={editProduct.unit || ''} onChange={e => setEditProduct(p => ({ ...p, unit: e.target.value }))} />
                      <select className="px-4 py-3 border border-stone-200 rounded-xl text-sm bg-white" value={editProduct.category || ''} onChange={e => setEditProduct(p => ({ ...p, category: e.target.value }))}>
                        <option value="">Category</option>
                        {categories.map(c => <option key={c.id} value={c.name}>{c.icon} {c.name}</option>)}
                      </select>
                      <input className="px-4 py-3 border border-stone-200 rounded-xl text-sm" placeholder="Badge (New, Bestseller)" value={editProduct.badge || ''} onChange={e => setEditProduct(p => ({ ...p, badge: e.target.value }))} />
                      <textarea className="px-4 py-3 border border-stone-200 rounded-xl text-sm md:col-span-2 resize-none" placeholder="Description" rows={2} value={editProduct.description || ''} onChange={e => setEditProduct(p => ({ ...p, description: e.target.value }))} />
                    </div>

                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <ImageUploader bucket="product-images" currentUrl={editProduct.image_url} onUpload={([url]) => setEditProduct(p => p ? { ...p, image_url: url } : p)} label="Main Product Image" />
                      <div>
                        <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide block mb-3">Additional Images (URLs)</label>
                        <textarea className="w-full px-4 py-3 border border-stone-200 rounded-xl text-sm resize-none" placeholder="One URL per line" rows={3} value={imagesInput} onChange={e => setImagesInput(e.target.value)} />
                      </div>
                    </div>

                    <div className="flex items-center gap-6 mt-4">
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input type="checkbox" checked={editProduct.is_organic ?? true} onChange={e => setEditProduct(p => ({ ...p, is_organic: e.target.checked }))} className="rounded accent-green-600" />
                        Organic
                      </label>
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input type="checkbox" checked={editProduct.is_active ?? true} onChange={e => setEditProduct(p => ({ ...p, is_active: e.target.checked }))} className="rounded accent-green-600" />
                        Active
                      </label>
                    </div>

                    <div className="flex gap-3 mt-5">
                      <button onClick={saveProduct} className="btn-primary text-sm py-2.5 px-6 flex items-center gap-2"><Save size={14} /> Save</button>
                      <button onClick={() => setEditProduct(null)} className="py-2.5 px-6 border border-stone-200 rounded-full text-sm text-stone-600 hover:bg-stone-50">Cancel</button>
                    </div>
                  </div>
                )}

                <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden shadow-sm">
                  <table className="w-full">
                    <thead className="bg-stone-50 border-b border-stone-200">
                      <tr>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-stone-500 uppercase">Product</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-stone-500 uppercase">Price</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-stone-500 uppercase">Stock</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-stone-500 uppercase">Status</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-stone-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.map(p => (
                        <tr key={p.id} className="border-b border-stone-50 hover:bg-stone-50/60">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              {p.image_url && <img src={p.image_url} alt="" className="w-10 h-10 rounded-xl object-cover" />}
                              <div>
                                <p className="font-semibold text-stone-800 text-sm">{p.name}</p>
                                <p className="text-stone-400 text-xs">{p.category}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 font-bold text-green-700 text-sm">₹{p.price}/{p.unit}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <input type="number" min="0" value={stockUpdates[p.id] ?? p.stock} onChange={e => setStockUpdates(prev => ({ ...prev, [p.id]: Number(e.target.value) }))} className={`w-16 px-2 py-1.5 border rounded-lg text-sm text-center ${p.stock === 0 ? 'border-red-300 bg-red-50' : 'border-stone-200'}`} />
                              <button onClick={() => updateStock(p.id)} className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"><Check size={14} /></button>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <button onClick={() => toggleProductActive(p.id, p.is_active)} className={`text-xs px-3 py-1.5 rounded-full font-medium ${p.is_active ? 'bg-green-100 text-green-700' : 'bg-stone-100 text-stone-500'}`}>
                              {p.is_active ? 'Active' : 'Hidden'}
                            </button>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1">
                              <button onClick={() => openEditProduct(p)} className="p-1.5 text-stone-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Edit size={14} /></button>
                              <button onClick={() => deleteProduct(p.id)} className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* CATEGORIES */}
            {tab === 'categories' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-stone-800 text-lg">{categories.length} Categories</h3>
                  <button onClick={() => setEditCategory({ name: '', icon: '', color: 'green', sort_order: categories.length })} className="btn-primary text-sm py-2.5 px-5 flex items-center gap-2"><Plus size={14} /> Add Category</button>
                </div>

                {editCategory && (
                  <div className="bg-white rounded-2xl p-6 border-2 border-green-200 shadow-sm">
                    <div className="grid grid-cols-2 gap-4">
                      <input className="px-4 py-3 border border-stone-200 rounded-xl text-sm" placeholder="Category Name *" value={editCategory.name || ''} onChange={e => setEditCategory(c => ({ ...c, name: e.target.value }))} />
                      <input className="px-4 py-3 border border-stone-200 rounded-xl text-sm" placeholder="Icon (emoji)" value={editCategory.icon || ''} onChange={e => setEditCategory(c => ({ ...c, icon: e.target.value }))} />
                      <input className="px-4 py-3 border border-stone-200 rounded-xl text-sm" placeholder="Color" value={editCategory.color || ''} onChange={e => setEditCategory(c => ({ ...c, color: e.target.value }))} />
                      <input className="px-4 py-3 border border-stone-200 rounded-xl text-sm" type="number" placeholder="Sort Order" value={editCategory.sort_order ?? ''} onChange={e => setEditCategory(c => ({ ...c, sort_order: Number(e.target.value) }))} />
                    </div>
                    <div className="flex gap-3 mt-4">
                      <button onClick={saveCategory} className="btn-primary text-sm py-2 px-5 flex items-center gap-2"><Save size={14} /> Save</button>
                      <button onClick={() => setEditCategory(null)} className="py-2 px-5 border border-stone-200 rounded-full text-sm text-stone-600 hover:bg-stone-50">Cancel</button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {categories.map(cat => (
                    <div key={cat.id} className="bg-white rounded-2xl p-5 border border-stone-100 shadow-sm flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{cat.icon || '📦'}</span>
                        <div>
                          <p className="font-semibold text-stone-800 text-sm">{cat.name}</p>
                          <p className="text-stone-400 text-xs">Order #{cat.sort_order}</p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => setEditCategory(cat)} className="p-1.5 hover:bg-stone-100 rounded-lg text-stone-500"><Edit size={13} /></button>
                        <button onClick={() => deleteCategory(cat.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-400"><Trash2 size={13} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* GALLERY */}
            {tab === 'gallery' && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl p-6 border border-stone-100 shadow-sm">
                  <h3 className="font-bold text-stone-800 mb-4">Add Media</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input className="px-4 py-3 border border-stone-200 rounded-xl text-sm" placeholder="Title" value={galleryForm.title} onChange={e => setGalleryForm(f => ({ ...f, title: e.target.value }))} />
                    <input className="px-4 py-3 border border-stone-200 rounded-xl text-sm" placeholder="Category" value={galleryForm.category} onChange={e => setGalleryForm(f => ({ ...f, category: e.target.value }))} />
                    <input className="px-4 py-3 border border-stone-200 rounded-xl text-sm" placeholder="Image or Video URL *" value={galleryForm.media_url} onChange={e => setGalleryForm(f => ({ ...f, media_url: e.target.value }))} />
                    <select className="px-4 py-3 border border-stone-200 rounded-xl text-sm bg-white" value={galleryForm.media_type} onChange={e => setGalleryForm(f => ({ ...f, media_type: e.target.value }))}>
                      <option value="image">Photo</option>
                      <option value="video">Video</option>
                    </select>
                  </div>
                  <button onClick={addGalleryItem} disabled={!galleryForm.media_url} className="btn-primary text-sm py-2.5 px-6 mt-4 flex items-center gap-2 disabled:opacity-60"><Plus size={14} /> Add</button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {gallery.map(item => (
                    <div key={item.id} className="relative group rounded-2xl overflow-hidden border border-stone-100 shadow-sm aspect-square">
                      <img src={item.media_url} alt={item.title || ''} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button onClick={() => deleteGalleryItem(item.id)} className="p-2 bg-red-500 text-white rounded-xl hover:bg-red-600"><Trash2 size={16} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* USERS */}
            {tab === 'users' && (
              <div className="space-y-4">
                <h2 className="font-bold text-stone-800 text-lg">{users.length} Registered Users</h2>
                <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden shadow-sm">
                  <table className="w-full">
                    <thead className="bg-stone-50 border-b border-stone-200">
                      <tr>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-stone-500 uppercase">User</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-stone-500 uppercase">Phone</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-stone-500 uppercase">Role</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-stone-500 uppercase">Joined</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-stone-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(u => (
                        <tr key={u.id} className="border-b border-stone-50">
                          <td className="px-4 py-3">
                            <p className="font-semibold text-stone-800 text-sm">{u.full_name || 'Unknown'}</p>
                            <p className="text-xs text-stone-400">{u.id.slice(0, 8)}...</p>
                          </td>
                          <td className="px-4 py-3 text-sm text-stone-600">{u.phone || '-'}</td>
                          <td className="px-4 py-3">
                            <select value={u.role} onChange={e => updateUserRole(u.id, e.target.value as 'customer' | 'admin')} className={`text-xs px-3 py-1.5 rounded-full font-medium border-0 ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-stone-100 text-stone-600'}`}>
                              <option value="customer">Customer</option>
                              <option value="admin">Admin</option>
                            </select>
                          </td>
                          <td className="px-4 py-3 text-xs text-stone-500">{new Date(u.created_at).toLocaleDateString('en-IN')}</td>
                          <td className="px-4 py-3">
                            <button className="p-1.5 text-stone-400 hover:text-stone-600 hover:bg-stone-50 rounded-lg"><UserCog size={14} /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* NOTIFICATIONS */}
            {tab === 'notifications' && (
              <div className="max-w-2xl space-y-6">
                <div className="bg-white rounded-2xl p-6 border border-stone-100 shadow-sm">
                  <h3 className="font-bold text-stone-800 text-lg mb-1">Send Notification</h3>
                  <p className="text-stone-400 text-sm mb-5">Leave User ID empty to broadcast to all customers.</p>

                  <div className="space-y-4">
                    <input className="w-full px-4 py-3 border border-stone-200 rounded-xl text-sm" placeholder="User ID (optional)" value={notifForm.user_id} onChange={e => setNotifForm(f => ({ ...f, user_id: e.target.value }))} />
                    <input className="w-full px-4 py-3 border border-stone-200 rounded-xl text-sm" placeholder="Title *" value={notifForm.title} onChange={e => setNotifForm(f => ({ ...f, title: e.target.value }))} />
                    <textarea className="w-full px-4 py-3 border border-stone-200 rounded-xl text-sm resize-none" rows={4} placeholder="Message *" value={notifForm.message} onChange={e => setNotifForm(f => ({ ...f, message: e.target.value }))} />
                    <div className="flex flex-wrap gap-2">
                      {(['info', 'success', 'warning', 'error'] as const).map(t => (
                        <button key={t} onClick={() => setNotifForm(f => ({ ...f, type: t }))} className={`px-4 py-2 rounded-xl text-sm font-medium ${notifForm.type === t ? t === 'info' ? 'bg-blue-600 text-white' : t === 'success' ? 'bg-green-600 text-white' : t === 'warning' ? 'bg-amber-500 text-white' : 'bg-red-500 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}>{t}</button>
                      ))}
                    </div>
                  </div>

                  <button onClick={sendNotification} disabled={!notifForm.title || !notifForm.message} className="btn-primary w-full py-3 mt-5 flex items-center justify-center gap-2 disabled:opacity-60">
                    <Send size={16} /> {notifForm.user_id ? 'Send to User' : 'Broadcast to All'}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
