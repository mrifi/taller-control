const sql = require('mssql');
require('dotenv').config();

const parseBoolean = (value, defaultValue) => {
  if (value === undefined) {
    return defaultValue;
  }

  return String(value).toLowerCase() === 'true';
};

const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  port: Number(process.env.DB_PORT || 1433),
  database: process.env.DB_DATABASE,
  options: {
    encrypt: parseBoolean(process.env.DB_ENCRYPT, true),
    trustServerCertificate: parseBoolean(process.env.DB_TRUST_SERVER_CERTIFICATE, false)
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

let poolPromise;

const getPool = async () => {
  if (!poolPromise) {
    if (process.env.NODE_ENV !== 'production') {
      console.log({
        sqlServer: dbConfig.server,
        database: dbConfig.database,
        user: dbConfig.user
      });
    }

    poolPromise = sql.connect(dbConfig).catch((error) => {
      if (process.env.NODE_ENV !== 'production') {
        console.error('SQL Server connection error:', {
          message: error.message,
          code: error.code,
          originalError: error.originalError,
          precedingErrors: error.precedingErrors
        });
      }

      poolPromise = undefined;
      throw error;
    });
  }

  return poolPromise;
};

module.exports = {
  sql,
  getPool
};
