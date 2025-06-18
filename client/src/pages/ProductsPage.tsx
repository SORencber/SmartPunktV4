import { useTranslation } from 'react-i18next';
import { PageContainer } from '@/components/PageContainer';
import { Table, TableHead, TableRow, TableHeader } from '@/components/ui/table';
import { Button } from '@/components/ui/button';

export default function ProductsPage() {
  const { t } = useTranslation();

  return (
    <PageContainer title={t('products.title')} description={t('products.description')}>
      <Table>
        <TableHead>
          <TableRow>
            <TableHeader>{t('products.table.name')}</TableHeader>
            <TableHeader>{t('products.table.category')}</TableHeader>
            <TableHeader>{t('products.table.price')}</TableHeader>
            <TableHeader>{t('products.table.actions')}</TableHeader>
          </TableRow>
        </TableHead>
      </Table>
      <Button>{t('products.add')}</Button>
    </PageContainer>
  );
} 