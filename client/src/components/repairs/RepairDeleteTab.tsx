import { useSnackbar } from 'notistack';

export function RepairDeleteTab({ repair, onUpdate }: RepairDeleteTabProps) {
  const { enqueueSnackbar } = useSnackbar();

  const handleDeleteRepair = async () => {
    try {
      const response = await deleteRepair(repair._id);
      if (response.success) {
        enqueueSnackbar('Tamir kaydı silindi', { 
          variant: 'success',
          anchorOrigin: { vertical: 'top', horizontal: 'right' }
        });
        onUpdate();
      } else {
        enqueueSnackbar('Tamir kaydı silinemedi', { 
          variant: 'error',
          anchorOrigin: { vertical: 'top', horizontal: 'right' }
        });
      }
    } catch (error) {
      console.error('Error deleting repair:', error);
      enqueueSnackbar('Tamir kaydı silinemedi', { 
        variant: 'error',
        anchorOrigin: { vertical: 'top', horizontal: 'right' }
      });
    }
  };

  // ... existing code ...
} 