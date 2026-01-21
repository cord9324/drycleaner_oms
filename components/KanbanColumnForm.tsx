import React, { useState } from 'react';
import { useOrderStore } from '../store/useOrderStore';
import { KanbanColumn } from '../types';

interface KanbanColumnFormProps {
    initialData?: KanbanColumn;
    onClose: () => void;
}

const KanbanColumnForm: React.FC<KanbanColumnFormProps> = ({ initialData, onClose }) => {
    const { addKanbanColumn, updateKanbanColumn } = useOrderStore();
    const [formData, setFormData] = useState<Partial<KanbanColumn>>({
        label: initialData?.label || '',
        status: initialData?.status || '',
        color: initialData?.color || 'bg-slate-400'
    });

    const colorOptions = [
        { label: 'Slate', value: 'bg-slate-400' }, { label: 'Blue', value: 'bg-blue-500' },
        { label: 'Emerald', value: 'bg-emerald-500' }, { label: 'Amber', value: 'bg-amber-500' },
        { label: 'Red', value: 'bg-red-500' }, { label: 'Indigo', value: 'bg-indigo-500' },
        { label: 'Purple', value: 'bg-purple-500' }, { label: 'Pink', value: 'bg-pink-500' },
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const statusKey = formData.status || formData.label?.toUpperCase().replace(/\s+/g, '_') || `ST_${Date.now()}`;
        if (initialData) {
            await updateKanbanColumn(initialData.id, { ...formData, status: statusKey });
        } else {
            await addKanbanColumn({ id: `col${Date.now()}`, ...formData, status: statusKey } as KanbanColumn);
        }
        onClose();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <input required placeholder="Label" value={formData.label} onChange={e => setFormData({ ...formData, label: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm outline-none" />
            <div className="grid grid-cols-4 gap-2">
                {colorOptions.map(opt => (
                    <button key={opt.value} type="button" onClick={() => setFormData({ ...formData, color: opt.value })} className={`p-2 rounded-lg border-2 transition-all ${formData.color === opt.value ? 'border-primary' : 'border-transparent'}`}>
                        <div className={`size-6 rounded-full ${opt.value} mx-auto`} />
                    </button>
                ))}
            </div>
            <button type="submit" className="w-full bg-primary text-white font-bold py-3.5 rounded-xl">Save Column</button>
        </form>
    );
};

export default KanbanColumnForm;
