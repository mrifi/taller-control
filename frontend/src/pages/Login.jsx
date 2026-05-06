import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { BarChart3, Lock } from 'lucide-react';
import { isAuthenticated, login } from '../services/authService.js';

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '', rememberMe: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (isAuthenticated()) {
    return <Navigate to="/dashboard" replace />;
  }

  const redirectTo = location.state?.from?.pathname || '/dashboard';

  const handleChange = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(form.email, form.password, form.rememberMe);
      navigate(redirectTo, { replace: true });
    } catch (requestError) {
      setError(getErrorMessage(requestError));
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
            <span>Acceso seguro</span>
          </div>
        </div>

        <div className="login-heading">
          <p className="eyebrow">Panel privado</p>
          <h1>Inicia sesion</h1>
          <p>Accede al dashboard financiero y gestiona tus movimientos.</p>
        </div>

        {error ? <div className="alert-error">{error}</div> : null}

        <form className="login-form" onSubmit={handleSubmit}>
          <label>
            <span>Email</span>
            <input
              type="email"
              value={form.email}
              onChange={(event) => handleChange('email', event.target.value)}
              autoComplete="email"
              required
            />
          </label>

          <label>
            <span>Contrasena</span>
            <input
              type="password"
              value={form.password}
              onChange={(event) => handleChange('password', event.target.value)}
              autoComplete="current-password"
              required
            />
          </label>

          <div className="login-options">
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={form.rememberMe}
                onChange={(event) => handleChange('rememberMe', event.target.checked)}
              />
              <span>Recordarme</span>
            </label>

            <Link className="auth-link" to="/forgot-password">
              He olvidado mi contrasena
            </Link>
          </div>

          <button className="primary-button login-submit" type="submit" disabled={loading}>
            <Lock size={17} />
            <span>{loading ? 'Entrando...' : 'Entrar'}</span>
          </button>
        </form>
      </section>
    </main>
  );
}

function getErrorMessage(error) {
  return error?.response?.data?.message || 'No se pudo iniciar sesion.';
}

export default Login;
