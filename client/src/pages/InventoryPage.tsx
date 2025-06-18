import { useTranslation } from 'react-i18next';
import { PageContainer } from '@/components/PageContainer';
import { Table, TableHead, TableRow, TableHeader } from '@/components/ui/table';
import { Button } from '@/components/ui/button';

export default function InventoryPage() {
  const { t } = useTranslation();

  return (
    <PageContainer title={t('inventory.title')} description={t('inventory.description')}>
      <Table>
        <TableHead>
          <TableRow>
            <TableHeader>{t('inventory.table.part')}</TableHeader>
            <TableHeader>{t('inventory.table.stock')}</TableHeader>
            <TableHeader>{t('inventory.table.minStockLevel')}</TableHeader>
            <TableHeader>{t('inventory.table.actions')}</TableHeader>
          </TableRow>
        </TableHead>
      </Table>
      <Button>{t('inventory.addPart')}</Button>
    </PageContainer>
  );
} 