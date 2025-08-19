
/*
 * TECP Reference UI - Main Application
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

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Overview } from './pages/Overview';
import { Verify } from './pages/Verify';
import { Examples } from './pages/Examples';
import { Policies } from './pages/Policies';
import { TransparencyLog } from './pages/TransparencyLog';
import { ProtocolSpec } from './pages/ProtocolSpec';
import { ThreatModel } from './pages/ThreatModel';
import { TestVectors } from './pages/TestVectors';
import { SpecIndex } from './pages/SpecIndex';
import { Gateway } from './pages/Gateway';
import { GatewayHealthcare } from './pages/GatewayHealthcare';
import { GatewayFinance } from './pages/GatewayFinance';
import { GatewayLegal } from './pages/GatewayLegal';
import { NotFound } from './pages/NotFound';
import './styles/reference.css';

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Layout>
        <Routes>
          <Route path="/" element={<Overview />} />
          <Route path="/verify" element={<Verify />} />
          <Route path="/examples" element={<Examples />} />
          <Route path="/policies" element={<Policies />} />
          <Route path="/gateway" element={<Gateway />} />
          <Route path="/gateway/healthcare" element={<GatewayHealthcare />} />
          <Route path="/gateway/finance" element={<GatewayFinance />} />
          <Route path="/gateway/legal" element={<GatewayLegal />} />
          <Route path="/log" element={<TransparencyLog />} />
          <Route path="/spec" element={<SpecIndex />} />
          <Route path="/spec/protocol" element={<ProtocolSpec />} />
          <Route path="/spec/threat-model" element={<ThreatModel />} />
          <Route path="/spec/test-vectors" element={<TestVectors />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
