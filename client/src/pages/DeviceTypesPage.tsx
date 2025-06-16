import { useSnackbar } from 'notistack';

export default function DeviceTypesPage() {
  const { enqueueSnackbar } = useSnackbar();

  const handleCreateDeviceType = async (data: CreateDeviceTypeRequest) => {
    try {
      if (!data.name) {
        enqueueSnackbar('Cihaz türü adı gereklidir', { 
          variant: 'error',
          anchorOrigin: { vertical: 'top', horizontal: 'right' }
        });
        return;
      }

      const response = await createDeviceType(data);
      if (response.success) {
        enqueueSnackbar('Cihaz türü oluşturuldu', { 
          variant: 'success',
          anchorOrigin: { vertical: 'top', horizontal: 'right' }
        });
        await loadDeviceTypes();
      } else {
        enqueueSnackbar('Cihaz türü oluşturulamadı', { 
          variant: 'error',
          anchorOrigin: { vertical: 'top', horizontal: 'right' }
        });
      }
    } catch (error) {
      console.error('Error creating device type:', error);
      enqueueSnackbar('Cihaz türü oluşturulamadı', { 
        variant: 'error',
        anchorOrigin: { vertical: 'top', horizontal: 'right' }
      });
    }
  };

  const handleUpdateDeviceType = async (id: string, data: UpdateDeviceTypeRequest) => {
    try {
      if (!data.name) {
        enqueueSnackbar('Cihaz türü adı gereklidir', { 
          variant: 'error',
          anchorOrigin: { vertical: 'top', horizontal: 'right' }
        });
        return;
      }

      const response = await updateDeviceType(id, data);
      if (response.success) {
        enqueueSnackbar('Cihaz türü güncellendi', { 
          variant: 'success',
          anchorOrigin: { vertical: 'top', horizontal: 'right' }
        });
        await loadDeviceTypes();
      } else {
        enqueueSnackbar('Cihaz türü güncellenemedi', { 
          variant: 'error',
          anchorOrigin: { vertical: 'top', horizontal: 'right' }
        });
      }
    } catch (error) {
      console.error('Error updating device type:', error);
      enqueueSnackbar('Cihaz türü güncellenemedi', { 
        variant: 'error',
        anchorOrigin: { vertical: 'top', horizontal: 'right' }
      });
    }
  };

  const handleDeleteDeviceType = async (id: string) => {
    try {
      const response = await deleteDeviceType(id);
      if (response.success) {
        enqueueSnackbar('Cihaz türü silindi', { 
          variant: 'success',
          anchorOrigin: { vertical: 'top', horizontal: 'right' }
        });
        await loadDeviceTypes();
      } else {
        enqueueSnackbar('Cihaz türü silinemedi', { 
          variant: 'error',
          anchorOrigin: { vertical: 'top', horizontal: 'right' }
        });
      }
    } catch (error) {
      console.error('Error deleting device type:', error);
      enqueueSnackbar('Cihaz türü silinemedi', { 
        variant: 'error',
        anchorOrigin: { vertical: 'top', horizontal: 'right' }
      });
    }
  };
} 