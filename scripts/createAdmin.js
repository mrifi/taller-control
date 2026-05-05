require('dotenv').config();

const bcrypt = require('bcryptjs');
const { getPool, sql } = require('../src/config/db');

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@tallercontrol.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Cambiar123!';
const ADMIN_NAME = process.env.ADMIN_NAME || 'Administrador';

const ensureUsuarioTable = async (pool) => {
  await pool.request().query(`
    IF OBJECT_ID('dbo.Usuario', 'U') IS NULL
    BEGIN
      CREATE TABLE dbo.Usuario (
        IDUsuario INT IDENTITY(1,1) PRIMARY KEY,
        Nombre NVARCHAR(100) NOT NULL,
        Email NVARCHAR(150) NOT NULL UNIQUE,
        PasswordHash NVARCHAR(255) NOT NULL,
        Rol NVARCHAR(50) NOT NULL DEFAULT 'admin',
        Activo BIT NOT NULL DEFAULT 1,
        FechaCreacion DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
      );
    END
  `);
};

const createAdmin = async () => {
  const pool = await getPool();
  await ensureUsuarioTable(pool);

  const existing = await pool.request()
    .input('Email', sql.NVarChar(150), ADMIN_EMAIL)
    .query(`
      SELECT IDUsuario, Email
      FROM dbo.Usuario
      WHERE Email = @Email
    `);

  if (existing.recordset.length > 0) {
    console.log(`El usuario admin ya existe: ${ADMIN_EMAIL}`);
    return;
  }

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);

  const result = await pool.request()
    .input('Nombre', sql.NVarChar(100), ADMIN_NAME)
    .input('Email', sql.NVarChar(150), ADMIN_EMAIL)
    .input('PasswordHash', sql.NVarChar(255), passwordHash)
    .input('Rol', sql.NVarChar(50), 'admin')
    .query(`
      INSERT INTO dbo.Usuario (Nombre, Email, PasswordHash, Rol, Activo)
      OUTPUT INSERTED.IDUsuario, INSERTED.Nombre, INSERTED.Email, INSERTED.Rol, INSERTED.Activo
      VALUES (@Nombre, @Email, @PasswordHash, @Rol, 1)
    `);

  console.log('Usuario admin creado:', result.recordset[0]);
  console.log('Contrasena temporal:', ADMIN_PASSWORD);
};

createAdmin()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('No se pudo crear el usuario admin:', error);
    process.exit(1);
  });
