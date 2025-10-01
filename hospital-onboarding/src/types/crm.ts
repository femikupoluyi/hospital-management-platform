// Owner CRM Types
export interface OwnerAccount {
  id: string;
  owner_id: string;
  account_status: 'active' | 'suspended' | 'inactive';
  contract_count: number;
  total_revenue: number;
  total_payouts: number;
  pending_payouts: number;
  satisfaction_score?: number;
  last_communication_date?: Date;
  preferred_communication_channel: 'email' | 'sms' | 'whatsapp' | 'call';
  communication_frequency: 'daily' | 'weekly' | 'monthly';
  account_manager?: string;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

export interface OwnerPayout {
  id: string;
  owner_id: string;
  hospital_id: string;
  payout_period: string;
  period_start: Date;
  period_end: Date;
  gross_revenue: number;
  management_fee_percentage: number;
  management_fee_amount: number;
  net_payout: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  payment_method?: string;
  payment_reference?: string;
  payment_date?: Date;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

export interface OwnerCommunication {
  id: string;
  owner_id: string;
  communication_type: 'email' | 'sms' | 'whatsapp' | 'call' | 'meeting' | 'letter';
  subject?: string;
  content: string;
  direction: 'inbound' | 'outbound';
  status: string;
  sent_at?: Date;
  delivered_at?: Date;
  read_at?: Date;
  responded_at?: Date;
  response_content?: string;
  tags: string[];
  attachments: any[];
  created_by?: string;
  created_at: Date;
}

// Patient CRM Types
export interface Patient {
  id: string;
  hospital_id: string;
  patient_number: string;
  first_name: string;
  last_name: string;
  date_of_birth?: Date;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  email?: string;
  phone: string;
  alternate_phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country: string;
  blood_group?: string;
  allergies: string[];
  chronic_conditions: string[];
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  preferred_language: string;
  communication_preferences: {
    email: boolean;
    sms: boolean;
    whatsapp: boolean;
  };
  loyalty_points: number;
  loyalty_tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  registration_date: Date;
  last_visit_date?: Date;
  total_visits: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Appointment {
  id: string;
  patient_id: string;
  hospital_id: string;
  appointment_number: string;
  appointment_date: Date;
  appointment_time: string;
  department?: string;
  doctor_name?: string;
  appointment_type?: string;
  reason_for_visit?: string;
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show' | 'rescheduled';
  check_in_time?: Date;
  check_out_time?: Date;
  notes?: string;
  follow_up_required: boolean;
  follow_up_date?: Date;
  reminder_sent: boolean;
  reminder_sent_at?: Date;
  confirmation_sent: boolean;
  confirmation_sent_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface AppointmentReminder {
  id: string;
  appointment_id: string;
  reminder_type: '24_hour' | '3_hour' | 'morning_of' | 'custom';
  reminder_channel: 'sms' | 'whatsapp' | 'email' | 'call';
  scheduled_time: Date;
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'cancelled';
  sent_at?: Date;
  delivered_at?: Date;
  failure_reason?: string;
  message_content?: string;
  created_at: Date;
}

export interface PatientFeedback {
  id: string;
  patient_id: string;
  appointment_id?: string;
  hospital_id: string;
  feedback_type: 'appointment' | 'service' | 'facility' | 'staff' | 'general';
  rating: number;
  wait_time_rating?: number;
  staff_rating?: number;
  facility_rating?: number;
  treatment_rating?: number;
  comments?: string;
  improvements_suggested?: string;
  would_recommend?: boolean;
  follow_up_required: boolean;
  follow_up_completed: boolean;
  submitted_at: Date;
  created_at: Date;
}

// Loyalty Program Types
export interface LoyaltyProgram {
  id: string;
  program_name: string;
  program_type: 'points' | 'tier' | 'hybrid';
  is_active: boolean;
  points_per_visit: number;
  points_per_currency: number;
  tier_requirements: {
    bronze: number;
    silver: number;
    gold: number;
    platinum: number;
  };
  tier_benefits: Record<string, string[]>;
  redemption_rules?: any;
  expiry_policy?: any;
  created_at: Date;
  updated_at: Date;
}

export interface PatientPoints {
  id: string;
  patient_id: string;
  program_id: string;
  transaction_type: 'earned' | 'redeemed' | 'expired' | 'adjusted' | 'bonus';
  points: number;
  balance_before: number;
  balance_after: number;
  description?: string;
  reference_type?: string;
  reference_id?: string;
  expiry_date?: Date;
  created_at: Date;
}

export interface Reward {
  id: string;
  reward_name: string;
  reward_type: 'discount' | 'service' | 'product' | 'consultation';
  points_required: number;
  discount_percentage?: number;
  discount_amount?: number;
  description?: string;
  terms_conditions?: string;
  is_active: boolean;
  validity_days: number;
  max_redemptions_per_patient?: number;
  total_redemptions: number;
  created_at: Date;
  updated_at: Date;
}

// Communication Types
export interface Campaign {
  id: string;
  campaign_name: string;
  campaign_type: 'promotional' | 'educational' | 'reminder' | 'survey' | 'announcement';
  target_audience: 'all_patients' | 'all_owners' | 'specific_patients' | 'specific_owners' | 'loyalty_tier' | 'custom';
  audience_filters: any;
  channels: ('email' | 'sms' | 'whatsapp')[];
  subject?: string;
  content_template: string;
  personalization_fields: string[];
  schedule_type: 'immediate' | 'scheduled' | 'recurring';
  scheduled_time?: Date;
  recurrence_pattern?: any;
  status: 'draft' | 'scheduled' | 'in_progress' | 'completed' | 'paused' | 'cancelled';
  total_recipients: number;
  sent_count: number;
  delivered_count: number;
  opened_count: number;
  clicked_count: number;
  created_by?: string;
  created_at: Date;
  updated_at: Date;
}

export interface MessageTemplate {
  id: string;
  template_name: string;
  template_type: 'email' | 'sms' | 'whatsapp';
  category: 'appointment' | 'reminder' | 'promotional' | 'educational' | 'survey' | 'notification';
  subject?: string;
  content: string;
  variables: string[];
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface MessageQueueItem {
  id: string;
  recipient_type: 'patient' | 'owner';
  recipient_id: string;
  recipient_email?: string;
  recipient_phone?: string;
  channel: 'email' | 'sms' | 'whatsapp';
  subject?: string;
  content: string;
  priority: number;
  status: 'queued' | 'processing' | 'sent' | 'delivered' | 'failed' | 'cancelled';
  scheduled_for?: Date;
  attempts: number;
  max_attempts: number;
  sent_at?: Date;
  delivered_at?: Date;
  failure_reason?: string;
  metadata: any;
  created_at: Date;
}
