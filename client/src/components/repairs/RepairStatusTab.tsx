import { useSnackbar } from 'notistack';

export function RepairStatusTab({ repair, onUpdate }: RepairStatusTabProps) {
  const { enqueueSnackbar } = useSnackbar();

  const handleUpdateStatus = async (status: RepairStatus) => {
    try {
      const response = await updateRepairStatus(repair._id, status);
      if (response.success) {
        enqueueSnackbar('Durum güncellendi', { 
          variant: 'success',
          anchorOrigin: { vertical: 'top', horizontal: 'right' }
        });
        onUpdate();
      } else {
        enqueueSnackbar('Durum güncellenemedi', { 
          variant: 'error',
          anchorOrigin: { vertical: 'top', horizontal: 'right' }
        });
      }
    } catch (error) {
      console.error('Error updating status:', error);
      enqueueSnackbar('Durum güncellenemedi', { 
        variant: 'error',
        anchorOrigin: { vertical: 'top', horizontal: 'right' }
      });
    }
  };

  // ... existing code ...
} 