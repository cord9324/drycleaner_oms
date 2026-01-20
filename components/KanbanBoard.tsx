
import React, { useState } from 'react';
import { useOrderStore } from '../store/useOrderStore';
import { Order, OrderStatus } from '../types';
import { useNavigate } from 'react-router-dom';

const KanbanBoard: React.FC = () => {
  const { orders, updateOrderStatus, searchQuery, locationFilter, setLocationFilter, stores, kanbanColumns } = useOrderStore();
  const navigate = useNavigate();
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const filteredOrders = orders.filter(o => {
    const matchesSearch = o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          o.hangerNumber?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLocation = locationFilter === 'all' || o.storeId === locationFilter;
    
    // Apply 48-hour visibility rule for COMPLETED orders
    if (o.status === OrderStatus.COMPLETED) {
      if (!o.completedAt) return false;
      const completedTime = new Date(o.completedAt).getTime();
      const now = new Date().getTime();
      const diffHrs = (now - completedTime) / (1000 * 60 * 60);
      if (diffHrs > 48) return false;
    }

    return matchesSearch && matchesLocation;
  });

  const getOrdersByStatus = (status: string) => filteredOrders.filter(o => o.status === status);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.setData('orderId', id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('orderId');
    updateOrderStatus(id, status);
    setDraggedId(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  return (
    <div className="p-8 h-full flex flex-col gap-6">
      <div className="flex items-center justify-between">
         <div className="flex items-center gap-3">
            <div className="relative group">
              <button className="flex h-9 items-center gap-x-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 hover:border-primary transition-colors">
                <span className="material-symbols-outlined text-slate-500 text-[18px]">location_on</span>
                <span className="text-slate-700 dark:text-white text-xs font-medium">
                  {locationFilter === 'all' ? 'All Locations' : stores.find(s => s.id === locationFilter)?.name}
                </span>
                <span className="material-symbols-outlined text-slate-400 text-[18px]">expand_more</span>
              </button>
              <div className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl hidden group-hover:block z-20">
                <button onClick={() => setLocationFilter('all')} className="w-full text-left px-4 py-2 text-xs hover:bg-slate-100 dark:hover:bg-slate-800 first:rounded-t-lg last:rounded-b-lg">All Locations</button>
                {stores.map(s => (
                  <button key={s.id} onClick={() => setLocationFilter(s.id)} className="w-full text-left px-4 py-2 text-xs hover:bg-slate-100 dark:hover:bg-slate-800">{s.name}</button>
                ))}
              </div>
            </div>
         </div>
         <div className="flex items-center gap-2">
           <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Completed order window: 48h</span>
         </div>
      </div>

      <div className="flex-1 overflow-x-auto pb-4 custom-scrollbar">
        <div className="flex gap-6 h-full min-w-max">
          {kanbanColumns.map((col) => (
            <div 
              key={col.id} 
              className="w-[300px] flex flex-col gap-4"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.status)}
            >
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${col.color}`}></span>
                  <h3 className="text-slate-900 dark:text-white font-bold text-sm uppercase tracking-wider">{col.label}</h3>
                  <span className="text-xs text-slate-500 dark:text-slate-400 bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                    {getOrdersByStatus(col.status).length}
                  </span>
                </div>
              </div>

              <div className={`flex flex-col gap-3 overflow-y-auto flex-1 custom-scrollbar pr-1 rounded-xl p-2 transition-colors ${draggedId ? 'bg-primary/5' : ''}`}>
                {getOrdersByStatus(col.status).map((order) => (
                  <div key={order.id} draggable onDragStart={(e) => handleDragStart(e, order.id)} className={draggedId === order.id ? 'opacity-40 scale-95' : ''}>
                    <OrderCard order={order} onClick={() => navigate(`/orders/${order.id}`)} />
                  </div>
                ))}
                {getOrdersByStatus(col.status).length === 0 && (
                  <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-8 flex flex-col items-center justify-center opacity-50">
                    <span className="material-symbols-outlined text-4xl mb-2">inbox</span>
                    <span className="text-xs font-medium uppercase tracking-tight">Empty</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const OrderCard: React.FC<{ order: Order, onClick: () => void }> = ({ order, onClick }) => {
  const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':');
    const hr = parseInt(h);
    const ampm = hr >= 12 ? 'PM' : 'AM';
    const hr12 = hr % 12 || 12;
    return `${hr12}:${m} ${ampm}`;
  };

  const formatDateShort = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div onClick={onClick} className="group p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-primary/50 cursor-pointer shadow-sm transition-all hover:shadow-md active:scale-95">
      <div className="flex justify-between items-start mb-2">
        <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded uppercase">#{order.orderNumber}</span>
        <span className="text-[10px] text-slate-400 font-bold uppercase">Rec: {formatDateShort(order.createdAt)}</span>
      </div>
      <h4 className="text-slate-900 dark:text-white font-bold text-sm mb-1 truncate">{order.customerName}</h4>
      <p className="text-slate-500 dark:text-slate-400 text-xs mb-4">
        {order.items.reduce((acc, curr) => acc + curr.quantity, 0)} Items
      </p>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 overflow-hidden">
          {order.isPriority && <span className="material-symbols-outlined text-amber-500 text-[18px] shrink-0">bolt</span>}
          {order.hangerNumber && (
            <div className="flex items-center gap-1 px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[10px] font-black text-slate-600 dark:text-slate-400 truncate">
              <span className="material-symbols-outlined text-[14px]">checkroom</span>
              <span>{order.hangerNumber}</span>
            </div>
          )}
        </div>
        <div className="flex flex-col items-end shrink-0 ml-2">
          <span className="text-[9px] text-slate-400 uppercase font-bold">Pickup</span>
          <span className={`text-xs font-semibold ${order.isPriority ? 'text-amber-500' : 'text-slate-700 dark:text-white'}`}>
            {formatDateShort(order.pickupDate)} {formatTime(order.pickupTime)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default KanbanBoard;
