/*
 * TECP Reference UI - PDF Export Utility
 * 
 * Copyright 2024 TECP Working Group
 * Lead Architect: Ali Jakvani
 * 
 * Licensed under the Apache License, Version 2.0
 */

export interface ReceiptData {
  receipt_id: string;
  timestamp: number;
  input_hash: string;
  output_hash: string;
  policy_ids: string[];
  sig: string;
  pubkey: string;
  nonce: string;
  extensions?: any;
}

export interface VerificationData {
  valid: boolean;
  receipt_id: string;
  verification_time: string;
  checks: Record<string, boolean>;
  compliance_status: Record<string, string>;
}

export function exportReceiptToPDF(receipt: ReceiptData, verification?: VerificationData) {
  // Create a simple HTML document for PDF generation
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>TECP Receipt Verification Proof</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 800px;
          margin: 0 auto;
          padding: 40px 20px;
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .header h1 {
          color: #1f2937;
          margin: 0 0 10px 0;
          font-size: 28px;
        }
        .header p {
          color: #6b7280;
          margin: 0;
          font-size: 16px;
        }
        .section {
          margin-bottom: 30px;
        }
        .section h2 {
          color: #374151;
          font-size: 20px;
          margin-bottom: 15px;
          border-bottom: 1px solid #e5e7eb;
          padding-bottom: 5px;
        }
        .field {
          margin-bottom: 12px;
          display: flex;
          flex-wrap: wrap;
        }
        .field-label {
          font-weight: 600;
          color: #374151;
          min-width: 150px;
          margin-right: 15px;
        }
        .field-value {
          color: #6b7280;
          font-family: 'Monaco', 'Menlo', monospace;
          font-size: 14px;
          word-break: break-all;
          flex: 1;
        }
        .status-valid {
          color: #059669;
          font-weight: 600;
        }
        .status-invalid {
          color: #dc2626;
          font-weight: 600;
        }
        .compliance-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
          margin-top: 15px;
        }
        .compliance-item {
          padding: 10px;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          text-align: center;
        }
        .compliance-compliant {
          background-color: #f0fdf4;
          border-color: #bbf7d0;
          color: #166534;
        }
        .compliance-na {
          background-color: #f9fafb;
          border-color: #e5e7eb;
          color: #6b7280;
        }
        .footer {
          margin-top: 50px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          text-align: center;
          color: #9ca3af;
          font-size: 14px;
        }
        .timestamp {
          color: #6b7280;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>TECP Receipt Verification Proof</h1>
        <p>Cryptographic proof of compliant ephemeral computation</p>
        <p class="timestamp">Generated: ${new Date().toLocaleString()}</p>
      </div>

      <div class="section">
        <h2>Receipt Information</h2>
        <div class="field">
          <div class="field-label">Receipt ID:</div>
          <div class="field-value">${receipt.receipt_id}</div>
        </div>
        <div class="field">
          <div class="field-label">Timestamp:</div>
          <div class="field-value">${new Date(receipt.timestamp * 1000).toLocaleString()}</div>
        </div>
        <div class="field">
          <div class="field-label">Input Hash:</div>
          <div class="field-value">${receipt.input_hash}</div>
        </div>
        <div class="field">
          <div class="field-label">Output Hash:</div>
          <div class="field-value">${receipt.output_hash}</div>
        </div>
        <div class="field">
          <div class="field-label">Policies Applied:</div>
          <div class="field-value">${receipt.policy_ids.join(', ')}</div>
        </div>
        <div class="field">
          <div class="field-label">Signature:</div>
          <div class="field-value">${receipt.sig}</div>
        </div>
        <div class="field">
          <div class="field-label">Public Key:</div>
          <div class="field-value">${receipt.pubkey}</div>
        </div>
      </div>

      ${verification ? `
      <div class="section">
        <h2>Verification Status</h2>
        <div class="field">
          <div class="field-label">Status:</div>
          <div class="field-value ${verification.valid ? 'status-valid' : 'status-invalid'}">
            ${verification.valid ? 'VALID ✓' : 'INVALID ✗'}
          </div>
        </div>
        <div class="field">
          <div class="field-label">Verified At:</div>
          <div class="field-value">${new Date(verification.verification_time).toLocaleString()}</div>
        </div>
        
        <h3 style="margin-top: 25px; margin-bottom: 15px; color: #374151;">Verification Checks</h3>
        ${Object.entries(verification.checks).map(([check, passed]) => `
          <div class="field">
            <div class="field-label">${check.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:</div>
            <div class="field-value ${passed ? 'status-valid' : 'status-invalid'}">
              ${passed ? 'PASSED ✓' : 'FAILED ✗'}
            </div>
          </div>
        `).join('')}

        <h3 style="margin-top: 25px; margin-bottom: 15px; color: #374151;">Compliance Status</h3>
        <div class="compliance-grid">
          ${Object.entries(verification.compliance_status).map(([standard, status]) => `
            <div class="compliance-item ${status === 'COMPLIANT' ? 'compliance-compliant' : 'compliance-na'}">
              <div style="font-weight: 600; margin-bottom: 5px;">${standard.toUpperCase()}</div>
              <div>${status}</div>
            </div>
          `).join('')}
        </div>
      </div>
      ` : ''}

      <div class="footer">
        <p>This document provides cryptographic proof that the specified computation was performed according to the stated privacy policies.</p>
        <p>TECP Protocol - Trusted Ephemeral Computation Protocol</p>
        <p>Learn more at: https://tecp.dev</p>
      </div>
    </body>
    </html>
  `;

  // Create a new window with the HTML content
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Wait for content to load, then trigger print
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    };
  } else {
    // Fallback: create a downloadable HTML file
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tecp-receipt-${receipt.receipt_id}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
