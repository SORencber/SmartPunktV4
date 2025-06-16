const Activity = require('../models/Activity');

const logActivity = async (req, res, next) => {
  const originalSend = res.send;

  res.send = function (data) {
    // Store the original response data
    res.locals.responseData = data;

    // Call the original send function
    return originalSend.apply(res, arguments);
  };

  try {
    // Wait for the route handler to complete
    await next();

    // Get the response data
    const responseData = res.locals.responseData;
    let parsedData;
    try {
      parsedData = typeof responseData === 'string' ? JSON.parse(responseData) : responseData;
    } catch (e) {
      parsedData = responseData;
    }

    // Log the activity
    const activity = new Activity({
      user: {
        id: req.user._id,
        email: req.user.email,
        fullName: req.user.fullName
      },
      action: req.method,
      endpoint: req.originalUrl,
      status: res.statusCode,
      details: {
        requestBody: req.body,
        responseData: parsedData
      },
      ip: req.ip,
      userAgent: req.get('user-agent')
    });

    await activity.save();
  } catch (error) {
    console.error('Error logging activity:', error);
    // Don't block the response if logging fails
  }
};

module.exports = { logActivity }; 