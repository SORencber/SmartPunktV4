const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { getBranchPartModel } = require('../models/BranchPart');
const Part = require('../models/Part');
const { authenticateToken, checkBranchAccess } = require('../middleware/auth');
const { logActivity } = require('../middleware/activityLogger');

// Parts tablosundan güncellenecek alanlar
const UPDATABLE_FIELDS = [
  'name',
  'description',
  'modelId',
  'brandId',
  'deviceTypeId',
  'category',
  'barcode',
  'qrCode',
  'isActive',
  'compatibleWith',
  'cost',
  'margin',
  'minStockLevel',
  'price',
  'shelfNumber',
  'stock',
  'updatedBy',
  // Branch-specific fields
  'branch_stock',
  'branch_minStockLevel',
  'branch_cost',
  'branch_price',
  'branch_margin',
  'branch_shelfNumber',
  'branch_serviceFee'
];

// Add parts to branch inventory
router.post('/', authenticateToken, logActivity, async (req, res) => {
  console.log('🚀 POST /api/branch-parts başladı');

  try {
    const { branchId, parts } = req.body;

    console.log('🔍 Request detayları:', {
      timestamp: new Date().toISOString(),
      branchId,
      totalParts: parts?.length,
      firstPart: parts?.[0],
      lastPart: parts?.[parts.length - 1],
      user: {
        id: req.user._id,
        role: req.user.role,
        branch: req.user.branch,
        email: req.user.email
      }
    });

    if (!branchId || !parts || !Array.isArray(parts)) {
      console.error('❌ Geçersiz istek:', { 
        branchId, 
        hasParts: !!parts, 
        isArray: Array.isArray(parts),
        partsType: typeof parts
      });
      return res.status(400).json({ 
        success: false,
        message: 'Geçersiz istek. branchId ve parts dizisi gereklidir.' 
      });
    }

    console.log('✅ Request validasyonu başarılı');

    // Kullanıcının şubeye erişim yetkisi var mı kontrol et
    if (req.user.role !== 'admin' && req.user.role !== 'central_staff' && req.user.branch.toString() !== branchId) {
      console.error('❌ Yetki hatası:', {
        userId: req.user._id,
        userBranch: req.user.branch,
        requestedBranchId: branchId,
        userRole: req.user.role,
        branchMatch: req.user.branch.toString() === branchId
      });
      return res.status(403).json({ 
        success: false,
        message: 'Bu şube için yetkiniz bulunmamaktadır.' 
      });
    }

    console.log('✅ Yetki kontrolü başarılı');

    // Şube için dinamik model oluştur
    const BranchPart = getBranchPartModel(branchId);
    console.log(`📦 Şube koleksiyonu oluşturuldu: branch_${branchId}_parts`);

    const results = [];
    const errors = [];
    const stats = {
      total: parts.length,
      processed: 0,
      success: 0,
      failed: 0,
      notFound: 0,
      validationErrors: 0,
      dbErrors: 0
    };

    // Her parça için işlem yap
    for (const partData of parts) {
      try {
        stats.processed++;
        console.log(`🔄 Parça işleniyor (${stats.processed}/${stats.total}):`, {
          partId: partData._id,
          name: partData.name
        });

        // Ana parçayı bul
        const mainPart = await Part.findById(partData._id);
        if (!mainPart) {
          console.error('❌ Ana parça bulunamadı:', { partId: partData._id });
          stats.notFound++;
          errors.push({
            partId: partData._id,
            error: 'Ana parça bulunamadı'
          });
          continue;
        }

        // Şube parçasını bul veya oluştur
        let branchPart = await BranchPart.findOne({ partId: mainPart._id });

        if (branchPart) {
          // Şube parçası varsa, sadece ana parça alanlarını güncelle
          const updateFields = {};
          UPDATABLE_FIELDS.forEach(field => {
            if (mainPart[field] !== undefined) {
              updateFields[field] = mainPart[field];
            }
          });

          // branch_ alanlarına dokunma, sadece ana parça alanlarını güncelle
          const updatedBranchPart = await BranchPart.findByIdAndUpdate(
            branchPart._id,
            { 
              $set: {
                ...updateFields,
                updatedAt: new Date()
              }
            },
            { new: true }
          );

          console.log('✅ Parça güncellendi:', {
            partId: mainPart._id,
            updatedFields: Object.keys(updateFields)
          });

          results.push({
            partId: mainPart._id,
            success: true,
            type: 'updated',
            data: updatedBranchPart
          });
          stats.success++;
        } else {
          // Şube parçası yoksa, yeni oluştur
          const newBranchPart = new BranchPart({
            ...mainPart.toObject(),
            partId: mainPart._id,
            branch_stock: 0,
            branch_minStockLevel: 5,
            branch_cost: 0,
            branch_price: 0,
            branch_margin: 20,
            branch_shelfNumber: "0",
            branch_serviceFee: { amount: 0, currency: 'EUR' },
            branch_createdBy: {
              id: req.user._id,
              email: req.user.email,
              fullName: req.user.fullName || req.user.username
            }
          });

          await newBranchPart.save();

          console.log('✅ Yeni parça oluşturuldu:', {
            partId: mainPart._id,
            branchId
          });

          results.push({
            partId: mainPart._id,
            success: true,
            type: 'created',
            data: newBranchPart
          });
          stats.success++;
        }
      } catch (error) {
        console.error('❌ Parça işleme hatası:', {
          partId: partData._id,
          error: error.message
        });
        stats.failed++;
        errors.push({
          partId: partData._id,
          error: error.message
        });
      }
    }

    console.log('📊 İşlem istatistikleri:', stats);

    res.json({
      success: true,
      stats,
      results,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('❌ Genel hata:', error);
    res.status(500).json({
      success: false,
      message: 'Parçalar envantere eklenirken bir hata oluştu',
      error: error.message
    });
  }
});

// Get branch inventory
router.get('/', authenticateToken, checkBranchAccess, async (req, res) => {
  try {
    const { branchId, shelfNumber, minStock, partId } = req.query;

    if (!branchId) {
      return res.status(400).json({
        success: false,
        message: 'branchId parametresi gereklidir'
      });
    }

    // Verify user has access to the branch
    if (req.user.role !== 'admin' && req.user.role !== 'central_staff' && req.user.branch.toString() !== branchId) {
      return res.status(403).json({
        success: false,
        message: 'Bu şubeye erişim izniniz yok'
      });
    }

    // Şube için dinamik model oluştur
    const BranchPart = getBranchPartModel(branchId);

    // If partId is provided, find specific part
    if (partId) {
      try {
        // First check if the part exists in the main parts collection
        const mainPart = await Part.findOne({ _id: partId });
        if (!mainPart) {
          return res.status(404).json({
            success: false,
            message: 'Ana parça bulunamadı'
          });
        }

        // Then try to find it in the branch collection
        const branchPart = await BranchPart.findOne({ partId: mainPart._id })
          .populate('brandId', 'name')
          .populate('deviceTypeId', 'name')
          .populate('modelId', 'name');

        if (!branchPart) {
          // If not found in branch, create a new branch part with default values
          const newBranchPart = new BranchPart({
            ...mainPart.toObject(),
            partId: mainPart._id,
            branch_stock: 0,
            branch_minStockLevel: 5,
            branch_cost: 0,
            branch_price: 0,
            branch_margin: 20,
            branch_shelfNumber: "0",
            branch_serviceFee: { amount: 0, currency: 'EUR' },
            branch_createdBy: {
              id: req.user._id,
              email: req.user.email,
              fullName: req.user.fullName || req.user.username
            }
          });

          await newBranchPart.save();

          return res.json({
            success: true,
            data: newBranchPart
          });
        }

        return res.json({
          success: true,
          data: branchPart
        });
      } catch (error) {
        console.error('Error finding branch part:', error);
        return res.status(500).json({
          success: false,
          message: 'Parça yüklenirken hata oluştu',
          error: error.message
        });
      }
    }

    // Build query for inventory list
    const query = {};
    if (shelfNumber) {
      query.branch_shelfNumber = shelfNumber;
    }
    if (minStock === 'true') {
      query.branch_stock = { $lte: '$branch_minStockLevel' };
    }

    try {
      const branchParts = await BranchPart.find(query)
        .populate('brandId', 'name')
        .populate('deviceTypeId', 'name')
        .populate('modelId', 'name')
        .sort({ category: 1, 'name.tr': 1 });

      res.json({
        success: true,
        data: branchParts
      });
    } catch (error) {
      // If collection doesn't exist yet, return empty array
      if (error.name === 'MongoError' && error.code === 26) {
        return res.json({
          success: true,
          data: []
        });
      }
      throw error;
    }
  } catch (error) {
    console.error('Error fetching branch parts:', error);
    res.status(500).json({
      success: false,
      message: 'Parçalar yüklenirken hata oluştu',
      error: error.message
    });
  }
});

// Get inventory status for a brand
router.get('/status', authenticateToken, checkBranchAccess, async (req, res) => {
  try {
    const { branchId, brandId } = req.query;

    if (!branchId || !brandId) {
      return res.status(400).json({
        success: false,
        message: 'branchId ve brandId parametreleri gereklidir'
      });
    }

    // Verify user has access to the branch
    if (req.user.role !== 'admin' && req.user.role !== 'central_staff' && req.user.branch.toString() !== branchId) {
      return res.status(403).json({
        success: false,
        message: 'Bu şubeye erişim izniniz yok'
      });
    }

    const latestPart = await Part.findOne({ brandId: brandId })
      .sort({ updatedAt: -1 });

    const latestInventory = await BranchPart.findOne({ 
      branchId,
      partId: { $in: await Part.find({ brandId }).select('_id') }
    }).sort({ updatedAt: -1 });

    res.json({
      success: true,
      data: {
        needsUpdate: !latestInventory || 
          (latestPart && latestPart.updatedAt > latestInventory.updatedAt),
        lastPartUpdate: latestPart?.updatedAt || null,
        lastInventoryUpdate: latestInventory?.updatedAt || null
      }
    });
  } catch (error) {
    console.error('Error getting inventory status:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Envanter durumu alınırken bir hata oluştu'
    });
  }
});

// Update branch part
router.put('/:id', authenticateToken, logActivity, async (req, res) => {
  console.log('🚀 PUT /api/branch-parts/:id başladı');

  try {
    const { id } = req.params;
    const { branchId } = req.body;
    const user = req.user;

    console.log('🔍 Request detayları:', {
      timestamp: new Date().toISOString(),
      partId: id,
      branchId,
      user: {
        id: user._id,
        role: user.role,
        branch: user.branch,
        email: user.email
      }
    });

    if (!branchId) {
      console.error('❌ Geçersiz istek: branchId eksik');
      return res.status(400).json({ 
        success: false,
        message: 'branchId parametresi gereklidir' 
      });
    }

    // Kullanıcının şubeye erişim yetkisi var mı kontrol et
    if (user.role !== 'admin' && user.role !== 'central_staff' && user.branch.toString() !== branchId) {
      console.error('❌ Yetki hatası:', {
        userId: user._id,
        userBranch: user.branch,
        requestedBranchId: branchId,
        userRole: user.role
      });
      return res.status(403).json({ 
        success: false,
        message: 'Bu şube için yetkiniz bulunmamaktadır.' 
      });
    }

    // Şube için dinamik model oluştur
    const BranchPart = getBranchPartModel(branchId);
    console.log(`📦 Şube koleksiyonu oluşturuldu: branch_${branchId}_parts`);

    // Önce şube parçasını bul
    const branchPart = await BranchPart.findById(id);
    if (!branchPart) {
      console.error('❌ Şube parçası bulunamadı:', { id, branchId });
      return res.status(404).json({
        success: false,
        message: 'Şube parçası bulunamadı'
      });
    }

    // Ana parçayı bul
    const mainPart = await Part.findById(branchPart.partId);
    if (!mainPart) {
      console.error('❌ Ana parça bulunamadı:', { partId: branchPart.partId });
      return res.status(404).json({
        success: false,
        message: 'Ana parça bulunamadı'
      });
    }

    // Güncellenebilir alanları filtrele
    const updateFields = {};
    UPDATABLE_FIELDS.forEach(field => {
      if (req.body[field] !== undefined) {
        updateFields[field] = req.body[field];
      }
    });

    // branch_ alanlarına dokunma, sadece ana parça alanlarını güncelle
    const updatedBranchPart = await BranchPart.findByIdAndUpdate(
      id,
      { 
        $set: {
          ...updateFields,
          updatedAt: new Date()
        }
      },
      { 
        new: true,
        runValidators: true
      }
    ).populate('brandId', 'name')
     .populate('deviceTypeId', 'name')
     .populate('modelId', 'name');

    if (!updatedBranchPart) {
      console.error('❌ Parça güncellenemedi:', { id, branchId });
      return res.status(500).json({
        success: false,
        message: 'Parça güncellenirken bir hata oluştu'
      });
    }

    console.log('✅ Parça başarıyla güncellendi:', {
      partId: id,
      branchId,
      updatedFields: Object.keys(updateFields)
    });

    res.json({
      success: true,
      data: updatedBranchPart
    });

  } catch (error) {
    console.error('❌ Genel hata:', error);
    res.status(500).json({
      success: false,
      message: 'Parça güncellenirken bir hata oluştu',
      error: error.message
    });
  }
});

module.exports = router; 