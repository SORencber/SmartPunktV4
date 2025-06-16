import { useSnackbar } from 'notistack';

export function RepairUncancelTab({ repair, onUpdate }: RepairUncancelTabProps) {
  const { enqueueSnackbar } = useSnackbar();

  const handleUncancelRepair = async () => {
    try {
      const response = await uncancelRepair(repair._id);
      if (response.success) {
        enqueueSnackbar('Tamir kaydı iptali kaldırıldı', { 
          variant: 'success',
          anchorOrigin: { vertical: 'top', horizontal: 'right' }
        });
        onUpdate();
      } else {
        enqueueSnackbar('Tamir kaydı iptali kaldırılamadı', { 
          variant: 'error',
          anchorOrigin: { vertical: 'top', horizontal: 'right' }
        });
      }
    } catch (error) {
      console.error('Error uncanceling repair:', error);
      enqueueSnackbar('Tamir kaydı iptali kaldırılamadı', { 
        variant: 'error',
        anchorOrigin: { vertical: 'top', horizontal: 'right' }
      });
    }
  };

  // ... existing code ...
} 