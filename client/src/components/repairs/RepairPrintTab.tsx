import { useSnackbar } from 'notistack';

export function RepairPrintTab({ repair, onUpdate }: RepairPrintTabProps) {
  const { enqueueSnackbar } = useSnackbar();

  const handlePrintRepair = async () => {
    try {
      const response = await printRepair(repair._id);
      if (response.success) {
        enqueueSnackbar('Tamir kaydı yazdırıldı', { 
          variant: 'success',
          anchorOrigin: { vertical: 'top', horizontal: 'right' }
        });
        onUpdate();
      } else {
        enqueueSnackbar('Tamir kaydı yazdırılamadı', { 
          variant: 'error',
          anchorOrigin: { vertical: 'top', horizontal: 'right' }
        });
      }
    } catch (error) {
      console.error('Error printing repair:', error);
      enqueueSnackbar('Tamir kaydı yazdırılamadı', { 
        variant: 'error',
        anchorOrigin: { vertical: 'top', horizontal: 'right' }
      });
    }
  };

  // ... existing code ...
} 