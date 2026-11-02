const nodemailer = require("nodemailer");
const dotenv = require('dotenv');
dotenv.config(); // Load environment variables from .env file
const path = require("path");
//config mail transporter
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL,
        pass: process.env.APP_PASSWORD,
    },
});

async function sendMail(req, res) {
    try {
        var { to, subject, text, html } = req.body;
        const mailOptions = {
            from: process.env.EMAIL, // sender
            to: to, // receiver
            subject: subject,
            text: text ,
            html: html,
            attachments: [
                {
                    filename: "Invoice.pdf",
                    path: path.join(__dirname, "../assets/invoice.pdf")
                }
            ]
        }

        const info = await transporter.sendMail(mailOptions);
        res.send({
            message: "Email sent successfully",
        })
    } catch (err) {
        console.error(err);
    }
}

async function sendOtpEmail(to, otp, customerName = "Customer") {
    const mailOptions = {
        from: `"POS System" <${process.env.EMAIL}>`,
        to: to,
        subject: "Password Reset OTP Code - POS System",
        text: `Your OTP for password reset is: ${otp}. It will expire in 10 minutes.`,
        html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
                <div style="text-align: center; margin-bottom: 24px;">
                    <h2 style="color: #0f172a; margin: 0; font-size: 22px; font-weight: 700;">Password Reset Verification</h2>
                    <p style="color: #64748b; font-size: 14px; margin-top: 6px;">Customer Security Service</p>
                </div>
                <p style="color: #334155; font-size: 15px; line-height: 1.6;">Hello <strong>${customerName}</strong>,</p>
                <p style="color: #475569; font-size: 14px; line-height: 1.6;">We received a request to reset your customer account password. Enter this 6-digit verification code to complete your password reset:</p>
                <div style="background-color: #f0fdf4; border: 2px dashed #10b981; border-radius: 12px; padding: 20px; text-align: center; margin: 28px 0;">
                    <span style="font-size: 36px; font-weight: 800; letter-spacing: 10px; color: #059669; font-family: monospace;">${otp}</span>
                </div>
                <p style="color: #64748b; font-size: 13px; line-height: 1.5;">⏱️ This verification code is valid for <strong>10 minutes</strong>.</p>
                <p style="color: #94a3b8; font-size: 12px; line-height: 1.5; margin-top: 24px; border-top: 1px solid #f1f5f9; padding-top: 16px;">If you did not request a password reset, you can safely ignore this email. No changes will be made to your account.</p>
            </div>
        `,
    };

    return transporter.sendMail(mailOptions);
}

module.exports = { sendMail, sendOtpEmail, transporter };