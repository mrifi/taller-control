require('dotenv').config();

const { getPool } = require('../src/config/db');

const migrationSql = `
SET XACT_ABORT ON;

BEGIN TRANSACTION;

IF OBJECT_ID('dbo.Empresa', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.Empresa (
    IDEmpresa INT IDENTITY(1,1) PRIMARY KEY,
    Nombre NVARCHAR(150) NOT NULL,
    Slug NVARCHAR(100) NULL,
    Activa BIT NOT NULL CONSTRAINT DF_Empresa_Activa DEFAULT 1,
    FechaCreacion DATETIME2 NOT NULL CONSTRAINT DF_Empresa_FechaCreacion DEFAULT SYSUTCDATETIME()
  );
END;

IF COL_LENGTH('dbo.Empresa', 'Slug') IS NULL ALTER TABLE dbo.Empresa ADD Slug NVARCHAR(100) NULL;

IF NOT EXISTS (SELECT 1 FROM dbo.Empresa WHERE IDEmpresa = 1)
BEGIN
  SET IDENTITY_INSERT dbo.Empresa ON;
  EXEC('INSERT INTO dbo.Empresa (IDEmpresa, Nombre, Slug, Activa) VALUES (1, N''Neumáticos Idriss'', N''neumaticos-idriss'', 1)');
  SET IDENTITY_INSERT dbo.Empresa OFF;
END;

EXEC('
  UPDATE dbo.Empresa
  SET Nombre = N''Neumáticos Idriss'',
      Slug = N''neumaticos-idriss'',
      Activa = 1
  WHERE IDEmpresa = 1
');

IF COL_LENGTH('dbo.Usuario', 'IDEmpresa') IS NULL ALTER TABLE dbo.Usuario ADD IDEmpresa INT NULL;
IF COL_LENGTH('dbo.Taller', 'IDEmpresa') IS NULL ALTER TABLE dbo.Taller ADD IDEmpresa INT NULL;
IF COL_LENGTH('dbo.TipoIngreso', 'IDEmpresa') IS NULL ALTER TABLE dbo.TipoIngreso ADD IDEmpresa INT NULL;
IF COL_LENGTH('dbo.TipoGasto', 'IDEmpresa') IS NULL ALTER TABLE dbo.TipoGasto ADD IDEmpresa INT NULL;
IF COL_LENGTH('dbo.Ingreso', 'IDEmpresa') IS NULL ALTER TABLE dbo.Ingreso ADD IDEmpresa INT NULL;
IF COL_LENGTH('dbo.Gasto', 'IDEmpresa') IS NULL ALTER TABLE dbo.Gasto ADD IDEmpresa INT NULL;

EXEC('UPDATE dbo.Usuario SET IDEmpresa = 1 WHERE IDEmpresa IS NULL');
EXEC('UPDATE dbo.Taller SET IDEmpresa = 1 WHERE IDEmpresa IS NULL');
EXEC('UPDATE dbo.TipoIngreso SET IDEmpresa = 1 WHERE IDEmpresa IS NULL');
EXEC('UPDATE dbo.TipoGasto SET IDEmpresa = 1 WHERE IDEmpresa IS NULL');
EXEC('UPDATE dbo.Ingreso SET IDEmpresa = 1 WHERE IDEmpresa IS NULL');
EXEC('UPDATE dbo.Gasto SET IDEmpresa = 1 WHERE IDEmpresa IS NULL');

EXEC('
  IF NOT EXISTS (SELECT 1 FROM dbo.Usuario WHERE Email = N''neumaticosidriss@email.com'')
  BEGIN
    UPDATE dbo.Usuario
    SET Email = N''neumaticosidriss@email.com'',
        Nombre = N''Neumáticos Idriss'',
        Rol = N''OWNER'',
        IDEmpresa = 1,
        Activo = 1
    WHERE Email IN (N''admin@tallercontrol.com'', N''admin@email.com'')
       OR IDUsuario = (
         SELECT TOP 1 IDUsuario
         FROM dbo.Usuario
         WHERE IDEmpresa = 1
         ORDER BY IDUsuario
       )
  END

  UPDATE dbo.Usuario
  SET Nombre = N''Neumáticos Idriss'',
      Rol = N''OWNER'',
      IDEmpresa = 1,
      Activo = 1
  WHERE Email = N''neumaticosidriss@email.com''
');

EXEC('
  UPDATE dbo.Usuario
  SET Rol = N''OWNER''
  WHERE IDEmpresa = 1
    AND Rol IN (N''admin'', N''ADMIN'', N''owner'', N''Owner'')
');

IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Usuario') AND name = 'IDEmpresa' AND is_nullable = 1)
  EXEC('ALTER TABLE dbo.Usuario ALTER COLUMN IDEmpresa INT NOT NULL');
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Taller') AND name = 'IDEmpresa' AND is_nullable = 1)
  EXEC('ALTER TABLE dbo.Taller ALTER COLUMN IDEmpresa INT NOT NULL');
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.TipoIngreso') AND name = 'IDEmpresa' AND is_nullable = 1)
  EXEC('ALTER TABLE dbo.TipoIngreso ALTER COLUMN IDEmpresa INT NOT NULL');
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.TipoGasto') AND name = 'IDEmpresa' AND is_nullable = 1)
  EXEC('ALTER TABLE dbo.TipoGasto ALTER COLUMN IDEmpresa INT NOT NULL');
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Ingreso') AND name = 'IDEmpresa' AND is_nullable = 1)
  EXEC('ALTER TABLE dbo.Ingreso ALTER COLUMN IDEmpresa INT NOT NULL');
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Gasto') AND name = 'IDEmpresa' AND is_nullable = 1)
  EXEC('ALTER TABLE dbo.Gasto ALTER COLUMN IDEmpresa INT NOT NULL');

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_Usuario_Empresa')
  ALTER TABLE dbo.Usuario ADD CONSTRAINT FK_Usuario_Empresa FOREIGN KEY (IDEmpresa) REFERENCES dbo.Empresa(IDEmpresa);
IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_Taller_Empresa')
  ALTER TABLE dbo.Taller ADD CONSTRAINT FK_Taller_Empresa FOREIGN KEY (IDEmpresa) REFERENCES dbo.Empresa(IDEmpresa);
IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_TipoIngreso_Empresa')
  ALTER TABLE dbo.TipoIngreso ADD CONSTRAINT FK_TipoIngreso_Empresa FOREIGN KEY (IDEmpresa) REFERENCES dbo.Empresa(IDEmpresa);
IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_TipoGasto_Empresa')
  ALTER TABLE dbo.TipoGasto ADD CONSTRAINT FK_TipoGasto_Empresa FOREIGN KEY (IDEmpresa) REFERENCES dbo.Empresa(IDEmpresa);
IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_Ingreso_Empresa')
  ALTER TABLE dbo.Ingreso ADD CONSTRAINT FK_Ingreso_Empresa FOREIGN KEY (IDEmpresa) REFERENCES dbo.Empresa(IDEmpresa);
IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_Gasto_Empresa')
  ALTER TABLE dbo.Gasto ADD CONSTRAINT FK_Gasto_Empresa FOREIGN KEY (IDEmpresa) REFERENCES dbo.Empresa(IDEmpresa);

COMMIT TRANSACTION;
`;

const migrate = async () => {
  const pool = await getPool();
  await pool.request().batch(migrationSql);
  console.log('Migracion multiempresa aplicada correctamente.');
};

migrate()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('No se pudo aplicar la migracion multiempresa:', error);
    process.exit(1);
  });
