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
        address: initialData?.address || ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (initialData) {
            await updateStore(initialData.id, formData);
        } else {
            await addStore({ id: `s${Date.now()}`, ...formData });
        }
        onClose();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <input required placeholder="Store Name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm outline-none" />
            <textarea required placeholder="Address" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm h-24 outline-none" />
            <button type="submit" className="w-full bg-primary text-white font-bold py-3.5 rounded-xl">Save Store</button>
        </form>
    );
};

export default StoreForm;
