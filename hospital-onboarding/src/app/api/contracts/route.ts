import { NextRequest, NextResponse } from 'next/server';
import { sql, executeQuery } from '@/lib/db';

// Contract template generator
function generateContractContent(data: any): string {
  const startDate = new Date();
  const endDate = new Date();
  endDate.setFullYear(endDate.getFullYear() + 2); // 2-year contract

  return `
HOSPITAL MANAGEMENT SERVICES AGREEMENT

This Agreement is entered into as of ${startDate.toLocaleDateString()} ("Effective Date")

BETWEEN:

GrandPro Hospital Management Services Organization (GMSO)
A registered healthcare management company
("GMSO" or "Manager")

AND:

${data.owner_name}
${data.company_name ? `Operating as: ${data.company_name}` : ''}
${data.owner_address}, ${data.owner_city}, ${data.owner_state}, ${data.owner_country}
Email: ${data.owner_email}
Phone: ${data.owner_phone}
("Hospital Owner" or "Owner")

For the management and operation of:
${data.hospital_name}
${data.hospital_address}, ${data.hospital_city}, ${data.hospital_state}
License Number: ${data.license_number}
("Hospital" or "Facility")

WHEREAS, GMSO provides professional hospital management services;
WHEREAS, Owner desires to engage GMSO to manage and operate the Hospital;

NOW, THEREFORE, in consideration of the mutual covenants and agreements contained herein:

1. SERVICES
GMSO shall provide comprehensive hospital management services including:
- Daily operational management
- Clinical quality improvement programs
- Revenue cycle management
- Staff recruitment and training
- Technology infrastructure management
- Regulatory compliance oversight
- Marketing and patient engagement

2. TERM
Initial Term: 2 years from the Effective Date
Renewal: Automatic renewal for successive 1-year periods unless terminated

3. REVENUE SHARING
- GMSO Management Fee: ${data.revenue_share_percentage || 20}% of Net Revenue
- Payment Terms: ${data.billing_cycle || 'Monthly'} reconciliation and payment
- Owner retains ${100 - (data.revenue_share_percentage || 20)}% of Net Revenue

4. OWNER OBLIGATIONS
- Maintain all required licenses and permits
- Provide adequate funding for operations
- Ensure facility meets regulatory standards
- Cooperate with GMSO management directives

5. GMSO OBLIGATIONS
- Manage day-to-day operations professionally
- Maintain clinical quality standards
- Ensure regulatory compliance
- Provide monthly performance reports
- Implement best practices and protocols

6. PERFORMANCE METRICS
GMSO commits to achieving:
- Patient satisfaction score ≥ 85%
- Bed occupancy rate ≥ 70%
- Clinical quality indicators meeting national standards
- Revenue growth of ≥ 15% annually

7. TERMINATION
Either party may terminate with 90 days written notice for:
- Material breach not cured within 30 days
- Insolvency or bankruptcy
- Loss of required licenses
- Force majeure events exceeding 60 days

8. CONFIDENTIALITY
Both parties shall maintain strict confidentiality of all proprietary information.

9. INDEMNIFICATION
Each party shall indemnify the other against claims arising from their negligence.

10. GOVERNING LAW
This Agreement shall be governed by the laws of Ghana.

11. ENTIRE AGREEMENT
This constitutes the entire agreement between the parties.

AGREED AND ACCEPTED:

FOR GMSO:
_______________________
Name: [GMSO Representative]
Title: Chief Executive Officer
Date: ${startDate.toLocaleDateString()}

FOR HOSPITAL OWNER:
_______________________
Name: ${data.owner_name}
Title: ${data.owner_type === 'individual' ? 'Owner' : 'Authorized Representative'}
Date: ${startDate.toLocaleDateString()}
`;
}

// POST - Generate contract for approved application
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { application_id } = body;

    if (!application_id) {
      return NextResponse.json(
        { success: false, error: 'Application ID is required' },
        { status: 400 }
      );
    }

    // Get application details
    const result = await sql`
      SELECT 
        a.id as app_id,
        a.status as app_status,
        a.application_number,
        ho.name as owner_name,
        ho.email as owner_email,
        ho.phone as owner_phone,
        ho.owner_type,
        ho.company_name,
        ho.address as owner_address,
        ho.city as owner_city,
        ho.state as owner_state,
        ho.country as owner_country,
        h.name as hospital_name,
        h.address as hospital_address,
        h.city as hospital_city,
        h.state as hospital_state,
        h.license_number,
        h.revenue_share_percentage,
        h.billing_cycle
      FROM onboarding.applications a
      LEFT JOIN organization.hospital_owners ho ON a.owner_id = ho.id
      LEFT JOIN organization.hospitals h ON a.hospital_id = h.id
      WHERE a.id = ${application_id}
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Application not found' },
        { status: 404 }
      );
    }

    const application = result[0];

    // Check if application is approved
    if (application.app_status !== 'approved') {
      return NextResponse.json(
        { success: false, error: 'Only approved applications can generate contracts' },
        { status: 400 }
      );
    }

    // Check if contract already exists
    const existingContract = await sql`
      SELECT * FROM onboarding.contracts
      WHERE application_id = ${application_id}
    `;

    if (existingContract.length > 0) {
      return NextResponse.json({
        success: true,
        data: existingContract[0],
        message: 'Contract already exists for this application',
      });
    }

    // Generate contract
    const contractNumber = `CONT-${Date.now().toString(36).toUpperCase()}`;
    const contractContent = generateContractContent(application);
    const startDate = new Date();
    const endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + 2);

    const [contract] = await sql`
      INSERT INTO onboarding.contracts (
        application_id,
        contract_number,
        version,
        content,
        terms,
        start_date,
        end_date,
        renewal_terms,
        status
      ) VALUES (
        ${application_id},
        ${contractNumber},
        1,
        ${contractContent},
        ${JSON.stringify({
          revenue_share: application.revenue_share_percentage || 20,
          billing_cycle: application.billing_cycle || 'monthly',
          initial_term: '2 years',
          renewal_term: '1 year',
        })},
        ${startDate.toISOString()},
        ${endDate.toISOString()},
        ${JSON.stringify({
          automatic: true,
          notice_period: '90 days',
          renewal_term: '1 year',
        })},
        'draft'
      ) RETURNING *
    `;

    // Update application status
    await sql`
      UPDATE onboarding.applications
      SET 
        status = 'contract_pending',
        updated_at = NOW()
      WHERE id = ${application_id}
    `;

    // Add to status history
    await sql`
      INSERT INTO onboarding.application_status_history (
        application_id, old_status, new_status, reason
      ) VALUES (
        ${application_id},
        'approved',
        'contract_pending',
        'Contract generated and pending signature'
      )
    `;

    return NextResponse.json({
      success: true,
      data: contract,
      message: 'Contract generated successfully',
    });
  } catch (error) {
    console.error('Error generating contract:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate contract' },
      { status: 500 }
    );
  }
}

// GET - List all contracts
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = `
      SELECT 
        c.*,
        a.application_number,
        ho.name as owner_name,
        h.name as hospital_name
      FROM onboarding.contracts c
      LEFT JOIN onboarding.applications a ON c.application_id = a.id
      LEFT JOIN organization.hospital_owners ho ON a.owner_id = ho.id
      LEFT JOIN organization.hospitals h ON a.hospital_id = h.id
    `;

    const params: any[] = [];
    if (status) {
      query += ' WHERE c.status = $1';
      params.push(status);
    }

    query += ` ORDER BY c.created_at DESC LIMIT ${limit} OFFSET ${offset}`;

    const result = await executeQuery(query, params);
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch contracts');
    }
    const contracts = result.data;

    return NextResponse.json({
      success: true,
      data: contracts,
    });
  } catch (error) {
    console.error('Error fetching contracts:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch contracts' },
      { status: 500 }
    );
  }
}
