import { useAuthStore } from '../store/useAuthStore';
import { Project, FloorplanData } from '../types';

const API_BASE_URL = 'http://localhost:8787/api';

const getHeaders = () => {
  const token = useAuthStore.getState().token;
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

export const api = {
  // Sync User
  syncUser: async (email: string) => {
    const res = await fetch(`${API_BASE_URL}/users/sync`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ email })
    });
    return res.json();
  },

  // Projects
  fetchProjects: async (): Promise<Project[]> => {
    const res = await fetch(`${API_BASE_URL}/projects`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch projects');
    const json = await res.json();
    return json.data || json;
  },

  createProject: async (data: Partial<Project>): Promise<Project> => {
    const res = await fetch(`${API_BASE_URL}/projects`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to create project');
    return res.json();
  },

  updateProject: async (id: string, data: Partial<Project>) => {
    const res = await fetch(`${API_BASE_URL}/projects/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update project');
    return res.json();
  },

  deleteProject: async (id: string) => {
    const res = await fetch(`${API_BASE_URL}/projects/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to delete project');
    return res.json();
  },

  // Floorplans
  loadFloorplan: async (projectId: string): Promise<{ id: string, projectId: string, data: FloorplanData }> => {
    const res = await fetch(`${API_BASE_URL}/projects/${projectId}/floorplan`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to load floorplan');
    return res.json();
  },

  syncFloorplan: async (projectId: string, data: FloorplanData) => {
    const res = await fetch(`${API_BASE_URL}/projects/${projectId}/floorplan`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ data })
    });
    if (!res.ok) throw new Error('Failed to sync floorplan');
    return res.json();
  },

  // Assets (Global Library)
  fetchAssets: async (type?: string): Promise<any[]> => {
    const url = new URL(`${API_BASE_URL}/assets`);
    if (type) url.searchParams.append('type', type);
    
    // The endpoint is public, but we can pass headers just in case
    const res = await fetch(url.toString(), {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch assets');
    const json = await res.json();
    return json.data || json;
  }
};
