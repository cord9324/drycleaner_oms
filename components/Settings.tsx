
import React, { useState, useMemo } from 'react';
import { useOrderStore } from '../store/useOrderStore';
import Modal from './Modal';
import { ServiceType, ServiceCategory, Store, User, KanbanColumn } from '../types';

const Settings: React.FC = () => {
  const { 
    currentUser,
    stores, addStore, updateStore, deleteStore,
    users, updateUser, addUser, deleteUser,
    serviceCategories, addServiceCategory, updateServiceCategory, deleteServiceCategory,
    kanbanColumns, addKanbanColumn, updateKanbanColumn, deleteKanbanColumn, reorderKanbanColumns
  } = useOrderStore();
  
  const [activeTab, setActiveTab] = useState('stores');
  
  // Modals
  const [isStoreModalOpen, setStoreModalOpen] = useState(false);
  const [isUserModalOpen, setUserModalOpen] = useState(false);
  const [isServiceModalOpen, setServiceModalOpen] = useState(false);
  const [isKanbanModalOpen, setKanbanModalOpen] = useState(false);
  const [isDeleteUserConfirmOpen, setDeleteUserConfirmOpen] = useState(false);

  // Form states
  const [newStore, setNewStore] = useState({ name: '', address: '' });
  const [editingStoreId, setEditingStoreId] = useState<string | null>(null);

  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'STAFF' as any });
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const [newService, setNewService] = useState({ name: '', serviceType: ServiceType.DRY_CLEAN, basePrice: 0 });
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);

  const [newColumn, setNewColumn] = useState<Partial<KanbanColumn>>({ label: '', status: '', color: 'bg-slate-400' });
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null);

  // RBAC for Tabs
  const visibleTabs = useMemo(() => {
    const tabs = [
      { id: 'stores', label: 'Store Locations', roles: ['ADMIN', 'MANAGER'] },
      { id: 'services', label: 'Service Categories', roles: ['ADMIN', 'MANAGER'] },
      { id: 'kanban', label: 'Kanban Board', roles: ['ADMIN'] },
      { id: 'users', label: 'User Management', roles: ['ADMIN', 'MANAGER'] }
    ];
    return tabs.filter(t => t.roles.includes(currentUser?.role || 'STAFF'));
  }, [currentUser]);

  const resetStoreForm = () => { setNewStore({ name: '', address: '' }); setEditingStoreId(null); };
  const resetUserForm = () => { setNewUser({ name: '', email: '', password: '', role: 'STAFF' }); setEditingUserId(null); };
  const resetServiceForm = () => { setNewService({ name: '', serviceType: ServiceType.DRY_CLEAN, basePrice: 0 }); setEditingServiceId(null); };
  const resetKanbanForm = () => { setNewColumn({ label: '', status: '', color: 'bg-slate-400' }); setEditingColumnId(null); };

  const handleStoreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingStoreId) await updateStore(editingStoreId, newStore);
    else await addStore({ id: `s${Date.now()}`, ...newStore });
    setStoreModalOpen(false);
    resetStoreForm();
  };

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUserId) {
      await updateUser(editingUserId, { name: newUser.name, email: newUser.email, role: newUser.role });
    } else {
      if (!newUser.password || newUser.password.length < 6) {
        alert("Password must be at least 6 characters long.");
        return;
      }
      await addUser({ 
        name: newUser.name, 
        email: newUser.email,
        password: newUser.password,
        role: newUser.role
      });
    }
    setUserModalOpen(false);
    resetUserForm();
  };

  const handleConfirmDeleteUser = async () => {
    if (userToDelete) {
      await deleteUser(userToDelete.id);
      setDeleteUserConfirmOpen(false);
      setUserToDelete(null);
    }
  };

  const handleServiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingServiceId) await updateServiceCategory(editingServiceId, newService);
    else await addServiceCategory({ id: `sc${Date.now()}`, ...newService });
    setServiceModalOpen(false);
    resetServiceForm();
  };

  const handleKanbanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const statusKey = newColumn.status || newColumn.label?.toUpperCase().replace(/\s+/g, '_') || `ST_${Date.now()}`;
    if (editingColumnId) await updateKanbanColumn(editingColumnId, { ...newColumn, status: statusKey });
    else await addKanbanColumn({ id: `col${Date.now()}`, ...newColumn, status: statusKey } as KanbanColumn);
    setKanbanModalOpen(false);
    resetKanbanForm();
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
            className={`pb-4 px-2 text-sm font-bold uppercase tracking-wider transition-colors relative whitespace-nowrap ${
              activeTab === tab.id ? 'text-primary' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
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
            <button onClick={() => { resetStoreForm(); setStoreModalOpen(true); }} className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg shadow-primary/20">
              + Add Store
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stores.map(s => (
              <div key={s.id} className="p-6 bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-2xl group hover:border-primary transition-all shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <span className="material-symbols-outlined text-primary p-3 bg-primary/5 rounded-xl">storefront</span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setEditingStoreId(s.id); setNewStore({name:s.name, address:s.address}); setStoreModalOpen(true); }} className="p-2 text-slate-400 hover:text-primary"><span className="material-symbols-outlined text-[20px]">edit</span></button>
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
            <button onClick={() => { resetServiceForm(); setServiceModalOpen(true); }} className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg shadow-primary/20">
              + New Category
            </button>
          </div>
          <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest">
                <tr><th className="px-6 py-4">Item</th><th className="px-6 py-4">Type</th><th className="px-6 py-4">Price</th><th className="px-6 py-4 text-right">Actions</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {serviceCategories.map(cat => (
                  <tr key={cat.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.01] transition-colors group">
                    <td className="px-6 py-4 font-bold">{cat.name}</td>
                    <td className="px-6 py-4"><span className="text-xs font-medium px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-md">{cat.serviceType}</span></td>
                    <td className="px-6 py-4 text-emerald-500 font-bold">${cat.basePrice.toFixed(2)}</td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => { setEditingServiceId(cat.id); setNewService({name:cat.name, serviceType:cat.serviceType, basePrice:cat.basePrice}); setServiceModalOpen(true); }} className="p-2 text-slate-400 hover:text-primary"><span className="material-symbols-outlined text-[20px]">edit</span></button>
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
            <button onClick={() => { resetKanbanForm(); setKanbanModalOpen(true); }} className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg shadow-primary/20">
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
                  <button onClick={() => { setEditingColumnId(col.id); setNewColumn({label:col.label, status:col.status, color:col.color}); setKanbanModalOpen(true); }} className="p-2 text-slate-400 hover:text-primary"><span className="material-symbols-outlined text-[20px]">edit</span></button>
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
            <button onClick={() => { resetUserForm(); setUserModalOpen(true); }} className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg shadow-primary/20">
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
                              setNewUser({ name: u.name, email: u.email, password: '', role: u.role }); 
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

      {/* MODALS */}
      <Modal isOpen={isStoreModalOpen} onClose={() => { setStoreModalOpen(false); resetStoreForm(); }} title={editingStoreId ? "Edit Location" : "Add Location"}>
        <form onSubmit={handleStoreSubmit} className="space-y-4">
          <input required placeholder="Store Name" value={newStore.name} onChange={e => setNewStore({...newStore, name: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm outline-none" />
          <textarea required placeholder="Address" value={newStore.address} onChange={e => setNewStore({...newStore, address: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm h-24 outline-none" />
          <button type="submit" className="w-full bg-primary text-white font-bold py-3.5 rounded-xl">Save Store</button>
        </form>
      </Modal>

      <Modal isOpen={isUserModalOpen} onClose={() => { setUserModalOpen(false); resetUserForm(); }} title={editingUserId ? "Modify Staff Permissions" : "Register New Staff Member"}>
        <form onSubmit={handleUserSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-500">Full Name</label>
            <input required placeholder="E.g. Jane Smith" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm outline-none" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-500">Business Email</label>
            <input required type="email" placeholder="jane@drycleanpro.com" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm outline-none" />
          </div>
          {!editingUserId && (
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-500">Temporary Password</label>
              <input required type="password" placeholder="Min. 6 characters" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm outline-none" />
            </div>
          )}
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-500">Access Role</label>
            <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value as any})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm outline-none">
              <option value="STAFF">Staff (Daily Operations)</option>
              <option value="MANAGER">Manager (Store Admin)</option>
              <option value="ADMIN">Administrator (Full Access)</option>
            </select>
          </div>
          
          <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <p className="text-[10px] font-black uppercase text-slate-400">Security Notice</p>
            <p className="text-xs text-slate-500 mt-1">
              {editingUserId ? "Updating basic info. Email and Role can be changed directly." : "Creating a new account. The user will be able to log in immediately with the provided email and temporary password."}
            </p>
          </div>

          <button type="submit" className="w-full bg-primary text-white font-bold py-3.5 rounded-xl shadow-lg">
            {editingUserId ? "Update Profile" : "Register & Create Account"}
          </button>
        </form>
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

      <Modal isOpen={isServiceModalOpen} onClose={() => { setServiceModalOpen(false); resetServiceForm(); }} title="Service Category">
        <form onSubmit={handleServiceSubmit} className="space-y-4">
          <input required placeholder="Category Name" value={newService.name} onChange={e => setNewService({...newService, name: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm outline-none" />
          <select value={newService.serviceType} onChange={e => setNewService({...newService, serviceType: e.target.value as ServiceType})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm outline-none">
            {Object.values(ServiceType).map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <input type="number" step="0.01" value={newService.basePrice} onChange={e => setNewService({...newService, basePrice: parseFloat(e.target.value)})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm outline-none" />
          <button type="submit" className="w-full bg-primary text-white font-bold py-3.5 rounded-xl">Save Category</button>
        </form>
      </Modal>

      <Modal isOpen={isKanbanModalOpen} onClose={() => { setKanbanModalOpen(false); resetKanbanForm(); }} title="Kanban Column">
        <form onSubmit={handleKanbanSubmit} className="space-y-4">
          <input required placeholder="Label" value={newColumn.label} onChange={e => setNewColumn({...newColumn, label: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm outline-none" />
          <div className="grid grid-cols-4 gap-2">
            {colorOptions.map(opt => (
              <button key={opt.value} type="button" onClick={() => setNewColumn({...newColumn, color: opt.value})} className={`p-2 rounded-lg border-2 transition-all ${newColumn.color === opt.value ? 'border-primary' : 'border-transparent'}`}>
                <div className={`size-6 rounded-full ${opt.value} mx-auto`} />
              </button>
            ))}
          </div>
          <button type="submit" className="w-full bg-primary text-white font-bold py-3.5 rounded-xl">Save Column</button>
        </form>
      </Modal>
    </div>
  );
};

export default Settings;
