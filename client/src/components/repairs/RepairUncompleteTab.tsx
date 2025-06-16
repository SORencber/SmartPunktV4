import { useSnackbar } from 'notistack';

export function RepairUncompleteTab({ repair, onUpdate }: RepairUncompleteTabProps) {
  const { enqueueSnackbar } = useSnackbar();

  const handleUncompleteRepair = async () => {
    try {
      const response = await uncompleteRepair(repair._id);
      if (response.success) {
        enqueueSnackbar('Tamir kaydı tamamlanma durumu kaldırıldı', { 
          variant: 'success',
          anchorOrigin: { vertical: 'top', horizontal: 'right' }
        });
        onUpdate();
      } else {
        enqueueSnackbar('Tamir kaydı tamamlanma durumu kaldırılamadı', { 
          variant: 'error',
          anchorOrigin: { vertical: 'top', horizontal: 'right' }
        });
      }
    } catch (error) {
      console.error('Error uncompleting repair:', error);
      enqueueSnackbar('Tamir kaydı tamamlanma durumu kaldırılamadı', { 
        variant: 'error',
        anchorOrigin: { vertical: 'top', horizontal: 'right' }
      });
    }
  };
} 