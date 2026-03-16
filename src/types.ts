export interface Product {
  id: number;
  brand: string;
  model: string;
  rim: string;
  width: string;
  profile: string;
  type: string;
  price: number;
  cost_price: number;
  stock: number;
  min_stock: number;
  sku: string;
}

export interface Service {
  id: number;
  name: string;
  price: number;
}

export interface Customer {
  id: number;
  name: string;
  phone: string;
  email: string;
  address: string;
  balance: number;
}

export interface Vehicle {
  id: number;
  license_plate: string;
  brand: string;
  model: string;
  year: number;
  customer_id: number;
  owner_name?: string;
}

export interface Appointment {
  id: number;
  date: string;
  time: string;
  customer_id: number;
  customer_name?: string;
  vehicle_id: number;
  license_plate?: string;
  service_id: number;
  service_name?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  notes: string;
  price?: number; // Added to help with OT creation
}

export interface WorkOrder {
  id: number;
  appointment_id?: number;
  customer_id: number;
  customer_name?: string;
  vehicle_id: number;
  license_plate?: string;
  date: string;
  status: 'open' | 'closed' | 'cancelled';
  total: number;
  notes: string;
}

export interface DashboardStats {
  salesToday: number;
  servicesToday: number;
  criticalStock: number;
  pendingAppointments: number;
}

export interface Supplier {
  id: number;
  name: string;
  contact: string;
  phone: string;
  balance: number;
}

export interface Purchase {
  id: number;
  date: string;
  supplier_id: number;
  supplier_name?: string;
  total: number;
  status: string;
  is_current_account?: boolean;
}

export interface Check {
  id: number;
  bank: string;
  number: string;
  amount: number;
  due_date: string;
  status: 'portfolio' | 'deposited' | 'used_for_payment' | 'returned';
  source_sale_id?: number;
  target_purchase_id?: number;
  customer_id?: number;
  customer_name?: string;
  supplier_id?: number;
  supplier_name?: string;
  notes?: string;
}
