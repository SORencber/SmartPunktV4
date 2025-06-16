type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  details?: any;
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs: number = 1000;
  private apiUrl: string;

  constructor() {
    // Use the same API URL as other API calls
    this.apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  }

  private log(level: LogLevel, message: string, details?: any) {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      details
    };

    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Always log to console in development
    const consoleMethod = level === 'debug' ? 'log' : level;
    console[consoleMethod](`[${entry.timestamp}] ${message}`, details || '');

    // Send to server in both development and production
      const token = localStorage.getItem('accessToken');
      fetch(`${this.apiUrl}/logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify(entry),
      }).catch(error => {
        // Only log to console if fetch fails
        console.error('Failed to send log to server:', error);
      });
  }

  info(message: string, details?: any) {
    this.log('info', message, details);
  }

  warn(message: string, details?: any) {
    this.log('warn', message, details);
  }

  error(message: string, details?: any) {
    this.log('error', message, details);
  }

  debug(message: string, details?: any) {
    this.log('debug', message, details);
  }

  getLogs() {
    return this.logs;
  }

  clearLogs() {
    this.logs = [];
  }
}

export const logger = new Logger(); 