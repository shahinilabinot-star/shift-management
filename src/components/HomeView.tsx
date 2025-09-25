import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Activity, Users, CheckSquare, UserX, Home } from 'lucide-react';
import ShiftManager from './ShiftManager';
import { Patient, Task, DischargedPatient, DeceasedPatient, ShiftSession, User, ActivityLog } from '@/types/medical';

interface HomeViewProps {
  currentShift: ShiftSession | null;
  patients: Patient[];
  dischargedPatients: DischargedPatient[];
  deceasedPatients: DeceasedPatient[];
  tasks: Task[];
  onShiftChange: (shift: ShiftSession | null) => void;
  onLogActivity: (log: ActivityLog) => void;
  currentUser: User;
  onClose: () => void;
}

export default function HomeView({
  currentShift,
  patients,
  dischargedPatients,
  deceasedPatients,
  tasks,
  onShiftChange,
  onLogActivity,
  currentUser,
  onClose
}: HomeViewProps) {
  const newPatients = patients.filter(p => p.isNewPatient && p.status === 'active');
  const pendingTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Home className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-semibold">Dashboard Overview</h2>
        </div>
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </div>

      {/* Shift Manager */}
      <ShiftManager 
        onShiftChange={onShiftChange}
        onLogActivity={onLogActivity}
        currentUser={currentUser}
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{newPatients.length}</p>
                <p className="text-sm text-muted-foreground">New Patients</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{pendingTasks.length}</p>
                <p className="text-sm text-muted-foreground">Pending Tasks</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{dischargedPatients.length}</p>
                <p className="text-sm text-muted-foreground">Discharges</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <UserX className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{deceasedPatients.length}</p>
                <p className="text-sm text-muted-foreground">Deaths</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      {currentShift?.isActive && (
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <Users className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                <p className="font-medium">Manage Patients</p>
                <p className="text-sm text-muted-foreground">Add, edit, or discharge patients</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <CheckSquare className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <p className="font-medium">Manage Tasks</p>
                <p className="text-sm text-muted-foreground">Create and complete tasks</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}