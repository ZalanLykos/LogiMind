import type { DailyRecord } from '../types';

export async function loadData(): Promise<DailyRecord[]> {
  if (window.electron) {
    return await window.electron.loadData();
  }

  // Browser mode - fetch from server
  try {
    const response = await fetch('http://localhost:3000/api/data');
    if (!response.ok) throw new Error('Failed to fetch data');
    return await response.json();
  } catch (err) {
    console.error('Error loading data from server:', err);
    throw err;
  }
}

export async function saveData(data: DailyRecord[]): Promise<{ success: boolean; message?: string; error?: string }> {
  if (window.electron) {
    return await window.electron.saveData(data);
  }

  // Browser mode - save via server
  try {
    const response = await fetch('http://localhost:3000/api/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data }),
    });
    if (!response.ok) throw new Error('Failed to save data');
    return await response.json();
  } catch (err) {
    console.error('Error saving data to server:', err);
    return { success: false, error: (err as Error).message };
  }
}

export async function clearData(): Promise<{ success: boolean; message?: string; error?: string }> {
  if (window.electron) {
    return await window.electron.clearData();
  }

  // Browser mode - clear via server
  try {
    const response = await fetch('http://localhost:3000/api/clear', {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to clear data');
    return await response.json();
  } catch (err) {
    console.error('Error clearing data on server:', err);
    return { success: false, error: (err as Error).message };
  }
}
