import { useState, useEffect } from 'react';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, where } from 'firebase/firestore';
import { Order, OrderStatus } from '../types';
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
  Bell
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function KitchenDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'orders'), 
      where('status', 'in', ['pending', 'preparing']),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'orders');
    });

    return () => unsubscribe();
  }, []);

  const updateStatus = async (orderId: string, status: OrderStatus) => {
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
      <header className="bg-stone-900/50 backdrop-blur-xl border-b border-stone-800 px-8 py-6 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
            <ChefHat className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-serif italic">Kitchen Dashboard</h1>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-[10px] text-stone-500 uppercase tracking-widest font-bold">Live Order Stream</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 bg-stone-800/50 px-4 py-2 rounded-full border border-stone-700">
            <Bell className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold text-stone-300">{orders.length} Active Orders</span>
          </div>
          <button 
            onClick={handleLogout}
            className="p-3 hover:bg-stone-800 rounded-full transition-colors text-stone-500 hover:text-white"
          >
            <LogOut className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Orders Grid */}
      <main className="flex-1 p-8 overflow-y-auto">
        {orders.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-stone-600">
            <UtensilsCrossed className="w-20 h-20 mb-6 opacity-20" />
            <p className="text-xl font-serif italic">No pending orders. Take a breath.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
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
                    "p-6 flex items-center justify-between",
                    order.status === 'preparing' ? "bg-primary/10" : "bg-stone-800/30"
                  )}>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-stone-500 text-[10px] font-bold uppercase tracking-widest">Table</span>
                        <span className="text-2xl font-serif italic text-white">{order.tableNumber}</span>
                      </div>
                      <h3 className="text-sm font-bold text-stone-300 truncate max-w-[150px]">{order.customerName}</h3>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-stone-500 text-[10px] font-bold uppercase tracking-widest mb-1">
                        <Timer className="w-3 h-3" />
                        {formatDistanceToNow(new Date(order.createdAt))} ago
                      </div>
                      <StatusBadge status={order.status} />
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="p-6 flex-1 space-y-4">
                    <div className="space-y-3">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex items-start justify-between group">
                          <div className="flex items-center gap-3">
                            <span className="w-8 h-8 rounded-lg bg-stone-800 flex items-center justify-center text-primary font-bold text-sm">
                              {item.quantity}
                            </span>
                            <span className="text-stone-200 font-medium group-hover:text-white transition-colors">
                              {item.name}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {order.notes && (
                      <div className="mt-6 p-4 bg-stone-800/50 rounded-2xl border border-stone-700/50 flex gap-3">
                        <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                        <p className="text-xs text-stone-400 italic leading-relaxed">
                          "{order.notes}"
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="p-6 pt-0 mt-auto flex flex-col gap-2">
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
