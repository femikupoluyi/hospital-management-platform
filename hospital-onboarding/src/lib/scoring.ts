import { Hospital, EvaluationCriteria } from '@/types';

interface ScoringResult {
  category: string;
  subcategory?: string;
  criteria_name: string;
  max_score: number;
  actual_score: number;
  weight: number;
  weighted_score: number;
  comments?: string;
}

export class HospitalScoringEngine {
  private criteria: EvaluationCriteria[];

  constructor(criteria: EvaluationCriteria[]) {
    this.criteria = criteria.filter(c => c.is_active);
  }

  public calculateScore(hospital: Hospital, documents: any[]): {
    totalScore: number;
    maxPossibleScore: number;
    percentage: number;
    details: ScoringResult[];
    recommendation: 'approve' | 'review' | 'reject';
  } {
    const scoringResults: ScoringResult[] = [];
    let totalWeightedScore = 0;
    let maxWeightedScore = 0;

    for (const criterion of this.criteria) {
      const result = this.evaluateCriterion(criterion, hospital, documents);
      scoringResults.push(result);
      totalWeightedScore += result.weighted_score;
      maxWeightedScore += criterion.max_points * criterion.weight;
    }

    const percentage = (totalWeightedScore / maxWeightedScore) * 100;
    const recommendation = this.getRecommendation(percentage);

    return {
      totalScore: totalWeightedScore,
      maxPossibleScore: maxWeightedScore,
      percentage,
      details: scoringResults,
      recommendation,
    };
  }

  private evaluateCriterion(
    criterion: EvaluationCriteria,
    hospital: Hospital,
    documents: any[]
  ): ScoringResult {
    let actualScore = 0;
    let comments = '';

    switch (criterion.category) {
      case 'Infrastructure':
        actualScore = this.evaluateInfrastructure(criterion, hospital);
        break;
      case 'Compliance':
        actualScore = this.evaluateCompliance(criterion, hospital, documents);
        break;
      case 'Financial':
        actualScore = this.evaluateFinancial(criterion, hospital);
        break;
      case 'Location':
        actualScore = this.evaluateLocation(criterion, hospital);
        break;
      case 'Services':
        actualScore = this.evaluateServices(criterion, hospital);
        break;
      case 'Partnership':
        actualScore = this.evaluatePartnerships(criterion, hospital);
        break;
      case 'Documentation':
        actualScore = this.evaluateDocumentation(criterion, documents);
        break;
      default:
        actualScore = 0;
    }

    const weightedScore = actualScore * criterion.weight;

    return {
      category: criterion.category,
      subcategory: criterion.subcategory,
      criteria_name: criterion.criteria_name,
      max_score: criterion.max_points,
      actual_score: actualScore,
      weight: criterion.weight,
      weighted_score: weightedScore,
      comments,
    };
  }

  private evaluateInfrastructure(criterion: EvaluationCriteria, hospital: Hospital): number {
    const maxScore = criterion.max_points;

    switch (criterion.subcategory) {
      case 'Capacity':
        if (criterion.criteria_name === 'Bed Capacity') {
          const bedCount = hospital.bed_capacity || 0;
          if (bedCount >= 100) return maxScore;
          if (bedCount >= 50) return maxScore * 0.8;
          if (bedCount >= 25) return maxScore * 0.6;
          if (bedCount >= 10) return maxScore * 0.4;
          return maxScore * 0.2;
        }
        if (criterion.criteria_name === 'Staff Count') {
          const staffCount = hospital.staff_count || 0;
          if (staffCount >= 50) return maxScore;
          if (staffCount >= 25) return maxScore * 0.8;
          if (staffCount >= 10) return maxScore * 0.6;
          if (staffCount >= 5) return maxScore * 0.4;
          return maxScore * 0.2;
        }
        break;
      case 'Facilities':
        if (criterion.criteria_name === 'Departments') {
          const deptCount = hospital.departments?.length || 0;
          if (deptCount >= 10) return maxScore;
          if (deptCount >= 7) return maxScore * 0.8;
          if (deptCount >= 5) return maxScore * 0.6;
          if (deptCount >= 3) return maxScore * 0.4;
          return maxScore * 0.2;
        }
        break;
    }
    return 0;
  }

  private evaluateCompliance(
    criterion: EvaluationCriteria,
    hospital: Hospital,
    documents: any[]
  ): number {
    const maxScore = criterion.max_points;

    switch (criterion.subcategory) {
      case 'Licensing':
        if (criterion.criteria_name === 'Valid License') {
          if (!hospital.license_number) return 0;
          const hasLicense = hospital.license_expiry && 
                           new Date(hospital.license_expiry) > new Date();
          return hasLicense ? maxScore : 0;
        }
        break;
      case 'Certification':
        if (criterion.criteria_name === 'Accreditations') {
          const accredCount = hospital.accreditations?.length || 0;
          if (accredCount >= 5) return maxScore;
          if (accredCount >= 3) return maxScore * 0.8;
          if (accredCount >= 2) return maxScore * 0.6;
          if (accredCount >= 1) return maxScore * 0.4;
          return 0;
        }
        break;
    }
    return 0;
  }

  private evaluateFinancial(criterion: EvaluationCriteria, hospital: Hospital): number {
    const maxScore = criterion.max_points;

    if (criterion.criteria_name === 'Revenue Potential') {
      // Estimate based on bed capacity and type
      const bedCapacity = hospital.bed_capacity || 0;
      const typeMultiplier = this.getHospitalTypeMultiplier(hospital.type);
      const score = Math.min((bedCapacity * typeMultiplier) / 100, 1) * maxScore;
      return Math.min(score, maxScore);
    }
    return 0;
  }

  private evaluateLocation(criterion: EvaluationCriteria, hospital: Hospital): number {
    const maxScore = criterion.max_points;

    if (criterion.criteria_name === 'Geographic Coverage') {
      // Strategic cities get higher scores
      const strategicCities = ['Accra', 'Kumasi', 'Takoradi', 'Tamale', 'Cape Coast'];
      const cityScore = strategicCities.includes(hospital.city) ? 1 : 0.5;
      return maxScore * cityScore;
    }
    return 0;
  }

  private evaluateServices(criterion: EvaluationCriteria, hospital: Hospital): number {
    const maxScore = criterion.max_points;

    if (criterion.criteria_name === 'Service Range') {
      const serviceCount = hospital.services_offered?.length || 0;
      if (serviceCount >= 20) return maxScore;
      if (serviceCount >= 15) return maxScore * 0.8;
      if (serviceCount >= 10) return maxScore * 0.6;
      if (serviceCount >= 5) return maxScore * 0.4;
      return maxScore * 0.2;
    }
    return 0;
  }

  private evaluatePartnerships(criterion: EvaluationCriteria, hospital: Hospital): number {
    const maxScore = criterion.max_points;

    if (criterion.criteria_name === 'Insurance Network') {
      const partnerCount = hospital.insurance_partners?.length || 0;
      if (partnerCount >= 10) return maxScore;
      if (partnerCount >= 7) return maxScore * 0.8;
      if (partnerCount >= 5) return maxScore * 0.6;
      if (partnerCount >= 3) return maxScore * 0.4;
      return maxScore * 0.2;
    }
    return 0;
  }

  private evaluateDocumentation(criterion: EvaluationCriteria, documents: any[]): number {
    const maxScore = criterion.max_points;

    if (criterion.criteria_name === 'Document Submission') {
      const requiredDocs = [
        'business_registration',
        'medical_license',
        'tax_certificate',
        'insurance_certificate',
        'facility_photos',
      ];
      
      const submittedTypes = documents.map(d => d.document_type);
      const completedDocs = requiredDocs.filter(doc => submittedTypes.includes(doc));
      const completionRate = completedDocs.length / requiredDocs.length;
      
      return maxScore * completionRate;
    }
    return 0;
  }

  private getHospitalTypeMultiplier(type: string): number {
    const multipliers: Record<string, number> = {
      'general': 1.0,
      'specialized': 1.2,
      'clinic': 0.6,
      'diagnostic_center': 0.8,
      'maternity': 0.7,
    };
    return multipliers[type] || 0.5;
  }

  private getRecommendation(percentage: number): 'approve' | 'review' | 'reject' {
    if (percentage >= 75) return 'approve';
    if (percentage >= 50) return 'review';
    return 'reject';
  }
}
