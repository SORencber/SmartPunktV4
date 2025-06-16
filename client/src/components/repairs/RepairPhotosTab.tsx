import { useSnackbar } from 'notistack';

export function RepairPhotosTab({ repair, onUpdate }: RepairPhotosTabProps) {
  const { enqueueSnackbar } = useSnackbar();

  const handleUploadPhoto = async (file: File) => {
    try {
      if (!file) {
        enqueueSnackbar('Fotoğraf gereklidir', { 
          variant: 'error',
          anchorOrigin: { vertical: 'top', horizontal: 'right' }
        });
        return;
      }

      const response = await uploadPhoto(repair._id, file);
      if (response.success) {
        enqueueSnackbar('Fotoğraf yüklendi', { 
          variant: 'success',
          anchorOrigin: { vertical: 'top', horizontal: 'right' }
        });
        onUpdate();
      } else {
        enqueueSnackbar('Fotoğraf yüklenemedi', { 
          variant: 'error',
          anchorOrigin: { vertical: 'top', horizontal: 'right' }
        });
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      enqueueSnackbar('Fotoğraf yüklenemedi', { 
        variant: 'error',
        anchorOrigin: { vertical: 'top', horizontal: 'right' }
      });
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    try {
      const response = await deletePhoto(repair._id, photoId);
      if (response.success) {
        enqueueSnackbar('Fotoğraf silindi', { 
          variant: 'success',
          anchorOrigin: { vertical: 'top', horizontal: 'right' }
        });
        onUpdate();
      } else {
        enqueueSnackbar('Fotoğraf silinemedi', { 
          variant: 'error',
          anchorOrigin: { vertical: 'top', horizontal: 'right' }
        });
      }
    } catch (error) {
      console.error('Error deleting photo:', error);
      enqueueSnackbar('Fotoğraf silinemedi', { 
        variant: 'error',
        anchorOrigin: { vertical: 'top', horizontal: 'right' }
      });
    }
  };
} 