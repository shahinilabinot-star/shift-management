import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Download } from 'lucide-react';
import { ShiftSession, Patient, Task, ActivityLog, DischargedPatient, DeceasedPatient } from '@/types/medical';

interface ReportGeneratorProps {
  currentShift: ShiftSession | null;
  patients: Patient[];
  tasks: Task[];
  activityLogs: ActivityLog[];
  dischargedPatients: DischargedPatient[];
  deceasedPatients: DeceasedPatient[];
}

export default function ReportGenerator({
  currentShift,
  patients,
  tasks,
  activityLogs,
  dischargedPatients,
  deceasedPatients
}: ReportGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateReport = () => {
    if (!currentShift) return;

    setIsGenerating(true);

    // Group patients by department
    const patientsByDepartment = patients.reduce((acc, patient) => {
      const dept = patient.department || 'Të tjera';
      if (!acc[dept]) {
        acc[dept] = [];
      }
      acc[dept].push(patient);
      return acc;
    }, {} as Record<string, Patient[]>);

    // Generate report content
    let reportContent = `RAPORTI KUJDESTARISË SË DATËS ${new Date(currentShift.startTime).toLocaleString('sq-AL')}\n`;
    reportContent += `===================================================\n\n`;

    
    // Statistics
    const completedTasks = tasks.filter(t => t.completed).length;
    const totalTasks = tasks.length;
    const totalPatients = patients.length;
    const totalDischarges = dischargedPatients.length;
    const totalDeaths = deceasedPatients.length;

    
reportContent += `PACIENTËT SIPAS DEPARTAMENTEVE:\n`;
reportContent += `=====================================\n\n`;

Object.entries(patientsByDepartment).forEach(([department, deptPatients]) => {
  reportContent += `${department}:\n`;

  deptPatients.forEach((patient, index) => {
    const birthY = patient.birthYear ? new Date(patient.birthYear).getFullYear() : 'N/A';

    reportContent += `${index + 1}. ${patient.name} - ${birthY} - ${patient.country || 'N/A'}   Shtrati ${patient.roomNumber || 'N/A'}\n`;

    if (patient.symptoms) {
      reportContent += `   AK: ${patient.symptoms}\n`;
    }

    if (patient.ecg) {
      reportContent += `   EKG: ${patient.ecg}\n`;
    }

    if (patient.labResults && patient.labResults.trim() !== '') {
      reportContent += `   Analizat: ${patient.labResults}\n`;
    }

    if (patient.condition) {
      reportContent += `   Dg: ${patient.condition}\n`;
    }

    if (patient.pciData) {
      reportContent += `   Koro: ${patient.pciData}\n`;
    }

    reportContent += `\n`;
  });

  reportContent += `\n`;
});

        // Discharged Patients
    if (dischargedPatients.length > 0) {
      reportContent += `LËSHIMET:\n`;
      reportContent += `=====================================\n`;
      dischargedPatients.forEach(patient => {
        const birthY = patient.birthYear ? new Date(patient.birthYear).getFullYear() : 'N/A';
        reportContent += `${patient.name} - ${birthY}\n`;
        if (patient.department) {
          reportContent += `${patient.department} - Shtrati ${patient.roomNumber || 'N/A'}`;
        }
        if (patient.diagnosis) {
          reportContent += `Dg: ${patient.diagnosis}\n`;
        }
        if (patient.notes) {
          reportContent += `Shënime: ${patient.notes}`;
        }
        if (patient.dischargeReportDone) {
          reportContent += `Fletëlsëhimi i përfunduar.`;}
        else {
          reportContent += `Fletëlsëhimi i papërfunduar.\n`;
        }
        reportContent += `\n`;
        reportContent += `\n`;
      });
    }

    if (deceasedPatients.length > 0) {
  reportContent += `EXITUSET:\n`;
  reportContent += `=====================================\n`;

  deceasedPatients.forEach((patient, index) => {
    const birthY = patient.birthYear ? new Date(patient.birthYear).getFullYear() : 'N/A';
    reportContent += `${index + 1}. ${patient.name} - ${birthY} - ${patient.country || 'N/A'}\n`;

    if (patient.department) {
      reportContent += `${patient.department} - Shtrati ${patient.roomNumber || 'N/A'}\n`;
    }

    if (patient.diagnosis) {
      reportContent += `Dg: ${patient.diagnosis}`;
    }

    reportContent += `\n`;

    if (patient.deathReportDone) {
      reportContent += `Fletëlsëhimi i përfunduar.\n`;
    } else {
      reportContent += `Fletëlsëhimi i papërfunduar.\n`;
    }

    reportContent += `\n`;
  });
}

    // Create and download file
    const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `raporti-turni-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setIsGenerating(false);
  };

  const completedTasks = tasks.filter(t => t.completed).length;
  const totalTasks = tasks.length;

  // Group patients by department for preview
  const patientsByDepartment = patients.reduce((acc, patient) => {
    const dept = patient.department || 'Të tjera';
    if (!acc[dept]) {
      acc[dept] = [];
    }
    acc[dept].push(patient);
    return acc;
  }, {} as Record<string, Patient[]>);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Raporti i Turnit
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">

        {/* Statistics */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Statistikat</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">{patients.length}</p>
              <p className="text-sm text-muted-foreground">Pacientë Totalë</p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{completedTasks}/{totalTasks}</p>
              <p className="text-sm text-muted-foreground">Detyra të Përfunduara</p>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <p className="text-2xl font-bold text-orange-600">{dischargedPatients.length}</p>
              <p className="text-sm text-muted-foreground">Shkarkime</p>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <p className="text-2xl font-bold text-red-600">{deceasedPatients.length}</p>
              <p className="text-sm text-muted-foreground">Vdekje</p>
            </div>
          </div>
        </div>

         {/* Download Button - Centered */}
        <div className="flex justify-center">
          <Button 
            onClick={generateReport} 
            disabled={isGenerating || !currentShift}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            {isGenerating ? 'Duke gjeneruar...' : 'Shkarko Raportin'}
          </Button>
        </div>

        {/* Patients by Department Preview */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Pacientët sipas Departamenteve</h3>
          <div className="space-y-4">
            {Object.entries(patientsByDepartment).map(([department, deptPatients]) => (
              <div key={department} className="border rounded-lg p-4">
                <h4 className="font-semibold text-blue-600 mb-3">{department}:</h4>
                <div className="space-y-3">
                  {deptPatients.map((patient, index) => {
                    const birthY = patient.birthYear ? new Date(patient.birthYear).getFullYear() : 'N/A';
                    
                    return (
                      <div key={patient.id} className="text-sm space-y-1 border-l-2 border-gray-200 pl-3">
                        <p className="font-medium">
                          {index + 1}. {patient.name} - {birthY} - {patient.country || 'N/A'} - Shtrati {patient.roomNumber || 'N/A'}
                        </p>
                        
                        {patient.symptoms && (
                          <p><strong>AK:</strong> {patient.symptoms}</p>
                        )}
                        
                        {patient.ecg && (
                          <p><strong>EKG:</strong> {patient.ecg}</p>
                        )}
                        
                        {patient.labResults && patient.labResults.trim() !== '' && (
                          <p><strong>Analizat:</strong> {patient.labResults}</p>
                        )}

                        {patient.ecg && (
                          <p><strong>Dg:</strong> {patient.condition}</p>
                        )}
                        
                        {patient.pciData && (
                          <p><strong>Koro:</strong> {patient.pciData}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        {activityLogs.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Aktivitetet e Fundit</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {activityLogs.slice(0, 10).map((log) => (
                <div key={log.id} className="text-sm p-2 bg-gray-50 rounded">
                  <span className="text-muted-foreground">
                    {new Date(log.timestamp).toLocaleString('sq-AL')}
                  </span>
                  <span className="mx-2">-</span>
                  <span className="font-medium">{log.user}:</span>
                  <span className="ml-1">{log.description}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}