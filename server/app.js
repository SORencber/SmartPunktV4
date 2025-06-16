const partRoutes = require('./routes/partRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const adminRoutes = require('./routes/adminRoutes');

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/device-types', deviceTypeRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/models', modelRoutes);
app.use('/api/parts', partRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes); 