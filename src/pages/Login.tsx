import { useState } from 'react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Navigate, useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
  user: any;
  role: string | null;
}

export default function Login({ user, role }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  if (user && role) {
    return <Navigate to={role === 'admin' ? '/admin' : '/kitchen'} />;
  }

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const userDoc = await getDoc(doc(db, 'users', result.user.uid));
      
      const allowedEmails = ['grafiqo.np@gmail.com', 'bharatnepalmaitri@gmail.com', 'v.divash@gmail.com', 'dineshsonibny@gmail.com'];
      
      if (!userDoc.exists() && !allowedEmails.includes(result.user.email || '')) {
        setError('Access denied. Please contact the administrator.');
        await auth.signOut();
      } else {
        let role = userDoc.exists() ? userDoc.data().role : 'admin';
        if (!userDoc.exists() && (result.user.email === 'v.divash@gmail.com' || result.user.email === 'dineshsonibny@gmail.com')) {
          role = 'kitchen';
        }
        navigate(role === 'admin' ? '/admin' : '/kitchen');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-[2rem] p-10 shadow-2xl border border-stone-100 text-center"
      >
        <div className="w-20 h-20 bg-stone-800 rounded-3xl mx-auto mb-8 flex items-center justify-center shadow-lg transform -rotate-6">
          <LogIn className="w-10 h-10 text-white" />
        </div>
        
        <h1 className="text-4xl font-serif italic text-stone-800 mb-2">Staff Portal</h1>
        <p className="text-stone-500 mb-10 font-medium">Please sign in to access your dashboard</p>
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-medium border border-red-100">
            {error}
          </div>
        )}
        
        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full premium-button bg-stone-800 text-white py-4 flex items-center justify-center gap-3 hover:bg-stone-700 disabled:opacity-50 shadow-xl shadow-stone-200"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
              Sign in with Google
            </>
          )}
        </button>
        
        <div className="mt-10 pt-8 border-t border-stone-50">
          <p className="text-xs text-stone-400 uppercase tracking-widest font-bold">Secure Access Only</p>
        </div>
      </motion.div>
    </div>
  );
}
