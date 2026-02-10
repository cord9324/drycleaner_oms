
import React, { useState, useMemo } from 'react';
import { useOrderStore } from '../store/useOrderStore';
import Modal from './Modal';
import { ServiceType, ServiceCategory, Store, User, KanbanColumn } from '../types';
import StoreForm from './StoreForm';
import UserForm from './UserForm';
import ServiceCategoryForm from './ServiceCategoryForm';
import KanbanColumnForm from './KanbanColumnForm';

const Settings: React.FC = () => {
  const {
    currentUser,
    stores, deleteStore,
    users, deleteUser,
    serviceCategories, deleteServiceCategory, reorderServiceCategories,
    kanbanColumns, deleteKanbanColumn, reorderKanbanColumns,
    settings, updateSettings
  } = useOrderStore();

  const [activeTab, setActiveTab] = useState('stores');

  // Modals
  const [isStoreModalOpen, setStoreModalOpen] = useState(false);
  const [isUserModalOpen, setUserModalOpen] = useState(false);
  const [isServiceModalOpen, setServiceModalOpen] = useState(false);
  const [isKanbanModalOpen, setKanbanModalOpen] = useState(false);
  const [isDeleteUserConfirmOpen, setDeleteUserConfirmOpen] = useState(false);

  // Form states
  // Form states
  const [editingStoreId, setEditingStoreId] = useState<string | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null);

  // RBAC for Tabs
  const visibleTabs = useMemo(() => {
    const tabs = [
      { id: 'stores', label: 'Store Locations', roles: ['ADMIN', 'MANAGER'] },
      { id: 'services', label: 'Service Categories', roles: ['ADMIN', 'MANAGER'] },
      { id: 'kanban', label: 'Kanban Board', roles: ['ADMIN'] },
      { id: 'users', label: 'User Management', roles: ['ADMIN', 'MANAGER'] },
      { id: 'system', label: 'System Settings', roles: ['ADMIN', 'MANAGER'] }
    ];
    return tabs.filter(t => t.roles.includes(currentUser?.role || 'STAFF'));
  }, [currentUser]);

  const handleConfirmDeleteUser = async () => {
    if (userToDelete) {
      await deleteUser(userToDelete.id);
      setDeleteUserConfirmOpen(false);
      setUserToDelete(null);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
      case 'MANAGER': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400';
    }
  };

  const colorOptions = [
    { label: 'Slate', value: 'bg-slate-400' }, { label: 'Blue', value: 'bg-blue-500' },
    { label: 'Emerald', value: 'bg-emerald-500' }, { label: 'Amber', value: 'bg-amber-500' },
    { label: 'Red', value: 'bg-red-500' }, { label: 'Indigo', value: 'bg-indigo-500' },
    { label: 'Purple', value: 'bg-purple-500' }, { label: 'Pink', value: 'bg-pink-500' },
  ];

  return (
    <div className="p-8 space-y-8 max-w-6xl mx-auto">
      <div className="flex gap-4 border-b border-slate-200 dark:border-slate-800 overflow-x-auto pb-1 no-scrollbar">
        {visibleTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-4 px-2 text-sm font-bold uppercase tracking-wider transition-colors relative whitespace-nowrap ${activeTab === tab.id ? 'text-primary' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
          >
            {tab.label}
            {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
          </button>
        ))}
      </div>

      {activeTab === 'stores' && (
        <div className="animate-in fade-in slide-in-from-bottom-2">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Store Locations</h2>
              <p className="text-sm text-slate-500">Manage your business physical branches</p>
            </div>
            <button onClick={() => { setEditingStoreId(null); setStoreModalOpen(true); }} className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg shadow-primary/20">
              + Add Store
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stores.map(s => (
              <div key={s.id} className="p-6 bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-2xl group hover:border-primary transition-all shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <span className="material-symbols-outlined text-primary p-3 bg-primary/5 rounded-xl">storefront</span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setEditingStoreId(s.id); setStoreModalOpen(true); }} className="p-2 text-slate-400 hover:text-primary"><span className="material-symbols-outlined text-[20px]">edit</span></button>
                    <button onClick={() => deleteStore(s.id)} className="p-2 text-slate-400 hover:text-red-500"><span className="material-symbols-outlined text-[20px]">delete</span></button>
                  </div>
                </div>
                <h4 className="font-bold text-lg">{s.name}</h4>
                <p className="text-sm text-slate-500 mt-1">{s.address}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'services' && (
        <div className="animate-in fade-in slide-in-from-bottom-2">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Service Categories</h2>
              <p className="text-sm text-slate-500">Configure item types and base pricing</p>
            </div>
            <button onClick={() => { setEditingServiceId(null); setServiceModalOpen(true); }} className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg shadow-primary/20">
              + New Category
            </button>
          </div>
          <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest">
                <tr><th className="px-6 py-4">Item</th><th className="px-6 py-4">Type</th><th className="px-6 py-4">Class</th><th className="px-6 py-4">Price</th><th className="px-6 py-4 text-right">Actions</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {serviceCategories.map((cat, index) => (
                  <tr key={cat.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.01] transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity">
                          <button disabled={index === 0} onClick={() => reorderServiceCategories(index, index - 1)} className="material-symbols-outlined text-slate-400 hover:text-primary disabled:opacity-0 text-[18px]">keyboard_arrow_up</button>
                          <button disabled={index === serviceCategories.length - 1} onClick={() => reorderServiceCategories(index, index + 1)} className="material-symbols-outlined text-slate-400 hover:text-primary disabled:opacity-0 text-[18px]">keyboard_arrow_down</button>
                        </div>
                        <span className="font-bold">{cat.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4"><span className="text-xs font-medium px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-md">{cat.serviceType}</span></td>
                    <td className="px-6 py-4"><span className="text-xs font-medium px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-md">{cat.class || 'None'}</span></td>
                    <td className="px-6 py-4 text-emerald-500 font-bold">${cat.basePrice.toFixed(2)}</td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => { setEditingServiceId(cat.id); setServiceModalOpen(true); }} className="p-2 text-slate-400 hover:text-primary"><span className="material-symbols-outlined text-[20px]">edit</span></button>
                      <button onClick={() => deleteServiceCategory(cat.id)} className="p-2 text-slate-400 hover:text-red-500"><span className="material-symbols-outlined text-[20px]">delete</span></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'kanban' && (
        <div className="animate-in fade-in slide-in-from-bottom-2">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Board Configuration</h2>
              <p className="text-sm text-slate-500">Customize order pipeline stages</p>
            </div>
            <button onClick={() => { setEditingColumnId(null); setKanbanModalOpen(true); }} className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg shadow-primary/20">
              + Add Column
            </button>
          </div>
          <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-2">
            {kanbanColumns.map((col, index) => (
              <div key={col.id} className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-xl group">
                <div className="flex flex-col">
                  <button disabled={index === 0} onClick={() => reorderKanbanColumns(index, index - 1)} className="material-symbols-outlined text-slate-400 hover:text-primary disabled:opacity-0">keyboard_arrow_up</button>
                  <button disabled={index === kanbanColumns.length - 1} onClick={() => reorderKanbanColumns(index, index + 1)} className="material-symbols-outlined text-slate-400 hover:text-primary disabled:opacity-0">keyboard_arrow_down</button>
                </div>
                <div className={`size-4 rounded-full ${col.color}`} />
                <div className="flex-1">
                  <p className="font-bold">{col.label}</p>
                  <p className="text-[10px] text-slate-400 font-black">Status Key: {col.status}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setEditingColumnId(col.id); setKanbanModalOpen(true); }} className="p-2 text-slate-400 hover:text-primary"><span className="material-symbols-outlined text-[20px]">edit</span></button>
                  <button onClick={() => deleteKanbanColumn(col.id)} className="p-2 text-slate-400 hover:text-red-500"><span className="material-symbols-outlined text-[20px]">delete</span></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="animate-in fade-in slide-in-from-bottom-2">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Staff Management</h2>
              <p className="text-sm text-slate-500">Manage permissions and team access levels</p>
            </div>
            <button onClick={() => { setEditingUserId(null); setUserModalOpen(true); }} className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg shadow-primary/20">
              + Register Member
            </button>
          </div>
          <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest">
                  <tr>
                    <th className="px-6 py-4">User Details</th>
                    <th className="px-6 py-4">Email Address</th>
                    <th className="px-6 py-4">System Role</th>
                    <th className="px-6 py-4">Internal ID</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {users.length > 0 ? users.map(u => (
                    <tr key={u.id} className={`hover:bg-slate-50 dark:hover:bg-white/[0.01] transition-colors group ${currentUser?.id === u.id ? 'bg-primary/[0.02]' : ''}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="size-10 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden shrink-0 ring-1 ring-slate-200 dark:ring-slate-700">
                            <img src={u.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.name}`} alt={u.name} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-slate-900 dark:text-white">{u.name}</p>
                              {currentUser?.id === u.id && (
                                <span className="text-[9px] bg-primary text-white px-1.5 py-0.5 rounded font-black uppercase tracking-tighter">You</span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-400 uppercase font-black">Active Member</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{u.email || 'N/A'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${getRoleBadge(u.role)}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[10px] font-mono text-slate-400">{u.id.substring(0, 12)}...</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => {
                              setEditingUserId(u.id);
                              setUserModalOpen(true);
                            }}
                            className="p-2 text-slate-400 hover:text-primary transition-colors"
                            title="Edit Profile"
                          >
                            <span className="material-symbols-outlined text-[20px]">edit</span>
                          </button>
                          {currentUser?.id !== u.id && (
                            <button
                              onClick={() => { setUserToDelete(u); setDeleteUserConfirmOpen(true); }}
                              className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                              title="Remove User"
                            >
                              <span className="material-symbols-outlined text-[20px]">person_remove</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500">No registered staff found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'system' && (
        <div className="animate-in fade-in slide-in-from-bottom-2">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">System Settings</h2>
              <p className="text-sm text-slate-500">Global application configurations</p>
            </div>
          </div>
          <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm max-w-2xl">
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Global Tax Rate</label>
                <div className="flex items-center gap-4">
                  <div className="relative flex-1 max-w-[200px]">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">%</span>
                    <input
                      type="number"
                      step="0.01"
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 pl-8 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold"
                      value={(settings.taxRate * 100).toFixed(1)}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val)) {
                          updateSettings({ taxRate: val / 100 });
                        }
                      }}
                    />
                  </div>
                  <p className="text-xs text-slate-500 italic">Currently set to {(settings.taxRate * 100).toFixed(1)}%. This applies to all new orders.</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Default Pickup Time</label>
                <div className="flex items-center gap-4">
                  <div className="relative flex-1 max-w-[200px]">
                    <input
                      type="time"
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold"
                      value={settings.defaultPickupTime}
                      onChange={(e) => updateSettings({ defaultPickupTime: e.target.value })}
                    />
                  </div>
                  <p className="text-xs text-slate-500 italic">Sets the initial pickup time for new orders.</p>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Order Settings & Branding</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Order Number Prefix</label>
                    <input
                      type="text"
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold"
                      value={settings.orderPrefix}
                      onChange={(e) => updateSettings({ orderPrefix: e.target.value })}
                      placeholder="e.g. ORD-"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Company Name</label>
                    <input
                      type="text"
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold"
                      value={settings.companyName}
                      onChange={(e) => updateSettings({ companyName: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Company Phone</label>
                    <input
                      type="text"
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold"
                      value={settings.companyPhone}
                      onChange={(e) => updateSettings({ companyPhone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Store Address (Display Only)</label>
                    <input
                      type="text"
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold"
                      value={settings.companyAddress}
                      onChange={(e) => updateSettings({ companyAddress: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">Silent Printing Security</h4>
                    <p className="text-[10px] text-slate-500 font-medium mt-1 uppercase tracking-tight">Trust anchor for QZ Tray Handshakes</p>
                  </div>
                  <a
                    href="/qz-digital-certificate.txt"
                    download="qz-digital-certificate.txt"
                    className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700"
                  >
                    <span className="material-symbols-outlined text-sm">download</span>
                    Download Cert
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODALS */}
      <Modal isOpen={isStoreModalOpen} onClose={() => { setStoreModalOpen(false); setEditingStoreId(null); }} title={editingStoreId ? "Edit Location" : "Add Location"}>
        {isStoreModalOpen && <StoreForm initialData={stores.find(s => s.id === editingStoreId)} onClose={() => { setStoreModalOpen(false); setEditingStoreId(null); }} />}
      </Modal>

      <Modal isOpen={isUserModalOpen} onClose={() => { setUserModalOpen(false); setEditingUserId(null); }} title={editingUserId ? "Modify Staff Permissions" : "Register New Staff Member"}>
        {isUserModalOpen && <UserForm initialData={users.find(u => u.id === editingUserId)} onClose={() => { setUserModalOpen(false); setEditingUserId(null); }} />}
      </Modal>

      {/* CUSTOM DELETE USER CONFIRMATION MODAL */}
      <Modal isOpen={isDeleteUserConfirmOpen} onClose={() => setDeleteUserConfirmOpen(false)} title="Confirm User Removal">
        <div className="space-y-6 text-center">
          <div className="mx-auto size-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-red-500 text-3xl">warning</span>
          </div>
          <div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-white">Delete Staff Profile?</h4>
            <p className="text-sm text-slate-500 mt-2">
              Are you sure you want to remove <span className="font-bold text-slate-900 dark:text-white">{userToDelete?.name}</span>?
              This will revoke their access to the system immediately. This action cannot be undone.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setDeleteUserConfirmOpen(false)}
              className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold py-3 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmDeleteUser}
              className="flex-1 bg-red-500 text-white font-bold py-3 rounded-xl hover:bg-red-600 shadow-lg shadow-red-500/20 transition-all active:scale-95"
            >
              Delete Profile
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isServiceModalOpen} onClose={() => { setServiceModalOpen(false); setEditingServiceId(null); }} title="Service Category">
        {isServiceModalOpen && <ServiceCategoryForm initialData={serviceCategories.find(s => s.id === editingServiceId)} onClose={() => { setServiceModalOpen(false); setEditingServiceId(null); }} />}
      </Modal>

      <Modal isOpen={isKanbanModalOpen} onClose={() => { setKanbanModalOpen(false); setEditingColumnId(null); }} title="Kanban Column">
        {isKanbanModalOpen && <KanbanColumnForm initialData={kanbanColumns.find(c => c.id === editingColumnId)} onClose={() => { setKanbanModalOpen(false); setEditingColumnId(null); }} />}
      </Modal>
    </div>
  );
};

export default Settings;
