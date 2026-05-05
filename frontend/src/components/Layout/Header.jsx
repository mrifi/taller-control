import { LogOut, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getUser, logout } from '../../services/authService.js';

function Header() {
  const navigate = useNavigate();
  const user = getUser();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="topbar">
      <div>
        <p className="eyebrow">Panel de control</p>
        <h1>Dashboard financiero</h1>
      </div>

      <div className="topbar-actions">
        <div className="search-box">
          <Search size={17} />
          <span>Buscar movimientos</span>
        </div>
        {user ? (
          <div className="user-chip">
            <span>{user.nombre}</span>
            <small>{user.rol}</small>
          </div>
        ) : null}
        <button className="icon-button" type="button" aria-label="Cerrar sesion" onClick={handleLogout}>
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}

export default Header;
