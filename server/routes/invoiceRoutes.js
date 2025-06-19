const express = require('express');
const router = express.Router();
const Invoice = require('../models/Invoice');
const Order = require('../models/Order');
const { protect: auth } = require('../middleware/auth');
const { generatePdf } = require('../utils/pdfGenerator');

// Create new invoice from selected orders
router.post('/', auth, async (req, res) => {
  try {
    const { orderIds } = req.body;

    // Get all selected orders
    const orders = await Order.find({ _id: { $in: orderIds } })
      .populate('items')
      .populate('branch');

    if (!orders.length) {
      return res.status(404).json({ message: 'No orders found' });
    }

    // Calculate totals and collect items
    let totalAmount = 0;
    const itemMap = new Map();

    orders.forEach(order => {
      // Add service fee to total
      totalAmount += order.serviceFee || 0;

      // Group items by name and calculate totals
      order.items.forEach(item => {
        const key = item.partId || item.name;
        if (!itemMap.has(key)) {
          itemMap.set(key, {
            name: item.name,
            quantity: 0,
            unitPrice: item.unitPrice || 0,
            total: 0
          });
        }
        const entry = itemMap.get(key);
        entry.quantity += item.quantity;
        entry.total += (item.unitPrice || 0) * item.quantity;
      });
    });

    // Add items total to totalAmount
    Array.from(itemMap.values()).forEach(item => {
      totalAmount += item.total;
    });

    // Create invoice record
    const invoice = new Invoice({
      orders: orderIds,
      totalAmount,
      items: Array.from(itemMap.values()),
      serviceFee: orders.reduce((sum, order) => sum + (order.serviceFee || 0), 0),
      branch: orders[0].branch // Use the branch from the first order
    });

    await invoice.save();

    // Generate PDF and get its URL
    // We need to re-populate the orders to get the orderId field for the PDF
    const populatedInvoice = await Invoice.findById(invoice._id).populate('orders').populate('branch');
    const pdfUrl = await generatePdf(populatedInvoice);

    // Update invoice with the PDF URL
    invoice.pdfUrl = pdfUrl;
    await invoice.save();

    // Update orders' invoice status
    await Order.updateMany(
      { _id: { $in: orderIds } },
      { 
        isInvoiced: true,
        invoicedAt: new Date(),
        invoice: invoice._id
      }
    );

    res.status(201).json(invoice);
  } catch (error) {
    console.error('Error creating invoice:', error);
    res.status(500).json({ message: 'Error creating invoice' });
  }
});

// Get all invoices
router.get('/', auth, async (req, res) => {
  try {
    const invoices = await Invoice.find()
      .populate('orders')
      .populate('branch')
      .sort({ createdAt: -1 });

    res.json(invoices);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ message: 'Error fetching invoices' });
  }
});

// Get single invoice by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('orders')
      .populate('branch');

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    res.json(invoice);
  } catch (error) {
    console.error('Error fetching invoice:', error);
    res.status(500).json({ message: 'Error fetching invoice' });
  }
});

module.exports = router; 