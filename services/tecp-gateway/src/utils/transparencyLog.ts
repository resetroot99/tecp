/*
 * TECP Gateway - Transparency Log Client
 */

import axios from 'axios';
import { logger } from './logger';

export interface ReceiptData {
  receipt_id: string;
  input_hash: string;
  output_hash: string;
  policy_ids: string[];
  timestamp: number;
  signature: string;
  metadata?: any;
}

export interface LogEntry {
  entry_id: string;
  merkle_proof: string[];
  tree_size: number;
  timestamp: number;
}

export class TransparencyLogClient {
  constructor(private baseUrl: string) {}

  async submitReceipt(receipt: ReceiptData): Promise<LogEntry> {
    try {
      const response = await axios.post(`${this.baseUrl}/submit`, receipt, {
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      logger.error('Failed to submit receipt to transparency log', { 
        error: error instanceof Error ? error.message : error,
        receiptId: receipt.receipt_id 
      });
      throw error;
    }
  }

  async getEntry(entryId: string): Promise<any> {
    try {
      const response = await axios.get(`${this.baseUrl}/entry/${entryId}`, {
        timeout: 5000
      });
      return response.data;
    } catch (error) {
      logger.error('Failed to retrieve log entry', { 
        error: error instanceof Error ? error.message : error,
        entryId 
      });
      throw error;
    }
  }

  async verifyProof(entryId: string, merkleProof: string[]): Promise<boolean> {
    try {
      const response = await axios.post(`${this.baseUrl}/verify`, {
        entry_id: entryId,
        merkle_proof: merkleProof
      }, {
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      return response.data.valid === true;
    } catch (error) {
      logger.error('Failed to verify merkle proof', { 
        error: error instanceof Error ? error.message : error,
        entryId 
      });
      return false;
    }
  }
}
