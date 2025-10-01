'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Activity, User, Calendar, FileText, Heart, Thermometer } from 'lucide-react';

interface Encounter {
  encounter_id: string;
  encounter_number: string;
  patient_name: string;
  patient_number: string;
  encounter_type: string;
  admission_date: string;
  department: string;
  status: string;
  chief_complaint: string;
  triage_level: number;
  bed_number: string;
}

export default function EMRDashboard() {
  const [encounters, setEncounters] = useState<Encounter[]>([]);
  const [selectedEncounter, setSelectedEncounter] = useState<Encounter | null>(null);
  const [vitalSigns, setVitalSigns] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showNewEncounterForm, setShowNewEncounterForm] = useState(false);
  const [newEncounter, setNewEncounter] = useState({
    patient_id: '',
    hospital_id: '37f6c11b-5ded-4c17-930d-88b1fec06301',
    encounter_type: 'outpatient',
    department: '',
    chief_complaint: '',
    triage_level: 3
  });

  useEffect(() => {
    fetchEncounters();
  }, []);

  const fetchEncounters = async () => {
    try {
      const response = await fetch('/api/emr/encounters?status=active');
      const data = await response.json();
      setEncounters(data.encounters || []);
    } catch (error) {
      console.error('Error fetching encounters:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchVitalSigns = async (encounterId: string) => {
    try {
      const response = await fetch(`/api/emr/vital-signs?encounter_id=${encounterId}`);
      const data = await response.json();
      setVitalSigns(data.vital_signs?.[0] || null);
    } catch (error) {
      console.error('Error fetching vital signs:', error);
    }
  };

  const createEncounter = async () => {
    try {
      const response = await fetch('/api/emr/encounters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEncounter)
      });
      const data = await response.json();
      if (data.encounter) {
        fetchEncounters();
        setShowNewEncounterForm(false);
        setNewEncounter({
          patient_id: '',
          hospital_id: '37f6c11b-5ded-4c17-930d-88b1fec06301',
          encounter_type: 'outpatient',
          department: '',
          chief_complaint: '',
          triage_level: 3
        });
      }
    } catch (error) {
      console.error('Error creating encounter:', error);
    }
  };

  const recordVitalSigns = async (encounterId: string, vitals: any) => {
    try {
      const response = await fetch('/api/emr/vital-signs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          encounter_id: encounterId,
          ...vitals
        })
      });
      const data = await response.json();
      if (data.vital_signs) {
        fetchVitalSigns(encounterId);
      }
    } catch (error) {
      console.error('Error recording vital signs:', error);
    }
  };

  const getTriageColor = (level: number) => {
    switch (level) {
      case 1: return 'bg-red-500';
      case 2: return 'bg-orange-500';
      case 3: return 'bg-yellow-500';
      case 4: return 'bg-green-500';
      case 5: return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'discharged': return 'bg-blue-500';
      case 'transferred': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return <div>Loading EMR data...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Electronic Medical Records</h2>
        <Button 
          onClick={() => setShowNewEncounterForm(!showNewEncounterForm)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <FileText className="mr-2 h-4 w-4" />
          New Encounter
        </Button>
      </div>

      {showNewEncounterForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Encounter</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Input
                placeholder="Patient ID"
                value={newEncounter.patient_id}
                onChange={(e) => setNewEncounter({ ...newEncounter, patient_id: e.target.value })}
              />
              <select
                className="px-3 py-2 border rounded-md"
                value={newEncounter.encounter_type}
                onChange={(e) => setNewEncounter({ ...newEncounter, encounter_type: e.target.value })}
              >
                <option value="outpatient">Outpatient</option>
                <option value="inpatient">Inpatient</option>
                <option value="emergency">Emergency</option>
                <option value="daycare">Day Care</option>
                <option value="telemedicine">Telemedicine</option>
              </select>
              <Input
                placeholder="Department"
                value={newEncounter.department}
                onChange={(e) => setNewEncounter({ ...newEncounter, department: e.target.value })}
              />
              <select
                className="px-3 py-2 border rounded-md"
                value={newEncounter.triage_level}
                onChange={(e) => setNewEncounter({ ...newEncounter, triage_level: parseInt(e.target.value) })}
              >
                <option value="1">1 - Critical</option>
                <option value="2">2 - Urgent</option>
                <option value="3">3 - Less Urgent</option>
                <option value="4">4 - Non-Urgent</option>
                <option value="5">5 - Not Urgent</option>
              </select>
              <Input
                placeholder="Chief Complaint"
                value={newEncounter.chief_complaint}
                onChange={(e) => setNewEncounter({ ...newEncounter, chief_complaint: e.target.value })}
                className="col-span-2"
              />
              <Button 
                onClick={createEncounter}
                className="col-span-2 bg-green-600 hover:bg-green-700"
              >
                Create Encounter
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="mr-2 h-5 w-5" />
                Active Encounters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {encounters.map((encounter) => (
                  <div
                    key={encounter.encounter_id}
                    className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => {
                      setSelectedEncounter(encounter);
                      fetchVitalSigns(encounter.encounter_id);
                    }}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{encounter.patient_name}</span>
                          <Badge variant="outline">{encounter.patient_number}</Badge>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {encounter.chief_complaint || 'No complaint recorded'}
                        </p>
                        <div className="flex gap-2 mt-2">
                          <Badge className={getTriageColor(encounter.triage_level)}>
                            Triage {encounter.triage_level}
                          </Badge>
                          <Badge variant="outline">{encounter.encounter_type}</Badge>
                          {encounter.department && (
                            <Badge variant="outline">{encounter.department}</Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={getStatusColor(encounter.status)}>
                          {encounter.status}
                        </Badge>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(encounter.admission_date).toLocaleDateString()}
                        </p>
                        {encounter.bed_number && (
                          <p className="text-xs text-gray-600">Bed: {encounter.bed_number}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {encounters.length === 0 && (
                  <p className="text-gray-500 text-center py-4">No active encounters</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          {selectedEncounter && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Heart className="mr-2 h-5 w-5" />
                  Vital Signs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm">
                    <strong>Patient:</strong> {selectedEncounter.patient_name}
                  </div>
                  <div className="text-sm">
                    <strong>Encounter:</strong> {selectedEncounter.encounter_number}
                  </div>
                  
                  {vitalSigns ? (
                    <div className="space-y-2 mt-4">
                      {vitalSigns.temperature && (
                        <div className="flex justify-between">
                          <span className="text-sm">Temperature:</span>
                          <span className="font-semibold">{vitalSigns.temperature}°C</span>
                        </div>
                      )}
                      {(vitalSigns.blood_pressure_systolic && vitalSigns.blood_pressure_diastolic) && (
                        <div className="flex justify-between">
                          <span className="text-sm">Blood Pressure:</span>
                          <span className="font-semibold">
                            {vitalSigns.blood_pressure_systolic}/{vitalSigns.blood_pressure_diastolic} mmHg
                          </span>
                        </div>
                      )}
                      {vitalSigns.pulse_rate && (
                        <div className="flex justify-between">
                          <span className="text-sm">Pulse Rate:</span>
                          <span className="font-semibold">{vitalSigns.pulse_rate} bpm</span>
                        </div>
                      )}
                      {vitalSigns.oxygen_saturation && (
                        <div className="flex justify-between">
                          <span className="text-sm">O2 Saturation:</span>
                          <span className="font-semibold">{vitalSigns.oxygen_saturation}%</span>
                        </div>
                      )}
                      {vitalSigns.weight && (
                        <div className="flex justify-between">
                          <span className="text-sm">Weight:</span>
                          <span className="font-semibold">{vitalSigns.weight} kg</span>
                        </div>
                      )}
                      {vitalSigns.bmi && (
                        <div className="flex justify-between">
                          <span className="text-sm">BMI:</span>
                          <span className="font-semibold">{vitalSigns.bmi}</span>
                        </div>
                      )}
                      <div className="text-xs text-gray-500 mt-2">
                        Recorded: {new Date(vitalSigns.recorded_at).toLocaleString()}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <Thermometer className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500">No vital signs recorded</p>
                      <Button 
                        size="sm" 
                        className="mt-2"
                        onClick={() => {
                          // In a real app, this would open a form
                          recordVitalSigns(selectedEncounter.encounter_id, {
                            temperature: 36.8,
                            blood_pressure_systolic: 120,
                            blood_pressure_diastolic: 80,
                            pulse_rate: 72,
                            oxygen_saturation: 98,
                            weight: 70
                          });
                        }}
                      >
                        Record Vital Signs
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
