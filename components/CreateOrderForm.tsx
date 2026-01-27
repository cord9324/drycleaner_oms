import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrderStore } from '../store/useOrderStore';
import { Button } from './ui/Button';
import Combobox from './ui/Combobox';
import { ServiceType, OrderItem, Customer, Order } from '../types';
import { qzService } from '../lib/qz-print';

interface CreateOrderFormProps {
    onClose: () => void;
    onSuccess?: () => void;
}

const CreateOrderForm: React.FC<CreateOrderFormProps> = ({ onClose, onSuccess }) => {
    const navigate = useNavigate();
    const {
        currentUser,
        addOrder,
        addCustomer,
        updateCustomer,
        customers,
        stores,
        serviceCategories,
        kanbanColumns,
        settings
    } = useOrderStore();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isNewCustomer, setIsNewCustomer] = useState(false);
    const [newCustomerData, setNewCustomerData] = useState({ firstName: '', lastName: '', phone: '', email: '', notes: '' });
    const [selectedCustomerId, setSelectedCustomerId] = useState('');
    const [selectedStoreId, setSelectedStoreId] = useState('');
    const [hangerNumber, setHangerNumber] = useState('');

    const [orderItems, setOrderItems] = useState<Partial<OrderItem>[]>([
        { id: Math.random().toString(36).substr(2, 9), category: '', quantity: 1, unitPrice: 0, total: 0 }
    ]);
    const [isPriority, setIsPriority] = useState(false);
    const [pickupDate, setPickupDate] = useState(new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0]);
    const [pickupTime, setPickupTime] = useState('17:00');
    const [specialHandling, setSpecialHandling] = useState('');

    useEffect(() => {
        if (stores.length > 0 && !selectedStoreId) {
            setSelectedStoreId(stores[0].id);
        }
    }, [stores, selectedStoreId]);

    const handleAddItem = () => {
        setOrderItems([...orderItems, { id: Math.random().toString(36).substr(2, 9), category: '', quantity: 1, unitPrice: 0, total: 0 }]);
    };

    const handleRemoveItem = (id: string) => {
        if (orderItems.length > 1) {
            setOrderItems(orderItems.filter(item => item.id !== id));
        }
    };

    const handleItemChange = (id: string, field: string, value: any) => {
        setOrderItems(orderItems.map(item => {
            if (item.id === id) {
                const updatedItem = { ...item, [field]: value };
                if (field === 'category') {
                    const cat = serviceCategories.find(c => c.name === value);
                    if (cat) {
                        updatedItem.unitPrice = cat.basePrice;
                        updatedItem.serviceType = cat.serviceType;
                    }
                }
                updatedItem.total = (updatedItem.unitPrice || 0) * (updatedItem.quantity || 0);
                return updatedItem;
            }
            return item;
        }));
    };

    const calculateSubtotal = () => orderItems.reduce((acc, item) => acc + (item.total || 0), 0);

    const handleCreateOrder = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        let customer: Customer | undefined;
        const now = new Date().toISOString();

        try {
            if (isNewCustomer) {
                const newId = `c${Date.now()}`;
                customer = {
                    id: newId,
                    firstName: newCustomerData.firstName,
                    lastName: newCustomerData.lastName,
                    phone: newCustomerData.phone,
                    email: newCustomerData.email || '',
                    address: 'N/A',
                    notes: newCustomerData.notes,
                    totalSpent: 0,
                    createdAt: now
                };
                await addCustomer(customer);
            } else {
                customer = customers.find(c => c.id === selectedCustomerId);
                if (customer) {
                    await updateCustomer(customer.id, {
                        lastOrderDate: now,
                        totalSpent: (customer.totalSpent || 0) + (calculateSubtotal() * (1 + settings.taxRate))
                    });
                }
            }

            if (!customer) throw new Error("Customer missing");

            const subtotal = calculateSubtotal();
            const tax = subtotal * settings.taxRate;
            const finalItems = orderItems.map(item => ({
                ...item,
                id: item.id!,
                category: item.category!,
                serviceType: item.serviceType || ServiceType.DRY_CLEAN,
                quantity: item.quantity!,
                unitPrice: item.unitPrice!,
                total: item.total!
            })) as OrderItem[];

            const initialStatus = kanbanColumns.length > 0 ? kanbanColumns[0].status : 'RECEIVED';

            const newOrder: Order = {
                id: Math.random().toString(36).substr(2, 9),
                orderNumber: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
                hangerNumber: hangerNumber.trim() || undefined,
                customerId: customer.id,
                customerName: `${customer.lastName}, ${customer.firstName}`,
                status: initialStatus,
                items: finalItems,
                subtotal,
                tax,
                total: subtotal + tax,
                createdAt: now,
                pickupDate: pickupDate,
                pickupTime: pickupTime,
                isPriority,
                storeId: selectedStoreId || stores[0]?.id || 's1',
                specialHandling: specialHandling.trim()
            };

            await addOrder(newOrder);

            // Trigger Silent Printing
            const currentStore = stores.find(s => s.id === newOrder.storeId);
            if (currentStore && currentStore.qzEnabled) {
                qzService.printReceipt(newOrder, currentStore, settings, customer).catch(err => {
                    console.error("Silent printing failed:", err);
                });
            }

            if (onSuccess) {
                onSuccess();
            } else {
                onClose();
                navigate('/orders');
            }
        } catch (err) {
            console.error("Failed to create order", err);
            alert("Error creating order. Please ensure all fields are valid.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleCreateOrder} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Intake Store</label>
                    <select required className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm" value={selectedStoreId} onChange={(e) => setSelectedStoreId(e.target.value)}>
                        {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </div>
                <div className="space-y-1">
                    <div className="flex justify-between items-center"><label className="text-[10px] font-bold text-slate-400 uppercase">Customer</label><button type="button" onClick={() => setIsNewCustomer(!isNewCustomer)} className="text-primary text-[10px] font-bold uppercase">{isNewCustomer ? 'Existing' : 'New Client'}</button></div>
                    {!isNewCustomer ? (
                        <Combobox
                            required
                            options={customers.map(c => ({
                                value: c.id,
                                label: `${c.lastName}, ${c.firstName}`,
                                subLabel: c.phone
                            }))}
                            value={selectedCustomerId}
                            onChange={setSelectedCustomerId}
                            placeholder="Search Customer..."
                        />
                    ) : (
                        <div className="space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                                <input required placeholder="First" className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs" value={newCustomerData.firstName} onChange={(e) => setNewCustomerData({ ...newCustomerData, firstName: e.target.value })} />
                                <input required placeholder="Last" className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs" value={newCustomerData.lastName} onChange={(e) => setNewCustomerData({ ...newCustomerData, lastName: e.target.value })} />
                            </div>
                            <input required placeholder="Phone (Required)" className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs" value={newCustomerData.phone} onChange={(e) => setNewCustomerData({ ...newCustomerData, phone: e.target.value })} />
                        </div>
                    )}
                </div>
            </div>

            <div className="space-y-3">
                <div className="flex justify-between items-center"><label className="text-[10px] font-bold text-slate-400 uppercase">Order Items</label><button type="button" onClick={handleAddItem} className="text-primary text-[10px] font-bold uppercase">+ Add Line</button></div>
                <div className="max-h-48 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                    {orderItems.map(item => (
                        <div key={item.id} className="grid grid-cols-12 gap-2 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                            <div className="col-span-7">
                                <select required className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded p-1 text-xs" value={item.category} onChange={(e) => handleItemChange(item.id!, 'category', e.target.value)}>
                                    <option value="">Select Service...</option>
                                    {serviceCategories.map(cat => <option key={cat.id} value={cat.name}>{cat.name} (${cat.basePrice})</option>)}
                                </select>
                            </div>
                            <div className="col-span-2"><input type="number" min="1" className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded p-1 text-xs" value={item.quantity} onChange={(e) => handleItemChange(item.id!, 'quantity', parseInt(e.target.value))} /></div>
                            <div className="col-span-2 text-right text-xs font-bold pt-1.5">${(item.total || 0).toFixed(2)}</div>
                            <div className="col-span-1 flex items-center justify-center"><button type="button" onClick={() => handleRemoveItem(item.id!)} className="text-slate-400 hover:text-red-500"><span className="material-symbols-outlined text-[16px]">close</span></button></div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Logistics</label>
                    <div className="grid grid-cols-2 gap-2">
                        <input placeholder="Hanger #" className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs" value={hangerNumber} onChange={(e) => setHangerNumber(e.target.value)} />
                        <div className={`flex items-center justify-center gap-2 rounded-lg border px-2 h-[34px] transition-colors cursor-pointer ${isPriority ? 'bg-amber-500/10 border-amber-500 text-amber-600' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-400'}`} onClick={() => setIsPriority(!isPriority)}>
                            <span className="material-symbols-outlined text-[16px]">{isPriority ? 'bolt' : 'schedule'}</span>
                            <span className="text-[10px] font-bold uppercase">{isPriority ? 'Priority' : 'Normal'}</span>
                        </div>
                    </div>
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Estimated Pickup</label>
                    <div className="grid grid-cols-2 gap-2">
                        <input type="date" className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs" value={pickupDate} onChange={(e) => setPickupDate(e.target.value)} />
                        <input type="time" className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs" value={pickupTime} onChange={(e) => setPickupTime(e.target.value)} />
                    </div>
                </div>
            </div>

            <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Special Handling / Notes</label>
                <textarea placeholder="e.g. Grass stain on collar, extra starch, delicate buttons..." className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs h-16 focus:ring-2 focus:ring-primary/20 outline-none" value={specialHandling} onChange={(e) => setSpecialHandling(e.target.value)} />
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-end">
                <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Estimated Total</p>
                    <p className="text-2xl font-black text-primary">${(calculateSubtotal() * (1 + settings.taxRate)).toFixed(2)}</p>
                </div>
                <Button type="submit" isLoading={isSubmitting} size="lg">Create Order</Button>
            </div>
        </form>
    );
};

export default CreateOrderForm;
