import { useSnackbar } from 'notistack';

export default function PartsPage() {
  const { enqueueSnackbar } = useSnackbar();

  const handleCreatePart = async (data: CreatePartRequest) => {
    try {
      if (!data.name || !data.price) {
        enqueueSnackbar('Parça adı ve fiyatı gereklidir', { 
          variant: 'error',
          anchorOrigin: { vertical: 'top', horizontal: 'right' }
        });
        return;
      }

      const response = await createPart(data);
      if (response.success) {
        enqueueSnackbar('Parça oluşturuldu', { 
          variant: 'success',
          anchorOrigin: { vertical: 'top', horizontal: 'right' }
        });
        await loadParts();
      } else {
        enqueueSnackbar('Parça oluşturulamadı', { 
          variant: 'error',
          anchorOrigin: { vertical: 'top', horizontal: 'right' }
        });
      }
    } catch (error) {
      console.error('Error creating part:', error);
      enqueueSnackbar('Parça oluşturulamadı', { 
        variant: 'error',
        anchorOrigin: { vertical: 'top', horizontal: 'right' }
      });
    }
  };

  const handleUpdatePart = async (id: string, data: UpdatePartRequest) => {
    try {
      if (!data.name || !data.price) {
        enqueueSnackbar('Parça adı ve fiyatı gereklidir', { 
          variant: 'error',
          anchorOrigin: { vertical: 'top', horizontal: 'right' }
        });
        return;
      }

      const response = await updatePart(id, data);
      if (response.success) {
        enqueueSnackbar('Parça güncellendi', { 
          variant: 'success',
          anchorOrigin: { vertical: 'top', horizontal: 'right' }
        });
        await loadParts();
      } else {
        enqueueSnackbar('Parça güncellenemedi', { 
          variant: 'error',
          anchorOrigin: { vertical: 'top', horizontal: 'right' }
        });
      }
    } catch (error) {
      console.error('Error updating part:', error);
      enqueueSnackbar('Parça güncellenemedi', { 
        variant: 'error',
        anchorOrigin: { vertical: 'top', horizontal: 'right' }
      });
    }
  };

  const handleDeletePart = async (id: string) => {
    try {
      const response = await deletePart(id);
      if (response.success) {
        enqueueSnackbar('Parça silindi', { 
          variant: 'success',
          anchorOrigin: { vertical: 'top', horizontal: 'right' }
        });
        await loadParts();
      } else {
        enqueueSnackbar('Parça silinemedi', { 
          variant: 'error',
          anchorOrigin: { vertical: 'top', horizontal: 'right' }
        });
      }
    } catch (error) {
      console.error('Error deleting part:', error);
      enqueueSnackbar('Parça silinemedi', { 
        variant: 'error',
        anchorOrigin: { vertical: 'top', horizontal: 'right' }
      });
    }
  };
} 