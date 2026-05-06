require('dotenv').config();

const { getPool } = require('../src/config/db');

const migrationSql = `
IF COL_LENGTH('dbo.Usuario', 'PasswordResetTokenHash') IS NULL
  ALTER TABLE dbo.Usuario ADD PasswordResetTokenHash NVARCHAR(255) NULL;

IF COL_LENGTH('dbo.Usuario', 'PasswordResetExpires') IS NULL
  ALTER TABLE dbo.Usuario ADD PasswordResetExpires DATETIME2 NULL;
`;

const migrate = async () => {
  const pool = await getPool();
  await pool.request().batch(migrationSql);
  console.log('Migracion de recuperacion de contrasena aplicada correctamente.');
};

migrate()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('No se pudo aplicar la migracion de recuperacion de contrasena:', error);
    process.exit(1);
  });
