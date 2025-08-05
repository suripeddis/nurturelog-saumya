import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
  const { name, email } = await req.json();

  console.log('➡️ API Hit: /api/send-email');
  console.log('📨 Received form data:', { name, email });

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: 'arti@multiplehub.org', // for testing
    subject: 'New Waitlist Signup',
    text: `A new user has joined the waitlist:\n\nName: ${name}\nEmail: ${email}`,
  };

  try {
    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent:', result);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('❌ Failed to send email:', err);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}