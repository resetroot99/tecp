const mockSth = {
  size: 1,
  root: '0000000000000000000000000000000000000000000000000000000000000000',
  sig: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  kid: 'test-key-1'
};

export const mockLedger = {
  async getSTH() {
    return mockSth;
  },

  async getEntries() {
    return [{
      seq: 1,
      leaf_hash: '0000000000000000000000000000000000000000000000000000000000000000',
      timestamp: Date.now(),
      policy_ids: ['policy://test/mock@v1']
    }];
  },

  async appendEntry(leaf: string) {
    if (!leaf || typeof leaf !== 'string' || !/^([0-9a-f]{64}|0x[0-9a-f]{64})$/i.test(leaf)) {
      throw new Error('leaf must be 32-byte hex string');
    }
    return {
      leaf_index: 1,
      proof: ['0000000000000000000000000000000000000000000000000000000000000000'],
      sth: mockSth,
      algo: 'sha256',
      domain: { leaf: '00', node: '01' }
    };
  },

  async getProof(leaf: string) {
    if (!leaf || typeof leaf !== 'string' || !/^([0-9a-f]{64}|0x[0-9a-f]{64})$/i.test(leaf)) {
      throw new Error('leaf must be 32-byte hex string');
    }
    return {
      leaf_index: 1,
      proof: ['0000000000000000000000000000000000000000000000000000000000000000'],
      sth: mockSth,
      algo: 'sha256',
      domain: { leaf: '00', node: '01' }
    };
  }
};
