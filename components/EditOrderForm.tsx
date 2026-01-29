import React, { useState } from 'react';
import { useOrderStore } from '../store/useOrderStore';
import { Order, OrderItem, ServiceType } from '../types';

interface EditOrderFormProps {
    order: Order;
    onClose: () => void;
    onSuccess?: () => void;
}

const EditOrderForm: React.FC<EditOrderFormProps> = ({ order, onClose, onSuccess }) => {
    const { updateOrder, serviceCategories, settings, stores } = useOrderStore();

    const [items, setItems] = useState<OrderItem[]>([...order.items]);
    const [priority, setPriority] = useState(order.isPriority);
    const [hangerNumber, setHangerNumber] = useState(order.hangerNumber || '');
    const [pickupDate, setPickupDate] = useState(order.pickupDate);
    const [pickupTime, setPickupTime] = useState(order.pickupTime || '17:00');
    const [specialHandling, setSpecialHandling] = useState(order.specialHandling || '');
    const [selectedStoreId, setSelectedStoreId] = useState(order.storeId);

    const handleItemChange = (itemId: string, field: string, value: any) => {
        setItems(items.map(item => {
            if (item.id === itemId) {
                const updated = { ...item, [field]: value };
                if (field === 'category') {
                    const cat = serviceCategories.find(c => c.name === value);
                    if (cat) {
                        updated.unitPrice = cat.basePrice;
                        updated.serviceType = cat.serviceType;
                    }
                }
                updated.total = updated.unitPrice * updated.quantity;
                return updated;
            }
            return item;
        }));
    };

    const handleAddItem = () => {
        setItems([...items, {
            id: Math.random().toString(36).substr(2, 9),
            category: '',
            serviceType: ServiceType.DRY_CLEAN,
            quantity: 1,
            unitPrice: 0,
            total: 0
        }]);
    };

    const handleRemoveItem = (itemId: string) => {
        if (items.length > 1) {
            setItems(items.filter(i => i.id !== itemId));
        }
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        const subtotal = items.reduce((acc, i) => acc + i.total, 0);
        const tax = subtotal * settings.taxRate;

        updateOrder(order.id, {
            items: items,
            isPriority: priority,
            hangerNumber: hangerNumber.trim() || undefined,
            pickupDate: pickupDate,
            pickupTime: pickupTime,
            specialHandling: specialHandling,
            storeId: selectedStoreId,
            subtotal,
            tax,
            total: subtotal + tax
        });

        if (onSuccess) onSuccess();
        onClose();
    };

    return (
        <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">Hanger #</label>
                    <input type="text" placeholder="E.g. A-12" className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20" value={hangerNumber} onChange={e => setHangerNumber(e.target.value)} />
                </div>
                <div>
                    <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">Expedite</label>
                    <div className="flex items-center gap-3 bg-amber-50 dark:bg-amber-900/10 p-2.5 rounded-lg border border-amber-200 h-[46px]"><input type="checkbox" id="editPriority" checked={priority} onChange={e => setPriority(e.target.checked)} /><label htmlFor="editPriority" className="text-xs font-bold text-amber-600">Priority</label></div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                <div>
                    <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">Store Location</label>
                    <select
                        required
                        className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20"
                        value={selectedStoreId}
                        onChange={e => setSelectedStoreId(e.target.value)}
                    >
                        {stores.map(store => (
                            <option key={store.id} value={store.id}>
                                {store.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="space-y-3">
                <div className="flex justify-between items-center"><label className="text-xs font-bold uppercase text-slate-500">Items</label><button type="button" onClick={handleAddItem} className="text-primary text-xs font-bold">+ Add Item</button></div>
                {items.map(item => (
                    <div key={item.id} className="grid grid-cols-12 gap-2 items-end bg-slate-50 dark:bg-slate-800 p-3 rounded-xl">
                        <div className="col-span-6">
                            <select required className="w-full bg-white dark:bg-slate-900 p-2 rounded-lg text-sm" value={item.category} onChange={e => handleItemChange(item.id, 'category', e.target.value)}>
                                <option value="">Select Category</option>
                                {serviceCategories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                            </select>
                        </div>
                        <div className="col-span-3"><input type="number" min="1" className="w-full bg-white dark:bg-slate-900 p-2 rounded-lg text-sm" value={item.quantity} onChange={e => handleItemChange(item.id, 'quantity', parseInt(e.target.value))} /></div>
                        <div className="col-span-2 text-right text-xs font-bold pt-5">${item.total.toFixed(2)}</div>
                        <div className="col-span-1"><button type="button" onClick={() => handleRemoveItem(item.id)} className="text-red-500"><span className="material-symbols-outlined text-[20px]">delete</span></button></div>
                    </div>
                ))}
            </div>
            <div className="grid grid-cols-2 gap-4">
                <input type="date" className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl text-sm" value={pickupDate} onChange={e => setPickupDate(e.target.value)} />
                <input type="time" className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl text-sm" value={pickupTime} onChange={e => setPickupTime(e.target.value)} />
            </div>
            <textarea placeholder="Special Handling Notes" className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl text-sm h-24" value={specialHandling} onChange={e => setSpecialHandling(e.target.value)} />
            <button type="submit" className="w-full bg-primary text-white font-bold py-3.5 rounded-xl">Save Changes</button>
        </form>
    );
};

export default EditOrderForm;
