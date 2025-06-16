import { useSnackbar } from 'notistack';

export function RepairTimelineTab({ repair, onUpdate }: RepairTimelineTabProps) {
  const { enqueueSnackbar } = useSnackbar();

  const handleAddEvent = async (data: AddEventRequest) => {
    try {
      if (!data.type || !data.description) {
        enqueueSnackbar('Olay türü ve açıklaması gereklidir', { 
          variant: 'error',
          anchorOrigin: { vertical: 'top', horizontal: 'right' }
        });
        return;
      }

      const response = await addEvent(repair._id, data);
      if (response.success) {
        enqueueSnackbar('Olay eklendi', { 
          variant: 'success',
          anchorOrigin: { vertical: 'top', horizontal: 'right' }
        });
        onUpdate();
      } else {
        enqueueSnackbar('Olay eklenemedi', { 
          variant: 'error',
          anchorOrigin: { vertical: 'top', horizontal: 'right' }
        });
      }
    } catch (error) {
      console.error('Error adding event:', error);
      enqueueSnackbar('Olay eklenemedi', { 
        variant: 'error',
        anchorOrigin: { vertical: 'top', horizontal: 'right' }
      });
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      const response = await deleteEvent(repair._id, eventId);
      if (response.success) {
        enqueueSnackbar('Olay silindi', { 
          variant: 'success',
          anchorOrigin: { vertical: 'top', horizontal: 'right' }
        });
        onUpdate();
      } else {
        enqueueSnackbar('Olay silinemedi', { 
          variant: 'error',
          anchorOrigin: { vertical: 'top', horizontal: 'right' }
        });
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      enqueueSnackbar('Olay silinemedi', { 
        variant: 'error',
        anchorOrigin: { vertical: 'top', horizontal: 'right' }
      });
    }
  };
} 