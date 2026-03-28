import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { RestaurantProfile, Order } from '../types';
import { motion } from 'framer-motion';
import { MapPin, Phone, ArrowRight, UtensilsCrossed, Clock, ChefHat, Receipt, Plus } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

interface Props {
  restaurant: RestaurantProfile | null;
}

export default function Landing({ restaurant }: Props) {
  const { tableId } = useParams();
  const navigate = useNavigate();
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tableId) return;
    
    const q = query(
      collection(db, 'orders'),
      where('tableNumber', '==', parseInt(tableId)),
      where('status', 'in', ['pending', 'preparing'])
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
      orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setActiveOrders(orders);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [tableId]);

  if (!restaurant || loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-stone-50">
        <div className="animate-pulse text-stone-400 font-serif italic text-xl">Welcome...</div>
      </div>
    );
  }

  if (activeOrders.length > 0) {
    return (
      <div className="min-h-screen bg-stone-50 p-6 pb-24">
        <header className="mb-8 text-center pt-8">
          <h1 className="text-3xl font-serif italic text-stone-900 mb-2">Your Orders</h1>
          <p className="text-stone-500 text-sm uppercase tracking-widest font-bold">Table {tableId}</p>
        </header>

        <div className="space-y-6 max-w-md mx-auto">
          {activeOrders.map(order => (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              key={order.id} 
              className="bg-white rounded-3xl p-6 shadow-sm border border-stone-100"
            >
              <div className="flex items-center justify-between mb-6 pb-6 border-b border-stone-50">
                <div>
                  <p className="text-xs text-stone-400 uppercase tracking-widest font-bold mb-1">Order #{order.id.slice(-6)}</p>
                  <p className="font-bold text-stone-800">{order.customerName}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-stone-400 uppercase tracking-widest font-bold mb-1">Total</p>
                  <p className="font-bold text-primary">Rs. {order.total.toFixed(2)}</p>
                </div>
              </div>

              {/* Status Tracker */}
              <div className="mb-8">
                <div className="flex justify-between mb-2">
                  <div className={`flex flex-col items-center gap-2 ${order.status === 'pending' || order.status === 'preparing' ? 'text-primary' : 'text-stone-300'}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${order.status === 'pending' || order.status === 'preparing' ? 'bg-primary/10' : 'bg-stone-100'}`}>
                      <Clock className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest">Received</span>
                  </div>
                  <div className={`flex flex-col items-center gap-2 ${order.status === 'preparing' ? 'text-amber-500' : 'text-stone-300'}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${order.status === 'preparing' ? 'bg-amber-50' : 'bg-stone-100'}`}>
                      <ChefHat className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest">Preparing</span>
                  </div>
                </div>
                <div className="relative h-2 bg-stone-100 rounded-full overflow-hidden">
                  <motion.div 
                    className={`absolute top-0 left-0 h-full ${order.status === 'preparing' ? 'bg-amber-500' : 'bg-primary'}`}
                    initial={{ width: '0%' }}
                    animate={{ width: order.status === 'preparing' ? '100%' : '50%' }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>

              {/* Items */}
              <div className="space-y-3">
                <h4 className="text-xs text-stone-400 uppercase tracking-widest font-bold flex items-center gap-2">
                  <Receipt className="w-4 h-4" /> Order Items
                </h4>
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className="text-stone-600"><span className="font-bold mr-2">{item.quantity}x</span> {item.name}</span>
                    <span className="text-stone-400">Rs. {(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}

          <button
            onClick={() => navigate(`/table/${tableId}/menu`)}
            className="w-full premium-button bg-stone-900 text-white py-4 flex items-center justify-center gap-2 shadow-xl hover:bg-stone-800"
          >
            <Plus className="w-5 h-5" /> Order More Items
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Accents */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="max-w-md w-full text-center relative z-10"
      >
        {/* Logo/Icon */}
        <div className="mb-10 flex justify-center">
          {restaurant.logoUrl ? (
            <img 
              src={restaurant.logoUrl} 
              alt={restaurant.name} 
              className="w-32 h-32 object-contain rounded-full shadow-2xl border-4 border-white"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-24 h-24 bg-primary rounded-[2rem] flex items-center justify-center shadow-2xl transform -rotate-6">
              <UtensilsCrossed className="w-12 h-12 text-white" />
            </div>
          )}
        </div>

        {/* Welcome Text */}
        <h1 className="text-5xl font-serif italic text-stone-900 mb-4 leading-tight">
          {restaurant.name}
        </h1>
        
        <p className="text-stone-500 mb-8 text-lg font-medium leading-relaxed">
          {restaurant.intro || "Experience the finest flavors crafted with passion and elegance."}
        </p>

        {/* Table Info */}
        <div className="inline-flex items-center gap-2 px-6 py-2 bg-white rounded-full shadow-sm border border-stone-100 mb-12">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-stone-600 font-bold text-sm uppercase tracking-widest">Table {tableId}</span>
        </div>

        {/* Action Button */}
        <button
          onClick={() => navigate(`/table/${tableId}/menu`)}
          className="w-full group relative overflow-hidden premium-button bg-primary text-white py-5 flex items-center justify-center gap-3 shadow-2xl shadow-primary/20 hover:scale-[1.02] transition-all"
        >
          <span className="text-xl font-serif italic">View Menu</span>
          <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
        </button>

        {/* Info Footer */}
        <div className="mt-16 pt-10 border-t border-stone-200/50 flex flex-col gap-4">
          {restaurant.address && (
            <div className="flex items-center justify-center gap-2 text-stone-400 text-sm">
              <MapPin className="w-4 h-4" />
              <span>{restaurant.address}</span>
            </div>
          )}
          {restaurant.contact && (
            <div className="flex items-center justify-center gap-2 text-stone-400 text-sm">
              <Phone className="w-4 h-4" />
              <span>{restaurant.contact}</span>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
