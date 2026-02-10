import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrderStore } from '../store/useOrderStore';
import BarcodeScanner from './BarcodeScanner';
import { Button } from './ui/Button';

const MobileSearch: React.FC = () => {
    const navigate = useNavigate();
    const { orders, customers } = useOrderStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [showScanner, setShowScanner] = useState(true);

    const [error, setError] = useState<string | null>(null);

    const handleScan = (decodedText: string) => {
        setError(null);
        // Attempt to find order by ID or order number
        const order = orders.find(o =>
            o.id === decodedText ||
            o.orderNumber.toLowerCase() === decodedText.toLowerCase() ||
            o.orderNumber.toLowerCase() === `ord-${decodedText.toLowerCase()}`
        );

        if (order) {
            navigate(`/mobile/order/${order.id}`);
        } else {
            // If no order, check if it's a customer phone?
            const customer = customers.find(c => c.phone.includes(decodedText));
            if (customer) {
                setSearchQuery(decodedText);
                setShowScanner(false);
            } else {
                setError('Barcode not recognized or order not found.');
            }
        }
    };

    const handleManualSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        const query = searchQuery.trim().toLowerCase();
        if (!query) return;

        const order = orders.find(o =>
            o.orderNumber.toLowerCase() === query ||
            o.orderNumber.toLowerCase() === `ord-${query}` ||
            o.id.toLowerCase() === query
        );

        if (order) {
            navigate(`/mobile/order/${order.id}`);
        } else {
            setError('Order not found. Please check the number.');
        }
    };

    return (
        <div className="p-6 flex flex-col gap-8">
            <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">Search Orders</h2>
                <p className="text-sm text-slate-500">Scan a garment barcode or search manually.</p>
            </div>

            <div className="space-y-4">
                {showScanner ? (
                    <div className="space-y-3">
                        <BarcodeScanner onScan={handleScan} />
                        <Button
                            variant="secondary"
                            fullWidth
                            onClick={() => setShowScanner(false)}
                            className="h-12 rounded-xl text-sm font-bold"
                        >
                            Enter Manually
                        </Button>
                    </div>
                ) : (
                    <form onSubmit={handleManualSearch} className="space-y-3">
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                            <input
                                autoFocus
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Enter Order # (e.g. 0001)"
                                className="w-full h-14 pl-12 pr-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-base shadow-sm focus:ring-2 focus:ring-primary/20 outline-none"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <Button
                                type="button"
                                variant="secondary"
                                fullWidth
                                onClick={() => setShowScanner(true)}
                                className="h-12 rounded-xl text-sm font-bold"
                            >
                                Open Scanner
                            </Button>
                            <Button
                                type="submit"
                                fullWidth
                                className="h-12 rounded-xl text-sm font-bold shadow-lg shadow-primary/20"
                            >
                                Find Order
                            </Button>
                        </div>
                        {error && (
                            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 text-red-600 dark:text-red-400 animate-in fade-in slide-in-from-top-1">
                                <span className="material-symbols-outlined text-xl">error</span>
                                <p className="text-xs font-bold leading-none">{error}</p>
                            </div>
                        )}
                    </form>
                )}
            </div>

            {/* Quick Stats or Recents could go here */}
            <div className="mt-4 p-4 rounded-2xl bg-primary/5 border border-primary/10">
                <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary text-2xl">info</span>
                    <p className="text-xs text-primary/80 leading-relaxed font-medium">
                        Scan the barcode on the garment tag or hanger to reveal order details and edit them on the go.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default MobileSearch;
