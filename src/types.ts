export interface RestaurantTheme {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
}

export interface Subscription {
  endDate: string; // ISO string
}

export interface RestaurantProfile {
  name: string;
  logoUrl?: string;
  contact?: string;
  address?: string;
  intro?: string;
  theme?: RestaurantTheme;
  paymentQrUrl?: string;
  paymentDetails?: string;
  subscription?: Subscription;
}

export interface Category {
  id: string;
  name: string;
  order: number;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  categoryId: string;
  imageUrl?: string;
  isBestSeller?: boolean;
  isTodayPick?: boolean;
  isSpecialOffer?: boolean;
  isVeg?: boolean;
  available: boolean;
}

export interface Table {
  id: string;
  number: number;
  qrCodeUrl?: string;
}

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export type OrderStatus = 'pending' | 'preparing' | 'payment_pending' | 'completed' | 'cancelled';

export interface Order {
  id: string;
  customerName: string;
  tableNumber: number;
  items: OrderItem[];
  notes?: string;
  status: OrderStatus;
  total: number;
  createdAt: string;
}

export type UserRole = 'admin' | 'kitchen';

export interface StaffUser {
  uid: string;
  email: string;
  role: UserRole;
}
