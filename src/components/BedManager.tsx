import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Bed, Plus, Users } from 'lucide-react';
import { BedStatus, ActivityLog, User, DEPARTMENTS, DEPARTMENT_BED_COUNTS } from '@/types/medical';

interface BedManagerProps {
  bedStatuses: BedStatus[];
  onUpdateBedStatus: (bedStatuses: BedStatus[]) => void;
  onLogActivity: (log: ActivityLog) => void;
  currentUser: User;
}

export default function BedManager({ bedStatuses, onUpdateBedStatus, onLogActivity, currentUser }: BedManagerProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [freeBeds, setFreeBeds] = useState({ male: 0, female: 0 });
  const [totalFreeBeds, setTotalFreeBeds] = useState(0);

  const isCoronaryUnit = (department: string) => department === 'Njësia koronare';

  const openDialog = (department: string) => {
    setSelectedDepartment(department);
    const currentStatus = bedStatuses.find(b => b.department === department);
    
    if (isCoronaryUnit(department)) {
      // For Coronary Unit, use total free beds without gender separation
      const total = currentStatus?.freeBeds ? 
        currentStatus.freeBeds.male + currentStatus.freeBeds.female : 0;
      setTotalFreeBeds(total);
      setFreeBeds({ male: 0, female: 0 });
    } else {
      // For other departments, use gender-separated beds
      setFreeBeds(currentStatus?.freeBeds || { male: 0, female: 0 });
      setTotalFreeBeds(0);
    }
    
    setShowDialog(true);
  };

  const handleUpdateBeds = () => {
    const totalBeds = DEPARTMENT_BED_COUNTS[selectedDepartment as keyof typeof DEPARTMENT_BED_COUNTS];
    
    let finalFreeBeds;
    let occupiedBeds;
    let logDescription;

    if (isCoronaryUnit(selectedDepartment)) {
      // For Coronary Unit, don't track gender - store total in male field, female as 0
      finalFreeBeds = { male: Math.max(0, totalFreeBeds), female: 0 };
      occupiedBeds = Math.max(0, totalBeds - totalFreeBeds);
      logDescription = `Updated bed status for ${selectedDepartment}: ${totalFreeBeds} free beds (no gender tracking)`;
    } else {
      // For other departments, track by gender
      const totalFree = Math.max(0, freeBeds.male + freeBeds.female);
      finalFreeBeds = { 
        male: Math.max(0, freeBeds.male), 
        female: Math.max(0, freeBeds.female) 
      };
      occupiedBeds = Math.max(0, totalBeds - totalFree);
      logDescription = `Updated bed status for ${selectedDepartment}: ${freeBeds.male} male, ${freeBeds.female} female free beds`;
    }

    const updatedStatuses = bedStatuses.map(status => {
      if (status.department === selectedDepartment) {
        return {
          ...status,
          occupiedBeds,
          freeBeds: finalFreeBeds
        };
      }
      return status;
    });

    // If department doesn't exist in bedStatuses, add it
    if (!bedStatuses.find(b => b.department === selectedDepartment)) {
      updatedStatuses.push({
        department: selectedDepartment,
        totalBeds,
        occupiedBeds,
        freeBeds: finalFreeBeds
      });
    }

    onUpdateBedStatus(updatedStatuses);

    const log: ActivityLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'bed_updated',
      description: logDescription,
      user: currentUser.fullName,
      timestamp: new Date()
    };

    onLogActivity(log);
    setShowDialog(false);
  };

  const getBedStatusForDepartment = (department: string): BedStatus => {
    const existing = bedStatuses.find(b => b.department === department);
    if (existing) return existing;

    // Return default status if not found
    const totalBeds = DEPARTMENT_BED_COUNTS[department as keyof typeof DEPARTMENT_BED_COUNTS];
    return {
      department,
      totalBeds,
      occupiedBeds: totalBeds, // Start with all beds occupied
      freeBeds: { male: 0, female: 0 }
    };
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bed className="h-5 w-5" />
            Bed Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {DEPARTMENTS.map((dept) => {
              const status = getBedStatusForDepartment(dept);
              const occupancyRate = status.totalBeds > 0 ? (status.occupiedBeds / status.totalBeds) * 100 : 0;
              const totalFreeBeds = status.freeBeds.male + status.freeBeds.female;

              return (
                <Card key={dept} className="relative">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-sm">{dept}</h3>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openDialog(dept)}
                          className="h-6 w-6 p-0"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Total Beds:</span>
                          <span className="font-medium">{status.totalBeds}</span>
                        </div>
                        
                        <div className="flex justify-between text-sm">
                          <span>Occupied:</span>
                          <span className="font-medium text-red-600">{status.occupiedBeds}</span>
                        </div>
                        
                        <div className="flex justify-between text-sm">
                          <span>Free:</span>
                          <span className="font-medium text-green-600">{totalFreeBeds}</span>
                        </div>
                        
                        {/* Only show gender badges for non-Coronary Unit departments */}
                        {totalFreeBeds > 0 && !isCoronaryUnit(dept) && (
                          <div className="flex gap-1">
                            {status.freeBeds.male > 0 && (
                              <Badge variant="outline" className="text-xs">
                                {status.freeBeds.male}M
                              </Badge>
                            )}
                            {status.freeBeds.female > 0 && (
                              <Badge variant="outline" className="text-xs">
                                {status.freeBeds.female}F
                              </Badge>
                            )}
                          </div>
                        )}
                        
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-red-500 h-2 rounded-full transition-all"
                            style={{ width: `${occupancyRate}%` }}
                          />
                        </div>
                        
                        <p className="text-xs text-center text-muted-foreground">
                          {occupancyRate.toFixed(0)}% occupied
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Free Beds - {selectedDepartment}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {isCoronaryUnit(selectedDepartment) ? (
              // Coronary Unit - No gender tracking
              <>
                <p className="text-sm text-muted-foreground">
                  Update available beds for {selectedDepartment}. Gender tracking is disabled for this department.
                </p>
                
                <div>
                  <Label htmlFor="totalFree">Total Free Beds</Label>
                  <Input
                    id="totalFree"
                    type="number"
                    min="0"
                    max={DEPARTMENT_BED_COUNTS[selectedDepartment as keyof typeof DEPARTMENT_BED_COUNTS] || 0}
                    value={totalFreeBeds}
                    onChange={(e) => setTotalFreeBeds(parseInt(e.target.value) || 0)}
                  />
                </div>
                
                <div className="text-sm text-muted-foreground">
                  Total free beds: {totalFreeBeds} / {DEPARTMENT_BED_COUNTS[selectedDepartment as keyof typeof DEPARTMENT_BED_COUNTS] || 0}
                </div>
              </>
            ) : (
              // Other departments - Gender tracking enabled
              <>
                <p className="text-sm text-muted-foreground">
                  Add available beds by gender. This will update the occupancy status for this department.
                </p>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="male">Male Beds Available</Label>
                    <Input
                      id="male"
                      type="number"
                      min="0"
                      max={DEPARTMENT_BED_COUNTS[selectedDepartment as keyof typeof DEPARTMENT_BED_COUNTS] || 0}
                      value={freeBeds.male}
                      onChange={(e) => setFreeBeds(prev => ({ ...prev, male: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="female">Female Beds Available</Label>
                    <Input
                      id="female"
                      type="number"
                      min="0"
                      max={DEPARTMENT_BED_COUNTS[selectedDepartment as keyof typeof DEPARTMENT_BED_COUNTS] || 0}
                      value={freeBeds.female}
                      onChange={(e) => setFreeBeds(prev => ({ ...prev, female: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                </div>
                
                <div className="text-sm text-muted-foreground">
                  Total free beds: {freeBeds.male + freeBeds.female} / {DEPARTMENT_BED_COUNTS[selectedDepartment as keyof typeof DEPARTMENT_BED_COUNTS] || 0}
                </div>
              </>
            )}
            
            <div className="flex gap-2">
              <Button onClick={handleUpdateBeds} className="flex-1">
                Update Bed Status
              </Button>
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}