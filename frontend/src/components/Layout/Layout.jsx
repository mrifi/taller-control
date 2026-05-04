import Header from './Header.jsx';
import Sidebar from './Sidebar.jsx';

function Layout({ children }) {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-shell">
        <Header />
        <main className="content-shell">{children}</main>
      </div>
    </div>
  );
}

export default Layout;
