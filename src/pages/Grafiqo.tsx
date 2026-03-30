import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, onSnapshot, setDoc, getDocs, collection, deleteDoc, addDoc } from 'firebase/firestore';
import { RestaurantProfile } from '../types';
import { motion } from 'framer-motion';
import { CheckCircle2, AlertTriangle, Lock, X } from 'lucide-react';
import { addDays, format, differenceInDays } from 'date-fns';

export default function Grafiqo() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [secretKey, setSecretKey] = useState('');
  const [restaurant, setRestaurant] = useState<RestaurantProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubRestaurant = onSnapshot(doc(db, 'settings', 'restaurant'), (doc) => {
      if (doc.exists()) setRestaurant(doc.data() as RestaurantProfile);
      setLoading(false);
    });
    return () => unsubRestaurant();
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (secretKey === 'Grafiqo@hotel') {
      setIsAuthenticated(true);
    } else {
      alert('Invalid secret key');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-stone-900 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-stone-800 p-8 rounded-3xl w-full max-w-md shadow-2xl"
        >
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-stone-700 rounded-2xl flex items-center justify-center">
              <Lock className="w-8 h-8 text-stone-300" />
            </div>
          </div>
          <h1 className="text-2xl font-serif italic text-white text-center mb-8">Grafiqo Admin</h1>
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-2 block">Secret Key</label>
              <input 
                type="password" 
                className="w-full bg-stone-700 border border-stone-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                placeholder="Enter secret key"
              />
            </div>
            <button type="submit" className="w-full bg-primary text-white py-4 rounded-xl font-bold hover:bg-primary/90 transition-colors">
              Access System
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  if (loading) return <div className="h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-stone-50 p-8 md:p-12">
      <div className="max-w-4xl mx-auto space-y-12">
        <header>
          <h1 className="text-4xl font-serif italic text-stone-900 mb-2">Grafiqo Management</h1>
          <p className="text-stone-400 font-medium">System configuration and subscription management.</p>
        </header>

        <SubscriptionManagement restaurant={restaurant} />
        <RestaurantSetup restaurant={restaurant} />
      </div>
    </div>
  );
}

function SubscriptionManagement({ restaurant }: { restaurant: RestaurantProfile | null }) {
  const [customDays, setCustomDays] = useState<number>(30);
  const [isUpdating, setIsUpdating] = useState(false);

  const currentEndDate = restaurant?.subscription?.endDate ? new Date(restaurant.subscription.endDate) : null;
  const daysRemaining = currentEndDate ? differenceInDays(currentEndDate, new Date()) : 0;

  const updateSubscription = async (days: number) => {
    if (!confirm(`Are you sure you want to add ${days} days to the subscription?`)) return;
    setIsUpdating(true);
    try {
      const newEndDate = addDays(new Date(), days).toISOString();
      await setDoc(doc(db, 'settings', 'restaurant'), {
        ...restaurant,
        subscription: { endDate: newEndDate }
      }, { merge: true });
      alert('Subscription updated successfully.');
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, 'settings/restaurant');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <section className="space-y-6">
      <h3 className="text-2xl font-serif italic text-stone-800">Subscription Status</h3>
      <div className="bg-white p-8 rounded-3xl border border-stone-100 shadow-sm space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-stone-400 text-xs uppercase tracking-widest font-bold mb-1">Current Status</p>
            {currentEndDate ? (
              <div className="flex items-center gap-4">
                <h4 className={`text-3xl font-serif italic ${daysRemaining <= 0 ? 'text-red-500' : daysRemaining <= 2 ? 'text-orange-500' : 'text-green-500'}`}>
                  {daysRemaining > 0 ? `${daysRemaining} Days Remaining` : 'Expired'}
                </h4>
                <span className="text-stone-500 text-sm">
                  (Ends on {format(currentEndDate, 'MMM dd, yyyy')})
                </span>
              </div>
            ) : (
              <h4 className="text-3xl font-serif italic text-stone-400">No Active Subscription</h4>
            )}
          </div>
        </div>

        <div className="pt-6 border-t border-stone-100">
          <p className="text-stone-400 text-xs uppercase tracking-widest font-bold mb-4">Reset Countdown</p>
          <div className="flex flex-wrap gap-4">
            <button onClick={() => updateSubscription(30)} disabled={isUpdating} className="px-6 py-3 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-medium transition-colors">30 Days</button>
            <button onClick={() => updateSubscription(60)} disabled={isUpdating} className="px-6 py-3 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-medium transition-colors">60 Days</button>
            <button onClick={() => updateSubscription(90)} disabled={isUpdating} className="px-6 py-3 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-medium transition-colors">90 Days</button>
            <button onClick={() => updateSubscription(365)} disabled={isUpdating} className="px-6 py-3 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-medium transition-colors">365 Days</button>
          </div>
          
          <div className="mt-6 flex items-center gap-4">
            <input 
              type="number" 
              value={customDays} 
              onChange={(e) => setCustomDays(parseInt(e.target.value) || 0)}
              className="w-32 bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-stone-700 focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <button onClick={() => updateSubscription(customDays)} disabled={isUpdating} className="px-6 py-3 bg-stone-800 hover:bg-stone-900 text-white rounded-xl font-medium transition-colors">
              Set Custom Days
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function RestaurantSetup({ restaurant }: { restaurant: RestaurantProfile | null }) {
  const [profile, setProfile] = useState<RestaurantProfile>(restaurant || {
    name: '',
    theme: { primaryColor: '#5A5A40', secondaryColor: '#f5f5f0', accentColor: '#FF6321' }
  });
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [seedStatus, setSeedStatus] = useState<'idle' | 'seeding' | 'success' | 'error'>('idle');
  const [isResetting, setIsResetting] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      alert('Please upload a valid image file (.jpg, .png, .webp)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxSize = 800;

        if (width > height) {
          if (width > maxSize) {
            height *= maxSize / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width *= maxSize / height;
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setProfile({ ...profile, paymentQrUrl: dataUrl });
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleResetStats = async () => {
    if (!confirm('Are you sure you want to reset all stats? This will delete all orders. Settings, menu items, and tables will be preserved.')) return;
    setIsResetting(true);
    try {
      const ordersSnapshot = await getDocs(collection(db, 'orders'));
      const deletePromises = ordersSnapshot.docs.map(d => deleteDoc(doc(db, 'orders', d.id)));
      await Promise.all(deletePromises);
      alert('Stats reset successfully.');
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, 'orders');
    } finally {
      setIsResetting(false);
    }
  };

  const handleResetMenu = async () => {
    if (!confirm('Are you sure you want to reset the menu? This will delete all categories and menu items.')) return;
    setIsResetting(true);
    try {
      const itemsSnapshot = await getDocs(collection(db, 'menuItems'));
      const itemPromises = itemsSnapshot.docs.map(d => deleteDoc(doc(db, 'menuItems', d.id)));
      
      const catsSnapshot = await getDocs(collection(db, 'categories'));
      const catPromises = catsSnapshot.docs.map(d => deleteDoc(doc(db, 'categories', d.id)));
      
      await Promise.all([...itemPromises, ...catPromises]);
      alert('Menu reset successfully.');
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, 'menuItems/categories');
    } finally {
      setIsResetting(false);
    }
  };

  const handleSave = async () => {
    setSaveStatus('saving');
    try {
      await setDoc(doc(db, 'settings', 'restaurant'), profile, { merge: true });
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (e) { 
      handleFirestoreError(e, OperationType.WRITE, 'settings/restaurant');
      setSaveStatus('error');
    }
  };

  const seedData = async () => {
    if (!confirm('This will add example categories, menu items, and tables to your database. Continue?')) return;
    
    setSeedStatus('seeding');
    try {
      // Add Categories
      const categories = [
        { name: 'Appetizers', order: 0 },
        { name: 'Main Course', order: 1 },
        { name: 'Desserts', order: 2 },
        { name: 'Beverages', order: 3 }
      ];
      
      const catRefs: Record<string, string> = {};
      for (const cat of categories) {
        const docRef = await addDoc(collection(db, 'categories'), cat);
        catRefs[cat.name] = docRef.id;
      }

      // Add Menu Items
      const menuItems = [
        { name: 'Bruschetta', price: 450, categoryId: catRefs['Appetizers'], description: 'Toasted bread with tomatoes and garlic', image: 'https://picsum.photos/seed/bruschetta/400/300', available: true },
        { name: 'Paneer Tikka', price: 650, categoryId: catRefs['Appetizers'], description: 'Grilled cottage cheese with spices', image: 'https://picsum.photos/seed/paneer/400/300', available: true },
        { name: 'Chicken Momo', price: 350, categoryId: catRefs['Appetizers'], description: 'Steamed dumplings with chicken filling', image: 'https://picsum.photos/seed/momo/400/300', available: true },
        { name: 'Dal Bhat Thali', price: 850, categoryId: catRefs['Main Course'], description: 'Traditional Nepali meal set', image: 'https://picsum.photos/seed/dalbhat/400/300', available: true },
        { name: 'Margherita Pizza', price: 750, categoryId: catRefs['Main Course'], description: 'Classic tomato and mozzarella pizza', image: 'https://picsum.photos/seed/pizza/400/300', available: true },
        { name: 'Gulab Jamun', price: 250, categoryId: catRefs['Desserts'], description: 'Sweet milk dumplings in syrup', image: 'https://picsum.photos/seed/sweet/400/300', available: true },
        { name: 'Masala Chiya', price: 150, categoryId: catRefs['Beverages'], description: 'Spiced milk tea', image: 'https://picsum.photos/seed/tea/400/300', available: true }
      ];

      for (const item of menuItems) {
        await addDoc(collection(db, 'menuItems'), item);
      }

      // Add Tables
      for (let i = 1; i <= 5; i++) {
        await addDoc(collection(db, 'tables'), { number: i });
      }

      setSeedStatus('success');
      setTimeout(() => setSeedStatus('idle'), 3000);
    } catch (error) {
      console.error('Error seeding data:', error);
      setSeedStatus('error');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-12"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Profile Info */}
        <section className="space-y-8">
          <h3 className="text-2xl font-serif italic text-stone-800">General Info</h3>
          <div className="space-y-6">
            <div>
              <label className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-2 block">Restaurant Name</label>
              <input type="text" className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 text-stone-700 focus:outline-none focus:ring-2 focus:ring-primary/50" value={profile.name || ''} onChange={e => setProfile({...profile, name: e.target.value})} />
            </div>
            <div>
              <label className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-2 block">Logo URL</label>
              <input type="text" className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 text-stone-700 focus:outline-none focus:ring-2 focus:ring-primary/50" value={profile.logoUrl || ''} onChange={e => setProfile({...profile, logoUrl: e.target.value})} />
            </div>
            <div>
              <label className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-2 block">Intro Message</label>
              <textarea className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 text-stone-700 focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[100px]" value={profile.intro || ''} onChange={e => setProfile({...profile, intro: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-2 block">Contact</label>
                <input type="text" className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 text-stone-700 focus:outline-none focus:ring-2 focus:ring-primary/50" value={profile.contact || ''} onChange={e => setProfile({...profile, contact: e.target.value})} />
              </div>
              <div>
                <label className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-2 block">Address</label>
                <input type="text" className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 text-stone-700 focus:outline-none focus:ring-2 focus:ring-primary/50" value={profile.address || ''} onChange={e => setProfile({...profile, address: e.target.value})} />
              </div>
            </div>
          </div>
        </section>

        {/* Branding */}
        <section className="space-y-8">
          <h3 className="text-2xl font-serif italic text-stone-800">Visual Branding</h3>
          <div className="bg-white p-8 rounded-3xl border border-stone-100 shadow-sm space-y-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl shadow-inner border border-stone-100" style={{ backgroundColor: profile.theme?.primaryColor }} />
              <div className="flex-1">
                <label className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-1 block">Primary Color</label>
                <input type="color" className="w-full h-10 rounded-lg cursor-pointer" value={profile.theme?.primaryColor || '#5A5A40'} onChange={e => setProfile({...profile, theme: {...profile.theme!, primaryColor: e.target.value}})} />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl shadow-inner border border-stone-100" style={{ backgroundColor: profile.theme?.secondaryColor }} />
              <div className="flex-1">
                <label className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-1 block">Secondary Color</label>
                <input type="color" className="w-full h-10 rounded-lg cursor-pointer" value={profile.theme?.secondaryColor || '#f5f5f0'} onChange={e => setProfile({...profile, theme: {...profile.theme!, secondaryColor: e.target.value}})} />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl shadow-inner border border-stone-100" style={{ backgroundColor: profile.theme?.accentColor }} />
              <div className="flex-1">
                <label className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-1 block">Accent Color</label>
                <input type="color" className="w-full h-10 rounded-lg cursor-pointer" value={profile.theme?.accentColor || '#FF6321'} onChange={e => setProfile({...profile, theme: {...profile.theme!, accentColor: e.target.value}})} />
              </div>
            </div>
          </div>
          
          <div className="p-8 bg-stone-800 rounded-[2rem] text-white">
            <h4 className="font-serif italic text-xl mb-2">Preview</h4>
            <p className="text-stone-400 text-sm mb-6">This is how your brand colors will look across the app.</p>
            <div className="flex gap-2">
              <div className="px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest" style={{ backgroundColor: profile.theme?.primaryColor }}>Button</div>
              <div className="px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest text-stone-800" style={{ backgroundColor: profile.theme?.secondaryColor }}>Badge</div>
              <div className="px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest" style={{ backgroundColor: profile.theme?.accentColor }}>Alert</div>
            </div>
          </div>
        </section>

        {/* Payment Settings */}
        <section className="space-y-8 md:col-span-2">
          <h3 className="text-2xl font-serif italic text-stone-800">Payment Settings</h3>
          <div className="bg-white p-8 rounded-3xl border border-stone-100 shadow-sm space-y-6">
            <div>
              <label className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-2 block">Payment QR Code Image</label>
              <div className="flex items-start gap-6">
                {profile.paymentQrUrl ? (
                  <div className="relative w-32 h-32 rounded-xl border border-stone-200 overflow-hidden bg-stone-50 flex-shrink-0">
                    <img src={profile.paymentQrUrl} alt="Payment QR Code" className="w-full h-full object-contain" />
                    <button 
                      onClick={() => setProfile({...profile, paymentQrUrl: ''})}
                      className="absolute top-1 right-1 bg-white/80 p-1 rounded-full text-stone-600 hover:text-red-500 hover:bg-white transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="w-32 h-32 rounded-xl border-2 border-dashed border-stone-200 bg-stone-50 flex items-center justify-center flex-shrink-0">
                    <span className="text-stone-400 text-xs text-center px-2">No QR Code</span>
                  </div>
                )}
                <div className="flex-1 space-y-4">
                  <div>
                    <label className="px-6 py-3 bg-stone-100 text-stone-700 rounded-xl font-medium cursor-pointer hover:bg-stone-200 inline-block transition-colors">
                      Upload QR Code
                      <input 
                        type="file" 
                        accept="image/jpeg, image/png, image/webp" 
                        className="hidden" 
                        onChange={handleImageUpload} 
                      />
                    </label>
                    <p className="text-xs text-stone-500 mt-2">Upload a .jpg, .png, or .webp file. The image will be automatically resized to fit within database limits.</p>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-2 block">Or Provide Image URL</label>
                    <input 
                      type="text" 
                      placeholder="https://example.com/my-qr-code.png"
                      className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 text-stone-700 focus:outline-none focus:ring-2 focus:ring-primary/50" 
                      value={profile.paymentQrUrl || ''} 
                      onChange={e => setProfile({...profile, paymentQrUrl: e.target.value})} 
                    />
                  </div>
                </div>
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-2 block">Payment Details / Instructions</label>
              <textarea 
                placeholder="e.g., Please pay to eSewa ID: 98XXXXXXXX. Show the screenshot to the counter."
                className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 text-stone-700 focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[100px]" 
                value={profile.paymentDetails || ''} 
                onChange={e => setProfile({...profile, paymentDetails: e.target.value})} 
              />
            </div>
          </div>
        </section>
      </div>

      <div className="pt-12 border-t border-stone-200 flex flex-wrap items-center gap-6">
        <button 
          onClick={handleSave} 
          disabled={saveStatus === 'saving'}
          className="bg-stone-800 text-white px-12 py-4 rounded-xl text-lg font-serif italic shadow-xl shadow-stone-200 disabled:opacity-50 hover:bg-stone-900 transition-colors"
        >
          {saveStatus === 'saving' ? 'Saving...' : 'Save All Changes'}
        </button>

        <button
          onClick={seedData}
          disabled={seedStatus === 'seeding'}
          className="px-8 py-4 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 transition-colors disabled:opacity-50 font-serif italic text-lg"
        >
          {seedStatus === 'seeding' ? 'Seeding...' : seedStatus === 'success' ? 'Data Seeded!' : 'Seed Example Data'}
        </button>

        {saveStatus === 'success' && (
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 text-green-600 font-bold"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>Settings saved successfully!</span>
          </motion.div>
        )}
      </div>

      {/* Danger Zone */}
      <section className="mt-16 pt-12 border-t border-red-100">
        <h3 className="text-2xl font-serif italic text-red-600 mb-6 flex items-center gap-2">
          <AlertTriangle className="w-6 h-6" />
          Danger Zone
        </h3>
        <div className="bg-red-50/50 border border-red-100 rounded-3xl p-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h4 className="font-bold text-stone-900 text-lg">Reset Statistics</h4>
              <p className="text-stone-500 text-sm mt-1">This will permanently delete all orders and revenue data. Settings, menu items, and tables will be preserved.</p>
            </div>
            <button 
              onClick={handleResetStats} 
              disabled={isResetting}
              className="px-6 py-3 bg-red-100 text-red-700 rounded-xl font-bold hover:bg-red-200 transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              {isResetting ? 'Resetting...' : 'Reset Stats'}
            </button>
          </div>
          
          <div className="h-px bg-red-100 w-full" />
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h4 className="font-bold text-stone-900 text-lg">Reset Menu</h4>
              <p className="text-stone-500 text-sm mt-1">This will permanently delete all categories and menu items. Orders and settings will be preserved.</p>
            </div>
            <button 
              onClick={handleResetMenu} 
              disabled={isResetting}
              className="px-6 py-3 bg-red-100 text-red-700 rounded-xl font-bold hover:bg-red-200 transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              {isResetting ? 'Resetting...' : 'Reset Menu'}
            </button>
          </div>
        </div>
      </section>
    </motion.div>
  );
}
