import { useSnackbar } from 'notistack';

export function RepairCostTab({ repair, onUpdate }: RepairCostTabProps) {
  const { enqueueSnackbar } = useSnackbar();

  const handleUpdateCost = async (data: UpdateRepairRequest) => {
    try {
      if (data.laborCost === undefined || data.laborCost < 0) {
        enqueueSnackbar('İşçilik ücreti geçerli bir değer olmalıdır', { 
          variant: 'error',
          anchorOrigin: { vertical: 'top', horizontal: 'right' }
        });
        return;
      }

      const response = await updateRepair(repair._id, data);
      if (response.success) {
        enqueueSnackbar('Ücret bilgileri güncellendi', { 
          variant: 'success',
          anchorOrigin: { vertical: 'top', horizontal: 'right' }
        });
        onUpdate();
      } else {
        enqueueSnackbar('Ücret bilgileri güncellenemedi', { 
          variant: 'error',
          anchorOrigin: { vertical: 'top', horizontal: 'right' }
        });
      }
    } catch (error) {
      console.error('Error updating cost:', error);
      enqueueSnackbar('Ücret bilgileri güncellenemedi', { 
        variant: 'error',
        anchorOrigin: { vertical: 'top', horizontal: 'right' }
      });
    }
  };
} 