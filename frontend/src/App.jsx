import { useEffect, useRef, useState } from 'react';
import { BrowserRouter, Link, Navigate, NavLink, Outlet, Route, Routes, useLocation } from 'react-router-dom';
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
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const touchStartXRef = useRef(null);
  const touchStartYRef = useRef(null);

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  function handleLogout() {
    setIsSidebarOpen(false);
    logout();
  }

  function handleTouchStart(event) {
    if (event.touches.length !== 1) {
      touchStartXRef.current = null;
      touchStartYRef.current = null;
      return;
    }

    const touch = event.touches[0];
    touchStartXRef.current = touch.clientX;
    touchStartYRef.current = touch.clientY;
  }

  function handleTouchEnd(event) {
    if (touchStartXRef.current == null || touchStartYRef.current == null || event.changedTouches.length !== 1) {
      return;
    }

    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - touchStartXRef.current;
    const deltaY = touch.clientY - touchStartYRef.current;
    const horizontalMove = Math.abs(deltaX);
    const verticalMove = Math.abs(deltaY);
    const isHorizontalSwipe = horizontalMove > 60 && horizontalMove > verticalMove * 1.4;

    if (!isHorizontalSwipe) {
      touchStartXRef.current = null;
      touchStartYRef.current = null;
      return;
    }

    const startedNearLeftEdge = touchStartXRef.current < 36;

    if (!isSidebarOpen && deltaX > 0 && startedNearLeftEdge) {
      setIsSidebarOpen(true);
    }

    if (isSidebarOpen && deltaX < 0) {
      setIsSidebarOpen(false);
    }

    touchStartXRef.current = null;
    touchStartYRef.current = null;
  }

  return (
    <div
      className={`layout ${isSidebarOpen ? 'sidebar-open' : ''}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-top">
          <Link to="/dashboard" className="brand-link">
            <h1>Parivartan Academy</h1>
          </Link>
          <button
            className="mobile-close-btn"
            type="button"
            onClick={() => setIsSidebarOpen(false)}
            aria-label="Close menu"
          >
            Close
          </button>
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
                onClick={() => setIsSidebarOpen(false)}
              >
                <span className="nav-btn-tag">{item.tag}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
        </nav>
        <button className="btn secondary logout" onClick={handleLogout}>
          Logout
        </button>
      </aside>
      {isSidebarOpen ? (
        <button
          className="sidebar-backdrop"
          type="button"
          onClick={() => setIsSidebarOpen(false)}
          aria-label="Close sidebar"
        />
      ) : null}
      <section className="content">
        <div className="mobile-topbar">
          <button className="mobile-menu-btn" type="button" onClick={() => setIsSidebarOpen(true)}>
            Menu
          </button>
          <Link to="/dashboard" className="mobile-brand-link">
            Parivartan Academy
          </Link>
        </div>
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
