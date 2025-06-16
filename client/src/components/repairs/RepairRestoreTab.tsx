import { useSnackbar } from 'notistack';

export function RepairRestoreTab({ repair, onUpdate }: RepairRestoreTabProps) {
  const { enqueueSnackbar } = useSnackbar();

  const handleRestoreRepair = async () => {
    try {
      const response = await restoreRepair(repair._id);
      if (response.success) {
        enqueueSnackbar('Tamir kaydı geri yüklendi', { 
          variant: 'success',
          anchorOrigin: { vertical: 'top', horizontal: 'right' }
        });
        onUpdate();
      } else {
        enqueueSnackbar('Tamir kaydı geri yüklenemedi', { 
          variant: 'error',
          anchorOrigin: { vertical: 'top', horizontal: 'right' }
        });
      }
    } catch (error) {
      console.error('Error restoring repair:', error);
      enqueueSnackbar('Tamir kaydı geri yüklenemedi', { 
        variant: 'error',
        anchorOrigin: { vertical: 'top', horizontal: 'right' }
      });
    }
  };

  // ... existing code ...
} 