
export enum ServiceType {
  DRY_CLEAN = 'Dry Clean',
  LAUNDER = 'Launder',
  ALTERATION = 'Alteration',
  SPECIALTY = 'Specialty'
}

export enum OrderStatus {
  RECEIVED = 'RECEIVED',
  CLEANING = 'CLEANING',
  READY = 'READY',
  COMPLETED = 'COMPLETED',
  HOLD = 'HOLD',
  VOID = 'VOID'
}

export interface ServiceCategory {
  id: string;
  name: string;
  serviceType: ServiceType;
  basePrice: number;
  position: number;
}

export interface KanbanColumn {
  id: string;
  status: string;
  label: string;
  color: string;
  position: number;
}

export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  notes?: string;
  createdAt: string;
  lastOrderDate?: string;
  totalSpent: number;
}

export interface OrderItem {
  id: string;
  category: string;
  serviceType: ServiceType;
  quantity: number;
  unitPrice: number;
  total: number;
  notes?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  hangerNumber?: string;
  customerId: string;
  customerName: string;
  status: OrderStatus | string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  createdAt: string;
  completedAt?: string;
  pickupDate: string;
  pickupTime: string;
  isPriority: boolean;
  storeId: string;
  specialHandling?: string;
}

export interface Store {
  id: string;
  name: string;
  address: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'STAFF';
  avatar?: string;
}

export interface TimeLog {
  id: string;
  user_id: string;
  clock_in: string;
  clock_out: string | null;
  notes?: string;
}

export interface AppSettings {
  taxRate: number;
  companyName: string;
  companyAddress: string;
  companyPhone: string;
}
