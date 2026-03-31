import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, onSnapshot, query, addDoc, serverTimestamp } from 'firebase/firestore';
import { Category, MenuItem, RestaurantProfile, OrderItem } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingCart, 
  ChevronLeft, 
  Plus, 
  Minus, 
  X, 
  Search, 
  Star, 
  Flame, 
  Leaf, 
  Info,
  CheckCircle2
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Props {
  restaurant: RestaurantProfile | null;
}

export default function CustomerMenu({ restaurant }: Props) {
  const { tableId } = useParams();
  const navigate = useNavigate();
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [notes, setNotes] = useState('');
  const [isOrdering, setIsOrdering] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  // Fetch Categories & Menu Items
  useEffect(() => {
    const unsubCats = onSnapshot(collection(db, 'categories'), (snapshot) => {
      const cats = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
      setCategories(cats.sort((a, b) => a.order - b.order));
    });

    const unsubItems = onSnapshot(collection(db, 'menuItems'), (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MenuItem));
      setMenuItems(items.filter(item => item.available));
    });

    return () => {
      unsubCats();
      unsubItems();
    };
  }, []);

  const filteredItems = useMemo(() => {
    return menuItems.filter(item => {
      const matchesCategory = activeCategory === 'all' || item.categoryId === activeCategory;
      const matchesSearch = (item.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                           (item.description || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [menuItems, activeCategory, searchQuery]);

  const cartTotal = useMemo(() => {
    return cart.reduce((total, item) => total + ((typeof item.price === 'number' ? item.price : 0) * item.quantity), 0);
  }, [cart]);

  const addToCart = (item: MenuItem, isHalfPlate: boolean = false) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id && i.isHalfPlate === isHalfPlate);
      if (existing) {
        return prev.map(i => (i.id === item.id && i.isHalfPlate === isHalfPlate) ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { 
        id: item.id, 
        name: item.name, 
        price: isHalfPlate && item.halfPrice ? item.halfPrice : item.price, 
        quantity: 1,
        isHalfPlate 
      }];
    });
  };

  const removeFromCart = (id: string, isHalfPlate: boolean = false) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === id && i.isHalfPlate === isHalfPlate);
      if (existing && existing.quantity > 1) {
        return prev.map(i => (i.id === id && i.isHalfPlate === isHalfPlate) ? { ...i, quantity: i.quantity - 1 } : i);
      }
      return prev.filter(i => !(i.id === id && i.isHalfPlate === isHalfPlate));
    });
  };

  const handlePlaceOrder = async () => {
    if (!customerName || cart.length === 0) return;
    
    setIsOrdering(true);
    try {
      const orderData = {
        customerName,
        tableNumber: parseInt(tableId || '0'),
        items: cart,
        notes,
        status: 'pending',
        total: cartTotal,
        createdAt: new Date().toISOString(),
        serverTimestamp: serverTimestamp()
      };
      
      await addDoc(collection(db, 'orders'), orderData);
      setCart([]);
      setOrderSuccess(true);
      setIsCartOpen(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'orders');
    } finally {
      setIsOrdering(false);
    }
  };

  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-6 text-center">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md w-full bg-white rounded-[3rem] p-12 shadow-2xl border border-stone-100"
        >
          <div className="w-24 h-24 bg-green-500 rounded-full mx-auto mb-8 flex items-center justify-center shadow-lg shadow-green-200">
            <CheckCircle2 className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl font-serif italic text-stone-900 mb-4">Order Placed!</h1>
          <p className="text-stone-500 mb-10 text-lg font-medium">
            Your order has been sent to the kitchen. We'll serve you shortly.
          </p>
          <div className="space-y-4">
            <button
              onClick={() => navigate(`/table/${tableId}`)}
              className="w-full premium-button bg-primary text-white py-4 shadow-xl hover:bg-primary/90"
            >
              Track Order Status
            </button>
            <button
              onClick={() => setOrderSuccess(false)}
              className="w-full premium-button bg-stone-200 text-stone-800 py-4 shadow-sm hover:bg-stone-300"
            >
              Order More Items
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 pb-32">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-stone-100 px-6 py-4 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-stone-50 rounded-full transition-colors">
          <ChevronLeft className="w-6 h-6 text-stone-600" />
        </button>
        <div className="text-center">
          <h1 className="text-xl font-serif italic text-stone-900">{restaurant?.name || 'Menu'}</h1>
          <p className="text-[10px] text-stone-400 uppercase tracking-widest font-bold">Table {tableId}</p>
        </div>
        <button 
          onClick={() => setIsCartOpen(true)}
          className="relative p-2 hover:bg-stone-50 rounded-full transition-colors"
        >
          <ShoppingCart className="w-6 h-6 text-stone-600" />
          {cart.length > 0 && (
            <span className="absolute top-0 right-0 w-5 h-5 bg-accent text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow-sm">
              {cart.reduce((a, b) => a + b.quantity, 0)}
            </span>
          )}
        </button>
      </header>

      {/* Search & Categories */}
      <div className="px-6 py-6 space-y-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
          <input 
            type="text" 
            placeholder="Search for dishes..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl border border-stone-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all text-stone-700 placeholder-stone-300"
          />
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
          <button
            onClick={() => setActiveCategory('all')}
            className={cn(
              "px-6 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all",
              activeCategory === 'all' ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-white text-stone-500 border border-stone-100"
            )}
          >
            All Items
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                "px-6 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all",
                activeCategory === cat.id ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-white text-stone-500 border border-stone-100"
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Grid */}
      <div className="px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredItems.map(item => (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              key={item.id}
              className="premium-card group overflow-hidden flex flex-col"
            >
              <div className="relative h-48 overflow-hidden">
                {item.imageUrl ? (
                  <img 
                    src={item.imageUrl} 
                    alt={item.name} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full bg-stone-100 flex items-center justify-center">
                    <UtensilsCrossed className="w-12 h-12 text-stone-200" />
                  </div>
                )}
                
                {/* Badges */}
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  {item.isBestSeller && (
                    <span className="bg-amber-400 text-white text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-lg">
                      <Star className="w-3 h-3 fill-current" /> BEST SELLER
                    </span>
                  )}
                  {item.isTodayPick && (
                    <span className="bg-primary text-white text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-lg">
                      <Flame className="w-3 h-3 fill-current" /> TODAY'S PICK
                    </span>
                  )}
                </div>
                
                {item.isVeg !== undefined && (
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm p-1.5 rounded-lg shadow-lg">
                    <div className={cn(
                      "w-4 h-4 border-2 rounded-sm flex items-center justify-center",
                      item.isVeg ? "border-green-600" : "border-red-600"
                    )}>
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        item.isVeg ? "bg-green-600" : "bg-red-600"
                      )} />
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-serif italic text-stone-800">{item.name}</h3>
                  <div className="flex flex-col items-end">
                    <span className="text-lg font-bold text-primary">
                      {typeof item.price === 'number' ? `Rs. ${item.price.toFixed(2)}` : (item.price || 'N/A')} {item.halfPrice ? '(F)' : ''}
                    </span>
                    {item.halfPrice && (
                      <span className="text-sm font-medium text-stone-500">
                        {typeof item.halfPrice === 'number' ? `Rs. ${item.halfPrice.toFixed(2)}` : item.halfPrice} (H)
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-stone-400 text-sm mb-6 line-clamp-2 flex-1">{item.description}</p>
                
                <div className="flex flex-col gap-3 mt-auto">
                  {/* Full Plate Controls */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-stone-500 font-medium text-sm">
                      {item.halfPrice ? 'Full Plate' : 'Add to Order'}
                    </div>
                    
                    {cart.find(i => i.id === item.id && !i.isHalfPlate) ? (
                      <div className="flex items-center gap-4 bg-stone-50 rounded-full px-2 py-1 border border-stone-100">
                        <button 
                          onClick={() => removeFromCart(item.id, false)}
                          className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-stone-600 hover:bg-stone-100 transition-colors"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="font-bold text-stone-800 w-4 text-center">
                          {cart.find(i => i.id === item.id && !i.isHalfPlate)?.quantity}
                        </span>
                        <button 
                          onClick={() => addToCart(item, false)}
                          className="w-8 h-8 rounded-full bg-primary shadow-lg shadow-primary/20 flex items-center justify-center text-white hover:bg-primary/90 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => addToCart(item, false)}
                        className="premium-button bg-stone-800 text-white text-sm py-2 hover:bg-stone-700 shadow-md shadow-stone-200"
                      >
                        Add {item.halfPrice ? 'Full' : ''}
                      </button>
                    )}
                  </div>

                  {/* Half Plate Controls */}
                  {item.halfPrice && (
                    <div className="flex items-center justify-between pt-3 border-t border-stone-100">
                      <div className="flex items-center gap-1 text-stone-500 font-medium text-sm">
                        Half Plate
                      </div>
                      
                      {cart.find(i => i.id === item.id && i.isHalfPlate) ? (
                        <div className="flex items-center gap-4 bg-stone-50 rounded-full px-2 py-1 border border-stone-100">
                          <button 
                            onClick={() => removeFromCart(item.id, true)}
                            className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-stone-600 hover:bg-stone-100 transition-colors"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="font-bold text-stone-800 w-4 text-center">
                            {cart.find(i => i.id === item.id && i.isHalfPlate)?.quantity}
                          </span>
                          <button 
                            onClick={() => addToCart(item, true)}
                            className="w-8 h-8 rounded-full bg-primary shadow-lg shadow-primary/20 flex items-center justify-center text-white hover:bg-primary/90 transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => addToCart(item, true)}
                          className="premium-button bg-stone-100 text-stone-800 text-sm py-2 hover:bg-stone-200 shadow-sm"
                        >
                          Add Half
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Cart Drawer */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-40"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[3rem] z-50 max-h-[90vh] overflow-y-auto shadow-2xl border-t border-stone-100"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-3xl font-serif italic text-stone-900">Your Order</h2>
                  <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-stone-50 rounded-full">
                    <X className="w-6 h-6 text-stone-400" />
                  </button>
                </div>

                {cart.length === 0 ? (
                  <div className="py-20 text-center">
                    <div className="w-20 h-20 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-6">
                      <ShoppingCart className="w-10 h-10 text-stone-200" />
                    </div>
                    <p className="text-stone-400 font-medium">Your cart is empty</p>
                  </div>
                ) : (
                  <div className="space-y-8">
                    <div className="space-y-4">
                      {cart.map(item => (
                        <div key={`${item.id}-${item.isHalfPlate}`} className="flex items-center justify-between py-4 border-b border-stone-50">
                          <div>
                            <h4 className="font-bold text-stone-800">{item.name} {item.isHalfPlate ? '(Half)' : ''}</h4>
                            <p className="text-stone-400 text-sm">{typeof item.price === 'number' ? `Rs. ${item.price.toFixed(2)}` : (item.price || 'N/A')} each</p>
                          </div>
                          <div className="flex items-center gap-4">
                            <button 
                              onClick={() => removeFromCart(item.id, item.isHalfPlate)}
                              className="w-8 h-8 rounded-full border border-stone-200 flex items-center justify-center text-stone-400 hover:border-stone-400 transition-colors"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="font-bold text-stone-800 w-4 text-center">{item.quantity}</span>
                            <button 
                              onClick={() => {
                                const menuItem = menuItems.find(i => i.id === item.id);
                                if (menuItem) addToCart(menuItem, item.isHalfPlate);
                              }}
                              className="w-8 h-8 rounded-full bg-stone-800 flex items-center justify-center text-white hover:bg-stone-700 transition-colors"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-6">
                      <div>
                        <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">Your Name</label>
                        <input 
                          type="text" 
                          placeholder="Enter your name" 
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          className="premium-input"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">Special Instructions</label>
                        <textarea 
                          placeholder="Less spice, extra cheese, etc." 
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          className="premium-input min-h-[100px] resize-none"
                        />
                      </div>
                    </div>

                    <div className="pt-6 border-t border-stone-100">
                      <div className="flex justify-between items-center mb-8">
                        <span className="text-stone-400 font-medium">Total Amount</span>
                        <span className="text-3xl font-serif italic text-primary">Rs. {cartTotal.toFixed(2)}</span>
                      </div>
                      <button
                        onClick={handlePlaceOrder}
                        disabled={!customerName || cart.length === 0 || isOrdering}
                        className="w-full premium-button bg-primary text-white py-5 text-xl font-serif italic shadow-2xl shadow-primary/20 disabled:opacity-50"
                      >
                        {isOrdering ? 'Placing Order...' : 'Confirm Order'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Floating Cart Button (Mobile) */}
      {cart.length > 0 && !isCartOpen && (
        <motion.div 
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="fixed bottom-8 left-6 right-6 z-40"
        >
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full bg-stone-900 text-white rounded-full py-5 px-8 flex items-center justify-between shadow-2xl shadow-stone-900/40"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center">
                <ShoppingCart className="w-4 h-4" />
              </div>
              <span className="font-bold text-sm">{cart.reduce((a, b) => a + b.quantity, 0)} Items</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-stone-400 text-sm">View Cart</span>
              <span className="font-serif italic text-xl">Rs. {cartTotal.toFixed(2)}</span>
            </div>
          </button>
        </motion.div>
      )}
    </div>
  );
}

function UtensilsCrossed(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m16 2-2.3 2.3a3 3 0 0 0 0 4.2l1.8 1.8a3 3 0 0 0 4.2 0L22 8" />
      <path d="M15 15 2 2" />
      <path d="m2 15 21.5-21.5" />
      <path d="M15 2s2 2 2 4.5-2 4.5-2 4.5" />
      <path d="M15 2s-2 2-2 4.5 2 4.5 2 4.5" />
    </svg>
  )
}
