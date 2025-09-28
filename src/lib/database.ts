// Database service for online/offline functionality
import { Patient, Task, ActivityLog, ShiftSession, BedStatus } from '@/types/medical';
import { supabase } from '@/lib/supabase';

// Offline mode removed — this app is online-only. Use `dbService` for server persistence.

// Database service for API calls
export class DatabaseService {
  // Use Supabase for persistent storage

  async createPatient(patient: Patient): Promise<Patient> {
    const { data, error } = await supabase
      .from('patients')
      .insert([patient])
      .select()
      .single();

    if (error) {
      console.error('Supabase createPatient error:', error);
      throw error;
    }

    return data as Patient;
  }

  async updatePatient(id: string, patient: Partial<Patient>): Promise<Patient> {
    const { data, error } = await supabase
      .from('patients')
      .update(patient)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase updatePatient error:', error);
      throw error;
    }

    return data as Patient;
  }

  async deletePatient(id: string): Promise<void> {
    const { error } = await supabase
      .from('patients')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase deletePatient error:', error);
      throw error;
    }
  }

  async createTask(task: Task): Promise<Task> {
    const { data, error } = await supabase
      .from('tasks')
      .insert([task])
      .select()
      .single();

    if (error) {
      console.error('Supabase createTask error:', error);
      throw error;
    }

    return data as Task;
  }

  async updateTask(id: string, task: Partial<Task>): Promise<Task> {
    const { data, error } = await supabase
      .from('tasks')
      .update(task)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase updateTask error:', error);
      throw error;
    }

    return data as Task;
  }

  async deleteTask(id: string): Promise<void> {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase deleteTask error:', error);
      throw error;
    }
  }

  async createActivityLog(log: ActivityLog): Promise<ActivityLog> {
    const { data, error } = await supabase
      .from('activity_logs')
      .insert([log])
      .select()
      .single();

    if (error) {
      console.error('Supabase createActivityLog error:', error);
      throw error;
    }

    return data as ActivityLog;
  }
}

export const dbService = new DatabaseService();