import { useSnackbar } from 'notistack';

export function RepairAssignTab({ repair, onUpdate }: RepairAssignTabProps) {
  const { enqueueSnackbar } = useSnackbar();

  const handleAssignRepair = async (data: AssignRepairRequest) => {
    try {
      if (!data.userId) {
        enqueueSnackbar('Kullanıcı gereklidir', { 
          variant: 'error',
          anchorOrigin: { vertical: 'top', horizontal: 'right' }
        });
        return;
      }

      const response = await assignRepair(repair._id, data);
      if (response.success) {
        enqueueSnackbar('Tamir kaydı atandı', { 
          variant: 'success',
          anchorOrigin: { vertical: 'top', horizontal: 'right' }
        });
        onUpdate();
      } else {
        enqueueSnackbar('Tamir kaydı atanamadı', { 
          variant: 'error',
          anchorOrigin: { vertical: 'top', horizontal: 'right' }
        });
      }
    } catch (error) {
      console.error('Error assigning repair:', error);
      enqueueSnackbar('Tamir kaydı atanamadı', { 
        variant: 'error',
        anchorOrigin: { vertical: 'top', horizontal: 'right' }
      });
    }
  };
} 