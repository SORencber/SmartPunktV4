import { useSnackbar } from 'notistack';

export function RepairSummaryTab({ repair, onUpdate }: RepairSummaryTabProps) {
  const { enqueueSnackbar } = useSnackbar();

  const handleUpdateSummary = async (data: UpdateRepairRequest) => {
    try {
      if (!data.summary) {
        enqueueSnackbar('Özet gereklidir', { 
          variant: 'error',
          anchorOrigin: { vertical: 'top', horizontal: 'right' }
        });
        return;
      }

      const response = await updateRepair(repair._id, data);
      if (response.success) {
        enqueueSnackbar('Özet güncellendi', { 
          variant: 'success',
          anchorOrigin: { vertical: 'top', horizontal: 'right' }
        });
        onUpdate();
      } else {
        enqueueSnackbar('Özet güncellenemedi', { 
          variant: 'error',
          anchorOrigin: { vertical: 'top', horizontal: 'right' }
        });
      }
    } catch (error) {
      console.error('Error updating summary:', error);
      enqueueSnackbar('Özet güncellenemedi', { 
        variant: 'error',
        anchorOrigin: { vertical: 'top', horizontal: 'right' }
      });
    }
  };
} 