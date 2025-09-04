import AsyncStorage from '@react-native-async-storage/async-storage';

export interface LogEntry {
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  category: 'AUTH' | 'API' | 'NAVIGATION' | 'UI' | 'STORAGE' | 'NETWORK';
  message: string;
  data?: any;
  error?: any;
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000; // Keep last 1000 logs

  private addLog(level: LogEntry['level'], category: LogEntry['category'], message: string, data?: any, error?: any) {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      data,
      error: error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : undefined
    };

    this.logs.push(logEntry);
    
    // Keep only last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Also log to console for development
    const consoleMessage = `[${logEntry.timestamp}] [${level}] [${category}] ${message}`;
    if (level === 'ERROR') {
      console.error(consoleMessage, data, error);
    } else if (level === 'WARN') {
      console.warn(consoleMessage, data);
    } else {
      console.log(consoleMessage, data);
    }
  }

  info(category: LogEntry['category'], message: string, data?: any) {
    this.addLog('INFO', category, message, data);
  }

  warn(category: LogEntry['category'], message: string, data?: any) {
    this.addLog('WARN', category, message, data);
  }

  error(category: LogEntry['category'], message: string, data?: any, error?: any) {
    this.addLog('ERROR', category, message, data, error);
  }

  debug(category: LogEntry['category'], message: string, data?: any) {
    this.addLog('DEBUG', category, message, data);
  }

  // Get all logs
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  // Get logs by category
  getLogsByCategory(category: LogEntry['category']): LogEntry[] {
    return this.logs.filter(log => log.category === category);
  }

  // Get logs by level
  getLogsByLevel(level: LogEntry['level']): LogEntry[] {
    return this.logs.filter(log => log.level === level);
  }

  // Get recent logs (last N entries)
  getRecentLogs(count: number = 50): LogEntry[] {
    return this.logs.slice(-count);
  }

  // Clear logs
  clearLogs() {
    this.logs = [];
  }

  // Export logs as JSON
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  // Save logs to AsyncStorage
  async saveLogs() {
    try {
      await AsyncStorage.setItem('app_logs', JSON.stringify(this.logs));
    } catch (error) {
      console.error('Failed to save logs:', error);
    }
  }

  // Load logs from AsyncStorage
  async loadLogs() {
    try {
      const savedLogs = await AsyncStorage.getItem('app_logs');
      if (savedLogs) {
        this.logs = JSON.parse(savedLogs);
      }
    } catch (error) {
      console.error('Failed to load logs:', error);
    }
  }
}

export const logger = new Logger();

// Auto-save logs every 30 seconds
setInterval(() => {
  logger.saveLogs();
}, 30000);

// Load logs on startup
logger.loadLogs();
