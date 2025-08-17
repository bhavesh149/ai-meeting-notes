import nodemailer from 'nodemailer';
import { marked } from 'marked';
import pino from 'pino';

const logger = pino({
  name: 'email',
  level: process.env.LOG_LEVEL || 'info',
});

// Validate required environment variables
const requiredEnvVars = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'MAIL_FROM'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    logger.warn(`${envVar} environment variable is not set. Email functionality may not work.`);
  }
}

// Create nodemailer transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export interface SendEmailOptions {
  recipients: string[];
  subject: string;
  summary: string;
  summaryId: string;
}

export interface SendEmailResponse {
  success: boolean;
  messageId?: string;
  bodyHtml: string;
  error?: string;
}

export async function sendSummaryEmail({
  recipients,
  subject,
  summary,
  summaryId,
}: SendEmailOptions): Promise<SendEmailResponse> {
  try {
    logger.info({ recipients: recipients.length, subject, summaryId }, 'Sending summary email');

    // Convert markdown to HTML
    const summaryHtml = await marked(summary);
    
    // Create email template
    const bodyHtml = createEmailTemplate(summaryHtml, summaryId);

    const mailOptions = {
      from: process.env.MAIL_FROM,
      to: recipients.join(', '),
      subject: subject || 'Meeting Summary',
      html: bodyHtml,
      text: summary, // Fallback plain text
    };

    const info = await transporter.sendMail(mailOptions);

    logger.info({
      messageId: info.messageId,
      recipients: recipients.length,
      subject,
      summaryId,
    }, 'Email sent successfully');

    return {
      success: true,
      messageId: info.messageId,
      bodyHtml,
    };
  } catch (error) {
    logger.error({ error, recipients, subject, summaryId }, 'Failed to send email');
    
    return {
      success: false,
      bodyHtml: '',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

function createEmailTemplate(summaryHtml: string, summaryId: string): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Meeting Summary</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f8f9fa;
            }
            .container {
                background-color: white;
                padding: 30px;
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .header {
                border-bottom: 2px solid #e9ecef;
                padding-bottom: 20px;
                margin-bottom: 30px;
            }
            .header h1 {
                color: #2c3e50;
                margin: 0;
                font-size: 28px;
            }
            .summary-content {
                line-height: 1.8;
            }
            .summary-content h1, .summary-content h2, .summary-content h3 {
                color: #2c3e50;
                margin-top: 30px;
                margin-bottom: 15px;
            }
            .summary-content ul, .summary-content ol {
                padding-left: 25px;
            }
            .summary-content li {
                margin-bottom: 8px;
            }
            .summary-content blockquote {
                border-left: 4px solid #3498db;
                padding-left: 20px;
                margin: 20px 0;
                background-color: #f8f9fa;
                padding: 15px 20px;
                border-radius: 4px;
            }
            .summary-content code {
                background-color: #f1f3f4;
                padding: 2px 6px;
                border-radius: 3px;
                font-family: 'Courier New', Courier, monospace;
            }
            .summary-content pre {
                background-color: #f8f9fa;
                padding: 15px;
                border-radius: 6px;
                overflow-x: auto;
                border: 1px solid #e9ecef;
            }
            .footer {
                margin-top: 40px;
                padding-top: 20px;
                border-top: 1px solid #e9ecef;
                text-align: center;
                color: #6c757d;
                font-size: 14px;
            }
            .summary-id {
                font-family: 'Courier New', Courier, monospace;
                background-color: #f8f9fa;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 12px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>📝 Meeting Summary</h1>
                <p style="margin: 10px 0 0 0; color: #6c757d;">
                    Summary ID: <span class="summary-id">${summaryId}</span>
                </p>
            </div>
            
            <div class="summary-content">
                ${summaryHtml}
            </div>
            
            <div class="footer">
                <p>This summary was generated by AI and sent from the Meeting Notes Summarizer.</p>
                <p>Generated on ${new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}</p>
            </div>
        </div>
    </body>
    </html>
  `;
}

// Verify transporter configuration
export async function verifyEmailConfig(): Promise<boolean> {
  try {
    await transporter.verify();
    logger.info('Email configuration verified successfully');
    return true;
  } catch (error) {
    logger.error({ error }, 'Email configuration verification failed');
    return false;
  }
}

export { transporter };
export default transporter;
