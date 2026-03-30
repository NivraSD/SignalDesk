// Production-safe logger utility
const isDevelopment = process.env.NODE_ENV === 'development';
const isDebugEnabled = process.env.REACT_APP_DEBUG === 'true';

const logger = {
  log: (...args) => {
    if (isDevelopment || isDebugEnabled) {
      console.log(...args);
    }
  },
  
  error: (...args) => {
    // Always log errors, even in production
    console.error(...args);
  },
  
  warn: (...args) => {
    if (isDevelopment || isDebugEnabled) {
      console.warn(...args);
    }
  },
  
  info: (...args) => {
    if (isDevelopment || isDebugEnabled) {
      console.info(...args);
    }
  },
  
  debug: (...args) => {
    if (isDevelopment || isDebugEnabled) {
      console.debug(...args);
    }
  },
  
  table: (...args) => {
    if (isDevelopment || isDebugEnabled) {
      console.table(...args);
    }
  }
};

export default logger;