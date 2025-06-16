import { useSnackbar } from 'notistack';

export function RepairReopenTab({ repair, onUpdate }: RepairReopenTabProps) {
  const { enqueueSnackbar } = useSnackbar();

  const handleReopenRepair = async () => {
    try {
      const response = await reopenRepair(repair._id);
      if (response.success) {
        enqueueSnackbar('Tamir kaydı yeniden açıldı', { 
          variant: 'success',
          anchorOrigin: { vertical: 'top', horizontal: 'right' }
        });
        onUpdate();
      } else {
        enqueueSnackbar('Tamir kaydı yeniden açılamadı', { 
          variant: 'error',
          anchorOrigin: { vertical: 'top', horizontal: 'right' }
        });
      }
    } catch (error) {
      console.error('Error reopening repair:', error);
      enqueueSnackbar('Tamir kaydı yeniden açılamadı', { 
        variant: 'error',
        anchorOrigin: { vertical: 'top', horizontal: 'right' }
      });
    }
  };

  // ... existing code ...
} 