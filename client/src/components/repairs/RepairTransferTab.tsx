import { useSnackbar } from 'notistack';

export function RepairTransferTab({ repair, onUpdate }: RepairTransferTabProps) {
  const { enqueueSnackbar } = useSnackbar();

  const handleTransferRepair = async (data: TransferRepairRequest) => {
    try {
      if (!data.targetUserId) {
        enqueueSnackbar('Hedef kullanıcı gereklidir', { 
          variant: 'error',
          anchorOrigin: { vertical: 'top', horizontal: 'right' }
        });
        return;
      }

      const response = await transferRepair(repair._id, data);
      if (response.success) {
        enqueueSnackbar('Tamir kaydı devredildi', { 
          variant: 'success',
          anchorOrigin: { vertical: 'top', horizontal: 'right' }
        });
        onUpdate();
      } else {
        enqueueSnackbar('Tamir kaydı devredilemedi', { 
          variant: 'error',
          anchorOrigin: { vertical: 'top', horizontal: 'right' }
        });
      }
    } catch (error) {
      console.error('Error transferring repair:', error);
      enqueueSnackbar('Tamir kaydı devredilemedi', { 
        variant: 'error',
        anchorOrigin: { vertical: 'top', horizontal: 'right' }
      });
    }
  };
} 