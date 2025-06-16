import { useSnackbar } from 'notistack';

export function RepairArchiveTab({ repair, onUpdate }: RepairArchiveTabProps) {
  const { enqueueSnackbar } = useSnackbar();

  const handleArchiveRepair = async () => {
    try {
      const response = await archiveRepair(repair._id);
      if (response.success) {
        enqueueSnackbar('Tamir kaydı arşivlendi', { 
          variant: 'success',
          anchorOrigin: { vertical: 'top', horizontal: 'right' }
        });
        onUpdate();
      } else {
        enqueueSnackbar('Tamir kaydı arşivlenemedi', { 
          variant: 'error',
          anchorOrigin: { vertical: 'top', horizontal: 'right' }
        });
      }
    } catch (error) {
      console.error('Error archiving repair:', error);
      enqueueSnackbar('Tamir kaydı arşivlenemedi', { 
        variant: 'error',
        anchorOrigin: { vertical: 'top', horizontal: 'right' }
      });
    }
  };

  const handleUnarchiveRepair = async () => {
    try {
      const response = await unarchiveRepair(repair._id);
      if (response.success) {
        enqueueSnackbar('Tamir kaydı arşivden çıkarıldı', { 
          variant: 'success',
          anchorOrigin: { vertical: 'top', horizontal: 'right' }
        });
        onUpdate();
      } else {
        enqueueSnackbar('Tamir kaydı arşivden çıkarılamadı', { 
          variant: 'error',
          anchorOrigin: { vertical: 'top', horizontal: 'right' }
        });
      }
    } catch (error) {
      console.error('Error unarchiving repair:', error);
      enqueueSnackbar('Tamir kaydı arşivden çıkarılamadı', { 
        variant: 'error',
        anchorOrigin: { vertical: 'top', horizontal: 'right' }
      });
    }
  };
} 