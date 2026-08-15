
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    type: 'OAuth2',
    user: process.env.EMAIL_USER,
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    refreshToken: process.env.REFRESH_TOKEN,
  },
});

// Verify the connection configuration
transporter.verify((error, success) => {
  if (error) {
    console.error('Error connecting to email server:', error);
  } else {
    console.log('Email server is ready to send messages');
  }
});

// Function to send email
const sendEmail = async (to, subject, text, html) => {
  try {
    const info = await transporter.sendMail({
      from: `"Bankit" <${process.env.EMAIL_USER}>`, // sender address
      to, // list of receivers
      subject, // Subject line
      text, // plain text body
      html, // html body
    });

    console.log('Message sent: %s', info.messageId);
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
  } catch (error) {
    console.error("Email sending failed:", error.message);

    if (error.code === "EAUTH" || error.code === "EOAUTH2") {
      console.error(
        "Gmail OAuth authentication failed. The refresh token may be invalid or revoked."
      );
    }
        return {
      success: false,
      error: error.message,
    };
  }


};

async function sendRegistrationEmail(userEmail, userName) {
    const subject = 'Welcome to Bankit!';
    const text = `Hello ${userName},\n\nThank you for registering with Bankit! We're excited to have you on board.\n\nBest regards,\nThe Bankit Team`;
    const html = `<p>Hello ${userName},</p><p>Thank you for registering with <strong>Bankit</strong>! We're excited to have you on board.</p><p>Best regards,<br>The Bankit Team</p>`;

    await sendEmail(userEmail, subject, text, html);
}

async function sendLoginEmail(userEmail, userName) {
    const subject = 'Login Notification';
    const text = `Hello ${userName},\n\nYou have successfully logged in to your Bankit account.\n\nBest regards,\nThe Bankit Team`;
    const html = `<p>Hello ${userName},</p><p>You have successfully logged in to your <strong>Bankit</strong> account.</p><p>Best regards,<br>The Bankit Team</p>`;

    await sendEmail(userEmail, subject, text, html);
}


async function sendTransactionEmail(userEmail, userName, amount, toAccount) {

  const subject = 'Transaction Successful';
  const text = `Hello ${userName},\n\nYou have successfully transferred $${amount} to ${toAccount}.\n\nBest regards,\nThe Bankit Team`;
  const html = `<p>Hello ${userName},</p><p>You have successfully transferred $${amount} to ${toAccount}.</p><p>Best regards,<br>The Bankit Team</p>`;

  await sendEmail(userEmail, subject, text, html);
}

async function sendTransactionFailureEmail(userEmail, userName, amount, toAccount) {
  const subject = 'Transaction Failed';
  const text = `Hello ${userName},\n\nYour transaction of $${amount} to ${toAccount} has failed.\n\nBest regards,\nThe Bankit Team`;
  const html = `<p>Hello ${userName},</p><p>Your transaction of $${amount} to ${toAccount} has failed.</p><p>Best regards,<br>The Bankit Team</p>`;
}


module.exports = {sendEmail, sendRegistrationEmail, sendLoginEmail, sendTransactionEmail, sendTransactionFailureEmail};