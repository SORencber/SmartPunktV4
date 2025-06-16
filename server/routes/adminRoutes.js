const express = require('express');
const router = express.Router();
const { authenticateToken, checkRole } = require('../middleware/auth');
const { spawn } = require('child_process');
const path = require('path');

// Şube parçalarını senkronize et (sadece admin ve merkez personeli)
router.post('/sync-branch-parts', authenticateToken, checkRole(['admin', 'central_staff']), async (req, res) => {
  try {
    // Script yolunu belirle
    const scriptPath = path.join(__dirname, '../scripts/syncBranchParts.js');
    
    // Scripti başlat
    const script = spawn('node', [scriptPath], {
      detached: true,
      stdio: 'pipe'
    });

    // Script çıktısını topla
    let output = '';
    script.stdout.on('data', (data) => {
      output += data.toString();
      console.log(`Script çıktısı: ${data}`);
    });

    script.stderr.on('data', (data) => {
      output += data.toString();
      console.error(`Script hatası: ${data}`);
    });

    // Script tamamlandığında
    script.on('close', (code) => {
      console.log(`Script tamamlandı, çıkış kodu: ${code}`);
      
      if (code === 0) {
        res.json({
          success: true,
          message: 'Şube parçaları senkronizasyonu başlatıldı',
          output: output
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Senkronizasyon sırasında hata oluştu',
          output: output
        });
      }
    });

    // Scripti ana süreçten ayır
    script.unref();

  } catch (error) {
    console.error('Senkronizasyon başlatma hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Senkronizasyon başlatılamadı',
      error: error.message
    });
  }
});

module.exports = router; 