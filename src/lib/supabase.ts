import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tekasqzcixsdngkpmvew.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRla2FzcXpjaXhzZG5na3BtdmV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2MzU2MDAsImV4cCI6MjA3NDIxMTYwMH0.uNGcGOhG7HMUE_PzCUUBO4F4N4QGkZEk1_boA2KgguA';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Simple hash function for password verification (matches your existing hashed passwords)
const hashPassword = (password: string): string => {
  // This is a simple hash - in production you'd use bcrypt or similar
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString();
};

export const authenticateUser = async (username: string, password: string) => {
  try {
    // Try database authentication with the existing public.users table
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .eq('is_active', true)
      .single();

    if (data && !error) {
      // For now, we'll do simple password comparison
      // In production, you'd verify against password_hash properly
      const hashedPassword = hashPassword(password);
      
      // Check if password matches (try both plain text and hashed for compatibility)
      if (data.password_hash === password || data.password_hash === hashedPassword) {
        return {
          success: true,
          user: {
            id: data.id,
            fullName: data.full_name,
            username: data.username,
            department: data.department,
            role: data.role
          }
        };
      } else {
        return {
          success: false,
          error: 'Invalid password'
        };
      }
    }

    if (error) {
      console.log('Database query error:', error);
    }
  } catch (error) {
    console.log('Database connection error:', error);
  }

  // Fallback authentication for development
  const mockUsers = [
    { id: '1', fullName: 'Dr. John Smith', username: 'john', password: 'password', department: 'Cardiology', role: 'doctor' },
    { id: '2', fullName: 'Nurse Sarah Johnson', username: 'sarah', password: 'password', department: 'ICU', role: 'nurse' },
    { id: '3', fullName: 'Dr. Mike Wilson', username: 'mike', password: 'password', department: 'Emergency', role: 'doctor' },
    { id: '4', fullName: 'Admin User', username: 'admin', password: 'admin', department: 'Administration', role: 'admin' },
    { id: '5', fullName: 'Dr. Labi', username: 'Dr. Labi', password: 'ArtiArti', department: 'Cardiology', role: 'doctor' }
  ];

  const user = mockUsers.find(u => u.username === username && u.password === password);
  
  if (user) {
    return {
      success: true,
      user: {
        id: user.id,
        fullName: user.fullName,
        username: user.username,
        department: user.department,
        role: user.role as 'doctor' | 'nurse' | 'staff' | 'admin'
      }
    };
  }

  return {
    success: false,
    error: 'Invalid credentials'
  };
};

export const createUser = async (userData: {
  fullName: string;
  username: string;
  password: string;
  department: string;
  role: string;
}) => {
  try {
    const hashedPassword = hashPassword(userData.password);
    
    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          full_name: userData.fullName,
          username: userData.username,
          password_hash: hashedPassword,
          department: userData.department,
          role: userData.role,
          is_active: true
        }
      ])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        return {
          success: false,
          error: 'Username already exists'
        };
      }
      return {
        success: false,
        error: error.message
      };
    }

    return {
      success: true,
      user: {
        id: data.id,
        fullName: data.full_name,
        username: data.username,
        department: data.department,
        role: data.role
      }
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to create user'
    };
  }
};

export const testConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    return !error;
  } catch (error) {
    return false;
  }
};