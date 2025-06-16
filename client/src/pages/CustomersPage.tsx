import { useSnackbar } from 'notistack';

export default function CustomersPage() {
  const { enqueueSnackbar } = useSnackbar();

  const handleCreateCustomer = async (data: CreateCustomerRequest) => {
    try {
      if (!data.name || !data.phone) {
        enqueueSnackbar('Müşteri adı ve telefon numarası gereklidir', { 
          variant: 'error',
          anchorOrigin: { vertical: 'top', horizontal: 'right' }
        });
        return;
      }

      const response = await createCustomer(data);
      if (response.success) {
        enqueueSnackbar('Müşteri oluşturuldu', { 
          variant: 'success',
          anchorOrigin: { vertical: 'top', horizontal: 'right' }
        });
        await loadCustomers();
      } else {
        enqueueSnackbar('Müşteri oluşturulamadı', { 
          variant: 'error',
          anchorOrigin: { vertical: 'top', horizontal: 'right' }
        });
      }
    } catch (error) {
      console.error('Error creating customer:', error);
      enqueueSnackbar('Müşteri oluşturulamadı', { 
        variant: 'error',
        anchorOrigin: { vertical: 'top', horizontal: 'right' }
      });
    }
  };

  const handleUpdateCustomer = async (id: string, data: UpdateCustomerRequest) => {
    try {
      if (!data.name || !data.phone) {
        enqueueSnackbar('Müşteri adı ve telefon numarası gereklidir', { 
          variant: 'error',
          anchorOrigin: { vertical: 'top', horizontal: 'right' }
        });
        return;
      }

      const response = await updateCustomer(id, data);
      if (response.success) {
        enqueueSnackbar('Müşteri güncellendi', { 
          variant: 'success',
          anchorOrigin: { vertical: 'top', horizontal: 'right' }
        });
        await loadCustomers();
      } else {
        enqueueSnackbar('Müşteri güncellenemedi', { 
          variant: 'error',
          anchorOrigin: { vertical: 'top', horizontal: 'right' }
        });
      }
    } catch (error) {
      console.error('Error updating customer:', error);
      enqueueSnackbar('Müşteri güncellenemedi', { 
        variant: 'error',
        anchorOrigin: { vertical: 'top', horizontal: 'right' }
      });
    }
  };

  const handleDeleteCustomer = async (id: string) => {
    try {
      const response = await deleteCustomer(id);
      if (response.success) {
        enqueueSnackbar('Müşteri silindi', { 
          variant: 'success',
          anchorOrigin: { vertical: 'top', horizontal: 'right' }
        });
        await loadCustomers();
      } else {
        enqueueSnackbar('Müşteri silinemedi', { 
          variant: 'error',
          anchorOrigin: { vertical: 'top', horizontal: 'right' }
        });
      }
    } catch (error) {
      console.error('Error deleting customer:', error);
      enqueueSnackbar('Müşteri silinemedi', { 
        variant: 'error',
        anchorOrigin: { vertical: 'top', horizontal: 'right' }
      });
    }
  };
} 