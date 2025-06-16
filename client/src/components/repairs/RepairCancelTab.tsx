import { useSnackbar } from 'notistack';

export function RepairCancelTab({ repair, onUpdate }: RepairCancelTabProps) {
  const { enqueueSnackbar } = useSnackbar();

  const handleCancelRepair = async () => {
    try {
      const response = await cancelRepair(repair._id);
      if (response.success) {
        enqueueSnackbar('Tamir kaydı iptal edildi', { 
          variant: 'success',
          anchorOrigin: { vertical: 'top', horizontal: 'right' }
        });
        onUpdate();
      } else {
        enqueueSnackbar('Tamir kaydı iptal edilemedi', { 
          variant: 'error',
          anchorOrigin: { vertical: 'top', horizontal: 'right' }
        });
      }
    } catch (error) {
      console.error('Error canceling repair:', error);
      enqueueSnackbar('Tamir kaydı iptal edilemedi', { 
        variant: 'error',
        anchorOrigin: { vertical: 'top', horizontal: 'right' }
      });
    }
  };
} 