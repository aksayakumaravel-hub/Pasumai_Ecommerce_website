import { useState, useEffect } from 'react';
import { Bell, X, Check, Trash2, ShoppingCart, Truck, Package, Calendar, CreditCard, Leaf, ChevronRight, Settings } from 'lucide-react';
import { supabase, AppNotification, NotificationPreferences } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

type NotificationCenterProps = {
  onNavigate: (page: string) => void;
};

const categoryIcons: Record<string, React.ElementType> = {
  order: ShoppingCart,
  delivery: Truck,
  payment: CreditCard,
  booking: Calendar,
  promotion: Leaf,
  farm: Leaf,
  default: Bell,
};

const typeColors: Record<string, string> = {
  success: 'bg-green-500',
  info: 'bg-blue-500',
  warning: 'bg-amber-500',
  error: 'bg-red-500',
};

export default function NotificationCenter({ onNavigate }: NotificationCenterProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const [showPrefs, setShowPrefs] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);

  useEffect(() => {
    if (!user) return;

    fetchNotifications();
    fetchPreferences();

    // Subscribe to new notifications
    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        setNotifications(prev => [payload.new as AppNotification, ...prev]);
        setUnreadCount(prev => prev + 1);

        // Show browser notification
        if (globalThis.Notification && globalThis.Notification.permission === 'granted') {
          new globalThis.Notification((payload.new as AppNotification).title, {
            body: (payload.new as AppNotification).message,
            icon: '/favicon.ico',
          });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchNotifications = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);
    if (data) {
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.is_read).length);
    }
    setLoading(false);
  };

  const fetchPreferences = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
    setPreferences(data);
  };

  const markAsRead = async (id: string) => {
    await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', id);
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = async () => {
    if (!user) return;
    await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('is_read', false);
    setNotifications(prev =>
      prev.map(n => ({ ...n, is_read: true, read_at: n.read_at || new Date().toISOString() }))
    );
    setUnreadCount(0);
  };

  const deleteNotification = async (id: string) => {
    await supabase.from('notifications').delete().eq('id', id);
    setNotifications(prev => prev.filter(n => n.id !== id));
    const deleted = notifications.find(n => n.id === id);
    if (deleted && !deleted.is_read) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const updatePreferences = async (updates: Partial<NotificationPreferences>) => {
    if (!user || !preferences) return;
    const { data } = await supabase
      .from('notification_preferences')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', preferences.id)
      .select()
      .maybeSingle();
    if (data) setPreferences(data);
  };

  const requestPushPermission = async () => {
    if (!('Notification' in window)) {
      alert('Your browser does not support notifications');
      return;
    }

    const permission = await globalThis.Notification.requestPermission();
    if (permission === 'granted' && preferences) {
      updatePreferences({ push_enabled: true });
    }
  };

  const filteredNotifications = filter === 'all'
    ? notifications
    : notifications.filter(n => n.category === filter);

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(date).toLocaleDateString();
  };

  if (!user) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-full transition-all duration-300 hover:bg-stone-100"
      >
        <Bell size={20} className="text-stone-700" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-green-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-12 w-96 max-h-[80vh] bg-white rounded-2xl shadow-2xl border border-stone-200 z-50 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-stone-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell size={18} className="text-green-600" />
                <h3 className="font-bold text-stone-800">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowPrefs(!showPrefs)}
                  className="p-1.5 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-lg transition-colors"
                  title="Settings"
                >
                  <Settings size={16} />
                </button>
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-green-600 hover:text-green-700 font-medium"
                >
                  Mark all read
                </button>
              </div>
            </div>

            {/* Preferences Panel */}
            {showPrefs && (
              <div className="p-4 bg-stone-50 border-b border-stone-100">
                <h4 className="font-semibold text-stone-700 text-sm mb-3">Notification Settings</h4>
                <div className="space-y-2">
                  {[
                    { key: 'order_updates', label: 'Order updates' },
                    { key: 'delivery_updates', label: 'Delivery updates' },
                    { key: 'payment_updates', label: 'Payment updates' },
                    { key: 'booking_updates', label: 'Booking updates' },
                    { key: 'promotions', label: 'Promotions & offers' },
                    { key: 'farm_updates', label: 'Farm updates' },
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-center justify-between py-1 cursor-pointer">
                      <span className="text-sm text-stone-600">{label}</span>
                      <input
                        type="checkbox"
                        checked={preferences?.[key as keyof NotificationPreferences] as boolean ?? true}
                        onChange={(e) => updatePreferences({ [key]: e.target.checked })}
                        className="w-4 h-4 rounded accent-green-600"
                      />
                    </label>
                  ))}
                </div>
                {globalThis.Notification?.permission !== 'granted' && (
                  <button
                    onClick={requestPushPermission}
                    className="w-full mt-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                  >
                    Enable Push Notifications
                  </button>
                )}
              </div>
            )}

            {/* Filters */}
            <div className="p-2 border-b border-stone-100 flex gap-1 overflow-x-auto">
              {['all', 'order', 'delivery', 'payment', 'booking', 'promotion'].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                    filter === f
                      ? 'bg-green-600 text-white'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>

            {/* Notification List */}
            <div className="overflow-y-auto max-h-96">
              {loading ? (
                <div className="p-8 text-center text-stone-400">
                  <div className="animate-spin w-6 h-6 border-2 border-green-600 border-t-transparent rounded-full mx-auto" />
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="p-8 text-center text-stone-400">
                  <Bell size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No notifications</p>
                </div>
              ) : (
                filteredNotifications.map(notification => {
                  const Icon = categoryIcons[notification.category || 'default'] || Bell;
                  return (
                    <div
                      key={notification.id}
                      className={`p-4 border-b border-stone-50 hover:bg-stone-50 transition-colors cursor-pointer ${
                        !notification.is_read ? 'bg-green-50/50' : ''
                      }`}
                      onClick={() => {
                        if (!notification.is_read) markAsRead(notification.id);
                        if (notification.reference_type && notification.reference_id) {
                          onNavigate('dashboard');
                          setIsOpen(false);
                        }
                      }}
                    >
                      <div className="flex gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          notification.is_read ? 'bg-stone-100' : 'bg-green-100'
                        }`}>
                          <Icon size={18} className={notification.is_read ? 'text-stone-500' : 'text-green-600'} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <p className={`text-sm ${notification.is_read ? 'text-stone-600' : 'text-stone-800 font-semibold'}`}>
                              {notification.title}
                            </p>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification(notification.id);
                              }}
                              className="p-1 text-stone-300 hover:text-red-500 transition-colors"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                          <p className="text-xs text-stone-500 mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-stone-400 mt-2">
                            {timeAgo(notification.created_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* View All Link */}
            {notifications.length > 0 && (
              <div className="p-3 border-t border-stone-100">
                <button
                  onClick={() => {
                    onNavigate('dashboard');
                    setIsOpen(false);
                  }}
                  className="flex items-center justify-center gap-1 w-full py-2 text-sm text-green-600 hover:text-green-700 font-medium transition-colors"
                >
                  View All Notifications
                  <ChevronRight size={14} />
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
