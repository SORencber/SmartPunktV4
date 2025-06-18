import { api } from './api';

export interface Settings {
  businessName: string;
  businessPhone: string;
  businessEmail: string;
  businessAddress: string;
  timezone: string;
  defaultLanguage: 'en' | 'tr' | 'de';
  defaultCurrency: 'usd' | 'eur' | 'try';
  autoDetectCustomerLanguage: boolean;
  showLanguageFlags: boolean;
  notifications: {
    email: boolean;
    sms: boolean;
    lowStock: boolean;
    orderStatus: boolean;
  };
  security: {
    twoFactorAuth: boolean;
    sessionTimeout: '15' | '30' | '60' | 'never';
  };
  userManagement: {
    defaultUserRole: 'technician' | 'staff' | 'manager';
    requireEmailVerification: boolean;
  };
  createdAt?: string;
  updatedAt?: string;
  _id?: string;
}

export async function getSettings() {
  const res = await api.get<Settings>('/api/settings');
  return res.data;
}

export async function updateSettings(data: Partial<Settings>) {
  const res = await api.put<Settings>('/api/settings', data);
  return res.data;
} 