export interface HospitalOwner {
  id: string;
  owner_type: 'individual' | 'company' | 'government' | 'ngo';
  name: string;
  email: string;
  phone: string;
  company_name?: string;
  registration_number?: string;
  tax_id?: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postal_code?: string;
  bank_name?: string;
  account_number?: string;
  payment_method?: string;
  documents?: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface Hospital {
  id: string;
  owner_id?: string;
  code: string;
  name: string;
  type: 'general' | 'specialized' | 'clinic' | 'diagnostic_center' | 'maternity';
  status: 'pending' | 'active' | 'suspended' | 'inactive';
  address: string;
  city: string;
  state: string;
  country: string;
  postal_code?: string;
  phone: string;
  email: string;
  website?: string;
  bed_capacity?: number;
  staff_count?: number;
  departments?: string[];
  services_offered?: string[];
  operating_hours?: Record<string, any>;
  license_number?: string;
  license_expiry?: Date;
  accreditations?: string[];
  insurance_partners?: string[];
  revenue_share_percentage?: number;
  billing_cycle?: string;
  latitude?: number;
  longitude?: number;
  created_at: Date;
  updated_at: Date;
  onboarded_at?: Date;
}

export interface Application {
  id: string;
  application_number: string;
  owner_id?: string;
  hospital_id?: string;
  status: 'draft' | 'submitted' | 'under_review' | 'documents_pending' | 'scoring' | 
          'approved' | 'rejected' | 'contract_pending' | 'contract_signed' | 'completed';
  submission_date?: Date;
  review_start_date?: Date;
  approval_date?: Date;
  rejection_date?: Date;
  rejection_reason?: string;
  completion_date?: Date;
  assigned_reviewer?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

export interface EvaluationScore {
  id: string;
  application_id: string;
  category: string;
  subcategory?: string;
  max_score: number;
  actual_score: number;
  weight: number;
  comments?: string;
  evaluated_by?: string;
  evaluated_at: Date;
  created_at: Date;
}

export interface Document {
  id: string;
  application_id: string;
  document_type: string;
  document_name: string;
  file_path: string;
  file_size?: number;
  mime_type?: string;
  status: 'pending' | 'verified' | 'rejected' | 'expired';
  verification_date?: Date;
  verified_by?: string;
  rejection_reason?: string;
  expiry_date?: Date;
  metadata?: Record<string, any>;
  uploaded_at: Date;
  created_at: Date;
}

export interface Contract {
  id: string;
  application_id?: string;
  contract_number: string;
  template_id?: string;
  version: number;
  content: string;
  terms?: Record<string, any>;
  start_date: Date;
  end_date?: Date;
  renewal_terms?: Record<string, any>;
  status: 'draft' | 'sent' | 'viewed' | 'signed' | 'countersigned' | 'active' | 'expired' | 'terminated';
  sent_date?: Date;
  viewed_date?: Date;
  signed_date?: Date;
  countersigned_date?: Date;
  signature_request_id?: string;
  owner_signature?: Record<string, any>;
  gmso_signature?: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface EvaluationCriteria {
  id: string;
  category: string;
  subcategory?: string;
  criteria_name: string;
  description?: string;
  max_points: number;
  weight: number;
  evaluation_type: 'manual' | 'automatic' | 'hybrid';
  evaluation_rules?: Record<string, any>;
  is_mandatory: boolean;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface ApplicationStatusHistory {
  id: string;
  application_id: string;
  old_status?: string;
  new_status: string;
  changed_by?: string;
  reason?: string;
  created_at: Date;
}

export interface DashboardMetrics {
  totalApplications: number;
  pendingApplications: number;
  approvedApplications: number;
  rejectedApplications: number;
  averageProcessingTime: number;
  documentsToVerify: number;
  contractsPending: number;
  recentApplications: Application[];
  applicationsByStatus: { status: string; count: number }[];
  applicationsByMonth: { month: string; count: number }[];
}
