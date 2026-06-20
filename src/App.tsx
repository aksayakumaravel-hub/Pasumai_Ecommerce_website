import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { DeliveryProvider } from './context/DeliveryContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import FarmLogo from './components/FarmLogo';
import HomePage from './pages/HomePage';
import ShopPage from './pages/ShopPage';
import CartPage from './pages/CartPage';
import CottagesPage from './pages/CottagesPage';
import FarmVisitsPage from './pages/FarmVisitsPage';
import HallBookingPage from './pages/HallBookingPage';
import GalleryPage from './pages/GalleryPage';
import ContactPage from './pages/ContactPage';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import AdminPage from './pages/AdminPage';

type Page =
  | 'home' | 'shop' | 'cart' | 'cottages' | 'farm-visits'
  | 'halls' | 'gallery' | 'contact' | 'login' | 'signup'
  | 'dashboard' | 'admin';

function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-green-950 flex flex-col items-center justify-center z-[100] pointer-events-auto">
      <div className="mb-6 animate-float">
        <FarmLogo className="w-24 h-24" />
      </div>
      <div className="text-center">
        <p className="font-black text-white text-xl font-heading tracking-widest">PASUMAI</p>
        <p className="text-green-400 text-sm font-medium">INTEGRATED FARM</p>
      </div>
      <div className="mt-8 flex gap-1.5">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="w-2.5 h-2.5 bg-green-500 rounded-full animate-bounce"
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </div>
    </div>
  );
}

function AppContent() {
  const [page, setPage] = useState<Page>('home');
  const [appLoading, setAppLoading] = useState(true);
  const { loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      setTimeout(() => setAppLoading(false), 800);
    }
  }, [loading]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [page]);

  const onNavigate = (p: string) => setPage(p as Page);

  const noFooterPages: Page[] = ['login', 'signup'];

  if (appLoading) return <LoadingScreen />;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar currentPage={page} onNavigate={onNavigate} />

      <main className="flex-1">
        {page === 'home' && <HomePage onNavigate={onNavigate} />}
        {page === 'shop' && <ShopPage onNavigate={onNavigate} />}
        {page === 'cart' && <CartPage onNavigate={onNavigate} />}
        {page === 'cottages' && <CottagesPage onNavigate={onNavigate} />}
        {page === 'farm-visits' && <FarmVisitsPage onNavigate={onNavigate} />}
        {page === 'halls' && <HallBookingPage onNavigate={onNavigate} />}
        {page === 'gallery' && <GalleryPage />}
        {page === 'contact' && <ContactPage />}
        {page === 'login' && <AuthPage onNavigate={onNavigate} initialMode="login" />}
        {page === 'signup' && <AuthPage onNavigate={onNavigate} initialMode="signup" />}
        {page === 'dashboard' && <DashboardPage onNavigate={onNavigate} />}
        {page === 'admin' && <AdminPage onNavigate={onNavigate} />}
      </main>

      {!noFooterPages.includes(page) && (
        <Footer onNavigate={onNavigate} />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <DeliveryProvider>
          <AppContent />
        </DeliveryProvider>
      </CartProvider>
    </AuthProvider>
  );
}
