import { useSnackbar } from 'notistack';

export function RepairDeviceTab({ repair, onUpdate }: RepairDeviceTabProps) {
  const { enqueueSnackbar } = useSnackbar();

  const handleUpdateDevice = async (data: UpdateRepairRequest) => {
    try {
      if (!data.deviceTypeId || !data.brandId || !data.modelId) {
        enqueueSnackbar('Cihaz türü, marka ve model gereklidir', { 
          variant: 'error',
          anchorOrigin: { vertical: 'top', horizontal: 'right' }
        });
        return;
      }

      const response = await updateRepair(repair._id, data);
      if (response.success) {
        enqueueSnackbar('Cihaz bilgileri güncellendi', { 
          variant: 'success',
          anchorOrigin: { vertical: 'top', horizontal: 'right' }
        });
        onUpdate();
      } else {
        enqueueSnackbar('Cihaz bilgileri güncellenemedi', { 
          variant: 'error',
          anchorOrigin: { vertical: 'top', horizontal: 'right' }
        });
      }
    } catch (error) {
      console.error('Error updating device:', error);
      enqueueSnackbar('Cihaz bilgileri güncellenemedi', { 
        variant: 'error',
        anchorOrigin: { vertical: 'top', horizontal: 'right' }
      });
    }
  };
} 