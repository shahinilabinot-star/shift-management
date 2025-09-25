# Medical Shift Management App - MVP Todo

## Core Features to Implement:
1. **Shift Session Management**
   - Start/End shift functionality
   - Session persistence during shift
   - Shift timer display

2. **Patient Management**
   - Add new patients with medical information
   - Patient list view
   - Patient details form (name, age, condition, notes, etc.)

3. **Task Management**
   - Add tasks with deadlines
   - Task list with priority indicators
   - Mark tasks as completed
   - Basic notification alerts for overdue tasks

4. **Team Management**
   - Simple team member identification
   - Track who added what patient/task

5. **Reports & Logs**
   - End-of-shift summary
   - Patient report
   - Task completion log
   - Team activity log

## Files to Create:
1. `src/pages/Index.tsx` - Main dashboard (rewrite)
2. `src/components/ShiftManager.tsx` - Shift session controls
3. `src/components/PatientForm.tsx` - Add new patient form
4. `src/components/PatientList.tsx` - Display patients
5. `src/components/TaskManager.tsx` - Task management
6. `src/components/ReportGenerator.tsx` - Generate shift reports
7. `src/types/medical.ts` - TypeScript types
8. `src/hooks/useLocalStorage.ts` - Data persistence hook

## Data Structure (localStorage):
- Current shift session
- Patients array
- Tasks array  
- Team members
- Activity logs

## Simplified Implementation:
- Use localStorage for data persistence (no backend needed)
- Basic notification system using browser alerts
- Simple, clean medical-focused UI
- Mobile-responsive design for tablet/phone use