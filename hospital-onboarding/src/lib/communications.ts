import { sql } from '@/lib/db';
import nodemailer from 'nodemailer';
// import twilio from 'twilio'; // Uncomment when Twilio credentials are available
// import sgMail from '@sendgrid/mail'; // Uncomment when SendGrid API key is available

export interface CommunicationConfig {
  email: {
    enabled: boolean;
    provider: 'smtp' | 'sendgrid';
    from: string;
  };
  sms: {
    enabled: boolean;
    provider: 'twilio';
    from: string;
  };
  whatsapp: {
    enabled: boolean;
    provider: 'twilio';
    from: string;
  };
}

export class CommunicationService {
  private emailTransporter: nodemailer.Transporter | null = null;
  // private twilioClient: twilio.Twilio | null = null;
  
  constructor() {
    this.initializeProviders();
  }

  private initializeProviders() {
    // Initialize email transporter
    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
      this.emailTransporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    }

    // Initialize Twilio (when credentials are available)
    // if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    //   this.twilioClient = twilio(
    //     process.env.TWILIO_ACCOUNT_SID,
    //     process.env.TWILIO_AUTH_TOKEN
    //   );
    // }

    // Initialize SendGrid (when API key is available)
    // if (process.env.SENDGRID_API_KEY) {
    //   sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    // }
  }

  // Send email
  async sendEmail(to: string, subject: string, content: string, html?: string): Promise<boolean> {
    try {
      if (!this.emailTransporter) {
        console.warn('Email transporter not configured');
        return false;
      }

      const mailOptions = {
        from: process.env.FROM_EMAIL || 'noreply@grandpro-hmso.com',
        to,
        subject,
        text: content,
        html: html || content,
      };

      const result = await this.emailTransporter.sendMail(mailOptions);
      console.log('Email sent:', result.messageId);
      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  }

  // Send SMS (placeholder - requires Twilio credentials)
  async sendSMS(to: string, message: string): Promise<boolean> {
    try {
      // Placeholder implementation
      console.log(`SMS to ${to}: ${message}`);
      
      // Actual Twilio implementation:
      // if (!this.twilioClient) {
      //   console.warn('Twilio client not configured');
      //   return false;
      // }
      // 
      // const result = await this.twilioClient.messages.create({
      //   body: message,
      //   from: process.env.TWILIO_PHONE_NUMBER,
      //   to: to,
      // });
      // 
      // console.log('SMS sent:', result.sid);
      return true;
    } catch (error) {
      console.error('Error sending SMS:', error);
      return false;
    }
  }

  // Send WhatsApp message (placeholder - requires Twilio credentials)
  async sendWhatsApp(to: string, message: string): Promise<boolean> {
    try {
      // Placeholder implementation
      console.log(`WhatsApp to ${to}: ${message}`);
      
      // Actual Twilio WhatsApp implementation:
      // if (!this.twilioClient) {
      //   console.warn('Twilio client not configured');
      //   return false;
      // }
      // 
      // const result = await this.twilioClient.messages.create({
      //   body: message,
      //   from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      //   to: `whatsapp:${to}`,
      // });
      // 
      // console.log('WhatsApp message sent:', result.sid);
      return true;
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      return false;
    }
  }

  // Process template with variables
  processTemplate(template: string, variables: Record<string, any>): string {
    let processed = template;
    
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      processed = processed.replace(regex, variables[key] || '');
    });
    
    return processed;
  }

  // Queue message for delivery
  async queueMessage(
    recipientType: 'patient' | 'owner',
    recipientId: string,
    channel: 'email' | 'sms' | 'whatsapp',
    subject: string | null,
    content: string,
    recipientEmail?: string,
    recipientPhone?: string,
    scheduledFor?: Date
  ): Promise<string> {
    const [result] = await sql`
      INSERT INTO communications.message_queue (
        recipient_type,
        recipient_id,
        recipient_email,
        recipient_phone,
        channel,
        subject,
        content,
        scheduled_for,
        status
      ) VALUES (
        ${recipientType},
        ${recipientId},
        ${recipientEmail || null},
        ${recipientPhone || null},
        ${channel},
        ${subject || null},
        ${content},
        ${scheduledFor || null},
        ${scheduledFor ? 'queued' : 'queued'}
      ) RETURNING id
    `;
    
    return result.id;
  }

  // Process message queue
  async processMessageQueue(): Promise<number> {
    // Get pending messages
    const messages = await sql`
      SELECT * FROM communications.message_queue
      WHERE status = 'queued'
        AND (scheduled_for IS NULL OR scheduled_for <= NOW())
        AND attempts < max_attempts
      ORDER BY priority DESC, created_at ASC
      LIMIT 10
    `;

    let processedCount = 0;

    for (const message of messages) {
      try {
        // Update status to processing
        await sql`
          UPDATE communications.message_queue
          SET status = 'processing', attempts = attempts + 1
          WHERE id = ${message.id}
        `;

        let success = false;

        // Send based on channel
        switch (message.channel) {
          case 'email':
            if (message.recipient_email) {
              success = await this.sendEmail(
                message.recipient_email,
                message.subject || 'Notification',
                message.content
              );
            }
            break;
          
          case 'sms':
            if (message.recipient_phone) {
              success = await this.sendSMS(message.recipient_phone, message.content);
            }
            break;
          
          case 'whatsapp':
            if (message.recipient_phone) {
              success = await this.sendWhatsApp(message.recipient_phone, message.content);
            }
            break;
        }

        // Update status based on result
        if (success) {
          await sql`
            UPDATE communications.message_queue
            SET status = 'sent', sent_at = NOW()
            WHERE id = ${message.id}
          `;
          processedCount++;
        } else {
          await sql`
            UPDATE communications.message_queue
            SET status = CASE 
              WHEN attempts >= max_attempts THEN 'failed'
              ELSE 'queued'
            END,
            failure_reason = 'Delivery failed'
            WHERE id = ${message.id}
          `;
        }
      } catch (error) {
        console.error(`Error processing message ${message.id}:`, error);
        
        await sql`
          UPDATE communications.message_queue
          SET status = CASE 
            WHEN attempts >= max_attempts THEN 'failed'
            ELSE 'queued'
          END,
          failure_reason = ${error instanceof Error ? error.message : 'Unknown error'}
          WHERE id = ${message.id}
        `;
      }
    }

    return processedCount;
  }

  // Send appointment reminder
  async sendAppointmentReminder(
    appointment: any,
    patient: any,
    channel: 'email' | 'sms' | 'whatsapp'
  ): Promise<boolean> {
    try {
      // Get template
      const [template] = await sql`
        SELECT * FROM communications.templates
        WHERE template_type = ${channel}
          AND category = 'reminder'
          AND is_active = true
        LIMIT 1
      `;

      if (!template) {
        console.warn(`No active ${channel} reminder template found`);
        return false;
      }

      // Prepare variables
      const variables = {
        patient_name: `${patient.first_name} ${patient.last_name}`,
        appointment_date: new Date(appointment.appointment_date).toLocaleDateString(),
        appointment_time: appointment.appointment_time,
        hospital_name: appointment.hospital_name || 'Hospital',
        department: appointment.department || 'General',
        doctor_name: appointment.doctor_name || 'Doctor',
        hospital_phone: '+233244000000',
      };

      // Process template
      const content = this.processTemplate(template.content, variables);

      // Queue message
      await this.queueMessage(
        'patient',
        patient.id,
        channel,
        template.subject,
        content,
        patient.email,
        patient.phone
      );

      // Update appointment reminder status
      await sql`
        UPDATE crm.appointments
        SET reminder_sent = true, reminder_sent_at = NOW()
        WHERE id = ${appointment.id}
      `;

      return true;
    } catch (error) {
      console.error('Error sending appointment reminder:', error);
      return false;
    }
  }

  // Send bulk campaign
  async sendCampaign(campaignId: string): Promise<{ sent: number; failed: number }> {
    const stats = { sent: 0, failed: 0 };

    try {
      // Get campaign details
      const [campaign] = await sql`
        SELECT * FROM communications.campaigns
        WHERE id = ${campaignId}
      `;

      if (!campaign) {
        throw new Error('Campaign not found');
      }

      // Update campaign status
      await sql`
        UPDATE communications.campaigns
        SET status = 'in_progress'
        WHERE id = ${campaignId}
      `;

      // Get recipients based on target audience
      let recipients: any[] = [];
      
      if (campaign.target_audience === 'all_patients') {
        recipients = await sql`
          SELECT id, first_name, last_name, email, phone
          FROM crm.patients
          WHERE is_active = true
        `;
      } else if (campaign.target_audience === 'all_owners') {
        recipients = await sql`
          SELECT ho.id, ho.name, ho.email, ho.phone
          FROM organization.hospital_owners ho
          JOIN crm.owner_accounts oa ON oa.owner_id = ho.id
          WHERE oa.account_status = 'active'
        `;
      }

      // Send to each recipient
      for (const recipient of recipients) {
        try {
          const variables = {
            name: recipient.name || `${recipient.first_name} ${recipient.last_name}`,
            email: recipient.email,
            phone: recipient.phone,
          };

          const content = this.processTemplate(campaign.content_template, variables);

          // Queue message for each channel
          for (const channel of campaign.channels) {
            await this.queueMessage(
              campaign.target_audience.includes('patient') ? 'patient' : 'owner',
              recipient.id,
              channel as 'email' | 'sms' | 'whatsapp',
              campaign.subject,
              content,
              recipient.email,
              recipient.phone
            );

            // Record recipient
            await sql`
              INSERT INTO communications.campaign_recipients (
                campaign_id,
                recipient_type,
                recipient_id,
                recipient_email,
                recipient_phone,
                channel,
                status
              ) VALUES (
                ${campaignId},
                ${campaign.target_audience.includes('patient') ? 'patient' : 'owner'},
                ${recipient.id},
                ${recipient.email || null},
                ${recipient.phone || null},
                ${channel},
                'pending'
              )
            `;
          }

          stats.sent++;
        } catch (error) {
          console.error(`Error processing recipient ${recipient.id}:`, error);
          stats.failed++;
        }
      }

      // Update campaign stats
      await sql`
        UPDATE communications.campaigns
        SET 
          status = 'completed',
          total_recipients = ${stats.sent + stats.failed},
          sent_count = ${stats.sent},
          updated_at = NOW()
        WHERE id = ${campaignId}
      `;

    } catch (error) {
      console.error('Error sending campaign:', error);
      
      await sql`
        UPDATE communications.campaigns
        SET status = 'failed'
        WHERE id = ${campaignId}
      `;
    }

    return stats;
  }
}

export const communicationService = new CommunicationService();
