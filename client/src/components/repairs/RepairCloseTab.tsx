import { useSnackbar } from 'notistack';

export function RepairCloseTab({ repair, onUpdate }: RepairCloseTabProps) {
  const { enqueueSnackbar } = useSnackbar();

  const handleCloseRepair = async () => {
    try {
      const response = await closeRepair(repair._id);
      if (response.success) {
        enqueueSnackbar('Tamir kaydı kapatıldı', { 
          variant: 'success',
          anchorOrigin: { vertical: 'top', horizontal: 'right' }
        });
        onUpdate();
      } else {
        enqueueSnackbar('Tamir kaydı kapatılamadı', { 
          variant: 'error',
          anchorOrigin: { vertical: 'top', horizontal: 'right' }
        });
      }
    } catch (error) {
      console.error('Error closing repair:', error);
      enqueueSnackbar('Tamir kaydı kapatılamadı', { 
        variant: 'error',
        anchorOrigin: { vertical: 'top', horizontal: 'right' }
      });
    }
  };
} 