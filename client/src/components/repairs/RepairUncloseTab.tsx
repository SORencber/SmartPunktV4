import { useSnackbar } from 'notistack';

export function RepairUncloseTab({ repair, onUpdate }: RepairUncloseTabProps) {
  const { enqueueSnackbar } = useSnackbar();

  const handleUncloseRepair = async () => {
    try {
      const response = await uncloseRepair(repair._id);
      if (response.success) {
        enqueueSnackbar('Tamir kaydı kapatma durumu kaldırıldı', { 
          variant: 'success',
          anchorOrigin: { vertical: 'top', horizontal: 'right' }
        });
        onUpdate();
      } else {
        enqueueSnackbar('Tamir kaydı kapatma durumu kaldırılamadı', { 
          variant: 'error',
          anchorOrigin: { vertical: 'top', horizontal: 'right' }
        });
      }
    } catch (error) {
      console.error('Error unclosing repair:', error);
      enqueueSnackbar('Tamir kaydı kapatma durumu kaldırılamadı', { 
        variant: 'error',
        anchorOrigin: { vertical: 'top', horizontal: 'right' }
      });
    }
  };
} 