import { useSnackbar } from 'notistack';

export function RepairImportTab({ repair, onUpdate }: RepairImportTabProps) {
  const { enqueueSnackbar } = useSnackbar();

  const handleImportRepair = async (file: File) => {
    try {
      if (!file) {
        enqueueSnackbar('Dosya gereklidir', { 
          variant: 'error',
          anchorOrigin: { vertical: 'top', horizontal: 'right' }
        });
        return;
      }

      const response = await importRepair(repair._id, file);
      if (response.success) {
        enqueueSnackbar('Tamir kaydı içe aktarıldı', { 
          variant: 'success',
          anchorOrigin: { vertical: 'top', horizontal: 'right' }
        });
        onUpdate();
      } else {
        enqueueSnackbar('Tamir kaydı içe aktarılamadı', { 
          variant: 'error',
          anchorOrigin: { vertical: 'top', horizontal: 'right' }
        });
      }
    } catch (error) {
      console.error('Error importing repair:', error);
      enqueueSnackbar('Tamir kaydı içe aktarılamadı', { 
        variant: 'error',
        anchorOrigin: { vertical: 'top', horizontal: 'right' }
      });
    }
  };
} 