import { useTranslation } from 'react-i18next';
import { PageContainer } from '@/components/PageContainer';
import { Table, TableHead, TableRow, TableHeader } from '@/components/ui/table';
import { Button } from '@/components/ui/button';

export default function BranchesPage() {
  const { t } = useTranslation();

  return (
    <PageContainer title={t('branches.title')} description={t('branches.description')}>
      <Table>
        <TableHead>
          <TableRow>
            <TableHeader>{t('branches.table.name')}</TableHeader>
            <TableHeader>{t('branches.table.code')}</TableHeader>
            <TableHeader>{t('branches.table.manager')}</TableHeader>
            <TableHeader>{t('branches.table.status')}</TableHeader>
            <TableHeader>{t('branches.table.actions')}</TableHeader>
          </TableRow>
        </TableHead>
      </Table>
      <Button>{t('branches.add')}</Button>
    </PageContainer>
  );
} 