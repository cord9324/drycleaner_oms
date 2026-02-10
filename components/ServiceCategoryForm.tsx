import React, { useState } from 'react';
import { useOrderStore } from '../store/useOrderStore';
import { ServiceCategory, ServiceType, ServiceClass } from '../types';

interface ServiceCategoryFormProps {
    initialData?: ServiceCategory;
    onClose: () => void;
}

const ServiceCategoryForm: React.FC<ServiceCategoryFormProps> = ({ initialData, onClose }) => {
    const { addServiceCategory, updateServiceCategory } = useOrderStore();
    const [formData, setFormData] = useState({
        name: initialData?.name || '',
        serviceType: initialData?.serviceType || ServiceType.DRY_CLEAN,
        class: initialData?.class || ServiceClass.NONE,
        basePrice: initialData?.basePrice || 0
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (initialData) {
            await updateServiceCategory(initialData.id, formData);
        } else {
            await addServiceCategory({ id: `sc${Date.now()}`, ...formData });
        }
        onClose();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <input required placeholder="Category Name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm outline-none" />
            <select value={formData.serviceType} onChange={e => setFormData({ ...formData, serviceType: e.target.value as ServiceType })} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm outline-none">
                {Object.values(ServiceType).map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <select value={formData.class} onChange={e => setFormData({ ...formData, class: e.target.value as ServiceClass })} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm outline-none">
                {Object.values(ServiceClass).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <input type="number" step="0.01" value={formData.basePrice} onChange={e => setFormData({ ...formData, basePrice: parseFloat(e.target.value) })} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm outline-none" />
            <button type="submit" className="w-full bg-primary text-white font-bold py-3.5 rounded-xl">Save Category</button>
        </form>
    );
};

export default ServiceCategoryForm;
