
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
