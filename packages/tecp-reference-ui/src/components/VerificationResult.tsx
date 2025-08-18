
import { VerificationResult as VerificationResultType, ERROR_CODES } from '../types/verification';

interface VerificationResultProps {
  result: VerificationResultType;
  cliCommand?: string;
}

export function VerificationResult({ result, cliCommand }: VerificationResultProps) {
  const { valid, errors, details, performance } = result;

  return (
    <div className="card">
      <div className={`alert ${valid ? 'alert-success' : 'alert-error'}`}>
        <strong>{valid ? 'PASS' : 'FAIL'}</strong>
        {valid ? ' - Receipt verification successful' : ' - Receipt verification failed'}
      </div>

      <table className="table">
        <thead>
          <tr>
            <th>Component</th>
            <th>Status</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Signature</td>
            <td className={details.signature === 'Valid' ? 'status-pass' : 'status-fail'}>
              {details.signature}
            </td>
            <td>
              {details.signature === 'Valid' 
                ? 'Ed25519 signature verified' 
                : 'Signature verification failed'}
            </td>
          </tr>
          <tr>
            <td>Timestamp</td>
            <td className={
              details.timestamp === 'OK' ? 'status-pass' : 
              details.timestamp === 'Skew' ? 'status-warn' : 'status-fail'
            }>
              {details.timestamp}
            </td>
            <td>
              {details.timestamp === 'OK' && 'Within acceptable time bounds'}
              {details.timestamp === 'Skew' && 'Clock skew detected but acceptable'}
              {details.timestamp === 'Expired' && 'Receipt older than 24 hours'}
            </td>
          </tr>
          <tr>
            <td>Schema</td>
            <td className={details.schema === 'OK' ? 'status-pass' : 'status-fail'}>
              {details.schema === 'OK' ? 'OK' : 'Invalid'}
            </td>
            <td>
              {details.schema === 'OK' 
                ? 'All required fields present and valid' 
                : `Schema validation failed: ${details.schema}`}
            </td>
          </tr>
          <tr>
            <td>Transparency Log</td>
            <td className={
              details.transparencyLog === 'Included' ? 'status-pass' :
              details.transparencyLog === 'Not checked' ? 'status-warn' : 'status-fail'
            }>
              {details.transparencyLog}
            </td>
            <td>
              {details.transparencyLog === 'Included' && 'Receipt found in transparency log with valid proof'}
              {details.transparencyLog === 'Not found' && 'Receipt not found in transparency log'}
              {details.transparencyLog === 'Root mismatch' && 'Merkle proof verification failed'}
              {details.transparencyLog === 'Not checked' && 'Transparency log verification skipped'}
            </td>
          </tr>
        </tbody>
      </table>

      {errors.length > 0 && (
        <div className="section">
          <h3 className="section-title">Errors</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Message</th>
                <th>Field</th>
              </tr>
            </thead>
            <tbody>
              {errors.map((error, index) => (
                <tr key={index}>
                  <td className="code-inline">{error.code}</td>
                  <td>{ERROR_CODES[error.code]}</td>
                  <td className="code-inline">{error.field || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="section">
        <h3 className="section-title">Performance</h3>
        <table className="table">
          <tbody>
            <tr>
              <td>Verification Time</td>
              <td className="table-mono">{performance.verificationTimeMs}ms</td>
            </tr>
            <tr>
              <td>Receipt Size</td>
              <td className="table-mono">{performance.receiptSizeBytes} bytes</td>
            </tr>
          </tbody>
        </table>
      </div>

      {cliCommand && (
        <div className="section">
          <h3 className="section-title">CLI Command</h3>
          <p>Reproduce this verification using the command line:</p>
          <div className="code-block">{cliCommand}</div>
        </div>
      )}
    </div>
  );
}
