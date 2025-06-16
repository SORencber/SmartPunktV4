import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  Card, 
  CardContent, 
  Typography, 
  Grid,
  Snackbar,
  Alert,
  CircularProgress
} from '@mui/material';
import SyncIcon from '@mui/icons-material/Sync';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

const AdminDashboard = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  const handleSync = async () => {
    try {
      setLoading(true);
      const response = await axios.post('/api/admin/sync-branch-parts');
      
      setSnackbar({
        open: true,
        message: t('admin.syncStarted'),
        severity: 'success'
      });
    } catch (error) {
      console.error('Senkronizasyon hatası:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || t('admin.syncError'),
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                {t('admin.dashboard')}
              </Typography>
              
              <Box sx={{ mt: 2 }}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SyncIcon />}
                  onClick={handleSync}
                  disabled={loading}
                >
                  {loading ? t('admin.syncing') : t('admin.syncBranchParts')}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AdminDashboard; 