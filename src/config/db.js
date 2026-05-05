const sql = require('mssql');
require('dotenv').config();

const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  port: Number(process.env.DB_PORT || 1433),
  database: process.env.DB_DATABASE,
  options: {
    encrypt: true,
    trustServerCertificate: false
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
    console.log({
      server: dbConfig.server,
      database: dbConfig.database,
      port: dbConfig.port,
      encrypt: dbConfig.options.encrypt,
      trustServerCertificate: dbConfig.options.trustServerCertificate
    });

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
