import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { LogOut, Users, Bed, CheckSquare, Activity, FileText, User } from 'lucide-react';
import AuthForm from '@/components/AuthForm';
import ShiftManager from '@/components/ShiftManager';
import PatientList from '@/components/PatientList';
import TaskManager from '@/components/TaskManager';
import BedManager from '@/components/BedManager';
import ReportGenerator from '@/components/ReportGenerator';
import { Patient, Task, ActivityLog, ShiftSession, User as UserType, BedStatus, DischargedPatient, DeceasedPatient } from '@/types/medical';

export default function Index() {
  const [user, setUser] = useState<UserType | null>(null);
  const [currentShift, setCurrentShift] = useState<ShiftSession | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [bedStatuses, setBedStatuses] = useState<BedStatus[]>([]);
  const [dischargedPatients, setDischargedPatients] = useState<DischargedPatient[]>([]);
  const [deceasedPatients, setDeceasedPatients] = useState<DeceasedPatient[]>([]);

  const handleLogin = (userData: UserType) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentShift(null);
    setPatients([]);
    setTasks([]);
    setActivityLogs([]);
    setBedStatuses([]);
    setDischargedPatients([]);
    setDeceasedPatients([]);
  };

  const handleStartShift = (shift: ShiftSession) => {
    setCurrentShift(shift);
  };

  const handleEndShift = (shiftId: string) => {
    if (currentShift && currentShift.id === shiftId) {
      setCurrentShift(null);
    }
  };

  const handleJoinShift = (shiftId: string, userName: string) => {
    if (currentShift && currentShift.id === shiftId) {
      setCurrentShift(prev => prev ? {
        ...prev,
        teamMembers: [...prev.teamMembers, userName]
      } : null);
    }
  };

  const handleLeaveShift = (shiftId: string, userName: string) => {
    if (currentShift && currentShift.id === shiftId) {
      setCurrentShift(prev => prev ? {
        ...prev,
        teamMembers: prev.teamMembers.filter(member => member !== userName)
      } : null);
    }
  };

  const handleAddPatient = (patient: Patient) => {
    console.log('Index handleAddPatient called with:', patient);
    setPatients(prev => [...prev, patient]);
  };

  const handleUpdatePatient = (updatedPatient: Patient) => {
    setPatients(prev => prev.map(p => p.id === updatedPatient.id ? updatedPatient : p));
  };

  const handleDeletePatient = (patientId: string) => {
    setPatients(prev => prev.filter(p => p.id !== patientId));
  };

  const handleDischargePatient = (dischargedPatient: DischargedPatient) => {
    setDischargedPatients(prev => [...prev, dischargedPatient]);
    setPatients(prev => prev.filter(p => p.id !== dischargedPatient.id));
  };

  const handleRecordDeath = (deceasedPatient: DeceasedPatient) => {
    setDeceasedPatients(prev => [...prev, deceasedPatient]);
    setPatients(prev => prev.filter(p => p.id !== deceasedPatient.id));
  };

  const handleAddTask = (task: Task) => {
    setTasks(prev => [...prev, task]);
  };

  const handleUpdateTask = (updatedTask: Task) => {
    setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  const handleLogActivity = (log: ActivityLog) => {
    setActivityLogs(prev => [log, ...prev]);
  };

  const handleUpdateBedStatus = (bedStatuses: BedStatus[]) => {
    setBedStatuses(bedStatuses);
  };

  if (!user) {
    return <AuthForm onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <User className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-base sm:text-xl font-semibold text-gray-900">Medical Shift Manager</h1>
                <p className="text-sm text-gray-600">Welcome, {user.fullName}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden sm:text-right">
                <p className="text-sm font-medium text-gray-900">{user.fullName}</p>
                <p className="text-xs text-gray-600">{user.department} • {user.role}</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content with Tabs */}
      <Tabs defaultValue="shift" className="min-h-screen">
        {/* Main Content with bottom padding for fixed navigation */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
          <TabsContent value="shift">
            <ShiftManager
              currentShift={currentShift}
              onStartShift={handleStartShift}
              onEndShift={handleEndShift}
              onJoinShift={handleJoinShift}
              onLeaveShift={handleLeaveShift}
              onLogActivity={handleLogActivity}
              currentUser={user}
            />
          </TabsContent>

          <TabsContent value="patients">
            <PatientList
              patients={patients}
              onAddPatient={handleAddPatient}
              onUpdatePatient={handleUpdatePatient}
              onDeletePatient={handleDeletePatient}
              onDischargePatient={handleDischargePatient}
              onRecordDeath={handleRecordDeath}
              onAddTask={handleAddTask}
              onLogActivity={handleLogActivity}
              currentUser={user}
            />
          </TabsContent>

          <TabsContent value="tasks">
            <TaskManager
              tasks={tasks}
              patients={patients}
              onAddTask={handleAddTask}
              onUpdateTask={handleUpdateTask}
              onDeleteTask={handleDeleteTask}
              onLogActivity={handleLogActivity}
              currentUser={user}
            />
          </TabsContent>

          <TabsContent value="beds">
            <BedManager
              bedStatuses={bedStatuses}
              onUpdateBedStatus={handleUpdateBedStatus}
              onLogActivity={handleLogActivity}
              currentUser={user}
            />
          </TabsContent>

          <TabsContent value="reports">
            <ReportGenerator
              currentShift={currentShift}
              patients={patients}
              tasks={tasks}
              activityLogs={activityLogs}
              bedStatuses={bedStatuses}
              dischargedPatients={dischargedPatients}
              deceasedPatients={deceasedPatients}
              currentUser={user}
            />
          </TabsContent>
        </main>

        {/* Fixed Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50">
          <TabsList className="grid w-full grid-cols-5 h-16 bg-transparent rounded-none">
            <TabsTrigger 
              value="shift" 
              className="flex flex-col items-center justify-center h-full space-y-1 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600"
            >
              <Activity className="h-5 w-5" />
              <span className="text-xs">Shifts</span>
            </TabsTrigger>
            <TabsTrigger 
              value="patients" 
              className="flex flex-col items-center justify-center h-full space-y-1 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600"
            >
              <Users className="h-5 w-5" />
              <span className="text-xs">Patients</span>
            </TabsTrigger>
            <TabsTrigger 
              value="tasks" 
              className="flex flex-col items-center justify-center h-full space-y-1 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600"
            >
              <CheckSquare className="h-5 w-5" />
              <span className="text-xs">Tasks</span>
            </TabsTrigger>
            <TabsTrigger 
              value="beds" 
              className="flex flex-col items-center justify-center h-full space-y-1 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600"
            >
              <Bed className="h-5 w-5" />
              <span className="text-xs">Beds</span>
            </TabsTrigger>
            <TabsTrigger 
              value="reports" 
              className="flex flex-col items-center justify-center h-full space-y-1 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600"
            >
              <FileText className="h-5 w-5" />
              <span className="text-xs">Reports</span>
            </TabsTrigger>
          </TabsList>
        </div>
      </Tabs>
    </div>
  );
}