/*
 * Copyright 2024 TECP Working Group
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

import { useState, useEffect } from 'react';

export function ProtocolSpec() {
  const [content, setContent] = useState<string>('Loading...');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetch('http://localhost:3000/PROTOCOL.md')
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return response.text();
      })
      .then(text => {
        setContent(text);
      })
      .catch(err => {
        setError(`Failed to load protocol specification: ${err.message}`);
        setContent('');
      });
  }, []);

  if (error) {
    return (
      <div>
        <h1>Protocol Specification</h1>
        <div className="alert alert-error">
          {error}
        </div>
        <p>
          The protocol specification should be available at{' '}
          <a href="http://localhost:3000/PROTOCOL.md" target="_blank" rel="noopener noreferrer">
            http://localhost:3000/PROTOCOL.md
          </a>
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1>Protocol Specification</h1>
      
      <section className="section">
        <div className="spec-content">
          <pre style={{ 
            whiteSpace: 'pre-wrap', 
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
            fontSize: '14px',
            lineHeight: '1.5',
            backgroundColor: '#f8f8f8',
            padding: '1.5rem',
            borderRadius: '6px',
            overflow: 'auto'
          }}>
            {content}
          </pre>
        </div>
      </section>

      <section className="section">
        <h2>Related Documents</h2>
        <ul>
          <li><a href="/spec/threat-model">Threat Model</a></li>
          <li><a href="/spec/test-vectors">Test Vectors</a></li>
          <li><a href="/policies">Policy Registry</a></li>
        </ul>
      </section>
    </div>
  );
}
