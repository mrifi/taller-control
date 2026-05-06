import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { BarChart3, Lock } from 'lucide-react';
import { resetPassword } from '../services/authService.js';

function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = useMemo(() => searchParams.get('email') || '', [searchParams]);
  const token = useMemo(() => searchParams.get('token') || '', [searchParams]);
  const [form, setForm] = useState({ newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleChange = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');

    if (!email || !token) {
      setError('El enlace de recuperacion no es valido.');
      return;
    }

    if (form.newPassword.length < 8) {
      setError('La nueva contrasena debe tener al menos 8 caracteres.');
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      setError('Las contrasenas no coinciden.');
      return;
    }

    setLoading(true);

    try {
      await resetPassword({ email, token, newPassword: form.newPassword });
      setMessage('Contrasena actualizada correctamente. Redirigiendo al login...');
      window.setTimeout(() => navigate('/login', { replace: true }), 1200);
    } catch (requestError) {
      setError(requestError?.response?.data?.message || 'No se pudo actualizar la contrasena.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">
      <section className="login-panel">
        <div className="login-brand">
          <div className="brand-mark">
            <BarChart3 size={24} />
          </div>
          <div>
            <strong>Taller Control</strong>
            <span>Nuevo acceso</span>
          </div>
        </div>

        <div className="login-heading">
          <p className="eyebrow">Cuenta privada</p>
          <h1>Nueva contrasena</h1>
          <p>Crea una nueva contrasena para volver a entrar en tu panel.</p>
        </div>

        {message ? <div className="success-panel">{message}</div> : null}
        {error ? <div className="alert-error">{error}</div> : null}

        <form className="login-form" onSubmit={handleSubmit}>
          <label>
            <span>Nueva contrasena</span>
            <input
              type="password"
              value={form.newPassword}
              onChange={(event) => handleChange('newPassword', event.target.value)}
              autoComplete="new-password"
              required
            />
          </label>

          <label>
            <span>Confirmar contrasena</span>
            <input
              type="password"
              value={form.confirmPassword}
              onChange={(event) => handleChange('confirmPassword', event.target.value)}
              autoComplete="new-password"
              required
            />
          </label>

          <button className="primary-button login-submit" type="submit" disabled={loading}>
            <Lock size={17} />
            <span>{loading ? 'Guardando...' : 'Cambiar contrasena'}</span>
          </button>
        </form>

        <Link className="auth-link" to="/login">
          Volver al login
        </Link>
      </section>
    </main>
  );
}

export default ResetPassword;
