import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useOrderStore } from '../store/useOrderStore';
import { ServiceType, ServiceClass, OrderItem } from '../types';
import { Button } from './ui/Button';

const MobileOrderDetail: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { orders, customers, updateOrder, serviceCategories, settings } = useOrderStore();

    const order = orders.find(o => o.id === id);
    const customer = customers.find(c => c.id === order?.customerId);

    const [isEditing, setIsEditing] = useState(false);

    // Form State
    const [items, setItems] = useState<(OrderItem & { class?: ServiceClass })[]>(
        order?.items.map(item => ({ ...item, class: ServiceClass.NONE })) || []
    );
    const [hangerNumber, setHangerNumber] = useState(order?.hangerNumber || '');
    const [priority, setPriority] = useState(order?.isPriority || false);

    if (!order) {
        return (
            <div className="p-8 text-center">
                <p className="text-slate-500 mb-4">Order not found.</p>
                <Button onClick={() => navigate('/mobile')}>Back to Search</Button>
            </div>
        );
    }

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

    const handleSave = () => {
        const subtotal = items.reduce((acc, i) => acc + i.total, 0);
        const tax = subtotal * settings.taxRate;

        updateOrder(order.id, {
            items: items,
            isPriority: priority,
            hangerNumber: hangerNumber.trim() || undefined,
            subtotal,
            tax,
            total: subtotal + tax
        });
        setIsEditing(false);
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    return (
        <div className="pb-24">
            {/* Order Header Card */}
            <div className="bg-white dark:bg-[#111418] p-6 border-b border-slate-200 dark:border-[#283039]">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Order #{order.orderNumber}</h2>
                        <p className="text-sm font-bold text-primary uppercase tracking-wider">{order.status}</p>
                    </div>
                    <button
                        onClick={() => {
                            if (isEditing) handleSave();
                            else setIsEditing(true);
                        }}
                        className={`h-10 px-4 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${isEditing ? 'bg-green-600 text-white shadow-lg shadow-green-600/20' : 'bg-slate-100 dark:bg-[#283039] text-slate-900 dark:text-white'
                            }`}
                    >
                        <span className="material-symbols-outlined text-[18px]">{isEditing ? 'save' : 'edit'}</span>
                        <span>{isEditing ? 'Save' : 'Edit'}</span>
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <p className="text-[10px] font-bold uppercase text-slate-400">Customer</p>
                        <p className="font-bold text-slate-900 dark:text-white truncate">{order.customerName}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] font-bold uppercase text-slate-400 text-right">Pickup</p>
                        <p className="font-bold text-slate-900 dark:text-white text-right">{formatDate(order.pickupDate)}</p>
                    </div>
                </div>
            </div>

            {/* Editable Fields */}
            <div className="p-4 space-y-6">
                {/* Hanger and Priority Section */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white dark:bg-[#111418] p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-[#283039]">
                        <label className="text-[10px] font-bold uppercase text-slate-400 block mb-2">Hanger Location</label>
                        {isEditing ? (
                            <input
                                type="text"
                                value={hangerNumber}
                                onChange={e => setHangerNumber(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-lg p-2 text-sm font-bold focus:ring-2 focus:ring-primary/20"
                                placeholder="A-12"
                            />
                        ) : (
                            <p className="text-lg font-black text-slate-900 dark:text-white">{order.hangerNumber || 'None'}</p>
                        )}
                    </div>
                    <div className={`p-4 rounded-2xl shadow-sm border transition-all ${priority ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-900/20' : 'bg-white dark:bg-[#111418] border-slate-100 dark:border-[#283039]'
                        }`}>
                        <label className="text-[10px] font-bold uppercase text-slate-400 block mb-2">Priority</label>
                        <div className="flex items-center gap-2">
                            {isEditing ? (
                                <input
                                    type="checkbox"
                                    checked={priority}
                                    onChange={e => setPriority(e.target.checked)}
                                    className="accent-primary h-5 w-5"
                                />
                            ) : (
                                <span className="material-symbols-outlined text-amber-500">{priority ? 'priority_high' : 'low_priority'}</span>
                            )}
                            <span className={`text-sm font-bold ${priority ? 'text-amber-700' : 'text-slate-400'}`}>
                                {priority ? 'Urgent' : 'Normal'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Items Section */}
                <div className="space-y-3">
                    <div className="flex justify-between items-center px-1">
                        <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Order Items</h3>
                        {isEditing && (
                            <button
                                onClick={() => setItems([...items, { id: Math.random().toString(), category: '', serviceType: ServiceType.DRY_CLEAN, quantity: 1, unitPrice: 0, total: 0 }])}
                                className="text-primary text-xs font-bold"
                            >
                                + Add Item
                            </button>
                        )}
                    </div>

                    <div className="space-y-3">
                        {items.map(item => (
                            <div key={item.id} className="bg-white dark:bg-[#111418] p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-[#283039]">
                                {isEditing ? (
                                    <div className="space-y-3">
                                        <div className="flex gap-2">
                                            <select className="flex-[0.4] bg-slate-50 dark:bg-slate-800 border-none rounded-lg p-2 text-[10px] font-bold uppercase" value={item.class} onChange={(e) => handleItemChange(item.id, 'class', e.target.value)}>
                                                <option value={ServiceClass.NONE}>Class</option>
                                                {Object.values(ServiceClass).filter(c => c !== ServiceClass.NONE).map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                            <select className="flex-1 bg-slate-50 dark:bg-slate-800 border-none rounded-lg p-2 text-xs font-bold" value={item.category} onChange={e => handleItemChange(item.id, 'category', e.target.value)}>
                                                <option value="">Category</option>
                                                {serviceCategories
                                                    .filter(cat => item.class === undefined || item.class === ServiceClass.NONE || cat.class === item.class)
                                                    .map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="flex-1 flex items-center gap-2 bg-slate-50 dark:bg-slate-800 rounded-lg p-2">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase">Qty</span>
                                                <input type="number" value={item.quantity} onChange={e => handleItemChange(item.id, 'quantity', parseInt(e.target.value))} className="w-full bg-transparent border-none p-0 text-sm font-bold text-center" />
                                            </div>
                                            <div className="flex-1 flex items-center gap-2 bg-slate-50 dark:bg-slate-800 rounded-lg p-2">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase">$</span>
                                                <input type="number" step="0.01" value={item.unitPrice} onChange={e => handleItemChange(item.id, 'unitPrice', parseFloat(e.target.value))} className="w-full bg-transparent border-none p-0 text-sm font-bold text-center" />
                                            </div>
                                            <button onClick={() => setItems(items.filter(i => i.id !== item.id))} className="p-2 text-red-500"><span className="material-symbols-outlined">delete</span></button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="font-black text-slate-900 dark:text-white">{item.category}</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase">{item.serviceType}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-slate-900 dark:text-white">x{item.quantity}</p>
                                            <p className="text-xs font-black text-primary">${item.total.toFixed(2)}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Total Section */}
                <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl">
                    <div className="flex justify-between items-center mb-4 text-slate-400 text-xs font-bold uppercase tracking-wider">
                        <span>Summary</span>
                        <span>{items.reduce((acc, i) => acc + i.quantity, 0)} Items</span>
                    </div>
                    <div className="space-y-2 border-b border-slate-800 pb-4 mb-4">
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-400">Subtotal</span>
                            <span className="font-bold">${order.subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-400">Tax</span>
                            <span className="font-bold">${order.tax.toFixed(2)}</span>
                        </div>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-lg font-black">Total</span>
                        <span className="text-3xl font-black text-white">${order.total.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            {/* Sticky Actions */}
            {isEditing && (
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 dark:bg-black/80 backdrop-blur-lg border-t border-slate-200 dark:border-[#283039] flex gap-3">
                    <Button variant="secondary" fullWidth onClick={() => {
                        setIsEditing(false);
                        setItems(order.items.map(item => ({ ...item, class: ServiceClass.NONE })));
                        setHangerNumber(order.hangerNumber || '');
                        setPriority(order.isPriority);
                    }}>Cancel</Button>
                    <Button fullWidth onClick={handleSave}>Update Order</Button>
                </div>
            )}
        </div>
    );
};

export default MobileOrderDetail;
