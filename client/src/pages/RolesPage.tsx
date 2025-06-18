import { useTranslation } from 'react-i18next';
import { PageContainer } from '@/components/PageContainer';
import { Table, TableHead, TableRow, TableHeader } from '@/components/ui/table';
import { Button } from '@/components/ui/button';

export default function RolesPage() {
  const { t } = useTranslation();

  return (
    <PageContainer title={t('roles.title')} description={t('roles.description')}>
      <Table>
        <TableHead>
          <TableRow>
            <TableHeader>{t('roles.table.name')}</TableHeader>
            <TableHeader>{t('roles.table.permissions')}</TableHeader>
            <TableHeader>{t('roles.table.actions')}</TableHeader>
          </TableRow>
        </TableHead>
      </Table>
      <Button>{t('roles.add')}</Button>
    </PageContainer>
  );
} 