import { useSnackbar } from 'notistack';

export function RepairDuplicateTab({ repair, onUpdate }: RepairDuplicateTabProps) {
  const { enqueueSnackbar } = useSnackbar();

  const handleDuplicateRepair = async () => {
    try {
      const response = await duplicateRepair(repair._id);
      if (response.success) {
        enqueueSnackbar('Tamir kaydı kopyalandı', { 
          variant: 'success',
          anchorOrigin: { vertical: 'top', horizontal: 'right' }
        });
        onUpdate();
      } else {
        enqueueSnackbar('Tamir kaydı kopyalanamadı', { 
          variant: 'error',
          anchorOrigin: { vertical: 'top', horizontal: 'right' }
        });
      }
    } catch (error) {
      console.error('Error duplicating repair:', error);
      enqueueSnackbar('Tamir kaydı kopyalanamadı', { 
        variant: 'error',
        anchorOrigin: { vertical: 'top', horizontal: 'right' }
      });
    }
  };
} 