import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'noreplypeerevaluationsystem@gmail.com',
    pass: process.env.EMAIL_PASS || 'twmnfoksvgwfcegh',
  },
});

export const sendReminderEmail = async (
  to: string,
  subject: string,
  text: string,
  from?: string
) => {
  const mailOptions = {
    from: from || process.env.EMAIL_USER,
    to,
    subject,
    text,
  };
  await transporter.sendMail(mailOptions);
};

//  Updated function to include marksUpdated
export const sendTicketResolvedEmail = async (
  to: string,
  studentName: string,
  ticketSubject: string,
  description: string,
  remark: string,
  ticketId: string,
  marksUpdated?: number | null
) => {
  const mailOptions = {
    from: `"Peer Evaluation System" <${process.env.EMAIL_USER}>`,
    to,
    subject: `Resolved Ticket: ${ticketSubject}`,
    html: `
      <p>Dear ${studentName},</p>
      <p>Your escalated ticket has been resolved by the teacher.</p>
      <ul>
        <li><strong>Ticket ID:</strong> ${ticketId}</li>
        <li><strong>Subject:</strong> ${ticketSubject}</li>
        <li><strong>Description:</strong> ${description}</li>
        <li><strong>Teacher Remark:</strong> ${remark}</li>
        ${marksUpdated !== null && marksUpdated !== undefined
        ? `<li><strong>Updated Marks:</strong> ${marksUpdated}</li>`
        : ''
      }
      </ul>
      <p>Status: ✅ Resolved</p>
      <p>Thank you for using the Peer Evaluation System.</p>
      <br/>
      <p>Regards,<br/>Peer Evaluation Team</p>
    `,
  };

  await transporter.sendMail(mailOptions);
};
