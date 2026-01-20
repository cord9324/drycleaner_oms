
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useOrderStore } from '../store/useOrderStore';
import Modal from './Modal';
import { OrderItem, ServiceType } from '../types';

const OrderDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { orders, updateOrderStatus, updateOrder, serviceCategories, customers, kanbanColumns } = useOrderStore();
  const order = orders.find(o => o.id === id);
  const customer = customers.find(c => c.id === order?.customerId);
  
  const [isStatusModalOpen, setStatusModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);

  // Edit Order State
  const [editedItems, setEditedItems] = useState<OrderItem[]>([]);
  const [editedPriority, setEditedPriority] = useState(false);
  const [editedHangerNumber, setEditedHangerNumber] = useState('');
  const [editedPickupDate, setEditedPickupDate] = useState('');
  const [editedPickupTime, setEditedPickupTime] = useState('');
  const [editedSpecialHandling, setEditedSpecialHandling] = useState('');

  if (!order) return <div className="p-8">Order not found.</div>;

  const handleUpdateStatus = (newStatus: string) => {
    updateOrderStatus(order.id, newStatus);
    setStatusModalOpen(false);
  };

  const resetEditForm = () => {
    setEditedItems([]);
    setEditedPriority(false);
    setEditedHangerNumber('');
    setEditedPickupDate('');
    setEditedPickupTime('');
    setEditedSpecialHandling('');
  };

  const openEditModal = () => {
    setEditedItems([...order.items]);
    setEditedPriority(order.isPriority);
    setEditedHangerNumber(order.hangerNumber || '');
    setEditedPickupDate(order.pickupDate);
    setEditedPickupTime(order.pickupTime || '17:00');
    setEditedSpecialHandling(order.specialHandling || '');
    setEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setEditModalOpen(false);
    resetEditForm();
  };

  const handleEditItemChange = (itemId: string, field: string, value: any) => {
    setEditedItems(editedItems.map(item => {
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

  const handleAddEditItem = () => {
    setEditedItems([...editedItems, {
      id: Math.random().toString(36).substr(2, 9),
      category: '',
      serviceType: ServiceType.DRY_CLEAN,
      quantity: 1,
      unitPrice: 0,
      total: 0
    }]);
  };

  const handleRemoveEditItem = (itemId: string) => {
    if (editedItems.length > 1) {
      setEditedItems(editedItems.filter(i => i.id !== itemId));
    }
  };

  const handleSaveOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const subtotal = editedItems.reduce((acc, i) => acc + i.total, 0);
    const tax = subtotal * 0.08;
    
    updateOrder(order.id, {
      items: editedItems,
      isPriority: editedPriority,
      hangerNumber: editedHangerNumber.trim() || undefined,
      pickupDate: editedPickupDate,
      pickupTime: editedPickupTime,
      specialHandling: editedSpecialHandling,
      subtotal,
      tax,
      total: subtotal + tax
    });
    handleCloseEditModal();
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return 'N/A';
    const [h, m] = timeStr.split(':');
    const hr = parseInt(h);
    const ampm = hr >= 12 ? 'PM' : 'AM';
    const hr12 = hr % 12 || 12;
    return `${hr12}:${m} ${ampm}`;
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const currentColumn = kanbanColumns.find(c => c.status === order.status);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* --- Screen Layout: Hidden on print --- */}
      <div className="print:hidden">
        <nav className="flex items-center gap-2 mb-4 text-sm font-medium">
          <button onClick={() => navigate('/orders')} className="text-gray-500 dark:text-[#9dabb9] hover:text-primary transition-colors">Orders</button>
          <span className="text-gray-400 dark:text-[#9dabb9]">/</span>
          <span className="text-gray-900 dark:text-white font-semibold">Order #{order.orderNumber}</span>
        </nav>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
          <div className="flex flex-col gap-1">
            <h1 className="text-gray-900 dark:text-white text-4xl font-black leading-tight tracking-tight">Order #{order.orderNumber}</h1>
            <p className="text-gray-500 dark:text-[#9dabb9] text-sm">
              Customer: <span className="text-gray-900 dark:text-white font-medium">{order.customerName}</span> | 
              Hanger: <span className="text-gray-900 dark:text-white font-medium uppercase">{order.hangerNumber || 'N/A'}</span> |
              Status: <span className={`font-bold ${currentColumn?.color?.replace('bg-', 'text-') || 'text-primary'}`}>{currentColumn?.label || order.status}</span>
            </p>
          </div>
          <div className="flex gap-3">
            <button onClick={openEditModal} className="flex items-center justify-center gap-2 px-4 h-11 bg-gray-100 dark:bg-[#283039] text-gray-900 dark:text-white rounded-lg font-bold hover:bg-gray-200 transition-all">
              <span className="material-symbols-outlined">edit</span> <span>Edit</span>
            </button>
            <button onClick={() => setStatusModalOpen(true)} className="flex items-center justify-center gap-2 px-4 h-11 bg-gray-100 dark:bg-[#283039] text-gray-900 dark:text-white rounded-lg font-bold hover:bg-gray-200 transition-all">
              <span className="material-symbols-outlined">sync</span> <span>Status</span>
            </button>
            <button onClick={() => window.print()} className="flex items-center justify-center gap-2 px-6 h-11 bg-primary text-white rounded-lg font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all">
              <span className="material-symbols-outlined">print</span> <span>Print Ticket</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white dark:bg-[#1c2127] rounded-xl border border-gray-200 dark:border-[#3b4754] overflow-hidden shadow-sm">
              <div className="p-4 border-b border-gray-200 dark:border-[#3b4754] bg-gray-50 dark:bg-[#1c2127]">
                <h3 className="font-bold text-gray-900 dark:text-white">Order Summary</h3>
              </div>
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 dark:bg-[#1c2127]">
                    <th className="px-6 py-4 text-xs font-bold uppercase text-gray-400">Item</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase text-gray-400 text-center">Qty</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase text-gray-400 text-right">Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-[#3b4754]">
                  {order.items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-6 py-4">
                        <p className="font-bold">{item.category}</p>
                        <p className="text-xs text-gray-500">{item.serviceType}</p>
                      </td>
                      <td className="px-6 py-4 text-center font-medium">{item.quantity}</td>
                      <td className="px-6 py-4 text-right font-bold">${item.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded-xl p-6">
                <h4 className="text-xs font-black uppercase text-amber-600 mb-2">Special Handling</h4>
                <p className="text-sm">{order.specialHandling || 'None'}</p>
                {order.isPriority && <p className="mt-2 text-xs font-black text-amber-700 uppercase tracking-tighter">* PRIORITY PROCESSING *</p>}
              </div>
              <div className="bg-white dark:bg-[#1c2127] border border-gray-200 dark:border-[#3b4754] rounded-xl p-6 shadow-sm">
                <h4 className="text-xs font-black uppercase text-gray-400 mb-4">Payment Summary</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm"><span>Subtotal</span><span>${order.subtotal.toFixed(2)}</span></div>
                  <div className="flex justify-between text-sm"><span>Tax (8%)</span><span>${order.tax.toFixed(2)}</span></div>
                  <div className="pt-2 border-t border-gray-100 flex justify-between items-center">
                    <span className="text-lg font-black">Total</span>
                    <span className="text-2xl font-black text-primary">${order.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-6">
             <div className="bg-white dark:bg-[#1c2127] rounded-xl border border-gray-200 dark:border-[#3b4754] p-6 shadow-sm">
                <h4 className="text-sm font-bold mb-4">Customer Contact</h4>
                {customer ? (
                  <div className="space-y-1">
                    <p className="font-bold">{customer.firstName} {customer.lastName}</p>
                    <p className="text-xs text-gray-500">{customer.phone}</p>
                    <p className="text-xs text-gray-500">{customer.email}</p>
                  </div>
                ) : <p className="text-xs text-gray-500">Contact data unavailable</p>}
             </div>
             <div className="bg-white dark:bg-[#1c2127] rounded-xl border border-gray-200 dark:border-[#3b4754] p-6 shadow-sm">
                <h4 className="text-sm font-bold mb-4">Order Lifecycle</h4>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-slate-400">inventory_2</span>
                    <div>
                      <p className="text-[10px] font-bold uppercase text-slate-400">Received On</p>
                      <p className="font-bold text-sm">{formatDate(order.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary">checkroom</span>
                    <div>
                      <p className="text-[10px] font-bold uppercase text-primary">Hanger Location</p>
                      <p className="font-bold text-sm">{order.hangerNumber || 'Not Tagged'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary">schedule</span>
                    <div>
                      <p className="text-[10px] font-bold uppercase text-primary">Pickup Window</p>
                      <p className="font-bold text-sm">{formatDate(order.pickupDate)}</p>
                      <p className="text-xs text-gray-500">{formatTime(order.pickupTime)}</p>
                    </div>
                  </div>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* --- PRINT LAYOUT --- */}
      <div className="hidden print:block text-black p-4 space-y-6 max-w-md mx-auto">
        <div className="text-center border-b-2 border-dashed border-black pb-4">
          <h1 className="text-3xl font-black uppercase tracking-tighter">DryClean Pro</h1>
          <p className="text-[10px] font-bold uppercase tracking-widest">Main Store: 100 Central Plaza</p>
          <p className="text-[10px] font-medium">(555) 012-3456</p>
        </div>

        <div className="flex justify-between py-2 border-b border-black">
          <div>
            <p className="text-[10px] font-bold uppercase opacity-60">Order #</p>
            <h2 className="text-2xl font-black">{order.orderNumber}</h2>
          </div>
          <div className="text-right">
             <p className="text-[10px] font-bold uppercase opacity-60">Received</p>
             <p className="text-xs font-bold">{new Date(order.createdAt).toLocaleDateString()}</p>
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-[10px] font-bold uppercase opacity-60">Customer</p>
          <p className="text-xl font-black">{order.customerName}</p>
          {customer && <p className="text-xs font-bold">{customer.phone}</p>}
        </div>

        <div className="bg-black text-white p-3 rounded text-center">
           <p className="text-[10px] font-bold uppercase opacity-70">Ready for Pickup</p>
           <p className="text-xl font-black uppercase">{formatDate(order.pickupDate)} @ {formatTime(order.pickupTime)}</p>
        </div>
        
        {order.hangerNumber && (
          <div className="text-center bg-slate-100 p-2 rounded">
             <p className="text-[10px] font-black uppercase opacity-60">Hanger Number</p>
             <p className="text-2xl font-black">{order.hangerNumber}</p>
          </div>
        )}

        <div className="space-y-2 border-t border-black pt-4">
          <div className="flex justify-between text-[10px] font-black uppercase border-b border-black pb-1">
            <span>Description</span>
            <span>Total</span>
          </div>
          {order.items.map((item, idx) => (
            <div key={idx} className="flex justify-between text-xs font-medium border-b border-dotted border-gray-300 pb-1">
              <span>{item.quantity}x {item.category} ({item.serviceType})</span>
              <span className="font-bold">${item.total.toFixed(2)}</span>
            </div>
          ))}
        </div>

        <div className="space-y-1 pt-2">
          <div className="flex justify-between text-xs"><span>Subtotal</span><span>${order.subtotal.toFixed(2)}</span></div>
          <div className="flex justify-between text-xs"><span>Tax (8%)</span><span>${order.tax.toFixed(2)}</span></div>
          <div className="flex justify-between text-xl font-black border-t-2 border-black pt-1"><span>TOTAL</span><span>${order.total.toFixed(2)}</span></div>
        </div>

        {order.specialHandling && (
          <div className="p-2 border-2 border-black rounded mt-4">
            <p className="text-[10px] font-black uppercase mb-1">Special Handling</p>
            <p className="text-xs font-bold">{order.specialHandling}</p>
          </div>
        )}

        <div className="pt-8 text-center space-y-4">
          <div className="font-barcode text-6xl leading-none">{order.orderNumber}</div>
          <p className="text-[8px] uppercase font-bold tracking-widest">No refund without ticket. Orders donated after 90 days.</p>
        </div>
      </div>

      {/* --- MODALS --- */}
      <Modal isOpen={isStatusModalOpen} onClose={() => setStatusModalOpen(false)} title="Update Order Status">
        <div className="grid grid-cols-1 gap-3">
          {kanbanColumns.map((col) => (
            <button key={col.id} onClick={() => handleUpdateStatus(col.status)} className={`flex items-center justify-between p-4 rounded-xl border text-sm font-bold transition-all ${order.status === col.status ? 'bg-primary border-primary text-white' : 'bg-white dark:bg-slate-900 border-slate-200 hover:border-primary'}`}>
              <div className="flex items-center gap-3"><div className={`size-3 rounded-full ${col.color}`} /><span>{col.label}</span></div>
              {order.status === col.status && <span className="material-symbols-outlined">check_circle</span>}
            </button>
          ))}
        </div>
      </Modal>

      <Modal isOpen={isEditModalOpen} onClose={handleCloseEditModal} title="Edit Order Details">
        <form onSubmit={handleSaveOrder} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">Hanger #</label>
               <input type="text" placeholder="E.g. A-12" className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20" value={editedHangerNumber} onChange={e => setEditedHangerNumber(e.target.value)} />
             </div>
             <div>
               <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">Expedite</label>
               <div className="flex items-center gap-3 bg-amber-50 dark:bg-amber-900/10 p-2.5 rounded-lg border border-amber-200 h-[46px]"><input type="checkbox" id="editPriority" checked={editedPriority} onChange={e => setEditedPriority(e.target.checked)} /><label htmlFor="editPriority" className="text-xs font-bold text-amber-600">Priority</label></div>
             </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center"><label className="text-xs font-bold uppercase text-slate-500">Items</label><button type="button" onClick={handleAddEditItem} className="text-primary text-xs font-bold">+ Add Item</button></div>
            {editedItems.map(item => (
              <div key={item.id} className="grid grid-cols-12 gap-2 items-end bg-slate-50 dark:bg-slate-800 p-3 rounded-xl">
                <div className="col-span-6">
                  <select required className="w-full bg-white dark:bg-slate-900 p-2 rounded-lg text-sm" value={item.category} onChange={e => handleEditItemChange(item.id, 'category', e.target.value)}>
                    <option value="">Select Category</option>
                    {serviceCategories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                  </select>
                </div>
                <div className="col-span-3"><input type="number" min="1" className="w-full bg-white dark:bg-slate-900 p-2 rounded-lg text-sm" value={item.quantity} onChange={e => handleEditItemChange(item.id, 'quantity', parseInt(e.target.value))} /></div>
                <div className="col-span-2 text-right text-xs font-bold pt-5">${item.total.toFixed(2)}</div>
                <div className="col-span-1"><button type="button" onClick={() => handleRemoveEditItem(item.id)} className="text-red-500"><span className="material-symbols-outlined text-[20px]">delete</span></button></div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4">
             <input type="date" className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl text-sm" value={editedPickupDate} onChange={e => setEditedPickupDate(e.target.value)} />
             <input type="time" className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl text-sm" value={editedPickupTime} onChange={e => setEditedPickupTime(e.target.value)} />
          </div>
          <textarea placeholder="Special Handling Notes" className="w-full bg-slate-50 dark:bg-slate-800 p-3 rounded-xl text-sm h-24" value={editedSpecialHandling} onChange={e => setEditedSpecialHandling(e.target.value)} />
          <button type="submit" className="w-full bg-primary text-white font-bold py-3.5 rounded-xl">Save Changes</button>
        </form>
      </Modal>
    </div>
  );
};

export default OrderDetail;
