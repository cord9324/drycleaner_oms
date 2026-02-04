import React, { useState } from 'react';
import { useOrderStore } from '../store/useOrderStore';
import { Button } from './ui/Button';
import { Customer } from '../types';

interface CustomerFormProps {
    initialData?: Customer;
    onClose: () => void;
    onSuccess?: () => void;
}

const CustomerForm: React.FC<CustomerFormProps> = ({ initialData, onClose, onSuccess }) => {
    const { addCustomer, updateCustomer } = useOrderStore();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        firstName: initialData?.firstName || '',
        lastName: initialData?.lastName || '',
        email: initialData?.email || '',
        phone: initialData?.phone || '',
        address: initialData?.address || '',
        notes: initialData?.notes || ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (initialData) {
                await updateCustomer(initialData.id, {
                    ...initialData,
                    ...formData
                });
            } else {
                await addCustomer({
                    ...formData,
                    id: `c${Date.now()}`,
                    createdAt: new Date().toISOString(),
                    totalSpent: 0
                });
            }

            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            console.error("Failed to save customer", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">First Name</label>
                    <input required value={formData.firstName} onChange={e => setFormData({ ...formData, firstName: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none" placeholder="John" />
                </div>
                <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Last Name</label>
                    <input required value={formData.lastName} onChange={e => setFormData({ ...formData, lastName: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none" placeholder="Doe" />
                </div>
            </div>
            <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Email (Optional)</label>
                <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none" placeholder="john.doe@example.com" />
            </div>
            <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Phone</label>
                <input required value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none" placeholder="555-0100" />
            </div>
            <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Address</label>
                <textarea value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm h-16 focus:ring-2 focus:ring-primary/20 outline-none" placeholder="123 Main St..." />
            </div>
            <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Internal Notes</label>
                <textarea value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm h-20 focus:ring-2 focus:ring-primary/20 outline-none" placeholder="Customer preferences, allergies, etc..." />
            </div>

            {initialData && (
                <div className="p-4 bg-slate-100 dark:bg-slate-900/50 rounded-xl space-y-1">
                    <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Member Since</span>
                        <span className="font-bold">{new Date(initialData.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Last Active</span>
                        <span className="font-bold">{initialData.lastOrderDate ? new Date(initialData.lastOrderDate).toLocaleDateString() : 'N/A'}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Lifetime Revenue</span>
                        <span className="font-bold text-emerald-500">${initialData.totalSpent.toLocaleString()}</span>
                    </div>
                </div>
            )}

            <Button type="submit" fullWidth isLoading={isSubmitting}>{initialData ? 'Update Profile' : 'Save Customer'}</Button>
        </form>
    );
};

export default CustomerForm;
