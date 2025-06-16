import { useSnackbar } from 'notistack';

export function RepairCompleteTab({ repair, onUpdate }: RepairCompleteTabProps) {
  const { enqueueSnackbar } = useSnackbar();

  const handleCompleteRepair = async () => {
    try {
      const response = await completeRepair(repair._id);
      if (response.success) {
        enqueueSnackbar('Tamir kaydı tamamlandı', { 
          variant: 'success',
          anchorOrigin: { vertical: 'top', horizontal: 'right' }
        });
        onUpdate();
      } else {
        enqueueSnackbar('Tamir kaydı tamamlanamadı', { 
          variant: 'error',
          anchorOrigin: { vertical: 'top', horizontal: 'right' }
        });
      }
    } catch (error) {
      console.error('Error completing repair:', error);
      enqueueSnackbar('Tamir kaydı tamamlanamadı', { 
        variant: 'error',
        anchorOrigin: { vertical: 'top', horizontal: 'right' }
      });
    }
  };

  // ... existing code ...
} 