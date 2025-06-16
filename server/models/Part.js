const mongoose = require('mongoose');
const Branch = require('./Branch');
const Notification = require('./Notification');

const partSchema = new mongoose.Schema({
  name: {
    tr: {
      type: String,
      required: true,
      trim: true
    },
    de: {
      type: String,
      required: true,
      trim: true
    },
    en: {
      type: String,
      required: true,
      trim: true
    }
  },
  description: {
    tr: {
      type: String,
      trim: true
    },
    de: {
      type: String,
      trim: true
    },
    en: {
      type: String,
      trim: true
    }
  },
  brandId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Brand',
    required: true
  },
  modelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Model',
    required: true
  },
  deviceTypeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DeviceType',
    required: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  barcode: {
    type: String,
    trim: true
  },
  qrCode: {
    type: String,
    trim: true
  },
  stock: {
    type: Number,
    default: 0,
    min: [0, 'Stok miktarı 0\'dan küçük olamaz']
  },
  minStockLevel: {
    type: Number,
    default: 5,
    min: [0, 'Minimum stok seviyesi 0\'dan küçük olamaz']
  },
  cost: {
    amount: {
      type: Number,
      default: 0,
      min: [0, 'Maliyet 0\'dan küçük olamaz']
    },
    currency: {
      type: String,
      enum: ['EUR'],
      default: 'EUR'
    }
  },
  price: {
    amount: {
      type: Number,
      default: 0,
      min: [0, 'Fiyat 0\'dan küçük olamaz']
    },
    currency: {
      type: String,
      enum: ['EUR'],
      default: 'EUR'
    }
  },
  serviceFee: {
    amount: {
      type: Number,
      default: 0,
      min: [0, 'Teknik servis ücreti 0\'dan küçük olamaz']
    },
    currency: {
      type: String,
      enum: ['EUR'],
      default: 'EUR'
    }
  },
  margin: {
    type: Number,
    default: 20,
    min: [0, 'Kar marjı 0\'dan küçük olamaz'],
    max: [100, 'Kar marjı 100\'den büyük olamaz']
  },
  shelfNumber: {
    type: String,
    trim: true,
    default: "0"
  },
  compatibleWith: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Model'
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    email: {
      type: String,
      required: true
    },
    fullName: {
      type: String,
      required: true
    }
  },
  updatedBy: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    email: String,
    fullName: String
  }
}, {
  timestamps: true
});

partSchema.pre('save', function(next) {
  if (this.isModified('cost.amount') || this.isModified('price.amount')) {
    if (this.cost.amount > 0) {
      this.margin = ((this.price.amount - this.cost.amount) / this.cost.amount) * 100;
    }
  }
  next();
});

partSchema.index({ category: 1 });
partSchema.index({ brandId: 1, modelId: 1, deviceTypeId: 1 });
partSchema.index({ isActive: 1 });
partSchema.index({ barcode: 1 }, { sparse: true });
partSchema.index({ qrCode: 1 }, { sparse: true });
partSchema.index({ shelfNumber: 1 });
partSchema.index({ compatibleWith: 1 });

// Parça değişikliklerini takip et ve bildirim oluştur
partSchema.post('save', async function(doc) {
  try {
    // Tüm şubeleri bul
    const branches = await Branch.find({ isActive: true });
    
    // Her şube için bildirim oluştur
    const notifications = branches.map(branch => ({
      type: this.isNew ? 'PART_CREATE' : 'PART_UPDATE',
      branchId: branch._id,
      partId: doc._id,
      message: {
        tr: this.isNew ? 
          `Yeni parça eklendi: ${doc.name.tr}` :
          `Parça güncellendi: ${doc.name.tr}`,
        de: this.isNew ?
          `Neues Teil hinzugefügt: ${doc.name.de}` :
          `Teil aktualisiert: ${doc.name.de}`,
        en: this.isNew ?
          `New part added: ${doc.name.en}` :
          `Part updated: ${doc.name.en}`
      },
      createdBy: doc.updatedBy || doc.createdBy
    }));

    // Bildirimleri kaydet
    await Notification.insertMany(notifications);

    console.log(`📢 ${notifications.length} şubeye bildirim gönderildi`);
  } catch (error) {
    console.error('❌ Bildirim oluşturulurken hata:', error);
  }
});

const Part = mongoose.model('Part', partSchema);

module.exports = Part; 