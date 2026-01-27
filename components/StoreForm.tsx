import React, { useState } from 'react';
import { useOrderStore } from '../store/useOrderStore';
import { Store } from '../types';

interface StoreFormProps {
    initialData?: Store;
    onClose: () => void;
}

const StoreForm: React.FC<StoreFormProps> = ({ initialData, onClose }) => {
    const { addStore, updateStore } = useOrderStore();
    const [formData, setFormData] = useState({
        name: initialData?.name || '',
        address: initialData?.address || '',
        phone: initialData?.phone || '',
        qzEnabled: initialData?.qzEnabled || false,
        qzPrinterName: initialData?.qzPrinterName || 'Receipt'
    });
    const [availablePrinters, setAvailablePrinters] = useState<string[]>([]);
    const [isFetchingPrinters, setIsFetchingPrinters] = useState(false);

    const fetchPrinters = async () => {
        setIsFetchingPrinters(true);
        try {
            const { qzService } = await import('../lib/qz-print');
            const printers = await qzService.getPrinters();
            setAvailablePrinters(printers);
        } catch (e) {
            console.error(e);
        } finally {
            setIsFetchingPrinters(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (initialData) {
            await updateStore(initialData.id, formData);
        } else {
            await addStore({
                id: `s${Date.now()}`,
                name: formData.name,
                address: formData.address,
                phone: formData.phone,
                qzEnabled: formData.qzEnabled,
                qzPrinterName: formData.qzPrinterName
            });
        }
        onClose();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Store Name</label>
                <input required placeholder="Store Name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm outline-none font-bold" />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Phone Number</label>
                    <input placeholder="(555) 000-0000" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm outline-none font-bold" />
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Full Address</label>
                    <textarea required placeholder="Address" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm h-11 outline-none font-medium" />
                </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest">QZ Tray Printing (Silent)</h4>
                    {formData.qzEnabled && (
                        <button
                            type="button"
                            onClick={fetchPrinters}
                            disabled={isFetchingPrinters}
                            className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1 disabled:opacity-50"
                        >
                            <span className={`material-symbols-outlined text-sm ${isFetchingPrinters ? 'animate-spin' : ''}`}>sync</span>
                            {isFetchingPrinters ? 'Hunting...' : 'Find Printers'}
                        </button>
                    )}
                </div>
                <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="flex flex-col">
                        <span className="text-sm font-bold">Enable Silent Printing</span>
                        <span className="text-[10px] text-slate-500 font-medium">Prints automatically after order creation</span>
                    </div>
                    <input
                        type="checkbox"
                        checked={formData.qzEnabled}
                        onChange={e => setFormData({ ...formData, qzEnabled: e.target.checked })}
                        className="size-5 accent-primary cursor-pointer"
                    />
                </div>
                {formData.qzEnabled && (
                    <div className="space-y-1 animate-in slide-in-from-top-2 duration-300">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Target Printer</label>
                        {availablePrinters.length > 0 ? (
                            <select
                                value={formData.qzPrinterName}
                                onChange={e => setFormData({ ...formData, qzPrinterName: e.target.value })}
                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm outline-none font-bold"
                            >
                                <option value="">Select a printer...</option>
                                {availablePrinters.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        ) : (
                            <input
                                required
                                placeholder="e.g. ReceiptPrinter"
                                value={formData.qzPrinterName}
                                onChange={e => setFormData({ ...formData, qzPrinterName: e.target.value })}
                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm outline-none font-bold"
                            />
                        )}
                        <p className="text-[9px] text-slate-400 italic">Click 'Find Printers' above to browse connected hardware</p>
                    </div>
                )}
            </div>

            <button type="submit" className="w-full bg-primary text-white font-bold py-3.5 rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95 mt-4">
                {initialData ? 'Update Location' : 'Save Location'}
            </button>
        </form>
    );
};

export default StoreForm;
