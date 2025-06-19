const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const generateInvoiceHTML = (invoice) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  const itemsRows = invoice.items.map(item => `
    <tr class="item">
      <td>${item.name}</td>
      <td>${item.quantity}</td>
      <td>${formatCurrency(item.unitPrice)}</td>
      <td>${formatCurrency(item.total)}</td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html lang="tr">
    <head>
      <meta charset="UTF-8">
      <title>Fatura #${invoice._id}</title>
      <style>
        body { font-family: 'Helvetica Neue', 'Helvetica', Helvetica, Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #333; }
        .invoice-box { max-width: 800px; margin: auto; padding: 30px; border: 1px solid #eee; box-shadow: 0 0 10px rgba(0, 0, 0, 0.15); }
        .header { text-align: center; margin-bottom: 20px; }
        .header h1 { margin: 0; font-size: 24px; color: #555; }
        .details { margin-bottom: 30px; }
        .details, .details table { width: 100%; }
        .details table td { padding: 5px; }
        .details table tr td:nth-child(2) { text-align: right; }
        .invoice-table { width: 100%; border-collapse: collapse; text-align: left; }
        .invoice-table th, .invoice-table td { padding: 8px; border-bottom: 1px solid #eee; }
        .invoice-table th { background-color: #f2f2f2; }
        .total-table { width: 100%; margin-top: 20px; }
        .total-table td { padding: 5px; }
        .total-table .label { text-align: right; font-weight: bold; }
        .total-table .amount { text-align: right; }
        .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #777; }
      </style>
    </head>
    <body>
      <div class="invoice-box">
        <div class="header">
          <h1>FATURA</h1>
        </div>
        <div class="details">
          <table>
            <tr>
              <td>Fatura No</td>
              <td>#${invoice._id}</td>
            </tr>
            <tr>
              <td>Oluşturma Tarihi</td>
              <td>${formatDate(invoice.createdAt)}</td>
            </tr>
            <tr>
              <td>Şube</td>
              <td>${invoice.branch.name}</td>
            </tr>
             <tr>
              <td>Sipariş Numaraları</td>
              <td>${invoice.orders.map(o => o.orderId).join(', ')}</td>
            </tr>
          </table>
        </div>
        <table class="invoice-table">
          <thead>
            <tr>
              <th>Ürün/Hizmet</th>
              <th>Miktar</th>
              <th>Birim Fiyat</th>
              <th>Toplam</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRows}
          </tbody>
        </table>
        <table class="total-table">
          <tr>
            <td class="label">Ara Toplam</td>
            <td class="amount">${formatCurrency(invoice.totalAmount - invoice.serviceFee)}</td>
          </tr>
          <tr>
            <td class="label">Servis Ücreti</td>
            <td class="amount">${formatCurrency(invoice.serviceFee)}</td>
          </tr>
          <tr>
            <td class="label">Genel Toplam</td>
            <td class="amount">${formatCurrency(invoice.totalAmount)}</td>
          </tr>
        </table>
        <div class="footer">
          <p>SmartPunkt V3</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

const generatePdf = async (invoice) => {
  const fileName = `invoice-${invoice._id}.pdf`;
  const filePath = path.join(__dirname, '..', 'public', 'invoices', fileName);
  
  // Construct the absolute URL for accessing the PDF
  const serverBaseUrl = process.env.SERVER_URL || 'http://localhost:5000';
  const fileUrl = `${serverBaseUrl}/invoices/${fileName}`;

  // Ensure directory exists
  fs.mkdirSync(path.dirname(filePath), { recursive: true });

  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'] // Important for running in a container
  });
  const page = await browser.newPage();
  
  const htmlContent = generateInvoiceHTML(invoice);
  
  await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
  await page.pdf({
    path: filePath,
    format: 'A4',
    printBackground: true
  });

  await browser.close();
  
  return fileUrl;
};

module.exports = { generatePdf }; 