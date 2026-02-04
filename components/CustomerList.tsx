
import React, { useState, useMemo } from 'react';
import { useOrderStore } from '../store/useOrderStore';
import { useNavigate } from 'react-router-dom';
import Modal from './Modal';
import CustomerForm from './CustomerForm';
import { Button } from './ui/Button';
import { Customer, Order } from '../types';

type SortKey = 'name' | 'email' | 'address' | 'totalSpent' | 'lastOrderDate';

const CustomerList: React.FC = () => {
  const { customers, orders, deleteCustomer, kanbanColumns } = useOrderStore();
  const [localSearch, setLocalSearch] = useState('');
  const navigate = useNavigate();

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  // Form states
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCloseHistoryModal = () => {
    setIsHistoryModalOpen(false);
    setSelectedCustomer(null);
    setCustomerOrders([]);
  };

  // Sorting state
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' }>({
    key: 'name',
    direction: 'asc'
  });

  const handleSort = (key: SortKey) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const calculateDaysSince = (dateStr?: string) => {
    if (!dateStr) return null;
    const lastDate = new Date(dateStr);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - lastDate.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getRecencyLabel = (dateStr?: string) => {
    const days = calculateDaysSince(dateStr);
    if (days === null) return { text: 'Never', color: 'text-slate-400' };
    if (days === 0) return { text: 'Today', color: 'text-emerald-500 font-bold' };
    if (days === 1) return { text: '1 day ago', color: 'text-slate-600 dark:text-slate-300' };
    if (days > 60) return { text: `${days} days`, color: 'text-red-400 font-medium' };
    if (days > 30) return { text: `${days} days`, color: 'text-amber-500' };
    return { text: `${days} days`, color: 'text-slate-600 dark:text-slate-300' };
  };

  const filteredAndSorted = useMemo(() => {
    let result = customers.filter(c =>
      `${c.firstName} ${c.lastName}`.toLowerCase().includes(localSearch.toLowerCase()) ||
      c.email.toLowerCase().includes(localSearch.toLowerCase()) ||
      c.phone.includes(localSearch)
    );

    result.sort((a, b) => {
      let valA: any, valB: any;

      switch (sortConfig.key) {
        case 'name':
          valA = `${a.lastName}, ${a.firstName}`.toLowerCase();
          valB = `${b.lastName}, ${b.firstName}`.toLowerCase();
          break;
        case 'email':
          valA = a.email.toLowerCase();
          valB = b.email.toLowerCase();
          break;
        case 'address':
          valA = a.address.toLowerCase();
          valB = b.address.toLowerCase();
          break;
        case 'totalSpent':
          valA = a.totalSpent;
          valB = b.totalSpent;
          break;
        case 'lastOrderDate':
          valA = a.lastOrderDate ? new Date(a.lastOrderDate).getTime() : 0;
          valB = b.lastOrderDate ? new Date(b.lastOrderDate).getTime() : 0;
          break;
        default:
          return 0;
      }

      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [customers, localSearch, sortConfig]);



  const handleDeleteConfirm = async () => {
    if (selectedCustomer) {
      setIsSubmitting(true);
      try {
        await deleteCustomer(selectedCustomer.id);
        setIsDeleteModalOpen(false);
        setSelectedCustomer(null);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const openEditModal = (c: Customer) => {
    setSelectedCustomer(c);
    setIsEditModalOpen(true);
  };

  const openHistoryModal = (c: Customer) => {
    setSelectedCustomer(c);
    const history = orders.filter(o => o.customerId === c.id);
    setCustomerOrders(history.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    setIsHistoryModalOpen(true);
  };

  const openDeleteModal = (c: Customer) => {
    setSelectedCustomer(c);
    setIsDeleteModalOpen(true);
  };

  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sortConfig.key !== column) return <span className="material-symbols-outlined text-[14px] opacity-20">swap_vert</span>;
    return (
      <span className="material-symbols-outlined text-[14px] text-primary">
        {sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward'}
      </span>
    );
  };

  return (
    <div className="p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h2 className="text-slate-900 dark:text-white text-2xl font-bold">Customer Management</h2>
          <p className="text-slate-500 text-sm">{customers.length} total customers registered</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <label className="relative flex-1 sm:min-w-64">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#9dabb9]">search</span>
            <input
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="w-full bg-white dark:bg-[#111418] border border-slate-200 dark:border-[#283039] rounded-lg py-1.5 pl-10 pr-4 text-sm focus:ring-primary focus:border-primary text-slate-900 dark:text-white"
              placeholder="Search customers..."
              type="text"
            />
          </label>
          <Button
            onClick={() => setIsAddModalOpen(true)}
            size="sm"
          >
            + New Customer
          </Button>
        </div>
      </div>

      <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => handleSort('name')}>
                  <div className="flex items-center gap-2">Customer <SortIcon column="name" /></div>
                </th>
                <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => handleSort('email')}>
                  <div className="flex items-center gap-2">Contact <SortIcon column="email" /></div>
                </th>
                <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => handleSort('lastOrderDate')}>
                  <div className="flex items-center gap-2">Last Order <SortIcon column="lastOrderDate" /></div>
                </th>
                <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-right" onClick={() => handleSort('totalSpent')}>
                  <div className="flex items-center justify-end gap-2">Lifetime Spend <SortIcon column="totalSpent" /></div>
                </th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredAndSorted.map((c) => {
                const recency = getRecencyLabel(c.lastOrderDate);
                return (
                  <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                          {c.firstName[0]}{c.lastName[0]}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-slate-900 dark:text-white">{c.lastName}, {c.firstName}</p>
                            {c.notes && (
                              <span className="material-symbols-outlined text-[14px] text-amber-500" title={c.notes}>history_edu</span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-500">ID: #{c.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-700 dark:text-slate-300">{c.email}</p>
                      <p className="text-xs text-slate-500">{c.phone}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className={`text-sm ${recency.color}`}>{recency.text}</span>
                        {c.lastOrderDate && (
                          <span className="text-[10px] text-slate-400">
                            {new Date(c.lastOrderDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-bold text-emerald-500">${c.totalSpent.toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openHistoryModal(c)}
                          className="p-2 text-slate-400 hover:text-primary transition-colors hover:bg-primary/10 rounded-lg"
                          title="View Order History"
                        >
                          <span className="material-symbols-outlined">visibility</span>
                        </button>
                        <button
                          onClick={() => openEditModal(c)}
                          className="p-2 text-slate-400 hover:text-indigo-500 transition-colors hover:bg-indigo-500/10 rounded-lg"
                          title="Edit Profile"
                        >
                          <span className="material-symbols-outlined">edit</span>
                        </button>
                        <button
                          onClick={() => openDeleteModal(c)}
                          className="p-2 text-slate-400 hover:text-red-500 transition-colors hover:bg-red-500/10 rounded-lg"
                          title="Delete Customer"
                        >
                          <span className="material-symbols-outlined">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Register Customer Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Register New Customer">
        {isAddModalOpen && <CustomerForm onClose={() => setIsAddModalOpen(false)} />}
      </Modal>

      {/* Edit Customer Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Customer Profile">
        {selectedCustomer && isEditModalOpen && (
          <CustomerForm
            initialData={selectedCustomer}
            onClose={() => setIsEditModalOpen(false)}
          />
        )}
      </Modal>

      {/* History Modal */}
      <Modal
        isOpen={isHistoryModalOpen}
        onClose={handleCloseHistoryModal}
        title={selectedCustomer ? `${selectedCustomer.lastName}, ${selectedCustomer.firstName}'s Order History` : 'Order History'}
      >
        <div className="space-y-4">
          {customerOrders.length > 0 ? (
            <div className="border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-slate-900 text-[10px] font-black uppercase tracking-widest text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Order #</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Total</th>
                    <th className="px-4 py-3 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {customerOrders.map(order => {
                    const col = kanbanColumns.find(c => c.status === order.status);
                    return (
                      <tr key={order.id} className="text-sm hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                        <td className="px-4 py-3 font-bold text-primary">{order.orderNumber}</td>
                        <td className="px-4 py-3 text-slate-500">{new Date(order.createdAt).toLocaleDateString()}</td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${col?.color?.replace('bg-', 'text-') || 'text-slate-500'}`}>
                            {col?.label || order.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-bold">${order.total.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => { handleCloseHistoryModal(); navigate(`/orders/${order.id}`); }}
                            className="p-1.5 text-slate-400 hover:text-primary transition-colors"
                            title="View Details"
                          >
                            <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center">
              <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">history</span>
              <p className="text-slate-500 text-sm">No orders found for this customer.</p>
            </div>
          )}
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Confirm Deletion">
        <div className="space-y-6 text-center">
          <div className="mx-auto size-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-red-500 text-3xl">warning</span>
          </div>
          <div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-white">Delete Customer?</h4>
            <p className="text-sm text-slate-500 mt-2">
              Are you sure you want to delete <span className="font-bold text-slate-900 dark:text-white">{selectedCustomer?.lastName}, {selectedCustomer?.firstName}</span>?
              This action cannot be undone and will remove all their records.
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => setIsDeleteModalOpen(false)}
              variant="secondary"
              fullWidth
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteConfirm}
              variant="danger"
              fullWidth
              isLoading={isSubmitting}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CustomerList;
