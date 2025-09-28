import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Users, Play, Square } from 'lucide-react';
import { ShiftSession, User, ActivityLog } from '@/types/medical';

interface ShiftManagerProps {
  currentShift: ShiftSession | null;
  onStartShift: (shift: ShiftSession) => void;
  onEndShift: (shiftId: string) => void;
  onJoinShift: (shiftId: string, userName: string) => void;
  onLeaveShift: (shiftId: string, userName: string) => void;
  onLogActivity: (log: ActivityLog) => void;
  currentUser: User;
}

export default function ShiftManager({ 
  currentShift, 
  onStartShift, 
  onEndShift, 
  onJoinShift, 
  onLeaveShift,
  onLogActivity,
  currentUser 
}: ShiftManagerProps) {
  const [notes, setNotes] = useState('');

  const handleStartShift = () => {
    if (currentShift && currentShift.isActive) return;

    const newShift: ShiftSession = {
      id: `shift_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userName: currentUser.fullName,
      startTime: new Date(),
      isActive: true,
      bedStatuses: [],
      teamMembers: [currentUser.fullName],
      endApprovals: [],
      notes
    };

    onStartShift(newShift);

    const log: ActivityLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'shift_started',
      description: `Started shift`,
      user: currentUser.fullName,
      timestamp: new Date()
    };

    onLogActivity(log);
    setNotes('');
  };

  const handleEndShift = () => {
    if (!currentShift) return;
    onEndShift(currentShift.id);

    const log: ActivityLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'shift_ended',
      description: `Ended shift`,
      user: currentUser.fullName,
      timestamp: new Date()
    };

    onLogActivity(log);
  };

  const handleJoinShift = () => {
    if (!currentShift || !currentShift.isActive) return;
    onJoinShift(currentShift.id, currentUser.fullName);

    const log: ActivityLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'shift_joined',
      description: `${currentUser.fullName} joined the shift`,
      user: currentUser.fullName,
      timestamp: new Date()
    };

    onLogActivity(log);
  };

  const handleLeaveShift = () => {
    if (!currentShift) return;
    onLeaveShift(currentShift.id, currentUser.fullName);

    const log: ActivityLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'shift_left',
      description: `${currentUser.fullName} left the shift`,
      user: currentUser.fullName,
      timestamp: new Date()
    };

    onLogActivity(log);
  };

  const isUserInShift = currentShift?.teamMembers.includes(currentUser.fullName) || false;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Shift Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!currentShift ? (
          <div className="space-y-4">
            <h3 className="font-semibold">Start New Shift</h3>
            <p className="text-sm text-muted-foreground">Click the button below to start a shift.</p>

            <div>
              <Button onClick={handleStartShift} className="w-full">
                <Play className="h-4 w-4 mr-2" />
                Start Shift
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-green-800">Active Shift</h3>
                <Badge variant="outline" className="bg-green-100 text-green-800">Active</Badge>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span><strong>Started:</strong> {new Date(currentShift.startTime).toLocaleString()}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-green-600" />
                  <span><strong>Team:</strong> {currentShift.teamMembers.join(', ')}</span>
                </div>

                {currentShift.notes && (
                  <div className="mt-2 p-2 bg-blue-50 rounded border">
                    <strong>Notes:</strong> {currentShift.notes}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              {!isUserInShift ? (
                <Button onClick={handleJoinShift} variant="outline" className="flex-1">Join Shift</Button>
              ) : (
                <Button onClick={handleLeaveShift} variant="outline" className="flex-1">Leave Shift</Button>
              )}

              <Button onClick={handleEndShift} variant="destructive" className="flex-1">End Shift</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// The file contains a single ShiftManager component.