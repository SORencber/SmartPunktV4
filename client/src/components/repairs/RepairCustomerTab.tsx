import { useSnackbar } from 'notistack';

export function RepairCustomerTab({ repair, onUpdate }: RepairCustomerTabProps) {
  const { enqueueSnackbar } = useSnackbar();

  const handleUpdateCustomer = async (data: UpdateRepairRequest) => {
    try {
      if (!data.customerId) {
        enqueueSnackbar('Müşteri gereklidir', { 
          variant: 'error',
          anchorOrigin: { vertical: 'top', horizontal: 'right' }
        });
        return;
      }

      const response = await updateRepair(repair._id, data);
      if (response.success) {
        enqueueSnackbar('Müşteri güncellendi', { 
          variant: 'success',
          anchorOrigin: { vertical: 'top', horizontal: 'right' }
        });
        onUpdate();
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
} 