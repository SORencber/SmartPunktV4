import { useSnackbar } from 'notistack';

export function RepairNotesTab({ repair, onUpdate }: RepairNotesTabProps) {
  const { enqueueSnackbar } = useSnackbar();

  const handleAddNote = async (content: string) => {
    try {
      if (!content.trim()) {
        enqueueSnackbar('Not içeriği gereklidir', { 
          variant: 'error',
          anchorOrigin: { vertical: 'top', horizontal: 'right' }
        });
        return;
      }

      const response = await addNote(repair._id, content);
      if (response.success) {
        enqueueSnackbar('Not eklendi', { 
          variant: 'success',
          anchorOrigin: { vertical: 'top', horizontal: 'right' }
        });
        onUpdate();
      } else {
        enqueueSnackbar('Not eklenemedi', { 
          variant: 'error',
          anchorOrigin: { vertical: 'top', horizontal: 'right' }
        });
      }
    } catch (error) {
      console.error('Error adding note:', error);
      enqueueSnackbar('Not eklenemedi', { 
        variant: 'error',
        anchorOrigin: { vertical: 'top', horizontal: 'right' }
      });
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      const response = await deleteNote(repair._id, noteId);
      if (response.success) {
        enqueueSnackbar('Not silindi', { 
          variant: 'success',
          anchorOrigin: { vertical: 'top', horizontal: 'right' }
        });
        onUpdate();
      } else {
        enqueueSnackbar('Not silinemedi', { 
          variant: 'error',
          anchorOrigin: { vertical: 'top', horizontal: 'right' }
        });
      }
    } catch (error) {
      console.error('Error deleting note:', error);
      enqueueSnackbar('Not silinemedi', { 
        variant: 'error',
        anchorOrigin: { vertical: 'top', horizontal: 'right' }
      });
    }
  };
} 