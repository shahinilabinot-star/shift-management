import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Users, 
  Clock, 
  AlertTriangle, 
  Building2, 
  MapPin, 
  Edit, 
  Trash2, 
  Plus,
  Heart,
  Cigarette,
  Activity
} from 'lucide-react';
import { Patient, DEPARTMENTS, DEPARTMENT_SHORT_NAMES, User, Task, ActivityLog, DischargedPatient, DeceasedPatient } from '@/types/medical';
import PatientForm from './PatientForm';

interface PatientListProps {
  patients: Patient[];
  onAddPatient: (patient: Patient) => void;
  onUpdatePatient: (patient: Patient) => void;
  onDeletePatient: (patientId: string) => void;
  onDischargePatient: (patient: DischargedPatient) => void;
  onRecordDeath: (patient: DeceasedPatient) => void;
  onAddTask: (task: Task) => void;
  onLogActivity: (log: ActivityLog) => void;
  currentUser: User;
}

export default function PatientList({ 
  patients, 
  onAddPatient,
  onUpdatePatient, 
  onDeletePatient,
  onDischargePatient,
  onRecordDeath,
  onAddTask,
  onLogActivity,
  currentUser 
}: PatientListProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical': return 'destructive';
      case 'High': return 'destructive';
      case 'Medium': return 'default';
      case 'Low': return 'secondary';
      default: return 'secondary';
    }
  };

  const getPriorityIcon = (priority: string) => {
    if (priority === 'Critical' || priority === 'High') {
      return <AlertTriangle className="h-3 w-3" />;
    }
    return null;
  };

  const getPatientsByDepartment = (department: string) => {
    return patients.filter(patient => patient.department === department);
  };

  const handleDeletePatient = (patient: Patient) => {
    if (confirm(`Are you sure you want to delete patient ${patient.name}?`)) {
      onDeletePatient(patient.id);
      
      const log: ActivityLog = {
        id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'patient_deleted',
        description: `Deleted patient: ${patient.name} from ${patient.department}`,
        user: currentUser.fullName,
        timestamp: new Date(),
        relatedId: patient.id
      };
      onLogActivity(log);
    }
  };

  const handleAddPatient = (patient: Patient) => {
    console.log('PatientList handleAddPatient called with:', patient);
    onAddPatient(patient);
    setShowAddForm(false);
  };

  const handleUpdatePatient = (patient: Patient) => {
    onUpdatePatient(patient);
    setEditingPatient(null);
  };

  const getRiskFactorBadges = (riskFactors: Patient['riskFactors']) => {
    if (!riskFactors) return null;
    
    const factors = [];
    if (riskFactors.smoking) factors.push({ name: 'Smoking', icon: Cigarette, color: 'destructive' });
    if (riskFactors.hypertension) factors.push({ name: 'HTN', icon: Activity, color: 'destructive' });
    if (riskFactors.diabetes) factors.push({ name: 'DM', icon: Heart, color: 'destructive' });
    if (riskFactors.obesity) factors.push({ name: 'Obesity', icon: Activity, color: 'destructive' });
    if (riskFactors.dyslipidemia) factors.push({ name: 'Dyslip', icon: Activity, color: 'destructive' });
    
    return factors;
  };

  const renderPatientCard = (patient: Patient) => {
    const riskFactors = getRiskFactorBadges(patient.riskFactors);
    
    return (
      <div
        key={patient.id}
        className="border rounded-lg p-4 space-y-3 hover:bg-muted/50 transition-colors"
      >
        {/* Header with just name and buttons */}
        <div className="flex items-center justify-between bg-[lightblue] pl-[10px] rounded-[5px]">
          <h3 className="font-semibold text-lg">{patient.name}</h3>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditingPatient(patient)}
              className="h-8 w-8 p-0"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDeletePatient(patient)}
              className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Age and other info on second row */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="text-xs">
            Age {patient.age}
          </Badge>
          <Badge variant={patient.isNewPatient ? "default" : "secondary"} className="text-xs">
            {patient.isNewPatient ? 'New' : 'Existing'}
          </Badge>
          <Badge variant={getPriorityColor(patient.priority)} className="flex items-center gap-1">
            {getPriorityIcon(patient.priority)}
            {patient.priority}
          </Badge>
          {patient.gender && (
            <span className="text-sm text-muted-foreground">
              {patient.gender} • Born: {patient.birthYear}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <MapPin className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Room: {patient.roomNumber}</span>
        </div>
        
        {/* Risk Factors */}
        {riskFactors && riskFactors.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {riskFactors.map((factor, index) => (
              <Badge key={index} variant="outline" className="text-xs flex items-center gap-1">
                <factor.icon className="h-3 w-3" />
                {factor.name}
              </Badge>
            ))}
          </div>
        )}

        <div className="space-y-2">
          <div>
            <span className="font-medium text-sm">Diagnosis:</span>
            <p className="text-sm">{patient.condition}</p>
          </div>

          {patient.symptoms && (
            <div>
              <span className="font-medium text-sm">Chief Complaints:</span>
              <p className="text-sm">{patient.symptoms}</p>
            </div>
          )}

          {patient.pciData && (
            <div>
              <span className="font-medium text-sm">PCI Data:</span>
              <p className="text-sm">{patient.pciData}</p>
            </div>
          )}

          {patient.pciAccess && (patient.pciAccess.radial || patient.pciAccess.femoral) && (
            <div>
              <span className="font-medium text-sm">PCI Access:</span>
              <div className="flex gap-2 mt-1">
                {patient.pciAccess.radial && <Badge variant="secondary">Radial</Badge>}
                {patient.pciAccess.femoral && <Badge variant="secondary">Femoral</Badge>}
                {patient.pciAccess.periproceduralHeparin && <Badge variant="secondary">Heparin</Badge>}
              </div>
            </div>
          )}

          {patient.ecg && (
            <div>
              <span className="font-medium text-sm">ECG:</span>
              <p className="text-sm">{patient.ecg}</p>
            </div>
          )}

          {patient.labResults && (
            <div>
              <span className="font-medium text-sm">Lab Results:</span>
              <p className="text-sm">{patient.labResults}</p>
            </div>
          )}

          {patient.allergies && (
            <div>
              <span className="font-medium text-sm text-red-600">Allergies:</span>
              <p className="text-sm text-red-600">{patient.allergies}</p>
            </div>
          )}

          {patient.medications && (
            <div>
              <span className="font-medium text-sm">Medications:</span>
              <p className="text-sm">{patient.medications}</p>
            </div>
          )}

          {patient.notes && (
            <div>
              <span className="font-medium text-sm">Notes:</span>
              <p className="text-sm">{patient.notes}</p>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Added: {new Date(patient.addedAt).toLocaleString()}
          </span>
          <span>By: {patient.addedBy}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="relative pt-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5" />
            Patients by Department ({patients.length} total)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {patients.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">No patients added yet</p>
            </div>
          ) : (
            <Tabs defaultValue={DEPARTMENTS[0]} className="space-y-4">
              <TabsList className="grid w-full grid-cols-4">
                {DEPARTMENTS.map((dept) => {
                  const deptPatients = getPatientsByDepartment(dept);
                  const shortName = DEPARTMENT_SHORT_NAMES[dept];
                  return (
                    <TabsTrigger key={dept} value={dept} className="flex flex-col items-center gap-1 text-xs p-2">
                      <div className="flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        <span className="hidden sm:inline">{dept}</span>
                        <span className="sm:hidden">{shortName}</span>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {deptPatients.length}
                      </Badge>
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              {DEPARTMENTS.map((dept) => {
                const deptPatients = getPatientsByDepartment(dept);
                return (
                  <TabsContent key={dept} value={dept}>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 mb-4">
                        <Building2 className="h-4 w-4" />
                        <h3 className="font-semibold">{dept}</h3>
                        <Badge variant="outline">{deptPatients.length} patients</Badge>
                      </div>
                      
                      {deptPatients.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">
                          No patients in {dept} department
                        </p>
                      ) : (
                        <ScrollArea className="h-96">
                          <div className="space-y-4">
                            {deptPatients.map(renderPatientCard)}
                          </div>
                        </ScrollArea>
                      )}
                    </div>
                  </TabsContent>
                );
              })}
            </Tabs>
          )}
        </CardContent>
      </Card>

      {/* Floating Add Button */}
      <Button
        onClick={() => setShowAddForm(true)}
        className="fixed bottom-20 right-6 h-14 w-14 rounded-full shadow-lg z-50 bg-blue-600 hover:bg-blue-700"
        size="icon"
      >
        <Plus className="h-6 w-6" />
      </Button>

      {/* Add Patient Dialog */}
      <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Patient</DialogTitle>
          </DialogHeader>
          <PatientForm
            onAddPatient={handleAddPatient}
            onDischargePatient={onDischargePatient}
            onRecordDeath={onRecordDeath}
            onLogActivity={onLogActivity}
            onAddTask={onAddTask}
            currentUser={currentUser}
            onClose={() => setShowAddForm(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Patient Dialog */}
      <Dialog open={!!editingPatient} onOpenChange={() => setEditingPatient(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Patient</DialogTitle>
          </DialogHeader>
          {editingPatient && (
            <PatientForm
              onUpdatePatient={handleUpdatePatient}
              onDischargePatient={onDischargePatient}
              onRecordDeath={onRecordDeath}
              onLogActivity={onLogActivity}
              onAddTask={onAddTask}
              currentUser={currentUser}
              editingPatient={editingPatient}
              onClose={() => setEditingPatient(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}