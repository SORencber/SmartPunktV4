import { useSnackbar } from 'notistack';

export function RepairReassignTab({ repair, onUpdate }: RepairReassignTabProps) {
  const { enqueueSnackbar } = useSnackbar();

  const handleReassignRepair = async (data: ReassignRepairRequest) => {
    try {
      if (!data.userId) {
        enqueueSnackbar('Kullanıcı gereklidir', { 
          variant: 'error',
          anchorOrigin: { vertical: 'top', horizontal: 'right' }
        });
        return;
      }

      const response = await reassignRepair(repair._id, data);
      if (response.success) {
        enqueueSnackbar('Tamir kaydı yeniden atandı', { 
          variant: 'success',
          anchorOrigin: { vertical: 'top', horizontal: 'right' }
        });
        onUpdate();
      } else {
        enqueueSnackbar('Tamir kaydı yeniden atanamadı', { 
          variant: 'error',
          anchorOrigin: { vertical: 'top', horizontal: 'right' }
        });
      }
    } catch (error) {
      console.error('Error reassigning repair:', error);
      enqueueSnackbar('Tamir kaydı yeniden atanamadı', { 
        variant: 'error',
        anchorOrigin: { vertical: 'top', horizontal: 'right' }
      });
    }
  };
} 