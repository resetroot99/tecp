import React from 'react';
import { Link, useLocation } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
}

const navigation = [
  { path: '/', label: 'Overview' },
  { path: '/verify', label: 'Verify' },
  { path: '/examples', label: 'Examples' },
  { path: '/spec', label: 'Specs' },
  { path: '/policies', label: 'Policies' },
  { path: '/log', label: 'Log' },
];

export function Layout({ children }: LayoutProps) {
  const location = useLocation();

  return (
    <div>
      <nav className="nav">
        <div className="container">
          <ul className="nav-list">
            {navigation.map(({ path, label }) => (
              <li key={path}>
                <Link
                  to={path}
                  className={`nav-link ${location.pathname === path || location.pathname.startsWith(`${path}/`) ? 'active' : ''}`}
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>
      <main className="container">
        {children}
      </main>
    </div>
  );
}
