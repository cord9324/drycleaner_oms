
import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import KanbanBoard from './components/KanbanBoard';
import CustomerList from './components/CustomerList';
import OrderDetail from './components/OrderDetail';
import Settings from './components/Settings';
import Dashboard from './components/Dashboard';
import Analytics from './components/Analytics';
import Attendance from './components/Attendance';
import Auth from './components/Auth';
import MobileLayout from './components/MobileLayout';
import MobileSearch from './components/MobileSearch';
import MobileOrderDetail from './components/MobileOrderDetail';
import { useOrderStore } from './store/useOrderStore';
import { supabase, SUPABASE_CONFIG_VALID, saveSupabaseConfig } from './lib/supabase';

const App: React.FC = () => {
  const { setSession, setProfile, fetchInitialData, subscribeToChanges, session, loading } = useOrderStore();
  const [setupUrl, setSetupUrl] = useState('');
  const [setupKey, setSetupKey] = useState('');
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    if (!SUPABASE_CONFIG_VALID) return;

    const initializeApp = async (session: any) => {
      setSession(session);
      if (session) {
        await syncProfile(session.user.id, session.user.email);
        await fetchInitialData();
      }
      setIsInitializing(false);
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      initializeApp(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (_event === 'SIGNED_IN') {
        initializeApp(session);
      } else if (_event === 'SIGNED_OUT') {
        setSession(null);
        setProfile(null);
        setIsInitializing(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [setSession, setProfile, fetchInitialData]);

  useEffect(() => {
    if (session) {
      const unsubscribe = subscribeToChanges();
      return () => unsubscribe();
    }
  }, [session, subscribeToChanges]);

  const syncProfile = async (userId: string, email?: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (data && !error) {
        setProfile({
          id: data.id,
          name: data.name,
          email: data.email || email || '',
          role: data.role as 'ADMIN' | 'MANAGER' | 'STAFF',
          avatar: data.avatar
        });
      } else {
        const { count } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });

        const isFirstUser = (count === 0);
        const defaultName = email?.split('@')[0] || 'Member';

        const profilePayload = {
          id: userId,
          name: defaultName,
          email: email || '',
          role: isFirstUser ? 'ADMIN' : 'STAFF',
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`
        };

        const { error: insertError } = await supabase.from('profiles').insert([profilePayload]);

        if (!insertError) {
          setProfile({
            ...profilePayload,
            role: profilePayload.role as any
          });
        } else {
          setProfile({
            ...profilePayload,
            role: isFirstUser ? 'ADMIN' : 'STAFF' as any
          });
        }
      }
    } catch (e) {
      console.error("Profile synchronization error", e);
    }
  };

  const handleSetup = (e: React.FormEvent) => {
    e.preventDefault();
    if (setupUrl && setupKey) {
      saveSupabaseConfig(setupUrl, setupKey);
    }
  };

  if (!SUPABASE_CONFIG_VALID) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-background-dark p-6">
        <div className="max-w-md w-full bg-white dark:bg-surface-dark p-8 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3 mb-8 justify-center">
            <div className="bg-primary rounded-lg p-2 flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-3xl">settings_input_component</span>
            </div>
            <h1 className="text-slate-900 dark:text-white text-2xl font-black">App Setup</h1>
          </div>
          <form onSubmit={handleSetup} className="space-y-4">
            <input required type="url" value={setupUrl} onChange={(e) => setSetupUrl(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none" placeholder="Project URL" />
            <input required type="text" value={setupKey} onChange={(e) => setSetupKey(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none" placeholder="Anon Key" />
            <button type="submit" className="w-full bg-primary text-white font-bold py-3.5 rounded-xl shadow-lg hover:bg-primary/90 transition-all active:scale-[0.98]">Save & Connect</button>
          </form>
        </div>
      </div>
    );
  }

  if (isInitializing || (loading && !session)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-dark">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin text-primary">
            <span className="material-symbols-outlined text-4xl">progress_activity</span>
          </div>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Authenticating Session...</p>
        </div>
      </div>
    );
  }

  if (!session) return <Auth />;

  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/orders" element={<KanbanBoard />} />
          <Route path="/orders/:id" element={<OrderDetail />} />
          <Route path="/customers" element={<CustomerList />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/attendance" element={<Attendance />} />
          <Route path="/settings" element={<Settings />} />
        </Route>

        {/* Mobile Routes */}
        <Route path="/mobile" element={<MobileLayout />}>
          <Route index element={<MobileSearch />} />
          <Route path="order/:id" element={<MobileOrderDetail />} />
        </Route>
      </Routes>
    </HashRouter>
  );
};

export default App;
