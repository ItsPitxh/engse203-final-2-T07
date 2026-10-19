import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import LoansListPage from './pages/LoansListPage.jsx';
import LoanDetailPage from './pages/LoanDetailPage.jsx';
import NewLoanPage from './pages/NewLoanPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import { useAuth } from './hooks/useAuth.js';

function Nav() {
  const { isStaff, user, logout } = useAuth();
  return (
    <nav>
      <Link to="/">รายการ</Link>
      <Link to="/new">ยืมใหม่</Link>
      <Link to="/dashboard">สรุป</Link>
      {isStaff ? (
        <>
          <span>· {user.name}</span>
          <button onClick={logout}>ออกจากระบบ</button>
        </>
      ) : <Link to="/login">เข้าสู่ระบบ</Link>}
    </nav>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Nav />
      <Routes>
        <Route path="/" element={<LoansListPage />} />
        <Route path="/loans/:id" element={<LoanDetailPage />} />
        <Route path="/new" element={<NewLoanPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/login" element={<LoginPage />} />
      </Routes>
    </BrowserRouter>
  );
}