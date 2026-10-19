import { Routes, Route } from 'react-router-dom';
import AppLayout from './pages/AppLayout.jsx';
import LoansListPage from './pages/LoansListPage.jsx';
import LoanDetailPage from './pages/LoanDetailPage.jsx';
import NewLoanPage from './pages/NewLoanPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<LoansListPage />} />
        <Route path="loans/:id" element={<LoanDetailPage />} />
        <Route path="new" element={<NewLoanPage />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}