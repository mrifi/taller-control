import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, Mail } from 'lucide-react';
import { forgotPassword } from '../services/authService.js';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const response = await forgotPassword(email);
      setMessage(response.message || 'Si el email existe, recibiras instrucciones para recuperar la contrasena.');
    } catch {
      setMessage('Si el email existe, recibiras instrucciones para recuperar la contrasena.');
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
            <span>Recuperacion de acceso</span>
          </div>
        </div>

        <div className="login-heading">
          <p className="eyebrow">Cuenta privada</p>
          <h1>Recuperar contrasena</h1>
          <p>Introduce tu email y te enviaremos instrucciones para crear una nueva contrasena.</p>
        </div>

        {message ? <div className="success-panel">{message}</div> : null}
        {error ? <div className="alert-error">{error}</div> : null}

        <form className="login-form" onSubmit={handleSubmit}>
          <label>
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
            />
          </label>

          <button className="primary-button login-submit" type="submit" disabled={loading}>
            <Mail size={17} />
            <span>{loading ? 'Enviando...' : 'Enviar instrucciones'}</span>
          </button>
        </form>

        <Link className="auth-link" to="/login">
          Volver al login
        </Link>
      </section>
    </main>
  );
}

export default ForgotPassword;
