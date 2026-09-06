import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Cases from './pages/Cases';
import AddEditCase from './pages/AddEditCase';
import CaseDetail from './pages/CaseDetail';
import Search from './pages/Search';
import Reminders from './pages/Reminders';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/"              element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard"     element={<Dashboard />} />
        <Route path="/cases"         element={<Cases />} />
        <Route path="/cases/new"     element={<AddEditCase />} />
        <Route path="/cases/:id/edit" element={<AddEditCase />} />
        <Route path="/cases/:id"     element={<CaseDetail />} />
        <Route path="/search"        element={<Search />} />
        <Route path="/reminders"     element={<Reminders />} />
        <Route path="*"              element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
  );
}
