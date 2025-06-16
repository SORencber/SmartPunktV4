const mongoose = require('mongoose');
const Part = require('../models/Part');
const Model = require('../models/Model');
const Brand = require('../models/Brand');
const DeviceType = require('../models/DeviceType');
const { logger } = require('../utils/logger');

const MONGODB_URI = 'mongodb://localhost:27017/repair-system';

// Parça kategorileri ve çoklu dil desteği
const partCategories = {
  'Display': {
    tr: 'Ekran',
    de: 'Display',
    en: 'Display',
    description: {
      tr: 'Orijinal iPhone ekran modülü',
      de: 'Originales iPhone Display-Modul',
      en: 'Original iPhone display module'
    }
  },
  'Camera': {
    tr: 'Kamera',
    de: 'Kamera',
    en: 'Camera',
    description: {
      tr: 'Orijinal iPhone kamera modülü',
      de: 'Originales iPhone Kamera-Modul',
      en: 'Original iPhone camera module'
    }
  },
  'Camera Glass': {
    tr: 'Kamera Camı',
    de: 'Kamera-Glas',
    en: 'Camera Glass',
    description: {
      tr: 'Orijinal iPhone kamera camı',
      de: 'Originales iPhone Kamera-Glas',
      en: 'Original iPhone camera glass'
    }
  },
  'Battery': {
    tr: 'Batarya',
    de: 'Akku',
    en: 'Battery',
    description: {
      tr: 'Orijinal iPhone bataryası',
      de: 'Originaler iPhone Akku',
      en: 'Original iPhone battery'
    }
  },
  'Motherboard': {
    tr: 'Anakart',
    de: 'Hauptplatine',
    en: 'Motherboard',
    description: {
      tr: 'Orijinal iPhone anakartı',
      de: 'Originale iPhone Hauptplatine',
      en: 'Original iPhone motherboard'
    }
  },
  'Speaker': {
    tr: 'Hoparlör',
    de: 'Lautsprecher',
    en: 'Speaker',
    description: {
      tr: 'Orijinal iPhone hoparlörü',
      de: 'Originaler iPhone Lautsprecher',
      en: 'Original iPhone speaker'
    }
  },
  'Microphone': {
    tr: 'Mikrofon',
    de: 'Mikrofon',
    en: 'Microphone',
    description: {
      tr: 'Orijinal iPhone mikrofonu',
      de: 'Originales iPhone Mikrofon',
      en: 'Original iPhone microphone'
    }
  },
  'GPS': {
    tr: 'GPS',
    de: 'GPS',
    en: 'GPS',
    description: {
      tr: 'Orijinal iPhone GPS modülü',
      de: 'Originales iPhone GPS-Modul',
      en: 'Original iPhone GPS module'
    }
  },
  'Charging Port': {
    tr: 'Şarj Portu',
    de: 'Ladeanschluss',
    en: 'Charging Port',
    description: {
      tr: 'Orijinal iPhone şarj portu',
      de: 'Originaler iPhone Ladeanschluss',
      en: 'Original iPhone charging port'
    }
  },
  'Vibrator': {
    tr: 'Titreşim Motoru',
    de: 'Vibrationsmotor',
    en: 'Vibrator',
    description: {
      tr: 'Orijinal iPhone titreşim motoru',
      de: 'Originaler iPhone Vibrationsmotor',
      en: 'Original iPhone vibrator motor'
    }
  },
  'Fingerprint Sensor': {
    tr: 'Parmak İzi Sensörü',
    de: 'Fingerabdrucksensor',
    en: 'Fingerprint Sensor',
    description: {
      tr: 'Orijinal iPhone parmak izi sensörü',
      de: 'Originaler iPhone Fingerabdrucksensor',
      en: 'Original iPhone fingerprint sensor'
    }
  },
  'Proximity Sensor': {
    tr: 'Yakınlık Sensörü',
    de: 'Näherungssensor',
    en: 'Proximity Sensor',
    description: {
      tr: 'Orijinal iPhone yakınlık sensörü',
      de: 'Originaler iPhone Näherungssensor',
      en: 'Original iPhone proximity sensor'
    }
  },
  'Earpiece': {
    tr: 'Kulaklık',
    de: 'Hörer',
    en: 'Earpiece',
    description: {
      tr: 'Orijinal iPhone kulaklığı',
      de: 'Originaler iPhone Hörer',
      en: 'Original iPhone earpiece'
    }
  },
  'Antenna': {
    tr: 'Anten',
    de: 'Antenne',
    en: 'Antenna',
    description: {
      tr: 'Orijinal iPhone anteni',
      de: 'Originale iPhone Antenne',
      en: 'Original iPhone antenna'
    }
  },
  'SIM Tray': {
    tr: 'SIM Yuvası',
    de: 'SIM-Schacht',
    en: 'SIM Tray',
    description: {
      tr: 'Orijinal iPhone SIM yuvası',
      de: 'Originaler iPhone SIM-Schacht',
      en: 'Original iPhone SIM tray'
    }
  },
  'Volume Button': {
    tr: 'Ses Tuşu',
    de: 'Lautstärketaste',
    en: 'Volume Button',
    description: {
      tr: 'Orijinal iPhone ses tuşu',
      de: 'Originale iPhone Lautstärketaste',
      en: 'Original iPhone volume button'
    }
  },
  'Power Button': {
    tr: 'Güç Tuşu',
    de: 'Ein-/Ausschaltknopf',
    en: 'Power Button',
    description: {
      tr: 'Orijinal iPhone güç tuşu',
      de: 'Originaler iPhone Ein-/Ausschaltknopf',
      en: 'Original iPhone power button'
    }
  },
  'Home Button': {
    tr: 'Ana Ekran Tuşu',
    de: 'Home-Taste',
    en: 'Home Button',
    description: {
      tr: 'Orijinal iPhone ana ekran tuşu',
      de: 'Originale iPhone Home-Taste',
      en: 'Original iPhone home button'
    }
  },
  'Face ID': {
    tr: 'Face ID',
    de: 'Face ID',
    en: 'Face ID',
    description: {
      tr: 'Orijinal iPhone Face ID modülü',
      de: 'Originales iPhone Face-ID-Modul',
      en: 'Original iPhone Face ID module'
    }
  }
};

// Generate unique random string
function generateRandomString(length = 6) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function seedParts() {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info('Connected to MongoDB');

    // Get deviceTypeId for Telefon
    const phoneType = await DeviceType.findOne({ name: 'Telefon' });
    if (!phoneType) throw new Error('Telefon device type not found');

    // Get Apple brand
    const appleBrand = await Brand.findOne({ name: 'Apple', deviceTypeId: phoneType._id });
    if (!appleBrand) throw new Error('Apple brand not found');

    // Get all iPhone models
    const iphoneModels = await Model.find({ 
      brandId: appleBrand._id,
      deviceTypeId: phoneType._id,
      isActive: true 
    });

    // Prepare part documents
    const partDocs = [];
    for (const model of iphoneModels) {
      for (const [category, translations] of Object.entries(partCategories)) {
        // Generate unique barcode and QR code with random string
        const randomStr = generateRandomString();
        const modelNum = model.name.replace(/\D/g, '') || 'SE';
        const barcode = `IP${modelNum}-${category.substring(0, 3).toUpperCase()}-${randomStr}`;
        const qrCode = `QR-${barcode}`;

        partDocs.push({
          name: translations,
          description: translations.description,
          modelId: model._id,
          brandId: appleBrand._id,
          deviceTypeId: phoneType._id,
          category,
          barcode,
          qrCode,
          isActive: true,
          createdBy: {
            id: new mongoose.Types.ObjectId('684153263f015deb5a51c4c6'), // Admin user ID
            email: 'admin@repairsystem.com',
            fullName: 'Admin User'
          }
        });
      }
    }

    // Clear existing parts and insert new ones
    await Part.deleteMany({ brandId: appleBrand._id });
    const result = await Part.insertMany(partDocs);
    logger.info('iPhone parts seeded successfully', { count: result.length });

    await mongoose.disconnect();
    logger.info('Disconnected from MongoDB');
  } catch (error) {
    logger.error('Error seeding parts', { error: error.message });
    process.exit(1);
  }
}

// Run the seed function
seedParts(); 