import { useState, useEffect } from 'react';
import { ShoppingBag, Home, Calendar, Bell, Package, Clock, Check, X, ChevronRight, Wind } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase, Order, CottageBooking, FarmVisit, HallBooking, Notification } from '../lib/supabase';

type DashboardPageProps = {
  onNavigate: (page: string) => void;
};

type Tab = 'overview' | 'orders' | 'cottages' | 'visits' | 'halls' | 'notifications';

const statusColors: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-blue-100 text-blue-700',
  processing: 'bg-purple-100 text-purple-700',
  shipped: 'bg-indigo-100 text-indigo-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  completed: 'bg-green-100 text-green-700',
  paid: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
};

export default function DashboardPage({ onNavigate }: DashboardPageProps) {
  const { user, profile } = useAuth();
  const [tab, setTab] = useState<Tab>('overview');
  const [orders, setOrders] = useState<Order[]>([]);
  const [cottageBookings, setCottageBookings] = useState<CottageBooking[]>([]);
  const [farmVisits, setFarmVisits] = useState<FarmVisit[]>([]);
  const [hallBookings, setHallBookings] = useState<HallBooking[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchAll = async () => {
      const [ordersRes, cottagesRes, visitsRes, hallsRes, notifsRes] = await Promise.all([
        supabase.from('orders').select('*, order_items(*)').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('cottage_bookings').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('farm_visits').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('hall_bookings').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      ]);

      setOrders(ordersRes.data || []);
      setCottageBookings(cottagesRes.data || []);
      setFarmVisits(visitsRes.data || []);
      setHallBookings(hallsRes.data || []);
      setNotifications(notifsRes.data || []);
      setLoading(false);
    };

    fetchAll();
  }, [user]);

  const markNotifRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (!user) {
    return (
      <div className="min-h-screen bg-stone-50 pt-20 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-stone-600 mb-4">Please sign in to view your dashboard</h2>
          <button onClick={() => onNavigate('login')} className="btn-primary">Sign In</button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Home },
    { id: 'orders', label: 'Orders', icon: ShoppingBag, count: orders.length },
    { id: 'cottages', label: 'Stays', icon: Home, count: cottageBookings.length },
    { id: 'visits', label: 'Farm Visits', icon: Calendar, count: farmVisits.length },
    { id: 'halls', label: 'Hall Bookings', icon: Wind, count: hallBookings.length },
    { id: 'notifications', label: 'Notifications', icon: Bell, count: unreadCount },
  ];

  return (
    <div className="min-h-screen bg-stone-50 pt-20">
      {/* Header */}
      <div className="bg-green-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-green-600 flex items-center justify-center text-2xl font-black">
              {profile?.full_name?.[0] || user.email?.[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <h1 className="text-2xl font-black font-heading">
                Welcome, {profile?.full_name?.split(' ')[0] || 'Friend'}!
              </h1>
              <p className="text-green-300 text-sm">{user.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-8">
            {[
              { label: 'Orders', value: orders.length, icon: ShoppingBag },
              { label: 'Cottage Stays', value: cottageBookings.length, icon: Home },
              { label: 'Farm Visits', value: farmVisits.length, icon: Calendar },
              { label: 'Hall Bookings', value: hallBookings.length, icon: Wind },
              { label: 'Unread Alerts', value: unreadCount, icon: Bell },
            ].map(s => (
              <div key={s.label} className="bg-white/10 rounded-2xl p-4 flex items-center gap-3">
                <s.icon size={20} className="text-green-300" />
                <div>
                  <p className="text-2xl font-black">{s.value}</p>
                  <p className="text-green-300 text-xs">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-stone-200 bg-white sticky top-20 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex overflow-x-auto">
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id as Tab)}
                className={`flex items-center gap-2 px-5 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  tab === t.id
                    ? 'border-green-600 text-green-700'
                    : 'border-transparent text-stone-500 hover:text-stone-700'
                }`}
              >
                <t.icon size={16} />
                {t.label}
                {t.count !== undefined && t.count > 0 && (
                  <span className={`text-xs rounded-full px-1.5 py-0.5 font-bold ${
                    t.id === 'notifications' && unreadCount > 0
                      ? 'bg-red-500 text-white'
                      : 'bg-stone-100 text-stone-600'
                  }`}>
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
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-white rounded-2xl animate-pulse border border-stone-100" />
            ))}
          </div>
        ) : (
          <>
            {/* Overview */}
            {tab === 'overview' && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden shadow-sm">
                  <div className="flex items-center justify-between p-5 border-b border-stone-100">
                    <h3 className="font-bold text-stone-800">Recent Orders</h3>
                    <button onClick={() => setTab('orders')} className="text-green-600 text-sm flex items-center gap-1 hover:text-green-700">
                      View all <ChevronRight size={14} />
                    </button>
                  </div>
                  {orders.length === 0 ? (
                    <div className="text-center py-8 text-stone-400 text-sm">
                      No orders yet.{' '}
                      <button onClick={() => onNavigate('shop')} className="text-green-600 hover:underline">Shop now</button>
                    </div>
                  ) : (
                    orders.slice(0, 3).map(order => (
                      <div key={order.id} className="flex items-center gap-4 p-5 border-b border-stone-50 last:border-0">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <Package size={18} className="text-green-700" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-stone-800 text-sm">Order #{order.id.slice(0, 8).toUpperCase()}</p>
                          <p className="text-stone-400 text-xs">{new Date(order.created_at).toLocaleDateString('en-IN')}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-700">₹{order.total_amount}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[order.status] || 'bg-stone-100 text-stone-600'}`}>
                            {order.status}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Cottage bookings */}
                  <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden shadow-sm">
                    <div className="flex items-center justify-between p-5 border-b border-stone-100">
                      <h3 className="font-bold text-stone-800">Cottage Stays</h3>
                      <button onClick={() => setTab('cottages')} className="text-green-600 text-sm flex items-center gap-1">
                        View all <ChevronRight size={14} />
                      </button>
                    </div>
                    {cottageBookings.length === 0 ? (
                      <div className="text-center py-6 text-stone-400 text-sm">
                        <button onClick={() => onNavigate('cottages')} className="text-green-600 hover:underline">Book a cottage</button>
                      </div>
                    ) : cottageBookings.slice(0, 2).map(b => (
                      <div key={b.id} className="flex items-center gap-3 p-4 border-b border-stone-50 last:border-0">
                        <Home size={16} className="text-blue-600 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-stone-800 text-sm truncate">{b.cottage_type}</p>
                          <p className="text-stone-400 text-xs">{new Date(b.check_in).toLocaleDateString('en-IN')}</p>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[b.status]}`}>{b.status}</span>
                      </div>
                    ))}
                  </div>

                  {/* Hall bookings */}
                  <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden shadow-sm">
                    <div className="flex items-center justify-between p-5 border-b border-stone-100">
                      <h3 className="font-bold text-stone-800">Hall Bookings</h3>
                      <button onClick={() => setTab('halls')} className="text-green-600 text-sm flex items-center gap-1">
                        View all <ChevronRight size={14} />
                      </button>
                    </div>
                    {hallBookings.length === 0 ? (
                      <div className="text-center py-6 text-stone-400 text-sm">
                        <button onClick={() => onNavigate('halls')} className="text-green-600 hover:underline">Book a hall</button>
                      </div>
                    ) : hallBookings.slice(0, 2).map(b => (
                      <div key={b.id} className="flex items-center gap-3 p-4 border-b border-stone-50 last:border-0">
                        <Wind size={16} className="text-indigo-600 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-stone-800 text-sm truncate">
                            {b.hall_type === 'party_hall' ? 'Party Hall' : 'Conference Hall'}
                          </p>
                          <p className="text-stone-400 text-xs">{new Date(b.event_date).toLocaleDateString('en-IN')}</p>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[b.status]}`}>{b.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Orders tab */}
            {tab === 'orders' && (
              <div className="space-y-4">
                {orders.length === 0 ? (
                  <div className="text-center py-16">
                    <ShoppingBag size={48} className="text-stone-300 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-stone-600 mb-2">No orders yet</h3>
                    <button onClick={() => onNavigate('shop')} className="btn-primary">Start Shopping</button>
                  </div>
                ) : orders.map(order => (
                  <div key={order.id} className="bg-white rounded-2xl border border-stone-100 overflow-hidden shadow-sm">
                    <div className="flex flex-wrap items-center justify-between p-5 gap-3">
                      <div>
                        <p className="font-bold text-stone-800">Order #{order.id.slice(0, 8).toUpperCase()}</p>
                        <p className="text-xs text-stone-400">{new Date(order.created_at).toLocaleString('en-IN')}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-black text-green-700">₹{order.total_amount}</p>
                        <div className="flex gap-2 mt-1 justify-end">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[order.status]}`}>{order.status}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[order.payment_status]}`}>{order.payment_status}</span>
                        </div>
                      </div>
                    </div>
                    {order.order_items && (
                      <div className="px-5 pb-4 border-t border-stone-100 pt-3">
                        <div className="space-y-1.5">
                          {order.order_items.map(item => (
                            <div key={item.id} className="flex justify-between text-sm">
                              <span className="text-stone-600">{item.product_name} × {item.quantity}</span>
                              <span className="font-semibold">₹{item.price * item.quantity}</span>
                            </div>
                          ))}
                        </div>
                        {order.delivery_address && (
                          <p className="text-xs text-stone-400 mt-3 pt-2 border-t border-stone-100">
                            Delivery to: {order.delivery_address}
                          </p>
                        )}
                        {order.estimated_delivery && (
                          <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                            <Clock size={11} />
                            Est. delivery: {new Date(order.estimated_delivery).toLocaleDateString('en-IN')}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Cottage bookings tab */}
            {tab === 'cottages' && (
              <div className="space-y-4">
                {cottageBookings.length === 0 ? (
                  <div className="text-center py-16">
                    <Home size={48} className="text-stone-300 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-stone-600 mb-2">No cottage bookings</h3>
                    <button onClick={() => onNavigate('cottages')} className="btn-primary">Book a Cottage</button>
                  </div>
                ) : cottageBookings.map(b => (
                  <div key={b.id} className="bg-white rounded-2xl border border-stone-100 p-5 shadow-sm">
                    <div className="flex justify-between mb-3">
                      <div>
                        <p className="font-bold text-stone-800">{b.cottage_type}</p>
                        <p className="text-stone-400 text-xs">#{b.id.slice(0, 8).toUpperCase()}</p>
                      </div>
                      <span className={`text-xs px-3 py-1 rounded-full font-medium h-fit ${statusColors[b.status]}`}>{b.status}</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div><p className="text-stone-400 text-xs">Check-in</p><p className="font-semibold">{new Date(b.check_in).toLocaleDateString('en-IN')}</p></div>
                      <div><p className="text-stone-400 text-xs">Check-out</p><p className="font-semibold">{new Date(b.check_out).toLocaleDateString('en-IN')}</p></div>
                      <div><p className="text-stone-400 text-xs">Guests</p><p className="font-semibold">{b.guests_count} persons</p></div>
                      <div><p className="text-stone-400 text-xs">Total</p><p className="font-bold text-green-700">₹{b.total_amount}</p></div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Farm visits tab */}
            {tab === 'visits' && (
              <div className="space-y-4">
                {farmVisits.length === 0 ? (
                  <div className="text-center py-16">
                    <Calendar size={48} className="text-stone-300 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-stone-600 mb-2">No farm visits booked</h3>
                    <button onClick={() => onNavigate('farm-visits')} className="btn-primary">Plan a Visit</button>
                  </div>
                ) : farmVisits.map(v => (
                  <div key={v.id} className="bg-white rounded-2xl border border-stone-100 p-5 shadow-sm">
                    <div className="flex justify-between mb-3">
                      <div>
                        <p className="font-bold text-stone-800">{v.visit_type}</p>
                        <p className="text-stone-400 text-xs">#{v.id.slice(0, 8).toUpperCase()}</p>
                      </div>
                      <span className={`text-xs px-3 py-1 rounded-full font-medium h-fit ${statusColors[v.status]}`}>{v.status}</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div><p className="text-stone-400 text-xs">Date</p><p className="font-semibold">{new Date(v.visit_date).toLocaleDateString('en-IN')}</p></div>
                      <div><p className="text-stone-400 text-xs">Time</p><p className="font-semibold">{v.time_slot}</p></div>
                      <div><p className="text-stone-400 text-xs">Group</p><p className="font-semibold">{v.group_size} persons</p></div>
                      <div><p className="text-stone-400 text-xs">Total</p><p className="font-bold text-green-700">₹{v.total_amount}</p></div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Hall bookings tab */}
            {tab === 'halls' && (
              <div className="space-y-4">
                {hallBookings.length === 0 ? (
                  <div className="text-center py-16">
                    <Wind size={48} className="text-stone-300 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-stone-600 mb-2">No hall bookings</h3>
                    <button onClick={() => onNavigate('halls')} className="btn-primary">Book a Hall</button>
                  </div>
                ) : hallBookings.map(b => (
                  <div key={b.id} className="bg-white rounded-2xl border border-stone-100 p-5 shadow-sm">
                    <div className="flex justify-between mb-3">
                      <div>
                        <p className="font-bold text-stone-800">
                          {b.hall_type === 'party_hall' ? 'Open Garden Party Hall' : 'AC Conference Hall'}
                        </p>
                        <p className="text-stone-400 text-xs">#{b.id.slice(0, 8).toUpperCase()} {b.event_type && `• ${b.event_type}`}</p>
                      </div>
                      <span className={`text-xs px-3 py-1 rounded-full font-medium h-fit ${statusColors[b.status]}`}>{b.status}</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div><p className="text-stone-400 text-xs">Event Date</p><p className="font-semibold">{new Date(b.event_date).toLocaleDateString('en-IN')}</p></div>
                      {b.end_date && b.end_date !== b.event_date && (
                        <div><p className="text-stone-400 text-xs">End Date</p><p className="font-semibold">{new Date(b.end_date).toLocaleDateString('en-IN')}</p></div>
                      )}
                      <div><p className="text-stone-400 text-xs">Guests</p><p className="font-semibold">{b.guest_count} persons</p></div>
                      <div><p className="text-stone-400 text-xs">Total</p><p className="font-bold text-green-700">₹{Number(b.total_amount).toLocaleString()}</p></div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Notifications */}
            {tab === 'notifications' && (
              <div className="space-y-3">
                {notifications.length === 0 ? (
                  <div className="text-center py-16">
                    <Bell size={48} className="text-stone-300 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-stone-600">No notifications</h3>
                  </div>
                ) : notifications.map(n => (
                  <div
                    key={n.id}
                    className={`bg-white rounded-2xl border p-5 shadow-sm cursor-pointer transition-all ${
                      n.is_read ? 'border-stone-100 opacity-70' : 'border-green-200 shadow-green/10'
                    }`}
                    onClick={() => markNotifRead(n.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                        n.type === 'success' ? 'bg-green-100' :
                        n.type === 'error' ? 'bg-red-100' :
                        n.type === 'warning' ? 'bg-amber-100' : 'bg-blue-100'
                      }`}>
                        {n.type === 'success' ? <Check size={16} className="text-green-600" /> :
                         n.type === 'error' ? <X size={16} className="text-red-600" /> :
                         <Bell size={16} className="text-blue-600" />}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-stone-800 text-sm">{n.title}</p>
                        <p className="text-stone-500 text-sm mt-0.5 leading-relaxed">{n.message}</p>
                        <p className="text-stone-400 text-xs mt-2">{new Date(n.created_at).toLocaleString('en-IN')}</p>
                      </div>
                      {!n.is_read && (
                        <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0 mt-1.5" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
