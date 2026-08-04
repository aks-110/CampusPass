const nodemailer = require('nodemailer');

const sendEmail = async ({ to, subject, text, html }) => {
    try {
        // In a real app, configure SMTP details here
        // Using ethereal for dev if no real SMTP provided, or basic config
        let transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
            port: parseInt(process.env.SMTP_PORT) || 587,
            secure: false, // true for port 465, false for other ports
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });

        let info = await transporter.sendMail({
            from: process.env.SENDER_EMAIL ? `"CampusPass System" <${process.env.SENDER_EMAIL}>` : '"CampusPass System" <no-reply@campuspass.edu>',
            to,
            subject,
            text,
            html
        });

        console.log("Message sent: %s", info.messageId);
        return info;
    } catch (error) {
        console.error("Error sending email:", error);
    }
};

module.exports = { sendEmail };
