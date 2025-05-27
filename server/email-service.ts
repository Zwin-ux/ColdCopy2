import { MailService } from '@sendgrid/mail';

const mailService = new MailService();
if (process.env.SENDGRID_API_KEY) {
  mailService.setApiKey(process.env.SENDGRID_API_KEY);
}

export async function sendWelcomeEmail(email: string, username: string) {
  // Email temporarily disabled until SendGrid sender verification is complete
  console.log(`Welcome email would be sent to ${email} (${username})`);
  return;

  try {
    await mailService.send({
      to: email,
      from: 'noreply@coldcopy.ai', // Replace with your verified sender email
      subject: 'Welcome to ColdCopy! 🎯',
      html: `
        <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #0A1F44; margin-bottom: 10px;">Welcome to ColdCopy!</h1>
            <p style="color: #6B7280; font-size: 16px;">AI-powered personalized outreach messages</p>
          </div>
          
          <div style="background: #F8FAFC; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #0A1F44; margin-bottom: 15px;">Hi ${username}! 👋</h2>
            <p style="color: #374151; line-height: 1.6;">
              Thanks for joining ColdCopy! You're now ready to create personalized outreach messages that get responses.
            </p>
          </div>
          
          <div style="margin-bottom: 20px;">
            <h3 style="color: #0A1F44;">Your Login Details:</h3>
            <ul style="color: #374151;">
              <li><strong>Username:</strong> ${username}</li>
              <li><strong>Email:</strong> ${email}</li>
            </ul>
          </div>
          
          <div style="margin-bottom: 30px;">
            <h3 style="color: #0A1F44;">What's Next?</h3>
            <ul style="color: #374151; line-height: 1.6;">
              <li>Generate your first personalized message</li>
              <li>Upload LinkedIn profiles or bios for better targeting</li>
              <li>Upgrade to Pro for unlimited messages</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.BASE_URL || 'https://your-app.replit.app'}/dashboard" 
               style="background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Start Creating Messages
            </a>
          </div>
          
          <div style="text-align: center; margin-top: 30px; color: #6B7280; font-size: 14px;">
            <p>Questions? Reply to this email and we'll help you out!</p>
          </div>
        </div>
      `
    });
    console.log(`Welcome email sent to ${email}`);
  } catch (error) {
    console.error('Failed to send welcome email:', error);
  }
}

export async function sendLoginNotification(email: string, username: string) {
  // Email temporarily disabled until SendGrid sender verification is complete
  console.log(`Login notification would be sent to ${email} (${username})`);
  return;

  try {
    await mailService.send({
      to: email,
      from: 'noreply@coldcopy.ai', // Replace with your verified sender email
      subject: 'New login to your ColdCopy account',
      html: `
        <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #0A1F44;">Hi ${username},</h2>
          <p style="color: #374151; line-height: 1.6;">
            We noticed a new login to your ColdCopy account just now.
          </p>
          <div style="background: #F8FAFC; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="color: #374151; margin: 0;"><strong>Time:</strong> ${new Date().toLocaleString()}</p>
            <p style="color: #374151; margin: 5px 0 0 0;"><strong>Account:</strong> ${email}</p>
          </div>
          <p style="color: #374151; line-height: 1.6;">
            If this wasn't you, please secure your account immediately.
          </p>
          <div style="text-align: center; margin-top: 20px;">
            <a href="${process.env.BASE_URL || 'https://your-app.replit.app'}/dashboard" 
               style="background: #3B82F6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Go to Dashboard
            </a>
          </div>
        </div>
      `
    });
    console.log(`Login notification sent to ${email}`);
  } catch (error) {
    console.error('Failed to send login notification:', error);
  }
}