import { useParams, useNavigate } from 'react-router-dom';
import { RestaurantProfile } from '../types';
import { motion } from 'framer-motion';
import { MapPin, Phone, ArrowRight, UtensilsCrossed } from 'lucide-react';

interface Props {
  restaurant: RestaurantProfile | null;
}

export default function Landing({ restaurant }: Props) {
  const { tableId } = useParams();
  const navigate = useNavigate();

  if (!restaurant) {
    return (
      <div className="h-screen flex items-center justify-center bg-stone-50">
        <div className="animate-pulse text-stone-400 font-serif italic text-xl">Welcome...</div>
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
