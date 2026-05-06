const { getPool, sql } = require('../../config/db');

const buscarPorEmail = async (email) => {
  const pool = await getPool();
  const result = await pool.request()
    .input('Email', sql.NVarChar(150), email)
    .query(`
      SELECT
        IDUsuario,
        IDEmpresa,
        Nombre,
        Email,
        PasswordHash,
        Rol,
        Activo,
        PasswordResetTokenHash,
        PasswordResetExpires
      FROM dbo.Usuario
      WHERE Email = @Email
    `);

  return result.recordset?.[0] || null;
};

const guardarResetPassword = async ({ email, tokenHash, expiresAt }) => {
  const pool = await getPool();
  await pool.request()
    .input('Email', sql.NVarChar(150), email)
    .input('PasswordResetTokenHash', sql.NVarChar(255), tokenHash)
    .input('PasswordResetExpires', sql.DateTime2, expiresAt)
    .query(`
      UPDATE dbo.Usuario
      SET PasswordResetTokenHash = @PasswordResetTokenHash,
          PasswordResetExpires = @PasswordResetExpires
      WHERE Email = @Email
    `);
};

const actualizarPasswordPorReset = async ({ email, passwordHash }) => {
  const pool = await getPool();
  const result = await pool.request()
    .input('Email', sql.NVarChar(150), email)
    .input('PasswordHash', sql.NVarChar(255), passwordHash)
    .query(`
      UPDATE dbo.Usuario
      SET PasswordHash = @PasswordHash,
          PasswordResetTokenHash = NULL,
          PasswordResetExpires = NULL
      OUTPUT INSERTED.IDUsuario
      WHERE Email = @Email
    `);

  return result.recordset?.[0] || null;
};

module.exports = {
  actualizarPasswordPorReset,
  buscarPorEmail,
  guardarResetPassword
};
