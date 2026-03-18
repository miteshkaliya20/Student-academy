import { BrowserRouter, Link, Navigate, NavLink, Outlet, Route, Routes } from 'react-router-dom';
import './App.scss';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import AddStudent from './pages/AddStudent';
import Batches from './pages/Batches';
import Fees from './pages/Fees';
import Exams from './pages/Exams';
import Admissions from './pages/Admissions';
import Login from './pages/Login';
import PublicAdmission from './pages/PublicAdmission';
import StudentLogin from './pages/StudentLogin';
import StudentPortal from './pages/StudentPortal';
import { AuthProvider } from './context/AuthContext';
import { AcademyProvider } from './context/AcademyContext';
import { useAuth } from './hooks/useAuth';

const navItems = [
  { label: 'Dashboard', path: '/dashboard', tag: 'DB' },
  { label: 'Students', path: '/students', tag: 'ST' },
  { label: 'Batches', path: '/batches', tag: 'BT' },
  { label: 'Fees', path: '/fees', tag: 'FE' },
  { label: 'Exams', path: '/exams', tag: 'EX' },
  { label: 'Admissions', path: '/admissions', adminOnly: true, tag: 'AD' },
];

function Layout() {
  const { user, logout } = useAuth();
  const isAdmin = user?.role === 'Admin';

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-top">
          <Link to="/dashboard" className="brand-link">
            <h1>Parivartan Academy</h1>
          </Link>
          <p className="sidebar-subtitle">Admin & Student Operations</p>
        </div>

        <section className="sidebar-user-card">
          <p className="sidebar-user-name">{user.name}</p>
          <p className="sidebar-user-role">Role: {user.role}</p>
        </section>

        <nav>
          {navItems
            .filter((item) => !item.adminOnly || isAdmin)
            .map((item) => (
              <NavLink
                key={item.path}
                className={({ isActive }) => `nav-btn ${isActive ? 'active' : ''}`}
                to={item.path}
              >
                <span className="nav-btn-tag">{item.tag}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
        </nav>
        <button className="btn secondary logout" onClick={logout}>
          Logout
        </button>
      </aside>
      <section className="content">
        <div className="content-shell">
          <Outlet />
        </div>
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
      <Route path="/admission" element={<PublicAdmission />} />
      <Route path="/student/login" element={<StudentLogin />} />
      <Route path="/student/portal" element={<StudentPortal />} />

      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/students" element={<Students />} />
        <Route path="/students/add" element={isAdmin ? <AddStudent /> : <Navigate to="/students" replace />} />
        <Route path="/batches" element={<Batches />} />
        <Route path="/fees" element={<Fees />} />
        <Route path="/exams" element={<Exams />} />
        <Route path="/admissions" element={isAdmin ? <Admissions /> : <Navigate to="/dashboard" replace />} />
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
