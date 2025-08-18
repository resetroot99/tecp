import { useState, useEffect } from 'react';

interface PolicyDefinition {
  description: string;
  enforcement_type: 'design' | 'infrastructure' | 'code_audit' | 'runtime' | 'cryptographic';
  machine_check: string;
  compliance_tags: string[];
  technical_details: string;
}

interface PolicyRegistry {
  $schema: string;
  version: string;
  description: string;
  policies: Record<string, PolicyDefinition>;
}

export function Policies() {
  const [registry, setRegistry] = useState<PolicyRegistry | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [selectedEnforcement, setSelectedEnforcement] = useState<string>('all');

  useEffect(() => {
    // Load policy registry
    fetch('http://localhost:3000/policy-registry.json')
      .then(response => response.json())
      .then(data => {
        setRegistry(data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Failed to load policy registry:', error);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div>Loading policy registry...</div>;
  }

  if (!registry) {
    return <div>Failed to load policy registry</div>;
  }

  const filteredPolicies = Object.entries(registry.policies).filter(([id, policy]) => {
    const matchesFilter = filter === '' || 
      id.toLowerCase().includes(filter.toLowerCase()) ||
      policy.description.toLowerCase().includes(filter.toLowerCase());
    
    const matchesEnforcement = selectedEnforcement === 'all' || 
      policy.enforcement_type === selectedEnforcement;
    
    return matchesFilter && matchesEnforcement;
  });

  const enforcementTypes = Array.from(new Set(Object.values(registry.policies).map(p => p.enforcement_type)));

  return (
    <div>
      <h1>TECP Policy Registry</h1>
      
      <div className="alert alert-info" style={{ backgroundColor: '#e3f2fd', border: '1px solid #2196f3', borderRadius: '4px', padding: '1rem', marginBottom: '2rem' }}>
        <strong>Apache License 2.0</strong> - This policy registry is licensed under the Apache License 2.0.
      </div>
      
      <section className="section">
        <h2>About TECP Policies</h2>
        <p>
          TECP policies are machine-readable rules that define privacy and security requirements for ephemeral computation.
          Each policy has a unique identifier and specifies enforcement mechanisms, compliance mappings, and technical requirements.
        </p>
        <p>
          Policies are cryptographically attested in TECP receipts, providing verifiable proof that specific privacy 
          guarantees were enforced during computation. This enables mathematical verification of compliance rather than 
          relying on trust-based assurances.
        </p>
      </section>
      
      <section className="section">
        <p>
          Machine-readable policy definitions with compliance framework mappings. 
          Policy IDs are referenced in TECP receipts to specify enforcement requirements.
        </p>
        <p>
          <strong>Registry Version:</strong> {registry.version} | 
          <strong> Schema:</strong> <a href={registry.$schema}>{registry.$schema}</a>
        </p>
      </section>

      <section className="section">
        <h2 className="section-title">Filters</h2>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
          <div className="form-field" style={{ flex: 1 }}>
            <label className="form-label" htmlFor="policy-filter">
              Search Policies
            </label>
            <input
              id="policy-filter"
              type="text"
              className="form-input"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter by ID or description..."
            />
          </div>
          <div className="form-field">
            <label className="form-label" htmlFor="enforcement-filter">
              Enforcement Type
            </label>
            <select
              id="enforcement-filter"
              className="form-select"
              value={selectedEnforcement}
              onChange={(e) => setSelectedEnforcement(e.target.value)}
            >
              <option value="all">All Types</option>
              {enforcementTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">Policy Definitions</h2>
        <p>
          <strong>{filteredPolicies.length}</strong> of <strong>{Object.keys(registry.policies).length}</strong> policies shown
        </p>
        
        <table className="table">
          <thead>
            <tr>
              <th>Policy ID</th>
              <th>Description</th>
              <th>Enforcement</th>
              <th>Machine Check</th>
              <th>Compliance Tags</th>
            </tr>
          </thead>
          <tbody>
            {filteredPolicies.map(([id, policy]) => (
              <tr key={id}>
                <td className="code-inline">{id}</td>
                <td>{policy.description}</td>
                <td>
                  <span className={`status-${policy.enforcement_type === 'design' ? 'pass' : 'warn'}`}>
                    {policy.enforcement_type}
                  </span>
                </td>
                <td className="code-inline">{policy.machine_check}</td>
                <td>
                  {policy.compliance_tags.map(tag => (
                    <span key={tag} className="code-inline" style={{ marginRight: '0.5rem' }}>
                      {tag}
                    </span>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="section">
        <h2 className="section-title">Policy Details</h2>
        {filteredPolicies.map(([id, policy]) => (
          <div key={id} className="card">
            <h3 className="code-inline">{id}</h3>
            <p><strong>Description:</strong> {policy.description}</p>
            <p><strong>Enforcement Type:</strong> {policy.enforcement_type}</p>
            <p><strong>Machine Check:</strong> <span className="code-inline">{policy.machine_check}</span></p>
            <p><strong>Technical Details:</strong> {policy.technical_details}</p>
            <p><strong>Compliance Tags:</strong></p>
            <ul>
              {policy.compliance_tags.map(tag => (
                <li key={tag} className="code-inline">{tag}</li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <section className="section">
        <h2 className="section-title">Enforcement Types</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Description</th>
              <th>Verification Method</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="code-inline">design</td>
              <td>Enforced by system architecture and design</td>
              <td>Code review, architectural analysis</td>
            </tr>
            <tr>
              <td className="code-inline">infrastructure</td>
              <td>Enforced by deployment infrastructure</td>
              <td>Infrastructure attestation, geographic proofs</td>
            </tr>
            <tr>
              <td className="code-inline">code_audit</td>
              <td>Enforced by audited code implementation</td>
              <td>Static analysis, formal verification</td>
            </tr>
            <tr>
              <td className="code-inline">runtime</td>
              <td>Enforced during execution</td>
              <td>Runtime monitoring, execution proofs</td>
            </tr>
            <tr>
              <td className="code-inline">cryptographic</td>
              <td>Enforced by cryptographic mechanisms</td>
              <td>Mathematical proofs, key erasure evidence</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="section">
        <h2 className="section-title">Usage in Receipts</h2>
        <p>
          Policy IDs are included in the <span className="code-inline">policy_ids</span> field of TECP receipts:
        </p>
        <div className="code-block">
{`{
  "version": "TECP-0.1",
  "policy_ids": ["no_retention", "eu_region", "hipaa_safe"],
  // ... other receipt fields
}`}
        </div>
        <p>
          Verifiers can check policy compliance by validating the enforcement mechanisms 
          specified in this registry.
        </p>
      </section>
    </div>
  );
}
