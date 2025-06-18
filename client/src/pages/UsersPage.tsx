import { useTranslation } from 'react-i18next';
import { PageContainer } from '@/components/PageContainer';
import { Table, TableHead, TableRow, TableHeader } from '@/components/ui/table';
import { Button } from '@/components/ui/button';

export default function UsersPage() {
  const { t } = useTranslation();

  return (
    <PageContainer title={t('users.title')} description={t('users.description')}>
      <Table>
        <TableHead>
          <TableRow>
            <TableHeader>{t('users.table.name')}</TableHeader>
            <TableHeader>{t('users.table.email')}</TableHeader>
            <TableHeader>{t('users.table.role')}</TableHeader>
            <TableHeader>{t('users.table.branch')}</TableHeader>
            <TableHeader>{t('users.table.actions')}</TableHeader>
          </TableRow>
        </TableHead>
      </Table>
      <Button>{t('users.add')}</Button>
    </PageContainer>
  );
} 