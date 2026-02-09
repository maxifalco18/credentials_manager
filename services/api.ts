import { Credential, AuthResponse } from '../types';

// Mock data storage key
const STORAGE_KEY = 'mock_credentials_db';

// Helper to simulate network latency
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const getMockData = (): Credential[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  // Default seed data
  const seed: Credential[] = [
    {
      id: 1,
      tool: 'Jira',
      link: 'https://jira.company.com',
      username: 'jdoe',
      password: 'securePassword123!',
      ldap: true,
      description: 'Project management'
    },
    {
      id: 2,
      tool: 'AWS Console',
      link: 'https://aws.amazon.com',
      username: 'admin-user',
      password: 'ComplexPassword#99',
      ldap: false,
      description: 'Production environment access'
    }
  ];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
  return seed;
};

export const api = {
  login: async (credentials: Pick<Credential, 'username' | 'password'>): Promise<AuthResponse> => {
    await delay(800); // Simulate network request
    
    if (credentials.username === 'user1' && credentials.password === 'password1') {
      return { token: 'mock-secure-token-abc-123' };
    }
    
    throw new Error('Invalid credentials');
  },

  getCredentials: async (): Promise<Credential[]> => {
    await delay(600);
    return getMockData();
  },

  addCredential: async (credential: Credential): Promise<Credential> => {
    await delay(600);
    const data = getMockData();
    const newId = data.length > 0 ? Math.max(...data.map(c => c.id || 0)) + 1 : 1;
    const newCred = { ...credential, id: newId };
    data.push(newCred);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return newCred;
  },

  bulkAddCredentials: async (credentials: Credential[]): Promise<void> => {
    await delay(1000);
    const data = getMockData();
    let currentId = data.length > 0 ? Math.max(...data.map(c => c.id || 0)) : 0;
    
    const newCredentialsWithIds = credentials.map(c => {
      currentId += 1;
      return { ...c, id: currentId };
    });
    
    const updated = [...data, ...newCredentialsWithIds];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  },

  updateCredential: async (id: number, credential: Credential): Promise<Credential> => {
    await delay(600);
    const data = getMockData();
    const index = data.findIndex(c => c.id === id);
    if (index === -1) throw new Error('Credential not found');
    
    const updated = { ...credential, id };
    data[index] = updated;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return updated;
  },

  deleteCredential: async (id: number): Promise<void> => {
    await delay(600);
    const data = getMockData();
    const filtered = data.filter(c => c.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  }
};