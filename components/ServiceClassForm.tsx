import React, { useState } from 'react';
import { useOrderStore } from '../store/useOrderStore';
import { ServiceClass } from '../types';

interface ServiceClassFormProps {
    initialData?: ServiceClass;
    onClose: () => void;
}

const ServiceClassForm: React.FC<ServiceClassFormProps> = ({ initialData, onClose }) => {
    const { addServiceClass, updateServiceClass } = useOrderStore();
    const [formData, setFormData] = useState({
        name: initialData?.name || '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (initialData) {
            await updateServiceClass(initialData.id, formData);
        } else {
            await addServiceClass({ id: `cl_${Date.now()}`, ...formData });
        }
        onClose();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Class Name</label>
                <input required placeholder="e.g. Shirts, Blazers, etc." value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <button type="submit" className="w-full bg-primary text-white font-bold py-3.5 rounded-xl hover:bg-primary/90 transition-all">Save Class</button>
        </form>
    );
};

export default ServiceClassForm;
