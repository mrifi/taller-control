import { useEffect, useState } from 'react';
import { Building2, KeyRound, Save, UserRound } from 'lucide-react';
import { setUser } from '../services/authService.js';
import { changePassword, getProfile, updateProfile } from '../services/profileService.js';

const initialProfileForm = {
  nombre: '',
  email: '',
  nombreEmpresa: ''
};

const initialPasswordForm = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
};

function Profile() {
  const [profile, setProfile] = useState(null);
  const [profileForm, setProfileForm] = useState(initialProfileForm);
  const [passwordForm, setPasswordForm] = useState(initialPasswordForm);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await getProfile();
      const data = response.data;
      setProfile(data);
      setProfileForm({
        nombre: data.usuario.nombre || '',
        email: data.usuario.email || '',
        nombreEmpresa: data.empresa.nombre || ''
      });
    } catch (requestError) {
      setError(requestError?.response?.data?.message || 'No se pudo cargar el perfil.');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileChange = (field, value) => {
    setProfileForm((current) => ({ ...current, [field]: value }));
  };

  const handlePasswordChange = (field, value) => {
    setPasswordForm((current) => ({ ...current, [field]: value }));
  };

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setSavingProfile(true);

    try {
      const response = await updateProfile(profileForm);
      setProfile(response.data);
      setUser(response.data.usuario);
      setSuccess(response.message || 'Perfil actualizado correctamente.');
    } catch (requestError) {
      setError(requestError?.response?.data?.message || 'No se pudo actualizar el perfil.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (passwordForm.newPassword.length < 8) {
      setPasswordError('La nueva contrasena debe tener al menos 8 caracteres.');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('Las contrasenas no coinciden.');
      return;
    }

    setSavingPassword(true);

    try {
      const response = await changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      setPasswordForm(initialPasswordForm);
      setPasswordSuccess(response.message || 'Contrasena actualizada correctamente.');
    } catch (requestError) {
      setPasswordError(requestError?.response?.data?.message || 'No se pudo cambiar la contrasena.');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <section className="module-page profile-page">
      <div className="module-toolbar">
        <div>
          <p className="eyebrow">Cuenta</p>
          <h2>Perfil y empresa</h2>
          <p>Gestiona los datos principales de acceso y la informacion visible de la empresa.</p>
        </div>
      </div>

      {loading ? <div className="loading-panel">Cargando perfil...</div> : null}
      {error ? <div className="alert-error">{error}</div> : null}
      {success ? <div className="success-panel">{success}</div> : null}

      {!loading && profile ? (
        <div className="profile-grid">
          <form className="profile-card" onSubmit={handleProfileSubmit}>
            <div className="profile-card-heading">
              <Building2 size={22} />
              <div>
                <h3>Empresa</h3>
                <p>Estos datos identifican el espacio de trabajo.</p>
              </div>
            </div>

            <label>
              <span>Nombre empresa</span>
              <input
                type="text"
                value={profileForm.nombreEmpresa}
                onChange={(event) => handleProfileChange('nombreEmpresa', event.target.value)}
                maxLength={150}
                required
              />
            </label>

            <div className="profile-divider" />

            <div className="profile-card-heading">
              <UserRound size={22} />
              <div>
                <h3>Usuario</h3>
                <p>Nombre y email usados para iniciar sesion.</p>
              </div>
            </div>

            <label>
              <span>Nombre usuario</span>
              <input
                type="text"
                value={profileForm.nombre}
                onChange={(event) => handleProfileChange('nombre', event.target.value)}
                maxLength={100}
                required
              />
            </label>

            <label>
              <span>Email</span>
              <input
                type="email"
                value={profileForm.email}
                onChange={(event) => handleProfileChange('email', event.target.value)}
                maxLength={150}
                required
              />
            </label>

            <button className="primary-button profile-action" type="submit" disabled={savingProfile}>
              <Save size={17} />
              <span>{savingProfile ? 'Guardando...' : 'Guardar perfil'}</span>
            </button>
          </form>

          <form className="profile-card" onSubmit={handlePasswordSubmit}>
            <div className="profile-card-heading">
              <KeyRound size={22} />
              <div>
                <h3>Contrasena</h3>
                <p>Cambia tu contrasena manteniendo la sesion actual activa.</p>
              </div>
            </div>

            {passwordError ? <div className="alert-error">{passwordError}</div> : null}
            {passwordSuccess ? <div className="success-panel">{passwordSuccess}</div> : null}

            <label>
              <span>Contrasena actual</span>
              <input
                type="password"
                value={passwordForm.currentPassword}
                onChange={(event) => handlePasswordChange('currentPassword', event.target.value)}
                autoComplete="current-password"
                required
              />
            </label>

            <label>
              <span>Nueva contrasena</span>
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={(event) => handlePasswordChange('newPassword', event.target.value)}
                autoComplete="new-password"
                required
              />
            </label>

            <label>
              <span>Confirmar contrasena</span>
              <input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(event) => handlePasswordChange('confirmPassword', event.target.value)}
                autoComplete="new-password"
                required
              />
            </label>

            <button className="primary-button profile-action" type="submit" disabled={savingPassword}>
              <KeyRound size={17} />
              <span>{savingPassword ? 'Actualizando...' : 'Cambiar contrasena'}</span>
            </button>
          </form>
        </div>
      ) : null}
    </section>
  );
}

export default Profile;
