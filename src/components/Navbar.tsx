import { useState, useEffect, useRef } from 'react';
import { ShoppingCart, Menu, X, User, LogOut, ChevronDown, Bell, Leaf } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { supabase } from '../lib/supabase';
import FarmLogo from './FarmLogo';
import NotificationCenter from './NotificationCenter';

type NavbarProps = {
  currentPage: string;
  onNavigate: (page: string) => void;
};

const navLinks = [
  { label: 'Home', page: 'home' },
  { label: 'Shop', page: 'shop' },
  {
    label: 'Experiences',
    page: 'experiences',
    dropdown: [
      { label: 'Cottage Stays', page: 'cottages' },
      { label: 'Farm Visits', page: 'farm-visits' },
      { label: 'Party & Conference Halls', page: 'halls' },
    ],
  },
  { label: 'Gallery', page: 'gallery' },
  { label: 'Contact', page: 'contact' },
];

export default function Navbar({ currentPage, onNavigate }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  const [notifCount, setNotifCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const { user, profile, signOut } = useAuth();
  const { count } = useCart();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('notifications')
      .select('id', { count: 'exact' })
      .eq('user_id', user.id)
      .eq('is_read', false)
      .then(({ count: c }) => setNotifCount(c || 0));
  }, [user]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      // Close dropdown if click outside
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(null);
      }
      // Close user menu if click outside (but not on the menu itself)
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const isHeroPage = currentPage === 'home';
  const solid = scrolled || !isHeroPage;

  const experiencePages = ['cottages', 'farm-visits', 'halls'];
  const isExperiencePage = experiencePages.includes(currentPage);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        solid
          ? 'bg-white/96 backdrop-blur-xl shadow-lg shadow-green-900/5'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-3 group"
          >
            <FarmLogo className="h-12 w-12 group-hover:scale-105 transition-transform duration-300" />
            <div className="hidden sm:block">
              <p className={`font-black text-sm leading-tight font-heading transition-colors duration-300 ${solid ? 'text-green-800' : 'text-white'}`}>
                PASUMAI
              </p>
              <p className={`text-xs font-medium leading-tight transition-colors duration-300 ${solid ? 'text-green-600' : 'text-green-300'}`}>
                INTEGRATED FARM
              </p>
            </div>
          </button>

          {/* Desktop Nav */}
          <div ref={dropdownRef} className="hidden lg:flex items-center gap-1">
            {navLinks.map(link => (
              link.dropdown ? (
                <div key={link.label} className="relative">
                  <button
                    onClick={() => setDropdownOpen(dropdownOpen === link.label ? null : link.label)}
                    className={`flex items-center gap-1 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                      isExperiencePage
                        ? 'bg-green-600 text-white shadow-green'
                        : solid
                        ? 'text-stone-700 hover:text-green-700 hover:bg-green-50'
                        : 'text-white/90 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {link.label}
                    <ChevronDown size={14} className={`transition-transform ${dropdownOpen === link.label ? 'rotate-180' : ''}`} />
                  </button>

                  {dropdownOpen === link.label && (
                    <div className="absolute top-full left-0 mt-2 w-52 bg-white rounded-2xl shadow-2xl border border-stone-100 overflow-hidden py-1">
                      {link.dropdown.map(sub => (
                        <button
                          key={sub.page}
                          onClick={() => { onNavigate(sub.page); setDropdownOpen(null); }}
                          className={`w-full text-left px-4 py-3 text-sm transition-colors flex items-center gap-3 ${
                            currentPage === sub.page
                              ? 'bg-green-50 text-green-700 font-semibold'
                              : 'text-stone-700 hover:bg-green-50 hover:text-green-700'
                          }`}
                        >
                          <Leaf size={13} className="text-green-500" />
                          {sub.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <button
                  key={link.page}
                  onClick={() => onNavigate(link.page)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                    currentPage === link.page
                      ? 'bg-green-600 text-white shadow-green'
                      : solid
                      ? 'text-stone-700 hover:text-green-700 hover:bg-green-50'
                      : 'text-white/90 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {link.label}
                </button>
              )
            ))}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {/* Notifications */}
            <div className={`transition-colors ${solid ? '' : 'text-white'}`}>
              <NotificationCenter onNavigate={onNavigate} />
            </div>

            {/* Cart */}
            <button
              onClick={() => onNavigate('cart')}
              className={`relative p-2.5 rounded-full transition-all duration-300 ${
                solid
                  ? 'text-stone-700 hover:bg-green-50 hover:text-green-700'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              <ShoppingCart size={20} />
              {count > 0 && (
                <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold animate-bounce">
                  {count}
                </span>
              )}
            </button>

            {/* User menu */}
            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-full transition-all duration-300 ${
                    solid ? 'text-stone-700 hover:bg-green-50' : 'text-white hover:bg-white/10'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white text-sm font-bold">
                    {profile?.full_name?.[0] || user.email?.[0]?.toUpperCase() || 'U'}
                  </div>
                  {notifCount > 0 && (
                    <span className="absolute top-1 right-7 w-2 h-2 bg-red-500 rounded-full" />
                  )}
                  <ChevronDown size={14} />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-stone-100 overflow-hidden z-50">
                    <div className="px-4 py-3 border-b border-stone-100">
                      <p className="font-semibold text-stone-800 text-sm truncate">
                        {profile?.full_name || 'Welcome'}
                      </p>
                      <p className="text-xs text-stone-500 truncate">{user.email}</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log('Dashboard button clicked');
                        setUserMenuOpen(false);
                        onNavigate('dashboard');
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-stone-700 hover:bg-green-50 hover:text-green-700 transition-colors"
                    >
                      <User size={16} />
                      My Dashboard
                      {notifCount > 0 && (
                        <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
                          {notifCount}
                        </span>
                      )}
                    </button>
                    {profile?.role === 'admin' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log('Admin Panel button clicked');
                          setUserMenuOpen(false);
                          onNavigate('admin');
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-stone-700 hover:bg-green-50 hover:text-green-700 transition-colors"
                      >
                        <Bell size={16} />
                        Admin Panel
                      </button>
                    )}
                    <div className="border-t border-stone-100">
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          setUserMenuOpen(false);
                          try {
                            await signOut();
                            onNavigate('login');
                          } catch (err) {
                            console.error('Sign out error:', err);
                          }
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut size={16} />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => onNavigate('login')}
                className="btn-primary text-sm py-2.5 px-5"
              >
                Sign In
              </button>
            )}

            {/* Mobile toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className={`lg:hidden p-2 rounded-full transition-colors ${
                solid ? 'text-stone-700 hover:bg-stone-100' : 'text-white hover:bg-white/10'
              }`}
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="lg:hidden bg-white border-t border-stone-100 shadow-xl">
          <div className="max-w-7xl mx-auto px-4 py-4 space-y-1">
            {[
              { label: 'Home', page: 'home' },
              { label: 'Shop', page: 'shop' },
              { label: 'Cottage Stays', page: 'cottages' },
              { label: 'Farm Visits', page: 'farm-visits' },
              { label: 'Party & Conference Halls', page: 'halls' },
              { label: 'Gallery', page: 'gallery' },
              { label: 'Contact', page: 'contact' },
            ].map(link => (
              <button
                key={link.page}
                onClick={() => { onNavigate(link.page); setMobileOpen(false); }}
                className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  currentPage === link.page
                    ? 'bg-green-600 text-white'
                    : 'text-stone-700 hover:bg-green-50 hover:text-green-700'
                }`}
              >
                {link.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
