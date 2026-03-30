import { useState, useEffect } from 'react';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, where } from 'firebase/firestore';
import { Order, OrderStatus, RestaurantProfile } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChefHat, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  LogOut, 
  UtensilsCrossed,
  Timer,
  ChevronRight,
  Bell,
  AlertTriangle,
  X
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function KitchenDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [restaurant, setRestaurant] = useState<RestaurantProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSubPopup, setShowSubPopup] = useState(false);

  useEffect(() => {
    const q = query(
      collection(db, 'orders'), 
      where('status', 'in', ['pending', 'preparing']),
      orderBy('createdAt', 'asc')
    );

    const unsubscribeOrders = onSnapshot(q, (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'orders');
    });

    const unsubscribeRestaurant = onSnapshot(doc(db, 'settings', 'restaurant'), (doc) => {
      if (doc.exists()) setRestaurant(doc.data() as RestaurantProfile);
    });

    return () => {
      unsubscribeOrders();
      unsubscribeRestaurant();
    };
  }, []);

  const currentEndDate = restaurant?.subscription?.endDate ? new Date(restaurant.subscription.endDate) : null;
  const isExpired = currentEndDate && Math.ceil((currentEndDate.getTime() - new Date().getTime()) / (1000 * 3600 * 24)) <= 0;

  const updateStatus = async (orderId: string, status: OrderStatus) => {
    if (isExpired && status === 'preparing') {
      setShowSubPopup(true);
      return;
    }
    try {
      await updateDoc(doc(db, 'orders', orderId), { status });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  const handleLogout = () => auth.signOut();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-stone-900">
        <div className="animate-pulse text-stone-600 font-serif italic text-2xl">Kitchen Syncing...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col">
      {/* Header */}
      <header className="bg-stone-900/50 backdrop-blur-xl border-b border-stone-800 px-4 md:px-8 py-4 md:py-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sticky top-0 z-30">
        <div className="flex items-center gap-3 md:gap-4">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-primary rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
            <ChefHat className="w-6 h-6 md:w-7 md:h-7 text-white" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-serif italic">Kitchen Dashboard</h1>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-[10px] text-stone-500 uppercase tracking-widest font-bold">Live Order Stream</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 md:gap-6 w-full md:w-auto justify-between md:justify-end">
          <div className="flex items-center gap-2 md:gap-3 bg-stone-800/50 px-3 md:px-4 py-1.5 md:py-2 rounded-full border border-stone-700">
            <Bell className="w-3 h-3 md:w-4 md:h-4 text-primary" />
            <span className="text-xs md:text-sm font-bold text-stone-300">{orders.length} Active Orders</span>
          </div>
          <button 
            onClick={handleLogout}
            className="p-2 md:p-3 hover:bg-stone-800 rounded-full transition-colors text-stone-500 hover:text-white"
          >
            <LogOut className="w-5 h-5 md:w-6 md:h-6" />
          </button>
        </div>
      </header>

      <AnimatePresence>
        {showSubPopup && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-stone-900/80 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-stone-900 border border-stone-800 rounded-[3rem] p-10 shadow-2xl w-full max-w-lg text-center relative"
            >
              <button 
                onClick={() => setShowSubPopup(false)}
                className="absolute top-6 right-6 p-2 text-stone-500 hover:bg-stone-800 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
              <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="w-10 h-10 text-red-500" />
              </div>
              <h3 className="text-3xl font-serif italic text-stone-100 mb-4">Subscription Ended</h3>
              <p className="text-stone-400 mb-8">
                Renew your subscription to use the app. Contact your administrator.
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Orders Grid */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        {orders.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-stone-600">
            <UtensilsCrossed className="w-16 h-16 md:w-20 md:h-20 mb-4 md:mb-6 opacity-20" />
            <p className="text-lg md:text-xl font-serif italic text-center">No pending orders. Take a breath.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-8">
            <AnimatePresence mode="popLayout">
              {orders.map(order => (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -20 }}
                  key={order.id}
                  className={cn(
                    "bg-stone-900 rounded-[2.5rem] overflow-hidden border transition-all duration-500 flex flex-col",
                    order.status === 'preparing' ? "border-primary/30 shadow-2xl shadow-primary/5" : "border-stone-800 shadow-xl"
                  )}
                >
                  {/* Order Header */}
                  <div className={cn(
                    "p-4 md:p-6 flex items-center justify-between",
                    order.status === 'preparing' ? "bg-primary/10" : "bg-stone-800/30"
                  )}>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-stone-500 text-[10px] font-bold uppercase tracking-widest">Table</span>
                        <span className="text-xl md:text-2xl font-serif italic text-white">{order.tableNumber}</span>
                      </div>
                      <h3 className="text-sm font-bold text-stone-300 truncate max-w-[150px]">{order.customerName}</h3>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center justify-end gap-1 text-stone-500 text-[10px] font-bold uppercase tracking-widest mb-1">
                        <Timer className="w-3 h-3" />
                        {formatDistanceToNow(new Date(order.createdAt))} ago
                      </div>
                      <StatusBadge status={order.status} />
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="p-4 md:p-6 flex-1 space-y-4">
                    <div className="space-y-3">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex items-start justify-between group">
                          <div className="flex items-center gap-3">
                            <span className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-stone-800 flex items-center justify-center text-primary font-bold text-sm">
                              {item.quantity}
                            </span>
                            <span className="text-stone-200 font-medium group-hover:text-white transition-colors text-sm md:text-base">
                              {item.name}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {order.notes && (
                      <div className="mt-4 md:mt-6 p-3 md:p-4 bg-stone-800/50 rounded-xl md:rounded-2xl border border-stone-700/50 flex gap-2 md:gap-3">
                        <AlertCircle className="w-4 h-4 md:w-5 md:h-5 text-amber-500 flex-shrink-0" />
                        <p className="text-xs text-stone-400 italic leading-relaxed">
                          "{order.notes}"
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="p-4 md:p-6 pt-0 mt-auto flex flex-col gap-2">
                    {order.status === 'pending' ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => updateStatus(order.id, 'cancelled')}
                          className="flex-1 bg-red-500/10 text-red-500 py-4 rounded-2xl font-bold text-sm uppercase tracking-widest hover:bg-red-500/20 transition-all flex items-center justify-center"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => updateStatus(order.id, 'preparing')}
                          className="flex-[2] bg-primary text-white py-4 rounded-2xl font-bold text-sm uppercase tracking-widest hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                        >
                          Accept <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => updateStatus(order.id, 'payment_pending')}
                        className="w-full bg-green-600 text-white py-4 rounded-2xl font-bold text-sm uppercase tracking-widest hover:bg-green-500 transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-900/20"
                      >
                        Mark Completed <CheckCircle2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors = {
    pending: "text-amber-500",
    preparing: "text-blue-500",
    completed: "text-green-500",
    cancelled: "text-red-500"
  };
  return (
    <span className={cn(
      "text-[10px] font-bold uppercase tracking-widest",
      colors[status as keyof typeof colors]
    )}>
      {status}
    </span>
  );
}
