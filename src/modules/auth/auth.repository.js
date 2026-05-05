const { getPool, sql } = require('../../config/db');

const buscarPorEmail = async (email) => {
  const pool = await getPool();
  const result = await pool.request()
    .input('Email', sql.NVarChar(150), email)
    .query(`
      SELECT
        IDUsuario,
        Nombre,
        Email,
        PasswordHash,
        Rol,
        Activo
      FROM dbo.Usuario
      WHERE Email = @Email
    `);

  return result.recordset?.[0] || null;
};

module.exports = {
  buscarPorEmail
};
