import { useSnackbar } from 'notistack';
import { 
  loadRepair,
  updateRepair,
  updateRepairStatus,
  addPart,
  removePart 
} from '@/api/repairs';
import { 
  UpdateRepairRequest,
  AddPartRequest,
  RepairStatus 
} from '@/types/api';
import { useParams } from 'react-router-dom';

export default function RepairDetailsPage() {
  const { enqueueSnackbar } = useSnackbar();
  const { id } = useParams<{ id: string }>();
  const repairId = id || '';

  const handleUpdateRepair = async (data: UpdateRepairRequest) => {
    try {
      if (!data.customerId || !data.deviceTypeId || !data.brandId || !data.modelId) {
        enqueueSnackbar('Müşteri, cihaz türü, marka ve model gereklidir', { 
          variant: 'error',
          anchorOrigin: { vertical: 'top', horizontal: 'right' }
        });
        return;
      }

      const response = await updateRepair(repairId, data);
      if (response.success) {
        enqueueSnackbar('Tamir kaydı güncellendi', { 
          variant: 'success',
          anchorOrigin: { vertical: 'top', horizontal: 'right' }
        });
        await loadRepair();
      } else {
        enqueueSnackbar('Tamir kaydı güncellenemedi', { 
          variant: 'error',
          anchorOrigin: { vertical: 'top', horizontal: 'right' }
        });
      }
    } catch (error) {
      console.error('Error updating repair:', error);
      enqueueSnackbar('Tamir kaydı güncellenemedi', { 
        variant: 'error',
        anchorOrigin: { vertical: 'top', horizontal: 'right' }
      });
    }
  };

  const handleAddPart = async (data: AddPartRequest) => {
    try {
      if (!data.partId || !data.quantity) {
        enqueueSnackbar('Parça ve miktar gereklidir', { 
          variant: 'error',
          anchorOrigin: { vertical: 'top', horizontal: 'right' }
        });
        return;
      }

      const response = await addPart(repairId, data);
      if (response.success) {
        enqueueSnackbar('Parça eklendi', { 
          variant: 'success',
          anchorOrigin: { vertical: 'top', horizontal: 'right' }
        });
        await loadRepair();
      } else {
        enqueueSnackbar('Parça eklenemedi', { 
          variant: 'error',
          anchorOrigin: { vertical: 'top', horizontal: 'right' }
        });
      }
    } catch (error) {
      console.error('Error adding part:', error);
      enqueueSnackbar('Parça eklenemedi', { 
        variant: 'error',
        anchorOrigin: { vertical: 'top', horizontal: 'right' }
      });
    }
  };

  const handleRemovePart = async (partId: string) => {
    try {
      const response = await removePart(repairId, partId);
      if (response.success) {
        enqueueSnackbar('Parça kaldırıldı', { 
          variant: 'success',
          anchorOrigin: { vertical: 'top', horizontal: 'right' }
        });
        await loadRepair();
      } else {
        enqueueSnackbar('Parça kaldırılamadı', { 
          variant: 'error',
          anchorOrigin: { vertical: 'top', horizontal: 'right' }
        });
      }
    } catch (error) {
      console.error('Error removing part:', error);
      enqueueSnackbar('Parça kaldırılamadı', { 
        variant: 'error',
        anchorOrigin: { vertical: 'top', horizontal: 'right' }
      });
    }
  };

  const handleUpdateStatus = async (status: RepairStatus) => {
    try {
      const response = await updateRepairStatus(repairId, status);
      if (response.success) {
        enqueueSnackbar('Durum güncellendi', { 
          variant: 'success',
          anchorOrigin: { vertical: 'top', horizontal: 'right' }
        });
        await loadRepair();
      } else {
        enqueueSnackbar('Durum güncellenemedi', { 
          variant: 'error',
          anchorOrigin: { vertical: 'top', horizontal: 'right' }
        });
      }
    } catch (error) {
      console.error('Error updating status:', error);
      enqueueSnackbar('Durum güncellenemedi', { 
        variant: 'error',
        anchorOrigin: { vertical: 'top', horizontal: 'right' }
      });
    }
  };
} 