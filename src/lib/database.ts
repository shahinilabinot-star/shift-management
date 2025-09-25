// Database service for online/offline functionality
import { Patient, Task, ActivityLog, ShiftSession, BedStatus } from '@/types/medical';

// Offline Storage utility
export class OfflineStorage {
  static get<T>(key: string, defaultValue: T): T {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Error reading from localStorage for key ${key}:`, error);
      return defaultValue;
    }
  }

  static set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error writing to localStorage for key ${key}:`, error);
    }
  }

  static remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing from localStorage for key ${key}:`, error);
    }
  }
}

// Database service for API calls
export class DatabaseService {
  private baseUrl = '/api'; // Replace with actual API endpoint

  async createPatient(patient: Patient): Promise<Patient> {
    try {
      const response = await fetch(`${this.baseUrl}/patients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patient)
      });
      return await response.json();
    } catch (error) {
      console.error('Failed to create patient:', error);
      throw error;
    }
  }

  async updatePatient(id: string, patient: Patient): Promise<Patient> {
    try {
      const response = await fetch(`${this.baseUrl}/patients/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patient)
      });
      return await response.json();
    } catch (error) {
      console.error('Failed to update patient:', error);
      throw error;
    }
  }

  async deletePatient(id: string): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/patients/${id}`, {
        method: 'DELETE'
      });
    } catch (error) {
      console.error('Failed to delete patient:', error);
      throw error;
    }
  }

  async createTask(task: Task): Promise<Task> {
    try {
      const response = await fetch(`${this.baseUrl}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task)
      });
      return await response.json();
    } catch (error) {
      console.error('Failed to create task:', error);
      throw error;
    }
  }

  async updateTask(id: string, task: Task): Promise<Task> {
    try {
      const response = await fetch(`${this.baseUrl}/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task)
      });
      return await response.json();
    } catch (error) {
      console.error('Failed to update task:', error);
      throw error;
    }
  }

  async deleteTask(id: string): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/tasks/${id}`, {
        method: 'DELETE'
      });
    } catch (error) {
      console.error('Failed to delete task:', error);
      throw error;
    }
  }

  async createActivityLog(log: ActivityLog): Promise<ActivityLog> {
    try {
      const response = await fetch(`${this.baseUrl}/activity-logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(log)
      });
      return await response.json();
    } catch (error) {
      console.error('Failed to create activity log:', error);
      throw error;
    }
  }
}

export const dbService = new DatabaseService();