import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { auth, db } from './lib/firebase';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { RestaurantProfile } from './types';

// Pages
import CustomerMenu from './pages/CustomerMenu';
import AdminDashboard from './pages/AdminDashboard';
import KitchenDashboard from './pages/KitchenDashboard';
import Login from './pages/Login';
import Landing from './pages/Landing';
import ErrorBoundary from './components/ErrorBoundary';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [restaurant, setRestaurant] = useState<RestaurantProfile | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          setRole(userDoc.data().role);
        } else if (currentUser.email === 'grafiqo.np@gmail.com') {
          setRole('admin');
        } else if (currentUser.email === 'v.divash@gmail.com') {
          setRole('kitchen');
        }
      } else {
        setRole(null);
      }
      setLoading(false);
    });

    // Listen for restaurant settings
    const unsubRestaurant = onSnapshot(doc(db, 'settings', 'restaurant'), (doc) => {
      if (doc.exists()) {
        setRestaurant(doc.data() as RestaurantProfile);
      }
    });

    return () => {
      unsubscribe();
      unsubRestaurant();
    };
  }, []);

  // Set dynamic theme colors
  useEffect(() => {
    if (restaurant?.theme) {
      const root = document.documentElement;
      root.style.setProperty('--primary', restaurant.theme.primaryColor);
      root.style.setProperty('--secondary', restaurant.theme.secondaryColor);
      root.style.setProperty('--accent', restaurant.theme.accentColor);
    }
  }, [restaurant]);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-stone-50">
        <div className="animate-pulse text-stone-400 font-serif italic text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          {/* Customer Routes */}
          <Route path="/table/:tableId" element={<Landing restaurant={restaurant} />} />
          <Route path="/table/:tableId/menu" element={<CustomerMenu restaurant={restaurant} />} />

          {/* Staff Routes */}
          <Route path="/login" element={<Login user={user} role={role} />} />
          
          <Route 
            path="/admin/*" 
            element={role === 'admin' ? <AdminDashboard /> : <Navigate to="/login" />} 
          />
          
          <Route 
            path="/kitchen" 
            element={role === 'admin' || role === 'kitchen' ? <KitchenDashboard /> : <Navigate to="/login" />} 
          />

          {/* Default Redirect */}
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}
