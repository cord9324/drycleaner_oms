import React, { useState } from 'react';
import { useOrderStore } from '../store/useOrderStore';
import { User } from '../types';

interface UserFormProps {
    initialData?: User;
    onClose: () => void;
}

const UserForm: React.FC<UserFormProps> = ({ initialData, onClose }) => {
    const { addUser, updateUser } = useOrderStore();
    const [formData, setFormData] = useState({
        name: initialData?.name || '',
        email: initialData?.email || '',
        password: '',
        role: initialData?.role || 'STAFF'
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (initialData) {
            await updateUser(initialData.id, {
                name: formData.name,
                email: formData.email,
                role: formData.role
            });
        } else {
            if (!formData.password || formData.password.length < 6) {
                alert("Password must be at least 6 characters long.");
                return;
            }
            await addUser({
                name: formData.name,
                email: formData.email,
                password: formData.password,
                role: formData.role
            });
        }
        onClose();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-500">Full Name</label>
                <input required placeholder="E.g. Jane Smith" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm outline-none" />
            </div>
            <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-500">Business Email</label>
                <input required type="email" placeholder="jane@drycleanpro.com" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm outline-none" />
            </div>
            {!initialData && (
                <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-500">Temporary Password</label>
                    <input required type="password" placeholder="Min. 6 characters" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm outline-none" />
                </div>
            )}
            <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-500">Access Role</label>
                <select value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value as any })} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm outline-none">
                    <option value="STAFF">Staff (Daily Operations)</option>
                    <option value="MANAGER">Manager (Store Admin)</option>
                    <option value="ADMIN">Administrator (Full Access)</option>
                </select>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                <p className="text-[10px] font-black uppercase text-slate-400">Security Notice</p>
                <p className="text-xs text-slate-500 mt-1">
                    {initialData ? "Updating basic info. Email and Role can be changed directly." : "Creating a new account. The user will be able to log in immediately with the provided email and temporary password."}
                </p>
            </div>

            <button type="submit" className="w-full bg-primary text-white font-bold py-3.5 rounded-xl shadow-lg">
                {initialData ? "Update Profile" : "Register & Create Account"}
            </button>
        </form>
    );
};

export default UserForm;
