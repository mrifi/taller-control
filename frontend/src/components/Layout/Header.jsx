import { Bell, Search } from 'lucide-react';

function Header() {
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
        <button className="icon-button" type="button" aria-label="Notificaciones">
          <Bell size={18} />
        </button>
      </div>
    </header>
  );
}

export default Header;
