const express = require('express');
const router = express.Router();
const { logger } = require('../utils/logger');
const fs = require('fs').promises;
const path = require('path');
const { protect, authorize } = require('../middleware/auth');

// Get logs with pagination and filtering
router.get('/', protect, authorize('admin'), async (req, res, next) => {
  try {
    const { type, level, limit = 100, offset = 0 } = req.query;
    const logDir = path.join(__dirname, '..', 'logs');
    
    // Read the combined log file
    const logFile = path.join(logDir, 'combined.log');
    const logContent = await fs.readFile(logFile, 'utf-8');
    
    // Parse logs
    const logs = logContent
      .split('\n')
      .filter(Boolean)
      .map(line => {
        try {
          return JSON.parse(line);
        } catch (e) {
          logger.warn('Failed to parse log line', {
            line,
            error: {
              message: e.message,
              name: e.name
            }
          });
          return null;
        }
      })
      .filter(log => {
        if (!log) return false;
        if (type && log.type !== type) return false;
        if (level && log.level !== level) return false;
        return true;
      })
      .reverse() // Most recent first
      .slice(offset, offset + parseInt(limit));
    
    logger.info('Logs fetched successfully', {
      userId: req.user._id,
      type,
      level,
      limit,
      offset,
      count: logs.length
    });

    res.json(logs);
  } catch (error) {
    logger.error('Failed to fetch logs', {
      error: {
        message: error.message,
        name: error.name,
        stack: error.stack
      },
      userId: req.user._id,
      query: req.query
    });
    next(error);
  }
});

// Get error logs
router.get('/errors', protect, authorize('admin'), async (req, res, next) => {
  try {
    const { limit = 100, offset = 0 } = req.query;
    const logDir = path.join(__dirname, '..', 'logs');
    
    // Read the error log file
    const logFile = path.join(logDir, 'error.log');
    const logContent = await fs.readFile(logFile, 'utf-8');
    
    // Parse logs
    const logs = logContent
      .split('\n')
      .filter(Boolean)
      .map(line => {
        try {
          return JSON.parse(line);
        } catch (e) {
          logger.warn('Failed to parse error log line', {
            line,
            error: {
              message: e.message,
              name: e.name
            }
          });
          return null;
        }
      })
      .filter(Boolean)
      .reverse() // Most recent first
      .slice(offset, offset + parseInt(limit));
    
    logger.info('Error logs fetched successfully', {
      userId: req.user._id,
      limit,
      offset,
      count: logs.length
    });

    res.json(logs);
  } catch (error) {
    logger.error('Failed to fetch error logs', {
      error: {
        message: error.message,
        name: error.name,
        stack: error.stack
      },
      userId: req.user._id,
      query: req.query
    });
    next(error);
  }
});

// Clear logs (admin only)
router.delete('/', protect, authorize('admin'), async (req, res, next) => {
  try {
    const logDir = path.join(__dirname, '..', 'logs');
    const files = await fs.readdir(logDir);
    
    // Clear all log files
    await Promise.all(
      files.map(file => 
        fs.writeFile(path.join(logDir, file), '')
      )
    );
    
    logger.info('Logs cleared by admin', {
      userId: req.user._id,
      files: files.length
    });
    
    res.json({ message: 'Logs cleared successfully' });
  } catch (error) {
    logger.error('Failed to clear logs', {
      error: {
        message: error.message,
        name: error.name,
        stack: error.stack
      },
      userId: req.user._id
    });
    next(error);
  }
});

module.exports = router; 