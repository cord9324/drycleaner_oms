
import { create } from 'zustand';
import { Order, Customer, Store, User, ServiceCategory, ServiceType, KanbanColumn, TimeLog, OrderStatus } from '../types';
import { supabase, CURRENT_URL, CURRENT_KEY } from '../lib/supabase';
import { Session, createClient } from '@supabase/supabase-js';

interface OrderState {
  orders: Order[];
  customers: Customer[];
  stores: Store[];
  users: User[];
  serviceCategories: ServiceCategory[];
  kanbanColumns: KanbanColumn[];
  timeLogs: TimeLog[];
  currentUser: User | null;
  session: Session | null;
  loading: boolean;
  searchQuery: string;
  locationFilter: string;
  
  // Auth Actions
  setSession: (session: Session | null) => void;
  setProfile: (profile: User | null) => void;
  
  // Data Actions
  fetchInitialData: () => Promise<void>;
  subscribeToChanges: () => () => void;
  
  // Time Tracking
  clockIn: () => Promise<void>;
  clockOut: () => Promise<void>;
  fetchTimeLogs: () => Promise<void>;
  
  // Orders
  updateOrderStatus: (orderId: string, status: string) => Promise<void>;
  addOrder: (order: Order) => Promise<void>;
  updateOrder: (orderId: string, updates: Partial<Order>) => Promise<void>;
  
  // Customers
  addCustomer: (customer: Customer) => Promise<void>;
  updateCustomer: (id: string, updates: Partial<Customer>) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  
  // Settings / Setup
  addStore: (store: Store) => Promise<void>;
  updateStore: (id: string, updates: Partial<Store>) => Promise<void>;
  deleteStore: (id: string) => Promise<void>;
  
  addUser: (userData: { name: string, email: string, role: string, password?: string }) => Promise<void>;
  updateUser: (userId: string, updates: Partial<User>) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  
  addServiceCategory: (category: ServiceCategory) => Promise<void>;
  updateServiceCategory: (id: string, updates: Partial<ServiceCategory>) => Promise<void>;
  deleteServiceCategory: (id: string) => Promise<void>;
  
  addKanbanColumn: (column: Omit<KanbanColumn, 'position'>) => Promise<void>;
  updateKanbanColumn: (id: string, updates: Partial<KanbanColumn>) => Promise<void>;
  deleteKanbanColumn: (id: string) => Promise<void>;
  reorderKanbanColumns: (startIndex: number, endIndex: number) => Promise<void>;

  setSearchQuery: (query: string) => void;
  setLocationFilter: (locationId: string) => void;
}

export const useOrderStore = create<OrderState>((set, get) => ({
  orders: [],
  customers: [],
  stores: [],
  serviceCategories: [],
  kanbanColumns: [],
  users: [],
  timeLogs: [],
  currentUser: null,
  session: null,
  loading: false,
  searchQuery: '',
  locationFilter: 'all',

  setSession: (session) => set({ session }),
  setProfile: (currentUser) => set({ currentUser }),

  fetchInitialData: async () => {
    set({ loading: true });
    try {
      const [
        ordersRes,
        customersRes,
        storesRes,
        servicesRes,
        columnsRes,
        profilesRes
      ] = await Promise.all([
        supabase.from('orders').select('*').order('created_at', { ascending: false }),
        supabase.from('customers').select('*'),
        supabase.from('stores').select('*'),
        supabase.from('service_categories').select('*'),
        supabase.from('kanban_columns').select('*').order('position'),
        supabase.from('profiles').select('*')
      ]);

      const currentUser = get().currentUser;

      let fetchedUsers: User[] = (profilesRes.data || []).map(p => ({
        id: p.id,
        name: p.name,
        email: p.email || '',
        role: p.role,
        avatar: p.avatar
      }));

      if (currentUser && !fetchedUsers.find(u => u.id === currentUser.id)) {
        fetchedUsers.push(currentUser);
      }

      set({
        orders: (ordersRes.data || []).map(o => ({
          ...o,
          orderNumber: o.order_number,
          hangerNumber: o.hanger_number,
          customerId: o.customer_id,
          customerName: o.customer_name,
          pickupDate: o.pickup_date,
          pickupTime: o.pickup_time,
          isPriority: o.is_priority,
          storeId: o.store_id,
          specialHandling: o.special_handling,
          createdAt: o.created_at,
          completedAt: o.completed_at
        })),
        customers: (customersRes.data || []).map(c => ({
          ...c,
          firstName: c.first_name,
          lastName: c.last_name,
          totalSpent: parseFloat(c.total_spent || 0),
          createdAt: c.created_at,
          lastOrderDate: c.last_order_date
        })),
        stores: storesRes.data || [],
        serviceCategories: (servicesRes.data || []).map(s => ({
          ...s,
          serviceType: s.service_type,
          basePrice: parseFloat(s.base_price || 0)
        })),
        kanbanColumns: columnsRes.data || [],
        users: fetchedUsers,
        loading: false
      });

      // Also fetch logs
      await get().fetchTimeLogs();
    } catch (error) {
      console.error('Error fetching data:', error);
      set({ loading: false });
    }
  },

  subscribeToChanges: () => {
    const channel = supabase
      .channel('db-all-changes')
      .on('postgres_changes', { event: '*', table: 'orders', schema: 'public' }, () => get().fetchInitialData())
      .on('postgres_changes', { event: '*', table: 'customers', schema: 'public' }, () => get().fetchInitialData())
      .on('postgres_changes', { event: '*', table: 'profiles', schema: 'public' }, () => get().fetchInitialData())
      .on('postgres_changes', { event: '*', table: 'time_logs', schema: 'public' }, () => get().fetchTimeLogs())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  },

  fetchTimeLogs: async () => {
    const { data, error } = await supabase
      .from('time_logs')
      .select('*')
      .order('clock_in', { ascending: false });
    
    if (!error) set({ timeLogs: data });
  },

  clockIn: async () => {
    const userId = get().currentUser?.id;
    if (!userId) return;

    // Check for active session
    const activeSession = get().timeLogs.find(log => log.user_id === userId && !log.clock_out);
    if (activeSession) {
      alert("You are already clocked in!");
      return;
    }

    const { error } = await supabase
      .from('time_logs')
      .insert([{ user_id: userId, clock_in: new Date().toISOString() }]);
    
    if (error) console.error("Clock In Error:", error.message);
    else await get().fetchTimeLogs();
  },

  clockOut: async () => {
    const userId = get().currentUser?.id;
    if (!userId) return;

    const activeSession = get().timeLogs.find(log => log.user_id === userId && !log.clock_out);
    if (!activeSession) {
      alert("No active clock-in found!");
      return;
    }

    const { error } = await supabase
      .from('time_logs')
      .update({ clock_out: new Date().toISOString() })
      .eq('id', activeSession.id);
    
    if (error) console.error("Clock Out Error:", error.message);
    else await get().fetchTimeLogs();
  },

  updateOrderStatus: async (orderId, status) => {
    const isCompleted = status === OrderStatus.COMPLETED;
    const dbUpdates: any = { 
      status,
      completed_at: isCompleted ? new Date().toISOString() : null
    };

    const { error } = await supabase.from('orders').update(dbUpdates).eq('id', orderId);
    if (error) console.error("Status Update Error:", error.message);
    else get().fetchInitialData();
  },

  addOrder: async (order) => {
    const { error } = await supabase.from('orders').insert([{
      id: order.id,
      order_number: order.orderNumber,
      hanger_number: order.hangerNumber,
      customer_id: order.customerId,
      customer_name: order.customerName,
      status: order.status,
      items: order.items,
      subtotal: order.subtotal,
      tax: order.tax,
      total: order.total,
      pickup_date: order.pickupDate,
      pickup_time: order.pickupTime,
      is_priority: order.isPriority,
      store_id: order.storeId,
      special_handling: order.specialHandling,
      created_at: order.createdAt,
      completed_at: order.status === OrderStatus.COMPLETED ? order.createdAt : null
    }]);
    
    if (error) {
      console.error("Order Insertion Error:", error.message);
      throw error;
    } else {
      await get().fetchInitialData();
    }
  },

  updateOrder: async (orderId, updates) => {
    const dbUpdates: any = {};
    if (updates.orderNumber) dbUpdates.order_number = updates.orderNumber;
    if (updates.hangerNumber !== undefined) dbUpdates.hanger_number = updates.hangerNumber;
    if (updates.status) {
      dbUpdates.status = updates.status;
      if (updates.status === OrderStatus.COMPLETED) {
        dbUpdates.completed_at = new Date().toISOString();
      } else {
        dbUpdates.completed_at = null;
      }
    }
    if (updates.items) dbUpdates.items = updates.items;
    if (updates.subtotal !== undefined) dbUpdates.subtotal = updates.subtotal;
    if (updates.tax !== undefined) dbUpdates.tax = updates.tax;
    if (updates.total !== undefined) dbUpdates.total = updates.total;
    if (updates.pickupDate) dbUpdates.pickup_date = updates.pickupDate;
    if (updates.pickupTime) dbUpdates.pickup_time = updates.pickupTime;
    if (updates.isPriority !== undefined) dbUpdates.is_priority = updates.isPriority;
    if (updates.specialHandling !== undefined) dbUpdates.special_handling = updates.specialHandling;

    const { error } = await supabase.from('orders').update(dbUpdates).eq('id', orderId);
    if (error) console.error("Order Update Error:", error.message);
    else get().fetchInitialData();
  },

  addCustomer: async (customer) => {
    const { error } = await supabase.from('customers').insert([{
      id: customer.id,
      first_name: customer.firstName,
      last_name: customer.lastName,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      notes: customer.notes,
      total_spent: customer.totalSpent,
      created_at: customer.createdAt
    }]);
    if (error) console.error("Customer Insertion Error:", error.message);
    else await get().fetchInitialData();
  },

  updateCustomer: async (id, updates) => {
    const dbUpdates: any = {};
    if (updates.firstName) dbUpdates.first_name = updates.firstName;
    if (updates.lastName) dbUpdates.last_name = updates.lastName;
    if (updates.email) dbUpdates.email = updates.email;
    if (updates.phone) dbUpdates.phone = updates.phone;
    if (updates.address) dbUpdates.address = updates.address;
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
    if (updates.totalSpent !== undefined) dbUpdates.total_spent = updates.totalSpent;
    if (updates.lastOrderDate) dbUpdates.last_order_date = updates.lastOrderDate;

    const { error } = await supabase.from('customers').update(dbUpdates).eq('id', id);
    if (error) console.error("Customer Update Error:", error.message);
    else await get().fetchInitialData();
  },

  deleteCustomer: async (id) => {
    const { error } = await supabase.from('customers').delete().eq('id', id);
    if (!error) get().fetchInitialData();
  },

  addStore: async (store) => {
    const { error } = await supabase.from('stores').insert([store]);
    if (!error) get().fetchInitialData();
  },
  updateStore: async (id, updates) => {
    const { error } = await supabase.from('stores').update(updates).eq('id', id);
    if (!error) get().fetchInitialData();
  },
  deleteStore: async (id) => {
    const { error } = await supabase.from('stores').delete().eq('id', id);
    if (!error) get().fetchInitialData();
  },

  addUser: async (userData) => {
    try {
      const cleanEmail = userData.email.trim().toLowerCase();
      const tempSupabase = createClient(CURRENT_URL, CURRENT_KEY, { auth: { persistSession: false } });
      if (!userData.password) throw new Error("Password is required for registration");
      const { error: authError } = await tempSupabase.auth.signUp({
        email: cleanEmail,
        password: userData.password,
        options: { data: { name: userData.name, role: userData.role } }
      });
      if (authError) throw authError;
      await get().fetchInitialData();
      alert(`Staff member ${userData.name} has been registered!`);
    } catch (error: any) {
      console.error("Staff Registration Error:", error.message || error);
      alert(`Registration Failed: ${error.message || 'Unknown error'}`);
    }
  },

  updateUser: async (userId, updates) => {
    try {
      if (userId === get().session?.user.id) {
        const { error: authError } = await supabase.auth.updateUser({
          email: updates.email,
          data: { name: updates.name, role: updates.role }
        });
        if (authError) throw authError;
        if (updates.email) alert("Email update initiated. Check inbox.");
      } else {
        const { error } = await supabase.from('profiles').update({
          name: updates.name,
          email: updates.email,
          role: updates.role
        }).eq('id', userId);
        if (error) throw error;
      }
      await get().fetchInitialData();
    } catch (error: any) {
      console.error("Profile Update Error:", error.message);
      alert(`Update Failed: ${error.message}`);
    }
  },

  deleteUser: async (userId) => {
    const { error } = await supabase.from('profiles').delete().eq('id', userId);
    if (error) console.error("Profile Deletion Error:", error.message);
    else await get().fetchInitialData();
  },

  addServiceCategory: async (category) => {
    const { error } = await supabase.from('service_categories').insert([{
      id: category.id,
      name: category.name,
      service_type: category.serviceType,
      base_price: category.basePrice
    }]);
    if (!error) get().fetchInitialData();
  },
  updateServiceCategory: async (id, updates) => {
    const dbUpdates: any = {};
    if (updates.name) dbUpdates.name = updates.name;
    if (updates.serviceType) dbUpdates.service_type = updates.serviceType;
    if (updates.basePrice) dbUpdates.base_price = updates.basePrice;
    const { error } = await supabase.from('service_categories').update(dbUpdates).eq('id', id);
    if (!error) get().fetchInitialData();
  },
  deleteServiceCategory: async (id) => {
    const { error } = await supabase.from('service_categories').delete().eq('id', id);
    if (!error) get().fetchInitialData();
  },

  addKanbanColumn: async (column) => {
    const position = get().kanbanColumns.length;
    const { error } = await supabase.from('kanban_columns').insert([{ ...column, position }]);
    if (!error) get().fetchInitialData();
  },
  updateKanbanColumn: async (id, updates) => {
    const { error } = await supabase.from('kanban_columns').update(updates).eq('id', id);
    if (!error) get().fetchInitialData();
  },
  deleteKanbanColumn: async (id) => {
    const { error } = await supabase.from('kanban_columns').delete().eq('id', id);
    if (!error) get().fetchInitialData();
  },
  reorderKanbanColumns: async (startIndex, endIndex) => {
    const result = Array.from(get().kanbanColumns);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    set({ kanbanColumns: result });
    const updates = result.map((col, idx) => ({
      id: col.id,
      label: col.label,
      status: col.status,
      color: col.color,
      position: idx
    }));
    const { error } = await supabase.from('kanban_columns').upsert(updates);
    if (error) {
      console.error("Error persisting kanban column order:", error.message);
      get().fetchInitialData();
    }
  },

  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setLocationFilter: (locationFilter) => set({ locationFilter }),
}));
