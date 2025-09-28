import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserPlus, X, FileText, UserX } from 'lucide-react';
import { Patient, ActivityLog, User, DEPARTMENTS, Task, DischargedPatient, DeceasedPatient, COUNTRIES } from '@/types/medical';
import { supabase } from '@/lib/supabase';


interface PatientFormProps {
  onAddPatient?: (patient: Patient) => void;
  onUpdatePatient?: (patient: Patient) => void;
  onDischargePatient?: (patient: DischargedPatient) => void;
  onRecordDeath?: (patient: DeceasedPatient) => void;
  onLogActivity: (log: ActivityLog) => void;
  onAddTask: (task: Task) => void;
  currentUser: User;
  editingPatient?: Patient | null;
  onClose?: () => void;
}

export default function PatientForm({ 
  onAddPatient, 
  onUpdatePatient, 
  onDischargePatient,
  onRecordDeath,
  onLogActivity, 
  onAddTask,
  currentUser, 
  editingPatient,
  onClose 
}: PatientFormProps) {
  const currentYear = new Date().getFullYear();
  const isEditing = !!editingPatient;
  const [activeTab, setActiveTab] = useState('new');
  
  const [newPatientForm, setNewPatientForm] = useState({
    name: editingPatient?.name || '',
    birthYear: editingPatient?.birthYear?.toString() || '',
    gender: editingPatient?.gender || 'Male',
    country: editingPatient?.country || '',
    diagnosis: editingPatient?.condition || '',
    chiefComplaints: editingPatient?.symptoms || '',
    ecg: editingPatient?.ecg || '',
    labResults: editingPatient?.labResults || '',
    pciData: editingPatient?.pciData || '',
    allergies: editingPatient?.allergies || '',
    medications: editingPatient?.medications || '',
    notes: editingPatient?.notes || '',
    department: editingPatient?.department || (currentUser?.department || "Njësi koronare"),
    roomNumber: editingPatient?.roomNumber || '',
    priority: editingPatient?.priority || 'Medium',
    isNewPatient: editingPatient?.isNewPatient ?? true,
    radial: editingPatient?.pciAccess?.radial || false,
    femoral: editingPatient?.pciAccess?.femoral || false,
    periproceduralHeparin: editingPatient?.pciAccess?.periproceduralHeparin || false,
    smoking: editingPatient?.riskFactors?.smoking || false,
    hypertension: editingPatient?.riskFactors?.hypertension || false,
    diabetes: editingPatient?.riskFactors?.diabetes || false,
    obesity: editingPatient?.riskFactors?.obesity || false,
    dyslipidemia: editingPatient?.riskFactors?.dyslipidemia || false,
  });

  const [dischargeForm, setDischargeForm] = useState({
    name: '',
    birthYear: '',
    diagnosis: '',
    roomNumber: '',
    notes: '',
    dischargeReportDone: false
  });

  const [deathForm, setDeathForm] = useState({
    name: '',
    birthYear: '',
    country: '',
    department: currentUser?.department || "Njësi koronare",
    roomNumber: '',
    diagnosis: '',
    deathReportDone: false
  });

  const [countryInput, setCountryInput] = useState(editingPatient?.country || '');
  const [filteredCountries, setFilteredCountries] = useState(COUNTRIES);

  const handleCountryInputChange = (value: string) => {
    setCountryInput(value);
    setNewPatientForm(prev => ({ ...prev, country: value }));
    
    // Filter countries based on input
    const filtered = COUNTRIES.filter(country =>
      country.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredCountries(filtered);
  };

const handleAddPatient = async (patient: Patient) => {
  const { data, error } = await supabase
    .from('patients')
    .insert([patient]);

  if (error) {
    console.error('Error inserting patient:', error.message);
    alert('Failed to add patient');
  } else {
    console.log('Patient added:', data);
  }
};


  const handleNewPatientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newPatientForm.name.trim() || !newPatientForm.birthYear || !newPatientForm.diagnosis.trim() || !newPatientForm.department || !newPatientForm.roomNumber.trim() || !newPatientForm.country.trim()) {
      alert('Please fill in required fields: Name, Birth Year, Country, Diagnosis, Department, and Room Number');
      return;
    }

    const birthYear = parseInt(newPatientForm.birthYear);
    if (birthYear < 1900 || birthYear > currentYear) {
      alert(`Birth year must be between 1900 and ${currentYear}`);
      return;
    }

    const age = currentYear - birthYear;

    const patient: Patient = {
      id: editingPatient?.id || `patient_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: newPatientForm.name.trim(),
      age: age,
      birthYear: birthYear,
      gender: newPatientForm.gender as 'Male' | 'Female',
      country: newPatientForm.country.trim(),
      condition: newPatientForm.diagnosis.trim(),
      symptoms: newPatientForm.chiefComplaints.trim(),
      ecg: newPatientForm.ecg.trim(),
      labResults: newPatientForm.labResults.trim(),
      pciData: newPatientForm.pciData.trim(),
      pciAccess: {
        radial: newPatientForm.radial,
        femoral: newPatientForm.femoral,
        periproceduralHeparin: newPatientForm.periproceduralHeparin
      },
      riskFactors: {
        smoking: newPatientForm.smoking,
        hypertension: newPatientForm.hypertension,
        diabetes: newPatientForm.diabetes,
        obesity: newPatientForm.obesity,
        dyslipidemia: newPatientForm.dyslipidemia
      },
      allergies: newPatientForm.allergies.trim(),
      medications: newPatientForm.medications.trim(),
      notes: newPatientForm.notes.trim(),
      department: newPatientForm.department,
      roomNumber: newPatientForm.roomNumber.trim(),
      priority: newPatientForm.priority as 'Low' | 'Medium' | 'High' | 'Critical',
      addedBy: editingPatient?.addedBy || currentUser.fullName,
      addedAt: editingPatient?.addedAt || new Date(),
      isNewPatient: newPatientForm.isNewPatient,
      status: 'active'
    };

    if (isEditing && onUpdatePatient) {
      onUpdatePatient(patient);
    } else if (onAddPatient) {
      onAddPatient(handleAddPatient(patient));
      
      // Generate sheath removal tasks if PCI access is selected
      if (newPatientForm.radial) {
        createSheathRemovalTask(patient, 'radial', newPatientForm.periproceduralHeparin);
      }
      if (newPatientForm.femoral) {
        createSheathRemovalTask(patient, 'femoral', newPatientForm.periproceduralHeparin);
      }
    }

    const log: ActivityLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: isEditing ? 'patient_updated' : 'patient_added',
      description: `${isEditing ? 'Updated' : 'Added'} ${newPatientForm.isNewPatient ? 'new' : 'existing'} patient: ${patient.name} (${patient.condition}) in ${patient.department}`,
      user: currentUser.fullName,
      timestamp: new Date(),
      relatedId: patient.id
    };

    onLogActivity(log);
    if (onClose) onClose();
  };

  const handleDischargeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!dischargeForm.name.trim() || !dischargeForm.birthYear || !dischargeForm.diagnosis.trim() || !dischargeForm.roomNumber.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    const dischargedPatient: DischargedPatient = {
      id: `discharge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: dischargeForm.name.trim(),
      birthYear: parseInt(dischargeForm.birthYear),
      diagnosis: dischargeForm.diagnosis.trim(),
      roomNumber: dischargeForm.roomNumber.trim(),
      notes: dischargeForm.notes.trim(),
      dischargeReportDone: dischargeForm.dischargeReportDone,
      dischargedBy: currentUser.fullName,
      dischargedAt: new Date()
    };

    if (onDischargePatient) {
      onDischargePatient(dischargedPatient);
    }

    // Create task if discharge report is not done
    if (!dischargeForm.dischargeReportDone) {
      const task: Task = {
        id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: 'Generate Discharge Report',
        description: `Generate discharge report for ${dischargedPatient.name} from room ${dischargedPatient.roomNumber}`,
        dueTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
        priority: 'Low',
        completed: false,
        addedBy: 'System (Auto-generated)',
        addedAt: new Date(),
        autoGenerated: true
      };
      onAddTask(task);
    }

    const log: ActivityLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'patient_discharged',
      description: `Discharged patient: ${dischargedPatient.name}`,
      user: currentUser.fullName,
      timestamp: new Date(),
      relatedId: dischargedPatient.id
    };

    onLogActivity(log);
    if (onClose) onClose();
  };

  const handleDeathSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!deathForm.name.trim() || !deathForm.birthYear || !deathForm.country.trim() || !deathForm.department || !deathForm.roomNumber.trim() || !deathForm.diagnosis.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    const deceasedPatient: DeceasedPatient = {
      id: `death_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: deathForm.name.trim(),
      birthYear: parseInt(deathForm.birthYear),
      country: deathForm.country.trim(),
      department: deathForm.department,
      roomNumber: deathForm.roomNumber.trim(),
      diagnosis: deathForm.diagnosis.trim(),
      deathReportDone: deathForm.deathReportDone,
      recordedBy: currentUser.fullName,
      recordedAt: new Date()
    };

    if (onRecordDeath) {
      onRecordDeath(deceasedPatient);
    }

    // Create task if death report is not done
    if (!deathForm.deathReportDone) {
      const task: Task = {
        id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: 'Generate Death Report',
        description: `Generate death report for ${deceasedPatient.name} from room ${deceasedPatient.roomNumber}`,
        dueTime: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours from now
        priority: 'High',
        completed: false,
        addedBy: 'System (Auto-generated)',
        addedAt: new Date(),
        autoGenerated: true
      };
      onAddTask(task);
    }

    const log: ActivityLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'patient_deceased',
      description: `Recorded death: ${deceasedPatient.name} from ${deceasedPatient.department}`,
      user: currentUser.fullName,
      timestamp: new Date(),
      relatedId: deceasedPatient.id
    };

    onLogActivity(log);
    if (onClose) onClose();
  };

  const createSheathRemovalTask = (patient: Patient, accessType: 'radial' | 'femoral', withHeparin: boolean) => {
    const now = new Date();
    const dueTime = new Date(now);
    
    if (withHeparin) {
      if (accessType === 'radial') {
        dueTime.setHours(dueTime.getHours() + 2);
      } else if (accessType === 'femoral') {
        dueTime.setHours(dueTime.getHours() + 6);
      }
    }

    const task: Task = {
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: `${accessType === 'radial' ? 'Radial' : 'Femoral'} Sheath Removal`,
      description: `Remove ${accessType} sheath for patient ${patient.name} in room ${patient.roomNumber}${withHeparin ? ` (${accessType === 'radial' ? '2' : '6'} hours post-heparin)` : ' (immediate - no heparin)'}`,
      patientId: patient.id,
      patientName: patient.name,
      dueTime: dueTime,
      priority: withHeparin ? 'High' : 'Critical',
      completed: false,
      addedBy: 'System (Auto-generated)',
      addedAt: new Date(),
      autoGenerated: true
    };

    onAddTask(task);
  };

  return (
    <Card className={isEditing ? "border-blue-200" : ""}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            {isEditing ? 'Edit Patient' : 'Patient Management'}
          </div>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="new" className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              New Patient
            </TabsTrigger>
            <TabsTrigger value="discharge" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Discharge
            </TabsTrigger>
            <TabsTrigger value="death" className="flex items-center gap-2">
              <UserX className="h-4 w-4" />
              Death
            </TabsTrigger>
          </TabsList>

          <TabsContent value="new">
            <form onSubmit={handleNewPatientSubmit} className="space-y-4">
              {/* Patient Status */}
              <div>
                <Label>Patient Status</Label>
                <RadioGroup 
                  value={newPatientForm.isNewPatient ? 'new' : 'existing'} 
                  onValueChange={(value) => setNewPatientForm(prev => ({ ...prev, isNewPatient: value === 'new' }))}
                  className="flex gap-6 mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="new" id="new-patient" />
                    <Label htmlFor="new-patient">New Patient</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="existing" id="existing-patient" />
                    <Label htmlFor="existing-patient">Existing Patient (Readmission)</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={newPatientForm.name}
                    onChange={(e) => setNewPatientForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Patient full name"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="birthYear">Birth Year * (1900-{currentYear})</Label>
                  <Input
                    id="birthYear"
                    type="number"
                    value={newPatientForm.birthYear}
                    onChange={(e) => setNewPatientForm(prev => ({ ...prev, birthYear: e.target.value }))}
                    placeholder="e.g., 1985"
                    min="1900"
                    max={currentYear}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Gender *</Label>
                  <RadioGroup 
                    value={newPatientForm.gender} 
                    onValueChange={(value) => setNewPatientForm(prev => ({ ...prev, gender: value }))}
                    className="flex gap-6 mt-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Male" id="male" />
                      <Label htmlFor="male">Male</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Female" id="female" />
                      <Label htmlFor="female">Female</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div>
                  <Label htmlFor="country">Country *</Label>
                  <div className="relative">
                    <Input
                      id="country"
                      value={countryInput}
                      onChange={(e) => handleCountryInputChange(e.target.value)}
                      placeholder="Type to search countries..."
                      required
                      list="countries-list"
                    />
                    <datalist id="countries-list">
                      {filteredCountries.map((country) => (
                        <option key={country} value={country} />
                      ))}
                    </datalist>
                  </div>
                </div>

                <div>
                  <Label htmlFor="department">Department *</Label>
                  <Select value={newPatientForm.department} onValueChange={(value) => setNewPatientForm(prev => ({ ...prev, department: value || "Njësi koronare" }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {DEPARTMENTS.map((dept) => (
                        <SelectItem key={dept} value={dept}>
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="roomNumber">Room Number *</Label>
                  <Input
                    id="roomNumber"
                    value={newPatientForm.roomNumber}
                    onChange={(e) => setNewPatientForm(prev => ({ ...prev, roomNumber: e.target.value }))}
                    placeholder="e.g., 101, A-205"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={newPatientForm.priority} onValueChange={(value) => setNewPatientForm(prev => ({ ...prev, priority: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Low">Low</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="diagnosis">Diagnosis *</Label>
                <Input
                  id="diagnosis"
                  value={newPatientForm.diagnosis}
                  onChange={(e) => setNewPatientForm(prev => ({ ...prev, diagnosis: e.target.value }))}
                  placeholder="Primary diagnosis"
                  required
                />
              </div>

              <div>
                <Label htmlFor="chiefComplaints">Chief Complaints</Label>
                <Textarea
                  id="chiefComplaints"
                  value={newPatientForm.chiefComplaints}
                  onChange={(e) => setNewPatientForm(prev => ({ ...prev, chiefComplaints: e.target.value }))}
                  placeholder="Patient's main complaints and symptoms"
                  rows={3}
                />
              </div>

              {/* Risk Factors */}
              <div>
                <Label>Risk Factors</Label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="smoking"
                      checked={newPatientForm.smoking}
                      onCheckedChange={(checked) => setNewPatientForm(prev => ({ ...prev, smoking: checked as boolean }))}
                    />
                    <Label htmlFor="smoking" className="text-sm">Smoking</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="hypertension"
                      checked={newPatientForm.hypertension}
                      onCheckedChange={(checked) => setNewPatientForm(prev => ({ ...prev, hypertension: checked as boolean }))}
                    />
                    <Label htmlFor="hypertension" className="text-sm">Hypertension</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="diabetes"
                      checked={newPatientForm.diabetes}
                      onCheckedChange={(checked) => setNewPatientForm(prev => ({ ...prev, diabetes: checked as boolean }))}
                    />
                    <Label htmlFor="diabetes" className="text-sm">Diabetes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="obesity"
                      checked={newPatientForm.obesity}
                      onCheckedChange={(checked) => setNewPatientForm(prev => ({ ...prev, obesity: checked as boolean }))}
                    />
                    <Label htmlFor="obesity" className="text-sm">Obesity</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="dyslipidemia"
                      checked={newPatientForm.dyslipidemia}
                      onCheckedChange={(checked) => setNewPatientForm(prev => ({ ...prev, dyslipidemia: checked as boolean }))}
                    />
                    <Label htmlFor="dyslipidemia" className="text-sm">Dyslipidemia</Label>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="allergies">Allergies</Label>
                <Textarea
                  id="allergies"
                  value={newPatientForm.allergies}
                  onChange={(e) => setNewPatientForm(prev => ({ ...prev, allergies: e.target.value }))}
                  placeholder="Enter known allergies"
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="ecg">ECG Results</Label>
                <Textarea
                  id="ecg"
                  value={newPatientForm.ecg}
                  onChange={(e) => setNewPatientForm(prev => ({ ...prev, ecg: e.target.value }))}
                  placeholder="Enter ECG findings"
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="medications">Current Medications</Label>
                <Textarea
                  id="medications"
                  value={newPatientForm.medications}
                  onChange={(e) => setNewPatientForm(prev => ({ ...prev, medications: e.target.value }))}
                  placeholder="Enter current medications"
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="labResults">Lab Results</Label>
                <Textarea
                  id="labResults"
                  value={newPatientForm.labResults}
                  onChange={(e) => setNewPatientForm(prev => ({ ...prev, labResults: e.target.value }))}
                  placeholder="Enter lab results"
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="pciData">PCI Data</Label>
                <Textarea
                  id="pciData"
                  value={newPatientForm.pciData}
                  onChange={(e) => setNewPatientForm(prev => ({ ...prev, pciData: e.target.value }))}
                  placeholder="Enter PCI procedure details"
                  rows={2}
                />
              </div>

              {/* PCI Access */}
              <div>
                <Label>PCI Access</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="radial"
                      checked={newPatientForm.radial}
                      onCheckedChange={(checked) => setNewPatientForm(prev => ({ ...prev, radial: checked as boolean }))}
                    />
                    <Label htmlFor="radial" className="text-sm">Radial Access</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="femoral"
                      checked={newPatientForm.femoral}
                      onCheckedChange={(checked) => setNewPatientForm(prev => ({ ...prev, femoral: checked as boolean }))}
                    />
                    <Label htmlFor="femoral" className="text-sm">Femoral Access</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="periproceduralHeparin"
                      checked={newPatientForm.periproceduralHeparin}
                      onCheckedChange={(checked) => setNewPatientForm(prev => ({ ...prev, periproceduralHeparin: checked as boolean }))}
                    />
                    <Label htmlFor="periproceduralHeparin" className="text-sm">Periprocedural Heparin</Label>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  value={newPatientForm.notes}
                  onChange={(e) => setNewPatientForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional observations, family history, etc."
                  rows={3}
                />
              </div>

              <Button type="submit" className="w-full">
                {isEditing ? 'Update Patient' : 'Add Patient'}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="discharge">
            <form onSubmit={handleDischargeSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="discharge-name">Patient Name *</Label>
                  <Input
                    id="discharge-name"
                    value={dischargeForm.name}
                    onChange={(e) => setDischargeForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Patient full name"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="discharge-birthYear">Birth Year *</Label>
                  <Input
                    id="discharge-birthYear"
                    type="number"
                    value={dischargeForm.birthYear}
                    onChange={(e) => setDischargeForm(prev => ({ ...prev, birthYear: e.target.value }))}
                    placeholder="e.g., 1985"
                    min="1900"
                    max={currentYear}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="discharge-diagnosis">Diagnosis *</Label>
                  <Input
                    id="discharge-diagnosis"
                    value={dischargeForm.diagnosis}
                    onChange={(e) => setDischargeForm(prev => ({ ...prev, diagnosis: e.target.value }))}
                    placeholder="Primary diagnosis"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="discharge-roomNumber">Room Number *</Label>
                  <Input
                    id="discharge-roomNumber"
                    value={dischargeForm.roomNumber}
                    onChange={(e) => setDischargeForm(prev => ({ ...prev, roomNumber: e.target.value }))}
                    placeholder="e.g., 101, A-205"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="discharge-notes">Notes</Label>
                <Textarea
                  id="discharge-notes"
                  value={dischargeForm.notes}
                  onChange={(e) => setDischargeForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Discharge notes and instructions"
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="discharge-report"
                  checked={dischargeForm.dischargeReportDone}
                  onCheckedChange={(checked) => setDischargeForm(prev => ({ ...prev, dischargeReportDone: checked as boolean }))}
                />
                <Label htmlFor="discharge-report">Discharge Report Completed</Label>
              </div>

              <Button type="submit" className="w-full">
                Record Discharge
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="death">
            <form onSubmit={handleDeathSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="death-name">Patient Name *</Label>
                  <Input
                    id="death-name"
                    value={deathForm.name}
                    onChange={(e) => setDeathForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Patient full name"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="death-birthYear">Birth Year *</Label>
                  <Input
                    id="death-birthYear"
                    type="number"
                    value={deathForm.birthYear}
                    onChange={(e) => setDeathForm(prev => ({ ...prev, birthYear: e.target.value }))}
                    placeholder="e.g., 1985"
                    min="1900"
                    max={currentYear}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="death-country">Country *</Label>
                  <Input
                    id="death-country"
                    value={deathForm.country}
                    onChange={(e) => setDeathForm(prev => ({ ...prev, country: e.target.value }))}
                    placeholder="Patient's country"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="death-department">Department *</Label>
                  <Select value={deathForm.department} onValueChange={(value) => setDeathForm(prev => ({ ...prev, department: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {DEPARTMENTS.map((dept) => (
                        <SelectItem key={dept} value={dept}>
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="death-roomNumber">Room Number *</Label>
                  <Input
                    id="death-roomNumber"
                    value={deathForm.roomNumber}
                    onChange={(e) => setDeathForm(prev => ({ ...prev, roomNumber: e.target.value }))}
                    placeholder="e.g., 101, A-205"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="death-diagnosis">Diagnosis *</Label>
                <Input
                  id="death-diagnosis"
                  value={deathForm.diagnosis}
                  onChange={(e) => setDeathForm(prev => ({ ...prev, diagnosis: e.target.value }))}
                  placeholder="Primary diagnosis"
                  required
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="death-report"
                  checked={deathForm.deathReportDone}
                  onCheckedChange={(checked) => setDeathForm(prev => ({ ...prev, deathReportDone: checked as boolean }))}
                />
                <Label htmlFor="death-report">Death Report Completed</Label>
              </div>

              <Button type="submit" className="w-full bg-red-600 hover:bg-red-700">
                Record Death
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}