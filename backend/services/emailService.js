// /backend/services/emailService.js
const nodemailer = require('nodemailer');

// ✅ Create real transporter using Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // your Gmail
    pass: process.env.EMAIL_PASS, // your app password
  },
});

// Verify transporter once when server starts
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Email configuration error:', error);
  } else {
    console.log('✅ Email server is ready to send messages');
  }
});

// ✅ Send approval email
const sendApprovalEmail = async (studentEmail, achievementTitle, studentName, facultyName = 'Faculty Member') => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: studentEmail,
      subject: '🎉 Achievement Approved - Smart Student Hub',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color: #22c55e;">Congratulations ${studentName || 'Student'}! 🎊</h2>
          <p>Your achievement has been approved by <strong>${facultyName}</strong>:</p>
          <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1f2937; margin: 0;">${achievementTitle || 'Your Achievement'}</h3>
          </div>
          <p>This achievement has been verified and added to your official portfolio.</p>
          <p>You can view it in your dashboard and download your updated portfolio anytime.</p>
          <br>
          <p>Best regards,<br>Smart Student Hub Team</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Approval email sent to ${studentEmail}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending approval email:', error);
    return false;
  }
};

// ✅ Send rejection email
const sendRejectionEmail = async (studentEmail, achievementTitle, studentName, reason, facultyName = 'Faculty Member') => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: studentEmail,
      subject: '📋 Achievement Review Update - Smart Student Hub',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Hello ${studentName || 'Student'},</h2>
          <p>Your achievement submission was reviewed by <strong>${facultyName}</strong> and needs revision:</p>
          <div style="background: #fef2f2; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #991b1b; margin: 0;">${achievementTitle || 'Your Achievement'}</h3>
            <p style="margin: 10px 0 0 0;"><strong>Reason:</strong> ${reason || 'Please review and update your submission.'}</p>
          </div>
          <p>Please review the feedback and resubmit with the necessary corrections.</p>
          <br>
          <p>Best regards,<br>Smart Student Hub Team</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`📨 Rejection email sent to ${studentEmail}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending rejection email:', error);
    return false;
  }
};

module.exports = { sendApprovalEmail, sendRejectionEmail };
