import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';

const links = [
  ['/', 'รายการ'],
  ['/new', 'ยืมใหม่'],
  ['/dashboard', 'สรุป'],
];

const linkClass = ({ isActive }) => `nav-link${isActive ? ' active' : ''}`;

function AppHeader() {
  useLocation(); // วาดใหม่ทุกครั้งที่เปลี่ยนหน้า (เช่น หลัง login)
  const { isStaff, user, logout } = useAuth();

  return (
    <header className="site-header">
      <div className="container header-inner">
        <div>
          <p className="eyebrow">ENGSE203 • T07</p>
          <p className="brand">ยืม-คืนอุปกรณ์ชมรม</p>
        </div>
        <nav aria-label="เมนูหลัก">
          {links.map(([to, label]) => (
            <NavLink className={linkClass} end={to === '/'} key={to} to={to}>
              {label}
            </NavLink>
          ))}
          {isStaff ? (
            <>
              <span className="nav-user">{user.name}</span>
              <button type="button" className="nav-link" onClick={logout}>ออกจากระบบ</button>
            </>
          ) : (
            <NavLink className={linkClass} to="/login">เข้าสู่ระบบ</NavLink>
          )}
        </nav>
      </div>
    </header>
  );
}

export default AppHeader;