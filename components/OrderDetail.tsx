
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useOrderStore } from '../store/useOrderStore';
import Modal from './Modal';
import EditOrderForm from './EditOrderForm';
import { OrderItem, ServiceType } from '../types';
import { Receipt } from './Receipt';
import { ClaimTicket } from './ClaimTicket';
import { qzService } from '../lib/qz-print';

const OrderDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { orders, updateOrderStatus, customers, kanbanColumns, settings, stores } = useOrderStore();
  const order = orders.find(o => o.id === id);
  const customer = customers.find(c => c.id === order?.customerId);
  const store = stores.find(s => s.id === order?.storeId);

  const [isStatusModalOpen, setStatusModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [printType, setPrintType] = useState<'receipt' | 'claim'>('receipt');

  if (!order) return <div className="p-8">Order not found.</div>;

  const handleUpdateStatus = (newStatus: string) => {
    updateOrderStatus(order.id, newStatus);
    setStatusModalOpen(false);
  };

  const handleBrowserPrint = (type: 'receipt' | 'claim') => {
    setPrintType(type);
    // Use setTimeout to ensure React has rendered the correct print component
    setTimeout(() => {
      window.print();
    }, 100);
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
    // If it's just a date string (YYYY-MM-DD), parse as local to avoid UTC shift
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const [year, month, day] = dateStr.split('-').map(Number);
      return new Date(year, month - 1, day).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
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
            <button onClick={() => setEditModalOpen(true)} className="flex items-center justify-center gap-2 px-4 h-11 bg-gray-100 dark:bg-[#283039] text-gray-900 dark:text-white rounded-lg font-bold hover:bg-gray-200 transition-all">
              <span className="material-symbols-outlined">edit</span> <span>Edit</span>
            </button>
            <button onClick={() => setStatusModalOpen(true)} className="flex items-center justify-center gap-2 px-4 h-11 bg-gray-100 dark:bg-[#283039] text-gray-900 dark:text-white rounded-lg font-bold hover:bg-gray-200 transition-all">
              <span className="material-symbols-outlined">sync</span> <span>Status</span>
            </button>
            <button onClick={() => handleBrowserPrint('claim')} className="flex items-center justify-center gap-2 px-4 h-11 bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-500 rounded-lg font-bold hover:bg-amber-200 transition-all">
              <span className="material-symbols-outlined">confirmation_number</span> <span>Claim Ticket</span>
            </button>
            <button onClick={() => handleBrowserPrint('receipt')} className="flex items-center justify-center gap-2 px-6 h-11 bg-primary text-white rounded-lg font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all">
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
                  <div className="flex justify-between text-sm"><span>Tax</span><span>${order.tax.toFixed(2)}</span></div>
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
                  <p className="font-bold">{customer.lastName}, {customer.firstName}</p>
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
      <div className="hidden print:block">
        {printType === 'receipt' ? (
          <Receipt order={order} customer={customer} settings={settings} store={store} />
        ) : (
          <ClaimTicket order={order} customer={customer} settings={settings} store={store} />
        )}
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

      <Modal isOpen={isEditModalOpen} onClose={() => setEditModalOpen(false)} title="Edit Order Details">
        {isEditModalOpen && <EditOrderForm order={order} onClose={() => setEditModalOpen(false)} />}
      </Modal>
    </div>
  );
};

export default OrderDetail;
