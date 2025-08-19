/*
 * TECP Reference UI - Layout Component
 * 
 * Copyright 2024 TECP Working Group
 * Lead Architect: Ali Jakvani (v3ctor)
 * Contributors: TECP Community
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
}

const navigation = [
  { path: '/', label: 'Overview' },
  { path: '/verify', label: 'Verify' },
  { path: '/examples', label: 'Examples' },
  { path: '/gateway', label: 'Enterprise Gateway' },
  { path: '/spec', label: 'Specs' },
  { path: '/policies', label: 'Policies' },
  { path: '/log', label: 'Log' },
];

export function Layout({ children }: LayoutProps) {
  const location = useLocation();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header>
        <nav className="nav">
          <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h1 style={{ margin: 0, fontSize: '1.5rem', color: '#2196f3' }}>
                  TECP Protocol v0.1
                </h1>
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>
                  Making privacy violations mathematically impossible
                </p>
              </div>
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
          </div>
        </nav>
      </header>
      
      <main className="container" style={{ flex: 1, paddingBottom: '2rem' }}>
        {children}
      </main>
      
      <footer style={{ 
        backgroundColor: '#f5f5f5', 
        borderTop: '1px solid #ddd', 
        padding: '2rem 0',
        marginTop: 'auto'
      }}>
        <div className="container">
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
            gap: '2rem',
            marginBottom: '1.5rem'
          }}>
            <div>
              <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', color: '#333' }}>
                TECP Protocol
              </h3>
              <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#666' }}>
                Trusted Ephemeral Computation Protocol
              </p>
              <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#666' }}>
                Making privacy violations mathematically impossible
              </p>
              <p style={{ margin: '0', fontSize: '0.9rem', color: '#666' }}>
                Version 0.1 - Production Ready
              </p>
            </div>
            
            <div>
              <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', color: '#333' }}>
                Architecture & Credits
              </h3>
              <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#666' }}>
                <strong>Lead Architect:</strong> Ali Jakvani
              </p>
              <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#666' }}>
                <strong>Contributors:</strong> TECP Community
              </p>
              <p style={{ margin: '0', fontSize: '0.9rem', color: '#666' }}>
                <strong>Test Coverage:</strong> 95%+ with interoperability validation
              </p>
            </div>
            
            <div>
              <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', color: '#333' }}>
                Resources
              </h3>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                <li style={{ marginBottom: '0.5rem' }}>
                  <a 
                    href="https://github.com/resetroot99/tecp" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ fontSize: '0.9rem', color: '#2196f3', textDecoration: 'none' }}
                  >
                    GitHub Repository
                  </a>
                </li>
                <li style={{ marginBottom: '0.5rem' }}>
                  <Link 
                    to="/spec/protocol" 
                    style={{ fontSize: '0.9rem', color: '#2196f3', textDecoration: 'none' }}
                  >
                    Protocol Specification
                  </Link>
                </li>
                <li style={{ marginBottom: '0.5rem' }}>
                  <Link 
                    to="/spec/threat-model" 
                    style={{ fontSize: '0.9rem', color: '#2196f3', textDecoration: 'none' }}
                  >
                    Threat Model
                  </Link>
                </li>
                <li style={{ marginBottom: '0.5rem' }}>
                  <a 
                    href="mailto:contact@tecp.dev" 
                    style={{ fontSize: '0.9rem', color: '#2196f3', textDecoration: 'none' }}
                  >
                    Contact
                  </a>
                </li>
              </ul>
            </div>
          </div>
          
          <div style={{ 
            borderTop: '1px solid #ddd', 
            paddingTop: '1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div style={{ fontSize: '0.85rem', color: '#666' }}>
              <p style={{ margin: '0 0 0.25rem 0' }}>
                Copyright © 2024 TECP Working Group. All rights reserved.
              </p>
              <p style={{ margin: 0 }}>
                Licensed under the{' '}
                <a 
                  href="http://www.apache.org/licenses/LICENSE-2.0" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ color: '#2196f3', textDecoration: 'none' }}
                >
                  Apache License 2.0
                </a>
                {' '}(implementation) and{' '}
                <a 
                  href="https://creativecommons.org/licenses/by/4.0/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ color: '#2196f3', textDecoration: 'none' }}
                >
                  CC BY 4.0
                </a>
                {' '}(specification)
              </p>
            </div>
            
            <div style={{ fontSize: '0.85rem', color: '#666', textAlign: 'right' }}>
              <p style={{ margin: '0 0 0.25rem 0' }}>
                <strong>Performance:</strong> Receipt creation ~3ms, verification ~1ms
              </p>
              <p style={{ margin: 0 }}>
                <strong>Security:</strong> Ed25519 + CBOR deterministic signing
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
