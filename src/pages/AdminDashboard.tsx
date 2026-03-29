import React, { useState, useEffect } from 'react';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  addDoc, 
  deleteDoc, 
  updateDoc, 
  query, 
  orderBy,
  getDocs
} from 'firebase/firestore';
import { 
  RestaurantProfile, 
  Category, 
  MenuItem, 
  Table, 
  Order, 
  RestaurantTheme 
} from '../types';
import { 
  LayoutDashboard, 
  Utensils, 
  Table as TableIcon, 
  Settings, 
  Plus, 
  Trash2, 
  Edit2, 
  LogOut, 
  CheckCircle2, 
  Clock, 
  ChefHat,
  Image as ImageIcon,
  Palette,
  QrCode,
  ChevronRight,
  Search,
  Banknote,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { format, startOfDay, startOfWeek, startOfMonth, isAfter } from 'date-fns';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'menu' | 'tables' | 'settings'>('overview');
  const [restaurant, setRestaurant] = useState<RestaurantProfile | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch Data
  useEffect(() => {
    const unsubRestaurant = onSnapshot(doc(db, 'settings', 'restaurant'), (doc) => {
      if (doc.exists()) setRestaurant(doc.data() as RestaurantProfile);
      setLoading(false);
    });

    const unsubCats = onSnapshot(query(collection(db, 'categories'), orderBy('order')), (snapshot) => {
      setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category)));
    });

    const unsubItems = onSnapshot(collection(db, 'menuItems'), (snapshot) => {
      setMenuItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MenuItem)));
    });

    const unsubTables = onSnapshot(query(collection(db, 'tables'), orderBy('number')), (snapshot) => {
      setTables(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Table)));
    });

    const unsubOrders = onSnapshot(query(collection(db, 'orders'), orderBy('createdAt', 'desc')), (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)));
    });

    return () => {
      unsubRestaurant();
      unsubCats();
      unsubItems();
      unsubTables();
      unsubOrders();
    };
  }, []);

  const handleLogout = () => auth.signOut();

  if (loading) return <div className="h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-stone-50 flex">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-stone-100 flex flex-col sticky top-0 h-screen">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-stone-800 rounded-xl flex items-center justify-center shadow-lg transform -rotate-6">
              <Utensils className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-serif italic text-stone-900 leading-tight">{restaurant?.name || 'Admin'}</h1>
              <span className="text-[10px] text-stone-400 uppercase tracking-widest font-bold">Reception Hub</span>
            </div>
          </div>

          <nav className="space-y-2">
            <SidebarItem 
              icon={<LayoutDashboard className="w-5 h-5" />} 
              label="Overview" 
              active={activeTab === 'overview'} 
              onClick={() => setActiveTab('overview')} 
            />
            <SidebarItem 
              icon={<Utensils className="w-5 h-5" />} 
              label="Menu Manager" 
              active={activeTab === 'menu'} 
              onClick={() => setActiveTab('menu')} 
            />
            <SidebarItem 
              icon={<TableIcon className="w-5 h-5" />} 
              label="Tables & QR" 
              active={activeTab === 'tables'} 
              onClick={() => setActiveTab('tables')} 
            />
            <SidebarItem 
              icon={<Settings className="w-5 h-5" />} 
              label="Restaurant Setup" 
              active={activeTab === 'settings'} 
              onClick={() => setActiveTab('settings')} 
            />
          </nav>
        </div>

        <div className="mt-auto p-8 border-t border-stone-50">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 text-stone-400 hover:text-red-500 transition-colors font-medium text-sm"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-12 overflow-y-auto">
        <header className="flex justify-between items-center mb-12">
          <div>
            <h2 className="text-4xl font-serif italic text-stone-900 mb-2 capitalize">{activeTab}</h2>
            <p className="text-stone-400 font-medium">Manage your restaurant operations in real-time.</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="bg-white rounded-full px-6 py-3 border border-stone-100 shadow-sm flex items-center gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-stone-600 font-bold text-xs uppercase tracking-widest">Live Sync Active</span>
            </div>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === 'overview' && <Overview orders={orders} />}
          {activeTab === 'menu' && <MenuManager categories={categories} menuItems={menuItems} />}
          {activeTab === 'tables' && <TableManager tables={tables} />}
          {activeTab === 'settings' && <RestaurantSetup restaurant={restaurant} />}
        </AnimatePresence>
      </main>
    </div>
  );
}

function SidebarItem({ icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 group",
        active ? "bg-stone-800 text-white shadow-xl shadow-stone-200" : "text-stone-400 hover:bg-stone-50 hover:text-stone-600"
      )}
    >
      <span className={cn("transition-transform duration-300", active ? "scale-110" : "group-hover:scale-110")}>
        {icon}
      </span>
      <span className="font-medium">{label}</span>
      {active && <ChevronRight className="w-4 h-4 ml-auto" />}
    </button>
  );
}

// --- Sub-components ---

function Overview({ orders }: { orders: Order[] }) {
  const activeOrders = orders.filter(o => o.status !== 'completed' && o.status !== 'cancelled');
  const completedOrders = orders.filter(o => o.status === 'completed');
  
  const today = startOfDay(new Date());
  const thisWeek = startOfWeek(new Date());
  const thisMonth = startOfMonth(new Date());

  const completedToday = completedOrders.filter(o => isAfter(new Date(o.createdAt), today));
  const completedThisWeek = completedOrders.filter(o => isAfter(new Date(o.createdAt), thisWeek));
  const completedThisMonth = completedOrders.filter(o => isAfter(new Date(o.createdAt), thisMonth));

  const revenueToday = completedToday.reduce((sum, o) => sum + o.total, 0);
  const revenueThisWeek = completedThisWeek.reduce((sum, o) => sum + o.total, 0);
  const revenueThisMonth = completedThisMonth.reduce((sum, o) => sum + o.total, 0);

  // Calculate average daily sales based on the first order date
  const firstOrderDate = completedOrders.length > 0 
    ? new Date(Math.min(...completedOrders.map(o => new Date(o.createdAt).getTime()))) 
    : new Date();
  const daysSinceFirstOrder = Math.max(1, Math.ceil((new Date().getTime() - firstOrderDate.getTime()) / (1000 * 3600 * 24)));
  const totalRevenue = completedOrders.reduce((sum, o) => sum + o.total, 0);
  const averageDailySales = totalRevenue / daysSinceFirstOrder;

  const pendingPaymentOrders = orders.filter(o => o.status === 'payment_pending');

  // Calculate most sold items
  const itemCounts: Record<string, number> = {};
  completedOrders.forEach(order => {
    order.items.forEach(item => {
      itemCounts[item.name] = (itemCounts[item.name] || 0) + item.quantity;
    });
  });

  const sortedItems = Object.entries(itemCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  const mostSoldItem = sortedItems.length > 0 ? sortedItems[0].name : 'N/A';

  const handlePaymentReceived = async (orderId: string) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { status: 'completed' });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Active Orders" value={activeOrders.length} icon={<Clock className="text-amber-500" />} />
        <StatCard label="Pending Payment" value={pendingPaymentOrders.length} icon={<AlertTriangle className="text-orange-500" />} />
        <StatCard label="Completed Today" value={completedToday.length} icon={<CheckCircle2 className="text-green-500" />} />
        <StatCard label="Most Sold Item" value={mostSoldItem} icon={<Utensils className="text-blue-500" />} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Daily Revenue" value={`Rs. ${revenueToday.toFixed(2)}`} icon={<Banknote className="text-primary" />} />
        <StatCard label="Weekly Revenue" value={`Rs. ${revenueThisWeek.toFixed(2)}`} icon={<TrendingUp className="text-primary" />} />
        <StatCard label="Monthly Revenue" value={`Rs. ${revenueThisMonth.toFixed(2)}`} icon={<Palette className="text-primary" />} />
        <StatCard label="Avg Daily Sales" value={`Rs. ${averageDailySales.toFixed(2)}`} icon={<TrendingUp className="text-blue-500" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 premium-card p-8">
          <h3 className="text-xl font-serif italic text-stone-800 mb-6">Top Selling Items</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sortedItems} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f5f5f4" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#78716c', fontSize: 12 }} width={120} />
                <Tooltip 
                  cursor={{ fill: '#fafaf9' }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
                />
                <Bar dataKey="count" fill="var(--primary)" radius={[0, 4, 4, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="premium-card p-8 flex flex-col">
          <h3 className="text-xl font-serif italic text-stone-800 mb-6">Pending Payments</h3>
          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            {pendingPaymentOrders.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-stone-400">
                <CheckCircle2 className="w-12 h-12 mb-2 opacity-20" />
                <p className="text-sm">All payments cleared</p>
              </div>
            ) : (
              pendingPaymentOrders.map(order => (
                <div key={order.id} className="bg-stone-50 p-4 rounded-2xl border border-stone-100 flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Table {order.tableNumber}</span>
                      <p className="font-bold text-stone-800">{order.customerName}</p>
                    </div>
                    <span className="font-bold text-primary">Rs. {order.total.toFixed(2)}</span>
                  </div>
                  <button 
                    onClick={() => handlePaymentReceived(order.id)}
                    className="w-full bg-green-500 text-white py-2 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-green-600 transition-colors"
                  >
                    Payment Received
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="premium-card p-8">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-2xl font-serif italic text-stone-800">Recent Orders</h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-300" />
            <input type="text" placeholder="Search orders..." className="pl-10 pr-4 py-2 bg-stone-50 rounded-full text-sm border-none focus:ring-2 focus:ring-primary/10" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-stone-400 text-[10px] uppercase tracking-widest font-bold border-b border-stone-50">
                <th className="pb-4">Order ID</th>
                <th className="pb-4">Customer</th>
                <th className="pb-4">Table</th>
                <th className="pb-4">Items</th>
                <th className="pb-4">Total</th>
                <th className="pb-4">Status</th>
                <th className="pb-4">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {orders.map(order => (
                <tr key={order.id} className="group hover:bg-stone-50/50 transition-colors">
                  <td className="py-6 font-mono text-xs text-stone-400">#{order.id.slice(-6)}</td>
                  <td className="py-6 font-bold text-stone-800">{order.customerName}</td>
                  <td className="py-6">
                    <span className="bg-stone-100 px-3 py-1 rounded-full text-xs font-bold text-stone-600">T-{order.tableNumber}</span>
                  </td>
                  <td className="py-6">
                    <div className="flex flex-col gap-1">
                      {order.items.map((item, idx) => (
                        <span key={idx} className="text-xs text-stone-500">{item.quantity}x {item.name}</span>
                      ))}
                    </div>
                  </td>
                  <td className="py-6 font-bold text-primary">Rs. {order.total.toFixed(2)}</td>
                  <td className="py-6">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="py-6 text-xs text-stone-400">{format(new Date(order.createdAt), 'HH:mm')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}

function StatCard({ label, value, icon }: { label: string, value: string | number, icon: any }) {
  return (
    <div className="premium-card p-8 flex items-center justify-between">
      <div>
        <p className="text-stone-400 text-xs uppercase tracking-widest font-bold mb-2">{label}</p>
        <h4 className="text-4xl font-serif italic text-stone-900">{value}</h4>
      </div>
      <div className="w-14 h-14 bg-stone-50 rounded-2xl flex items-center justify-center text-2xl">
        {icon}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors = {
    pending: "bg-amber-50 text-amber-600 border-amber-100",
    preparing: "bg-blue-50 text-blue-600 border-blue-100",
    completed: "bg-green-50 text-green-600 border-green-100",
    cancelled: "bg-red-50 text-red-600 border-red-100"
  };
  return (
    <span className={cn(
      "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border",
      colors[status as keyof typeof colors]
    )}>
      {status}
    </span>
  );
}

function MenuManager({ categories, menuItems }: { categories: Category[], menuItems: MenuItem[] }) {
  const [isAddingCat, setIsAddingCat] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [newCatName, setNewCatName] = useState('');
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [newItem, setNewItem] = useState<Partial<MenuItem>>({ available: true });
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [catToDelete, setCatToDelete] = useState<string | null>(null);

  const handleAddCategory = async () => {
    if (!newCatName) return;
    try {
      await addDoc(collection(db, 'categories'), { name: newCatName, order: categories.length });
      setNewCatName('');
      setIsAddingCat(false);
    } catch (e) { handleFirestoreError(e, OperationType.CREATE, 'categories'); }
  };

  const handleUpdateCategory = async () => {
    if (!editingCat || !editingCat.name) return;
    try {
      await updateDoc(doc(db, 'categories', editingCat.id), { name: editingCat.name });
      setEditingCat(null);
    } catch (e) { handleFirestoreError(e, OperationType.UPDATE, 'categories'); }
  };

  const handleAddItem = async () => {
    if (!newItem.name || !newItem.price || !newItem.categoryId) return;
    try {
      await addDoc(collection(db, 'menuItems'), { ...newItem, available: true });
      setNewItem({ available: true });
      setIsAddingItem(false);
    } catch (e) { handleFirestoreError(e, OperationType.CREATE, 'menuItems'); }
  };

  const handleUpdateItem = async () => {
    if (!editingItem || !editingItem.name || !editingItem.price || !editingItem.categoryId) return;
    try {
      const { id, ...data } = editingItem;
      await updateDoc(doc(db, 'menuItems', id), data);
      setEditingItem(null);
    } catch (e) { handleFirestoreError(e, OperationType.UPDATE, 'menuItems'); }
  };

  const handleDeleteItem = async () => {
    if (itemToDelete) {
      try {
        await deleteDoc(doc(db, 'menuItems', itemToDelete));
        setItemToDelete(null);
      } catch (e) { handleFirestoreError(e, OperationType.DELETE, 'menuItems'); }
    }
  };

  const handleDeleteCategory = async () => {
    if (catToDelete) {
      try {
        await deleteDoc(doc(db, 'categories', catToDelete));
        setCatToDelete(null);
      } catch (e) { handleFirestoreError(e, OperationType.DELETE, 'categories'); }
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-12"
    >
      {/* Categories */}
      <section>
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-2xl font-serif italic text-stone-800">Categories</h3>
          <button 
            onClick={() => setIsAddingCat(true)}
            className="premium-button bg-stone-800 text-white text-sm flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add Category
          </button>
        </div>

        <div className="flex flex-wrap gap-4">
          {categories.map(cat => (
            <div key={cat.id} className="bg-white border border-stone-100 px-6 py-3 rounded-2xl flex items-center gap-4 shadow-sm group">
              <span className="font-bold text-stone-700">{cat.name}</span>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => setEditingCat(cat)}
                  className="text-stone-300 hover:text-stone-600 transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setCatToDelete(cat.id)}
                  className="text-stone-300 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Menu Items */}
      <section>
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-2xl font-serif italic text-stone-800">Menu Items</h3>
          <button 
            onClick={() => setIsAddingItem(true)}
            className="premium-button bg-primary text-white text-sm flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add New Dish
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {menuItems.map(item => (
            <div key={item.id} className="premium-card p-6 flex gap-6">
              <div className="w-24 h-24 bg-stone-100 rounded-2xl overflow-hidden flex-shrink-0">
                {item.imageUrl ? (
                  <img src={item.imageUrl} className="w-full h-full object-cover" alt={item.name} referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-stone-300">
                    <ImageIcon className="w-8 h-8" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex justify-between mb-1">
                  <h4 className="font-bold text-stone-800">{item.name}</h4>
                  <span className="text-primary font-bold">Rs. {item.price.toFixed(2)}</span>
                </div>
                <p className="text-stone-400 text-xs mb-4 line-clamp-2">{item.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-widest font-bold text-stone-300">
                    {categories.find(c => c.id === item.categoryId)?.name}
                  </span>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setEditingItem(item)}
                      className="p-2 text-stone-400 hover:text-stone-600 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => setItemToDelete(item.id)} 
                      className="p-2 text-stone-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Modals */}
      <AnimatePresence>
        {isAddingCat && (
          <Modal title="Add Category" onClose={() => setIsAddingCat(false)}>
            <div className="space-y-6">
              <input 
                type="text" 
                placeholder="Category Name (e.g. Main Course)" 
                className="premium-input"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
              />
              <button onClick={handleAddCategory} className="w-full premium-button bg-stone-800 text-white py-4">Save Category</button>
            </div>
          </Modal>
        )}

        {editingCat && (
          <Modal title="Edit Category" onClose={() => setEditingCat(null)}>
            <div className="space-y-6">
              <input 
                type="text" 
                placeholder="Category Name" 
                className="premium-input"
                value={editingCat.name}
                onChange={(e) => setEditingCat({...editingCat, name: e.target.value})}
              />
              <button onClick={handleUpdateCategory} className="w-full premium-button bg-stone-800 text-white py-4">Update Category</button>
            </div>
          </Modal>
        )}

        {catToDelete && (
          <Modal title="Delete Category" onClose={() => setCatToDelete(null)}>
            <div className="space-y-6">
              <p className="text-stone-500">Are you sure you want to delete this category? This will not delete the items in it, but they will become uncategorized.</p>
              <div className="flex gap-4">
                <button onClick={() => setCatToDelete(null)} className="flex-1 premium-button bg-stone-100 text-stone-600 py-4">Cancel</button>
                <button onClick={handleDeleteCategory} className="flex-1 premium-button bg-red-500 text-white py-4">Delete</button>
              </div>
            </div>
          </Modal>
        )}

        {isAddingItem && (
          <Modal title="Add Menu Item" onClose={() => setIsAddingItem(false)}>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-2 block">Name</label>
                  <input type="text" className="premium-input" onChange={e => setNewItem({...newItem, name: e.target.value})} />
                </div>
                <div>
                  <label className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-2 block">Price</label>
                  <input type="number" className="premium-input" onChange={e => setNewItem({...newItem, price: parseFloat(e.target.value)})} />
                </div>
                <div>
                  <label className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-2 block">Category</label>
                  <select className="premium-input" onChange={e => setNewItem({...newItem, categoryId: e.target.value})}>
                    <option value="">Select Category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-2 block">Image URL</label>
                  <input type="text" className="premium-input" onChange={e => setNewItem({...newItem, imageUrl: e.target.value})} />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-2 block">Description</label>
                  <textarea className="premium-input min-h-[100px]" onChange={e => setNewItem({...newItem, description: e.target.value})} />
                </div>
                <div className="flex items-center gap-4 col-span-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-stone-600">
                    <input type="checkbox" onChange={e => setNewItem({...newItem, isVeg: e.target.checked})} /> Veg
                  </label>
                  <label className="flex items-center gap-2 text-sm font-medium text-stone-600">
                    <input type="checkbox" onChange={e => setNewItem({...newItem, isBestSeller: e.target.checked})} /> Best Seller
                  </label>
                </div>
              </div>
              <button onClick={handleAddItem} className="w-full premium-button bg-primary text-white py-4">Add to Menu</button>
            </div>
          </Modal>
        )}

        {editingItem && (
          <Modal title="Edit Menu Item" onClose={() => setEditingItem(null)}>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-2 block">Name</label>
                  <input type="text" className="premium-input" value={editingItem.name} onChange={e => setEditingItem({...editingItem, name: e.target.value})} />
                </div>
                <div>
                  <label className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-2 block">Price</label>
                  <input type="number" className="premium-input" value={editingItem.price} onChange={e => setEditingItem({...editingItem, price: parseFloat(e.target.value)})} />
                </div>
                <div>
                  <label className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-2 block">Category</label>
                  <select className="premium-input" value={editingItem.categoryId} onChange={e => setEditingItem({...editingItem, categoryId: e.target.value})}>
                    <option value="">Select Category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-2 block">Image URL</label>
                  <input type="text" className="premium-input" value={editingItem.imageUrl || ''} onChange={e => setEditingItem({...editingItem, imageUrl: e.target.value})} />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-2 block">Description</label>
                  <textarea className="premium-input min-h-[100px]" value={editingItem.description} onChange={e => setEditingItem({...editingItem, description: e.target.value})} />
                </div>
                <div className="flex items-center gap-4 col-span-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-stone-600">
                    <input type="checkbox" checked={editingItem.isVeg} onChange={e => setEditingItem({...editingItem, isVeg: e.target.checked})} /> Veg
                  </label>
                  <label className="flex items-center gap-2 text-sm font-medium text-stone-600">
                    <input type="checkbox" checked={editingItem.isBestSeller} onChange={e => setEditingItem({...editingItem, isBestSeller: e.target.checked})} /> Best Seller
                  </label>
                  <label className="flex items-center gap-2 text-sm font-medium text-stone-600">
                    <input type="checkbox" checked={editingItem.available} onChange={e => setEditingItem({...editingItem, available: e.target.checked})} /> Available
                  </label>
                </div>
              </div>
              <button onClick={handleUpdateItem} className="w-full premium-button bg-primary text-white py-4">Update Item</button>
            </div>
          </Modal>
        )}

        {itemToDelete && (
          <Modal title="Delete Item" onClose={() => setItemToDelete(null)}>
            <div className="space-y-6">
              <p className="text-stone-500">Are you sure you want to delete this menu item? This action cannot be undone.</p>
              <div className="flex gap-4">
                <button onClick={() => setItemToDelete(null)} className="flex-1 premium-button bg-stone-100 text-stone-600 py-4">Cancel</button>
                <button onClick={handleDeleteItem} className="flex-1 premium-button bg-red-500 text-white py-4">Delete</button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function TableManager({ tables }: { tables: Table[] }) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [tableToDelete, setTableToDelete] = useState<string | null>(null);
  const [newTableNum, setNewTableNum] = useState<number>(tables.length + 1);

  const handleAddTable = async () => {
    try {
      await addDoc(collection(db, 'tables'), { number: newTableNum });
      setIsAdding(false);
    } catch (e) { handleFirestoreError(e, OperationType.CREATE, 'tables'); }
  };

  const handleUpdateTable = async () => {
    if (!editingTable) return;
    try {
      await updateDoc(doc(db, 'tables', editingTable.id), { number: editingTable.number });
      setEditingTable(null);
    } catch (e) { handleFirestoreError(e, OperationType.UPDATE, 'tables'); }
  };

  const handleDeleteTable = async () => {
    if (tableToDelete) {
      try {
        await deleteDoc(doc(db, 'tables', tableToDelete));
        setTableToDelete(null);
      } catch (e) { handleFirestoreError(e, OperationType.DELETE, 'tables'); }
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-12"
    >
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-2xl font-serif italic text-stone-800">Tables & QR Codes</h3>
        <button 
          onClick={() => setIsAdding(true)}
          className="premium-button bg-stone-800 text-white text-sm flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add Table
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {tables.map(table => (
          <div key={table.id} className="premium-card p-8 text-center flex flex-col items-center group">
            <div className="w-16 h-16 bg-stone-50 rounded-2xl flex items-center justify-center text-2xl font-serif italic text-stone-800 mb-6 group-hover:bg-primary group-hover:text-white transition-colors">
              {table.number}
            </div>
            
            <div className="bg-white p-4 rounded-3xl shadow-inner border border-stone-50 mb-6">
              <QRCodeSVG 
                value={`${window.location.origin}/table/${table.number}`} 
                size={120}
                level="H"
                includeMargin={true}
              />
            </div>
            
            <p className="text-xs text-stone-400 font-bold uppercase tracking-widest mb-6">Scan for Table {table.number}</p>
            
            <div className="flex items-center gap-2 w-full">
              <button className="flex-1 premium-button bg-stone-50 text-stone-600 text-xs py-2 hover:bg-stone-100 flex items-center justify-center gap-2">
                <QrCode className="w-3 h-3" /> Print
              </button>
              <button 
                onClick={() => setEditingTable(table)}
                className="p-2 text-stone-300 hover:text-stone-600 transition-colors"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setTableToDelete(table.id)}
                className="p-2 text-stone-300 hover:text-red-500 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {isAdding && (
          <Modal title="Add Table" onClose={() => setIsAdding(false)}>
            <div className="space-y-6">
              <label className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-2 block">Table Number</label>
              <input 
                type="number" 
                className="premium-input"
                value={newTableNum}
                onChange={(e) => setNewTableNum(parseInt(e.target.value))}
              />
              <button onClick={handleAddTable} className="w-full premium-button bg-stone-800 text-white py-4">Create Table</button>
            </div>
          </Modal>
        )}

        {editingTable && (
          <Modal title="Edit Table" onClose={() => setEditingTable(null)}>
            <div className="space-y-6">
              <label className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-2 block">Table Number</label>
              <input 
                type="number" 
                className="premium-input"
                value={editingTable.number}
                onChange={(e) => setEditingTable({...editingTable, number: parseInt(e.target.value)})}
              />
              <button onClick={handleUpdateTable} className="w-full premium-button bg-stone-800 text-white py-4">Update Table</button>
            </div>
          </Modal>
        )}

        {tableToDelete && (
          <Modal title="Delete Table" onClose={() => setTableToDelete(null)}>
            <div className="space-y-6">
              <p className="text-stone-500">Are you sure you want to delete this table? This will remove the QR code access for this table.</p>
              <div className="flex gap-4">
                <button onClick={() => setTableToDelete(null)} className="flex-1 premium-button bg-stone-100 text-stone-600 py-4">Cancel</button>
                <button onClick={handleDeleteTable} className="flex-1 premium-button bg-red-500 text-white py-4">Delete</button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </motion.div>
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
      await setDoc(doc(db, 'settings', 'restaurant'), profile);
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
      className="max-w-4xl space-y-12"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Profile Info */}
        <section className="space-y-8">
          <h3 className="text-2xl font-serif italic text-stone-800">General Info</h3>
          <div className="space-y-6">
            <div>
              <label className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-2 block">Restaurant Name</label>
              <input type="text" className="premium-input" value={profile.name || ''} onChange={e => setProfile({...profile, name: e.target.value})} />
            </div>
            <div>
              <label className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-2 block">Logo URL</label>
              <input type="text" className="premium-input" value={profile.logoUrl || ''} onChange={e => setProfile({...profile, logoUrl: e.target.value})} />
            </div>
            <div>
              <label className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-2 block">Intro Message</label>
              <textarea className="premium-input min-h-[100px]" value={profile.intro || ''} onChange={e => setProfile({...profile, intro: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-2 block">Contact</label>
                <input type="text" className="premium-input" value={profile.contact || ''} onChange={e => setProfile({...profile, contact: e.target.value})} />
              </div>
              <div>
                <label className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-2 block">Address</label>
                <input type="text" className="premium-input" value={profile.address || ''} onChange={e => setProfile({...profile, address: e.target.value})} />
              </div>
            </div>
          </div>
        </section>

        {/* Branding */}
        <section className="space-y-8">
          <h3 className="text-2xl font-serif italic text-stone-800">Visual Branding</h3>
          <div className="premium-card p-8 space-y-8">
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
          <div className="premium-card p-8 space-y-6">
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
                    <label className="premium-button bg-stone-100 text-stone-700 px-4 py-2 text-sm cursor-pointer hover:bg-stone-200 inline-block">
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
                      className="premium-input" 
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
                className="premium-input min-h-[100px]" 
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
          className="premium-button bg-stone-800 text-white px-12 py-4 text-lg font-serif italic shadow-2xl shadow-stone-200 disabled:opacity-50"
        >
          {saveStatus === 'saving' ? 'Saving...' : 'Save All Changes'}
        </button>

        <button
          onClick={seedData}
          disabled={seedStatus === 'seeding'}
          className="px-8 py-4 rounded-full border border-stone-200 text-stone-600 hover:bg-stone-50 transition-all disabled:opacity-50 font-serif italic text-lg"
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
        <div className="premium-card border-red-100 bg-red-50/30 p-8 space-y-6">
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

function Modal({ title, children, onClose }: { title: string, children: React.ReactNode, onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative bg-white rounded-[3rem] p-10 shadow-2xl w-full max-w-lg overflow-hidden"
      >
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-3xl font-serif italic text-stone-900">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-stone-50 rounded-full transition-colors">
            <X className="w-6 h-6 text-stone-400" />
          </button>
        </div>
        {children}
      </motion.div>
    </div>
  );
}

function X(props: any) {
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
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  )
}
