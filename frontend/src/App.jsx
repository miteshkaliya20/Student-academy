import { BrowserRouter, Link, Navigate, NavLink, Outlet, Route, Routes } from 'react-router-dom';
import './App.css';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import AddStudent from './pages/AddStudent';
import Batches from './pages/Batches';
import Fees from './pages/Fees';
import Exams from './pages/Exams';
import Login from './pages/Login';
import { AuthProvider } from './context/AuthContext';
import { AcademyProvider } from './context/AcademyContext';
import { useAuth } from './hooks/useAuth';

const navItems = [
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Students', path: '/students' },
  { label: 'Batches', path: '/batches' },
  { label: 'Fees', path: '/fees' },
  { label: 'Exams', path: '/exams' },
];

function Layout() {
  const { user, logout } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="layout">
      <aside className="sidebar">
        <Link to="/dashboard" className="brand-link">
          <h1>Student Academy</h1>
        </Link>
        <p>{user.name}</p>
        <p className="muted">Role: {user.role}</p>
        <nav>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              className={({ isActive }) => `nav-btn ${isActive ? 'active' : ''}`}
              to={item.path}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <button className="btn secondary logout" onClick={logout}>
          Logout
        </button>
      </aside>
      <section className="content">
        <Outlet />
      </section>
    </div>
  );
}

function AppRoutes() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'Admin';

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />

      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/students" element={<Students />} />
        <Route path="/students/add" element={isAdmin ? <AddStudent /> : <Navigate to="/students" replace />} />
        <Route path="/batches" element={<Batches />} />
        <Route path="/fees" element={<Fees />} />
        <Route path="/exams" element={<Exams />} />
      </Route>

      <Route path="*" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AcademyProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AcademyProvider>
    </AuthProvider>
  );
}
