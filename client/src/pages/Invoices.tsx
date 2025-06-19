import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { Button } from '@/components/ui/button';
import { FileDown } from 'lucide-react';

interface Invoice {
  _id: string;
  orders: Array<{
    _id: string;
    orderId: string;
  }>;
  totalAmount: number;
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  serviceFee: number;
  createdAt: string;
  pdfUrl?: string;
  branch?: {
    name: string;
  };
}

export function Invoices() {
  const { t } = useTranslation();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('No authentication token found');
      }
      const response = await fetch('/api/invoices', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch invoices');
      }
      const data = await response.json();
      setInvoices(data);
    } catch (error: any) {
      console.error('Error loading invoices:', error);
      if (error.message.includes('token')) {
        window.location.href = '/login?session=expired';
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-white/50 dark:bg-slate-800/50 rounded w-48" />
        <div className="grid gap-6 md:grid-cols-2">
          <div className="h-64 bg-white/50 dark:bg-slate-800/50 rounded-xl" />
          <div className="h-64 bg-white/50 dark:bg-slate-800/50 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          {t('invoices.title')}
        </h1>
      </div>

      <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border-slate-200/50 dark:border-slate-700/50">
        <CardHeader>
          <CardTitle>{t('invoices.listTitle')}</CardTitle>
          <CardDescription>{t('invoices.listDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm border rounded-xl bg-white dark:bg-slate-800">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-700">
                  <th className="px-3 py-2 text-left">{t('invoices.table.date')}</th>
                  <th className="px-3 py-2 text-left">{t('invoices.table.branch')}</th>
                  <th className="px-3 py-2 text-left">{t('invoices.table.orders')}</th>
                  <th className="px-3 py-2 text-left">{t('invoices.table.items')}</th>
                  <th className="px-3 py-2 text-left">{t('invoices.table.serviceFee')}</th>
                  <th className="px-3 py-2 text-left">{t('invoices.table.total')}</th>
                  <th className="px-3 py-2 text-left">{t('invoices.table.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice._id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                    <td className="px-3 py-2">{formatDate(invoice.createdAt)}</td>
                    <td className="px-3 py-2">{invoice.branch?.name || '-'}</td>
                    <td className="px-3 py-2">
                      {invoice.orders.map(order => order.orderId).join(', ')}
                    </td>
                    <td className="px-3 py-2">
                      {invoice.items.length} {t('invoices.table.itemCount')}
                    </td>
                    <td className="px-3 py-2">{formatCurrency(invoice.serviceFee)}</td>
                    <td className="px-3 py-2">{formatCurrency(invoice.totalAmount)}</td>
                    <td className="px-3 py-2">
                      {invoice.pdfUrl && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(invoice.pdfUrl, '_blank')}
                          title={t('invoices.downloadPdf')}
                        >
                          <FileDown className="h-4 w-4 mr-2" />
                          {t('invoices.downloadPdf')}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 