import { NavLink } from 'react-router-dom';
import {
  BarChart3,
  CircleDollarSign,
  ClipboardList,
  FileText,
  Gauge,
  Warehouse
} from 'lucide-react';

const menuItems = [
  { label: 'Dashboard', icon: Gauge, to: '/dashboard' },
  { label: 'Ingresos', icon: CircleDollarSign, to: '/ingresos' },
  { label: 'Gastos', icon: ClipboardList, to: '/gastos' },
  { label: 'Talleres', icon: Warehouse, to: '/talleres' },
  { label: 'Reportes', icon: FileText, to: '/reportes' }
];

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">
          <BarChart3 size={22} />
        </div>
        <div>
          <strong>Taller Control</strong>
          <span>Finance OS</span>
        </div>
      </div>

      <nav className="sidebar-nav" aria-label="Principal">
        {menuItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.label}
              to={item.to}
              className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}

export default Sidebar;
