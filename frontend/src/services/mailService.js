const MAILS_STORAGE_KEY = 'temp_mail_mock_emails';

const INITIAL_EMAILS = [
  {
    id: 'm1',
    address: 'john@codeflai.tech',
    sender: 'GitHub <noreply@github.com>',
    recipient: 'john@codeflai.tech',
    subject: '[GitHub] Security Alert: New login detected on your account',
    date: '2026-07-18T16:45:00Z',
    content: `<div style="font-family: sans-serif; padding: 20px; color: #333;">
      <h2 style="color: #d93025;">New login detected on your GitHub account</h2>
      <p>Hello @john-codeflai,</p>
      <p>We noticed a login to your account from a new IP address: <strong>198.51.100.42</strong> (Singapore).</p>
      <p>If this was you, you don't need to take any action. If this wasn't you, please change your password immediately.</p>
      <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
      <p style="font-size: 12px; color: #777;">GitHub, Inc. • 88 Colin P Kelly Jr St • San Francisco, CA 94107</p>
    </div>`,
    isRead: false,
    isStarred: true,
    attachments: [],
    tags: ['security', 'important']
  },
  {
    id: 'm2',
    address: 'john@codeflai.tech',
    sender: 'Cloudflare Billing <billing@cloudflare.com>',
    recipient: 'john@codeflai.tech',
    subject: 'Your Cloudflare Invoice for July 2026 is ready',
    date: '2026-07-17T09:12:00Z',
    content: `<div style="font-family: sans-serif; padding: 20px; color: #333;">
      <h2>Your Cloudflare Invoice is Ready</h2>
      <p>Dear customer,</p>
      <p>Your invoice for the billing period of July 2026 has been generated. The total amount of <strong>$20.00</strong> will be charged to your card ending in 4242.</p>
      <p>You can download a PDF version of your invoice below.</p>
      <p>Best regards,<br/>The Cloudflare Billing Team</p>
    </div>`,
    isRead: true,
    isStarred: false,
    attachments: [
      { filename: 'invoice_july_2026.pdf', size: '142 KB', type: 'application/pdf' }
    ],
    tags: ['billing', 'invoice', 'important']
  },
  {
    id: 'm3',
    address: 'support@codeflai.tech',
    sender: 'Vercel Support <support@vercel.com>',
    recipient: 'support@codeflai.tech',
    subject: 'Re: [Ticket #48299] Custom Domain SSL Verification Failed',
    date: '2026-07-18T10:30:00Z',
    content: `<div style="font-family: sans-serif; padding: 20px; color: #333;">
      <p>Hi Support,</p>
      <p>Thanks for reaching out to Vercel Support. Regarding your query about the SSL certificate for <code>codeflai.tech</code>, we have manually re-triggered the validation and the certificate is now active.</p>
      <p>Please let us know if you need any further assistance.</p>
      <p>Best,<br/>Alex • Vercel Support Specialist</p>
    </div>`,
    isRead: false,
    isStarred: false,
    attachments: [],
    tags: ['work', 'support']
  },
  {
    id: 'm4',
    address: 'admin@codeflai.tech',
    sender: 'OpenAI <info@openai.com>',
    recipient: 'admin@codeflai.tech',
    subject: 'Introducing GPT-5: Developer API Early Access',
    date: '2026-07-18T17:59:00Z',
    content: `<div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h1 style="font-size: 24px; color: #10a37f; margin-bottom: 20px;">GPT-5 Developer Preview</h1>
      <p>We are excited to invite you to the early developer preview of our next-generation frontier model, GPT-5.</p>
      <p>GPT-5 brings unprecedented reasoning capabilities, a 1-million token context window, and significantly faster processing times.</p>
      <a href="#" style="display: inline-block; background: #10a37f; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; margin-top: 15px;">Access API Console</a>
    </div>`,
    isRead: false,
    isStarred: true,
    attachments: [],
    tags: ['api', 'important', 'work']
  },
  {
    id: 'm5',
    address: 'alex@codeflai.tech',
    sender: 'Medium Daily <noreply@medium.com>',
    recipient: 'alex@codeflai.tech',
    subject: 'Medium Daily Digest: 5 Tech Trends to watch in 2026',
    date: '2026-07-16T08:00:00Z',
    content: `<div style="font-family: sans-serif; padding: 20px; color: #333;">
      <h2>Medium Daily Digest</h2>
      <h3 style="margin-top: 20px;"><a href="#" style="color: #03a87c; text-decoration: none;">1. The Death of CSS as We Know It?</a></h3>
      <p style="color: #666; font-size: 14px;">Why container queries and anchor positioning changed everything...</p>
      
      <h3 style="margin-top: 20px;"><a href="#" style="color: #03a87c; text-decoration: none;">2. Node.js vs Deno vs Bun in 2026</a></h3>
      <p style="color: #666; font-size: 14px;">A comprehensive, raw benchmark comparison of modern runtimes...</p>
    </div>`,
    isRead: true,
    isStarred: false,
    attachments: [],
    tags: ['tech', 'news']
  },
  {
    id: 'm6',
    address: 'john@codeflai.tech',
    sender: 'john@codeflai.tech',
    recipient: 'recipient@example.com',
    subject: 'Follow-up regarding code review',
    date: '2026-07-18T12:00:00Z',
    content: `<div style="font-family: sans-serif; padding: 20px; color: #333;">
      <p>Hi Team,</p>
      <p>I just submitted my changes for review. Let me know if you see any issues. Thanks!</p>
    </div>`,
    isRead: true,
    isStarred: false,
    attachments: [],
    tags: ['sent', 'work'],
    isSent: true
  }
];

export const mailService = {
  getMails(address = null) {
    let mails = localStorage.getItem(MAILS_STORAGE_KEY);
    if (!mails) {
      localStorage.setItem(MAILS_STORAGE_KEY, JSON.stringify(INITIAL_EMAILS));
      mails = JSON.stringify(INITIAL_EMAILS);
    }
    const parsed = JSON.parse(mails);
    if (address) {
      return parsed.filter(m => m.address === address);
    }
    return parsed;
  },

  saveMails(mails) {
    localStorage.setItem(MAILS_STORAGE_KEY, JSON.stringify(mails));
  },

  deleteMail(id) {
    const mails = this.getMails();
    const filtered = mails.filter(m => m.id !== id);
    this.saveMails(filtered);
    return true;
  },

  toggleStar(id) {
    const mails = this.getMails();
    const mail = mails.find(m => m.id === id);
    if (mail) {
      mail.isStarred = !mail.isStarred;
      this.saveMails(mails);
    }
    return mail;
  },

  markAsRead(id, isRead = true) {
    const mails = this.getMails();
    const mail = mails.find(m => m.id === id);
    if (mail) {
      mail.isRead = isRead;
      this.saveMails(mails);
    }
    return mail;
  },

  sendMail(fromMail, toMail, subject, content) {
    // Simulate sending mail by adding it to the sent mail / mock storage
    const mails = this.getMails();
    const newMail = {
      id: 'sent_' + Date.now().toString(),
      address: fromMail,
      sender: fromMail,
      recipient: toMail,
      subject: subject || '(No Subject)',
      date: new Date().toISOString(),
      content: `<div style="font-family: sans-serif; padding: 20px; color: #333;">${content.replace(/\n/g, '<br/>')}</div>`,
      isRead: true,
      isStarred: false,
      attachments: [],
      isSent: true // Mark as sent for Sent folder
    };
    mails.unshift(newMail);
    this.saveMails(mails);
    return newMail;
  }
};
