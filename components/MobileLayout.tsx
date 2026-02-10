import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useOrderStore } from '../store/useOrderStore';
import { supabase } from '../lib/supabase';

const MobileLayout: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { currentUser } = useOrderStore();

    const handleLogout = async () => {
        await supabase.auth.signOut();
    };

    const isOrderPage = location.pathname.includes('/mobile/order/');

    return (
        <div className="flex flex-col h-screen bg-slate-50 dark:bg-[#0b0f13] overflow-hidden">
            {/* Mobile Top Bar */}
            <header className="flex items-center justify-between px-4 h-14 bg-white dark:bg-[#111418] border-b border-slate-200 dark:border-[#283039] shrink-0">
                <div className="flex items-center gap-2">
                    {isOrderPage ? (
                        <button
                            onClick={() => navigate('/mobile')}
                            className="p-2 -ml-2 text-slate-600 dark:text-[#9dabb9] hover:text-primary transition-colors"
                        >
                            <span className="material-symbols-outlined">arrow_back</span>
                        </button>
                    ) : (
                        <div className="bg-primary rounded-lg p-1 flex items-center justify-center">
                            <span className="material-symbols-outlined text-white text-xl">dry_cleaning</span>
                        </div>
                    )}
                    <span className="font-bold text-slate-900 dark:text-white text-sm">
                        {isOrderPage ? 'Order Details' : 'DryClean Pro'}
                    </span>
                </div>

                <div className="flex items-center gap-3">
                    <div className="h-7 w-7 rounded-full overflow-hidden border border-slate-200 dark:border-slate-800">
                        <img
                            alt="avatar"
                            src={currentUser?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser?.name || 'User'}`}
                        />
                    </div>
                    <button
                        onClick={handleLogout}
                        className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                    >
                        <span className="material-symbols-outlined text-[20px]">logout</span>
                    </button>
                </div>
            </header>

            {/* Content Area */}
            <main className="flex-1 overflow-auto custom-scrollbar">
                <Outlet />
            </main>
        </div>
    );
};

export default MobileLayout;
