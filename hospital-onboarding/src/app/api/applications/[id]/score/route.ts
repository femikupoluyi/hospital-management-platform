import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { HospitalScoringEngine } from '@/lib/scoring';
import { EvaluationCriteria, Hospital } from '@/types';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get application with hospital data
    const [application] = await sql`
      SELECT 
        a.*,
        h.*,
        h.id as hospital_id
      FROM onboarding.applications a
      LEFT JOIN organization.hospitals h ON a.hospital_id = h.id
      WHERE a.id = ${id}
    `;

    if (!application) {
      return NextResponse.json(
        { success: false, error: 'Application not found' },
        { status: 404 }
      );
    }

    // Get evaluation criteria
    const criteria = await sql`
      SELECT * FROM onboarding.evaluation_criteria
      WHERE is_active = true
    `;

    // Get documents for the application
    const documents = await sql`
      SELECT * FROM onboarding.documents
      WHERE application_id = ${id}
    `;

    // Initialize scoring engine with typed criteria
    const scoringEngine = new HospitalScoringEngine(criteria as EvaluationCriteria[]);

    // Calculate scores (cast to Hospital type for compatibility)
    const scoringResult = scoringEngine.calculateScore(application as Hospital, documents as any[]);

    // Start transaction to save scores
    await sql`BEGIN`;

    try {
      // Delete existing scores for this application
      await sql`
        DELETE FROM onboarding.evaluation_scores
        WHERE application_id = ${id}
      `;

      // Insert new scores
      for (const detail of scoringResult.details) {
        await sql`
          INSERT INTO onboarding.evaluation_scores (
            application_id, category, subcategory, max_score,
            actual_score, weight, comments
          ) VALUES (
            ${id},
            ${detail.category},
            ${detail.subcategory || null},
            ${detail.max_score},
            ${detail.actual_score},
            ${detail.weight},
            ${detail.comments || null}
          )
        `;
      }

      // Update application status based on recommendation
      let newStatus = 'scoring';
      if (scoringResult.recommendation === 'approve') {
        newStatus = 'approved';
      } else if (scoringResult.recommendation === 'reject') {
        newStatus = 'rejected';
      } else {
        newStatus = 'under_review';
      }

      await sql`
        UPDATE onboarding.applications
        SET 
          status = ${newStatus},
          notes = ${`Automated scoring completed. Score: ${scoringResult.percentage.toFixed(2)}%. Recommendation: ${scoringResult.recommendation}`},
          updated_at = NOW()
        WHERE id = ${id}
      `;

      // Add to status history
      await sql`
        INSERT INTO onboarding.application_status_history (
          application_id, old_status, new_status, reason
        ) VALUES (
          ${id},
          ${application.status},
          ${newStatus},
          ${`Automated scoring: ${scoringResult.percentage.toFixed(2)}% - ${scoringResult.recommendation}`}
        )
      `;

      await sql`COMMIT`;

      return NextResponse.json({
        success: true,
        data: {
          totalScore: scoringResult.totalScore,
          maxPossibleScore: scoringResult.maxPossibleScore,
          percentage: scoringResult.percentage,
          recommendation: scoringResult.recommendation,
          details: scoringResult.details,
          newStatus,
        },
        message: 'Scoring completed successfully',
      });
    } catch (error) {
      await sql`ROLLBACK`;
      throw error;
    }
  } catch (error) {
    console.error('Error scoring application:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to score application' },
      { status: 500 }
    );
  }
}

// GET - Get existing scores for an application
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const scores = await sql`
      SELECT * FROM onboarding.evaluation_scores
      WHERE application_id = ${id}
      ORDER BY category, subcategory
    `;

    if (scores.length === 0) {
      return NextResponse.json({
        success: true,
        data: null,
        message: 'No scores found for this application',
      });
    }

    // Calculate totals
    let totalWeightedScore = 0;
    let maxWeightedScore = 0;

    scores.forEach((score: any) => {
      const weightedScore = score.actual_score * score.weight;
      totalWeightedScore += weightedScore;
      maxWeightedScore += score.max_score * score.weight;
    });

    const percentage = (totalWeightedScore / maxWeightedScore) * 100;

    return NextResponse.json({
      success: true,
      data: {
        scores,
        summary: {
          totalScore: totalWeightedScore,
          maxPossibleScore: maxWeightedScore,
          percentage,
          recommendation: percentage >= 75 ? 'approve' : percentage >= 50 ? 'review' : 'reject',
        },
      },
    });
  } catch (error) {
    console.error('Error fetching scores:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch scores' },
      { status: 500 }
    );
  }
}
