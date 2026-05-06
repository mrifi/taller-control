const { getPool, sql } = require('../../config/db');
const AppError = require('../../utils/AppError');

const obtenerProfile = async ({ userId, empresaId }) => {
  const pool = await getPool();
  const result = await pool.request()
    .input('IDUsuario', sql.Int, userId)
    .input('IDEmpresa', sql.Int, empresaId)
    .query(`
      SELECT
        u.IDUsuario,
        u.Nombre AS UsuarioNombre,
        u.Email,
        u.Rol,
        u.PasswordHash,
        e.IDEmpresa,
        e.Nombre AS EmpresaNombre
      FROM dbo.Usuario u
      INNER JOIN dbo.Empresa e ON e.IDEmpresa = u.IDEmpresa
      WHERE u.IDUsuario = @IDUsuario
        AND u.IDEmpresa = @IDEmpresa
        AND u.Activo = 1
        AND e.Activa = 1
    `);

  return result.recordset?.[0] || null;
};

const existeEmailEnOtroUsuario = async ({ userId, email }) => {
  const pool = await getPool();
  const result = await pool.request()
    .input('IDUsuario', sql.Int, userId)
    .input('Email', sql.NVarChar(150), email)
    .query(`
      SELECT IDUsuario
      FROM dbo.Usuario
      WHERE Email = @Email
        AND IDUsuario <> @IDUsuario
    `);

  return (result.recordset || []).length > 0;
};

const actualizarProfile = async ({ userId, empresaId, nombre, email, nombreEmpresa }) => {
  const pool = await getPool();
  const transaction = pool.transaction();
  await transaction.begin();

  try {
    const usuarioResult = await transaction.request()
      .input('IDUsuario', sql.Int, userId)
      .input('IDEmpresa', sql.Int, empresaId)
      .input('Nombre', sql.NVarChar(100), nombre)
      .input('Email', sql.NVarChar(150), email)
      .query(`
        UPDATE dbo.Usuario
        SET Nombre = @Nombre,
            Email = @Email
        OUTPUT INSERTED.IDUsuario, INSERTED.Nombre, INSERTED.Email, INSERTED.Rol, INSERTED.IDEmpresa
        WHERE IDUsuario = @IDUsuario
          AND IDEmpresa = @IDEmpresa
      `);

    if (!usuarioResult.recordset?.[0]) {
      throw new AppError('Usuario no encontrado', 404);
    }

    const empresaResult = await transaction.request()
      .input('IDEmpresa', sql.Int, empresaId)
      .input('NombreEmpresa', sql.NVarChar(150), nombreEmpresa)
      .query(`
        UPDATE dbo.Empresa
        SET Nombre = @NombreEmpresa
        OUTPUT INSERTED.IDEmpresa, INSERTED.Nombre
        WHERE IDEmpresa = @IDEmpresa
      `);

    if (!empresaResult.recordset?.[0]) {
      throw new AppError('Empresa no encontrada', 404);
    }

    await transaction.commit();

    return {
      usuario: usuarioResult.recordset[0],
      empresa: empresaResult.recordset[0]
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const actualizarPassword = async ({ userId, empresaId, passwordHash }) => {
  const pool = await getPool();
  const result = await pool.request()
    .input('IDUsuario', sql.Int, userId)
    .input('IDEmpresa', sql.Int, empresaId)
    .input('PasswordHash', sql.NVarChar(255), passwordHash)
    .query(`
      UPDATE dbo.Usuario
      SET PasswordHash = @PasswordHash
      OUTPUT INSERTED.IDUsuario
      WHERE IDUsuario = @IDUsuario
        AND IDEmpresa = @IDEmpresa
    `);

  return result.recordset?.[0] || null;
};

module.exports = {
  actualizarPassword,
  actualizarProfile,
  existeEmailEnOtroUsuario,
  obtenerProfile
};
