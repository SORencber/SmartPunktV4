import { useSnackbar } from 'notistack';

export function RepairExportTab({ repair, onUpdate }: RepairExportTabProps) {
  const { enqueueSnackbar } = useSnackbar();

  const handleExportRepair = async () => {
    try {
      const response = await exportRepair(repair._id);
      if (response.success) {
        enqueueSnackbar('Tamir kaydı dışa aktarıldı', { 
          variant: 'success',
          anchorOrigin: { vertical: 'top', horizontal: 'right' }
        });
        onUpdate();
      } else {
        enqueueSnackbar('Tamir kaydı dışa aktarılamadı', { 
          variant: 'error',
          anchorOrigin: { vertical: 'top', horizontal: 'right' }
        });
      }
    } catch (error) {
      console.error('Error exporting repair:', error);
      enqueueSnackbar('Tamir kaydı dışa aktarılamadı', { 
        variant: 'error',
        anchorOrigin: { vertical: 'top', horizontal: 'right' }
      });
    }
  };

  // ... existing code ...
} 