import { useSnackbar } from 'notistack';

export function RepairDiagnosisTab({ repair, onUpdate }: RepairDiagnosisTabProps) {
  const { enqueueSnackbar } = useSnackbar();

  const handleUpdateDiagnosis = async (data: UpdateRepairRequest) => {
    try {
      if (!data.diagnosis) {
        enqueueSnackbar('Teşhis gereklidir', { 
          variant: 'error',
          anchorOrigin: { vertical: 'top', horizontal: 'right' }
        });
        return;
      }

      const response = await updateRepair(repair._id, data);
      if (response.success) {
        enqueueSnackbar('Teşhis güncellendi', { 
          variant: 'success',
          anchorOrigin: { vertical: 'top', horizontal: 'right' }
        });
        onUpdate();
      } else {
        enqueueSnackbar('Teşhis güncellenemedi', { 
          variant: 'error',
          anchorOrigin: { vertical: 'top', horizontal: 'right' }
        });
      }
    } catch (error) {
      console.error('Error updating diagnosis:', error);
      enqueueSnackbar('Teşhis güncellenemedi', { 
        variant: 'error',
        anchorOrigin: { vertical: 'top', horizontal: 'right' }
      });
    }
  };
} 