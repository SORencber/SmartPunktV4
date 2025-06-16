const crypto = require('crypto');
const QRCode = require('qrcode');
const PDFDocument = require('pdfkit');
const winston = require('winston');
const path = require('path');
const fs = require('fs').promises;

// Generate random string
const generateRandomString = (length = 8) => {
  return crypto.randomBytes(length).toString('hex');
};

// Generate order ID
const generateOrderId = () => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${year}${month}${day}-${random}`;
};

// Generate warranty certificate number
const generateWarrantyNumber = () => {
  const prefix = 'W';
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}${year}${month}-${random}`;
};

// Generate QR code
const generateQRCode = async (data) => {
  try {
    const qrCodeDataUrl = await QRCode.toDataURL(JSON.stringify(data));
    return qrCodeDataUrl;
  } catch (error) {
    winston.error(`QR Code generation error: ${error.message}`);
    throw error;
  }
};

// Generate PDF document
const generatePDF = async (data, type, language) => {
  const doc = new PDFDocument();
  const fileName = `${type}-${generateRandomString()}.pdf`;
  const filePath = path.join(__dirname, '../uploads', fileName);

  try {
    // Create uploads directory if it doesn't exist
    await fs.mkdir(path.join(__dirname, '../uploads'), { recursive: true });

    // Create write stream
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // Add content based on type and language
    switch (type) {
      case 'order':
        generateOrderPDF(doc, data, language);
        break;
      case 'warranty':
        generateWarrantyPDF(doc, data, language);
        break;
      default:
        throw new Error('Invalid document type');
    }

    // Finalize PDF
    doc.end();

    return new Promise((resolve, reject) => {
      stream.on('finish', () => resolve(filePath));
      stream.on('error', reject);
    });
  } catch (error) {
    winston.error(`PDF generation error: ${error.message}`);
    throw error;
  }
};

// Generate order PDF content
const generateOrderPDF = (doc, data, language) => {
  const translations = {
    tr: {
      orderReceipt: 'Sipariş Makbuzu',
      orderId: 'Sipariş No',
      date: 'Tarih',
      customer: 'Müşteri',
      items: 'Ürünler',
      total: 'Toplam',
      paid: 'Ödenen',
      remaining: 'Kalan',
      branch: 'Şube',
      address: 'Adres',
      phone: 'Telefon',
      email: 'E-posta',
      warranty: 'Garanti',
      notes: 'Notlar'
    },
    de: {
      orderReceipt: 'Bestellbestätigung',
      orderId: 'Bestellnummer',
      date: 'Datum',
      customer: 'Kunde',
      items: 'Artikel',
      total: 'Gesamt',
      paid: 'Bezahlt',
      remaining: 'Restbetrag',
      branch: 'Filiale',
      address: 'Adresse',
      phone: 'Telefon',
      email: 'E-Mail',
      warranty: 'Garantie',
      notes: 'Notizen'
    },
    en: {
      orderReceipt: 'Order Receipt',
      orderId: 'Order ID',
      date: 'Date',
      customer: 'Customer',
      items: 'Items',
      total: 'Total',
      paid: 'Paid',
      remaining: 'Remaining',
      branch: 'Branch',
      address: 'Address',
      phone: 'Phone',
      email: 'Email',
      warranty: 'Warranty',
      notes: 'Notes'
    }
  };

  const t = translations[language] || translations.en;

  // Add content
  doc.fontSize(20).text(t.orderReceipt, { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).text(`${t.orderId}: ${data.orderId}`);
  doc.text(`${t.date}: ${new Date(data.createdAt).toLocaleDateString()}`);
  doc.moveDown();
  
  // Customer info
  doc.text(`${t.customer}: ${data.customer.name}`);
  doc.text(`${t.phone}: ${data.customer.phone}`);
  if (data.customer.email) doc.text(`${t.email}: ${data.customer.email}`);
  doc.moveDown();

  // Items
  doc.text(t.items);
  data.items.forEach(item => {
    doc.text(`- ${item.product.name}: ${item.quantity} x ${item.unitPrice}`);
  });
  doc.moveDown();

  // Payment info
  doc.text(`${t.total}: ${data.payment.totalAmount}`);
  doc.text(`${t.paid}: ${data.payment.paidAmount}`);
  doc.text(`${t.remaining}: ${data.payment.remainingAmount}`);
  doc.moveDown();

  // Branch info
  doc.text(`${t.branch}: ${data.branch.name}`);
  doc.text(`${t.address}: ${data.branch.address}`);
  doc.text(`${t.phone}: ${data.branch.contact.phone}`);
  if (data.branch.contact.email) doc.text(`${t.email}: ${data.branch.contact.email}`);
  doc.moveDown();

  // Notes
  if (data.notes?.[language]) {
    doc.text(`${t.notes}: ${data.notes[language]}`);
  }
};

// Generate warranty PDF content
const generateWarrantyPDF = (doc, data, language) => {
  const translations = {
    tr: {
      warrantyCertificate: 'Garanti Belgesi',
      certificateNo: 'Belge No',
      issueDate: 'Düzenleme Tarihi',
      expiryDate: 'Bitiş Tarihi',
      customer: 'Müşteri',
      device: 'Cihaz',
      parts: 'Parçalar',
      terms: 'Garanti Şartları',
      branch: 'Şube',
      address: 'Adres',
      phone: 'Telefon',
      email: 'E-posta'
    },
    de: {
      warrantyCertificate: 'Garantieschein',
      certificateNo: 'Zertifikatsnummer',
      issueDate: 'Ausstellungsdatum',
      expiryDate: 'Ablaufdatum',
      customer: 'Kunde',
      device: 'Gerät',
      parts: 'Teile',
      terms: 'Garantiebedingungen',
      branch: 'Filiale',
      address: 'Adresse',
      phone: 'Telefon',
      email: 'E-Mail'
    },
    en: {
      warrantyCertificate: 'Warranty Certificate',
      certificateNo: 'Certificate No',
      issueDate: 'Issue Date',
      expiryDate: 'Expiry Date',
      customer: 'Customer',
      device: 'Device',
      parts: 'Parts',
      terms: 'Warranty Terms',
      branch: 'Branch',
      address: 'Address',
      phone: 'Phone',
      email: 'Email'
    }
  };

  const t = translations[language] || translations.en;

  // Add content
  doc.fontSize(20).text(t.warrantyCertificate, { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).text(`${t.certificateNo}: ${data.certificateNumber}`);
  doc.text(`${t.issueDate}: ${new Date(data.issueDate).toLocaleDateString()}`);
  doc.text(`${t.expiryDate}: ${new Date(data.expiryDate).toLocaleDateString()}`);
  doc.moveDown();

  // Customer info
  doc.text(`${t.customer}: ${data.customer.name}`);
  doc.text(`${t.phone}: ${data.customer.phone}`);
  if (data.customer.email) doc.text(`${t.email}: ${data.customer.email}`);
  doc.moveDown();

  // Device info
  doc.text(`${t.device}:`);
  doc.text(`- ${data.device.type}`);
  doc.text(`- ${data.device.brand} ${data.device.model}`);
  if (data.device.serialNumber) doc.text(`- S/N: ${data.device.serialNumber}`);
  doc.moveDown();

  // Parts info
  doc.text(t.parts);
  data.items.forEach(item => {
    if (item.warrantyEligible) {
      doc.text(`- ${item.product.name}`);
    }
  });
  doc.moveDown();

  // Warranty terms
  if (data.terms?.[language]) {
    doc.text(`${t.terms}:`);
    doc.text(data.terms[language]);
  }
  doc.moveDown();

  // Branch info
  doc.text(`${t.branch}: ${data.branch.name}`);
  doc.text(`${t.address}: ${data.branch.address}`);
  doc.text(`${t.phone}: ${data.branch.contact.phone}`);
  if (data.branch.contact.email) doc.text(`${t.email}: ${data.branch.contact.email}`);
};

// Format currency
const formatCurrency = (amount, currency = 'TRY', language = 'tr') => {
  const formatter = new Intl.NumberFormat(language, {
    style: 'currency',
    currency: currency
  });
  return formatter.format(amount);
};

// Format date
const formatDate = (date, language = 'tr') => {
  return new Date(date).toLocaleDateString(language, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Calculate warranty expiry date
const calculateWarrantyExpiry = (startDate, months = 6) => {
  const date = new Date(startDate);
  date.setMonth(date.getMonth() + months);
  return date;
};

module.exports = {
  generateRandomString,
  generateOrderId,
  generateWarrantyNumber,
  generateQRCode,
  generatePDF,
  formatCurrency,
  formatDate,
  calculateWarrantyExpiry
}; 