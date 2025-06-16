import { useSnackbar } from 'notistack';

export function RepairInvoiceTab({ repair, onUpdate }: RepairInvoiceTabProps) {
  const { enqueueSnackbar } = useSnackbar();

  const handleGenerateInvoice = async () => {
    try {
      const response = await generateInvoice(repair._id);
      if (response.success) {
        enqueueSnackbar('Fatura oluşturuldu', { 
          variant: 'success',
          anchorOrigin: { vertical: 'top', horizontal: 'right' }
        });
        onUpdate();
      } else {
        enqueueSnackbar('Fatura oluşturulamadı', { 
          variant: 'error',
          anchorOrigin: { vertical: 'top', horizontal: 'right' }
        });
      }
    } catch (error) {
      console.error('Error generating invoice:', error);
      enqueueSnackbar('Fatura oluşturulamadı', { 
        variant: 'error',
        anchorOrigin: { vertical: 'top', horizontal: 'right' }
      });
    }
  };

  const handleSendInvoice = async () => {
    try {
      const response = await sendInvoice(repair._id);
      if (response.success) {
        enqueueSnackbar('Fatura gönderildi', { 
          variant: 'success',
          anchorOrigin: { vertical: 'top', horizontal: 'right' }
        });
        onUpdate();
      } else {
        enqueueSnackbar('Fatura gönderilemedi', { 
          variant: 'error',
          anchorOrigin: { vertical: 'top', horizontal: 'right' }
        });
      }
    } catch (error) {
      console.error('Error sending invoice:', error);
      enqueueSnackbar('Fatura gönderilemedi', { 
        variant: 'error',
        anchorOrigin: { vertical: 'top', horizontal: 'right' }
      });
    }
  };
} 