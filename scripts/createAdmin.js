require('dotenv').config();

const bcrypt = require('bcryptjs');
const { getPool, sql } = require('../src/config/db');

const OWNER_EMAIL = process.env.OWNER_EMAIL || 'neumaticosidriss@email.com';
const OWNER_PASSWORD = process.env.OWNER_PASSWORD || process.env.ADMIN_PASSWORD || 'Cambiar123!';
const OWNER_NAME = process.env.OWNER_NAME || 'Neumáticos Idriss';

const ensureUsuarioTable = async (pool) => {
  await pool.request().query(`
    IF OBJECT_ID('dbo.Empresa', 'U') IS NULL
    BEGIN
      CREATE TABLE dbo.Empresa (
        IDEmpresa INT IDENTITY(1,1) PRIMARY KEY,
        Nombre NVARCHAR(150) NOT NULL,
        Slug NVARCHAR(100) NULL,
        Activa BIT NOT NULL DEFAULT 1,
        FechaCreacion DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
      );
    END;

    IF COL_LENGTH('dbo.Empresa', 'Slug') IS NULL
      ALTER TABLE dbo.Empresa ADD Slug NVARCHAR(100) NULL;

    IF NOT EXISTS (SELECT 1 FROM dbo.Empresa WHERE IDEmpresa = 1)
    BEGIN
      SET IDENTITY_INSERT dbo.Empresa ON;
      EXEC('INSERT INTO dbo.Empresa (IDEmpresa, Nombre, Slug, Activa) VALUES (1, N''Neumáticos Idriss'', N''neumaticos-idriss'', 1)');
      SET IDENTITY_INSERT dbo.Empresa OFF;
    END;

    EXEC('UPDATE dbo.Empresa SET Nombre = N''Neumáticos Idriss'', Slug = N''neumaticos-idriss'', Activa = 1 WHERE IDEmpresa = 1');

    IF OBJECT_ID('dbo.Usuario', 'U') IS NULL
    BEGIN
      CREATE TABLE dbo.Usuario (
        IDUsuario INT IDENTITY(1,1) PRIMARY KEY,
        IDEmpresa INT NOT NULL,
        Nombre NVARCHAR(100) NOT NULL,
        Email NVARCHAR(150) NOT NULL UNIQUE,
        PasswordHash NVARCHAR(255) NOT NULL,
        Rol NVARCHAR(50) NOT NULL DEFAULT 'OWNER',
        Activo BIT NOT NULL DEFAULT 1,
        FechaCreacion DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
      );
    END

    IF COL_LENGTH('dbo.Usuario', 'IDEmpresa') IS NULL
      ALTER TABLE dbo.Usuario ADD IDEmpresa INT NULL;

    EXEC('UPDATE dbo.Usuario SET IDEmpresa = 1 WHERE IDEmpresa IS NULL');
  `);
};

const createAdmin = async () => {
  const pool = await getPool();
  await ensureUsuarioTable(pool);

  const existing = await pool.request()
    .input('Email', sql.NVarChar(150), OWNER_EMAIL)
    .query(`
      SELECT IDUsuario, Email
      FROM dbo.Usuario
      WHERE Email = @Email
    `);

  if (existing.recordset.length > 0) {
    await pool.request()
      .input('Email', sql.NVarChar(150), OWNER_EMAIL)
      .input('Nombre', sql.NVarChar(100), OWNER_NAME)
      .query(`
        UPDATE dbo.Usuario
        SET IDEmpresa = 1,
            Nombre = @Nombre,
            Rol = 'OWNER',
            Activo = 1
        WHERE Email = @Email
      `);

    console.log(`El usuario OWNER ya existe y fue normalizado: ${OWNER_EMAIL}`);
    return;
  }

  const passwordHash = await bcrypt.hash(OWNER_PASSWORD, 12);

  const result = await pool.request()
    .input('Nombre', sql.NVarChar(100), OWNER_NAME)
    .input('Email', sql.NVarChar(150), OWNER_EMAIL)
    .input('PasswordHash', sql.NVarChar(255), passwordHash)
    .input('Rol', sql.NVarChar(50), 'OWNER')
    .query(`
      INSERT INTO dbo.Usuario (IDEmpresa, Nombre, Email, PasswordHash, Rol, Activo)
      OUTPUT INSERTED.IDUsuario, INSERTED.IDEmpresa, INSERTED.Nombre, INSERTED.Email, INSERTED.Rol, INSERTED.Activo
      VALUES (1, @Nombre, @Email, @PasswordHash, @Rol, 1)
    `);

  console.log('Usuario OWNER creado:', result.recordset[0]);
  console.log('Contrasena temporal:', OWNER_PASSWORD);
};

createAdmin()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('No se pudo crear el usuario admin:', error);
    process.exit(1);
  });
