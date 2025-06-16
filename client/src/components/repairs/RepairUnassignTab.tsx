import { useSnackbar } from 'notistack';

export function RepairUnassignTab({ repair, onUpdate }: RepairUnassignTabProps) {
  const { enqueueSnackbar } = useSnackbar();

  const handleUnassignRepair = async () => {
    try {
      const response = await unassignRepair(repair._id);
      if (response.success) {
        enqueueSnackbar('Tamir kaydı ataması kaldırıldı', { 
          variant: 'success',
          anchorOrigin: { vertical: 'top', horizontal: 'right' }
        });
        onUpdate();
      } else {
        enqueueSnackbar('Tamir kaydı ataması kaldırılamadı', { 
          variant: 'error',
          anchorOrigin: { vertical: 'top', horizontal: 'right' }
        });
      }
    } catch (error) {
      console.error('Error unassigning repair:', error);
      enqueueSnackbar('Tamir kaydı ataması kaldırılamadı', { 
        variant: 'error',
        anchorOrigin: { vertical: 'top', horizontal: 'right' }
      });
    }
  };

  // ... existing code ...
} 