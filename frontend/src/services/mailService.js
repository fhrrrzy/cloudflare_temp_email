import { api } from '../api'
import { processItem } from '../utils/email-parser'

export const mailService = {
  async getMails(address) {
    try {
      const url = '/admin/mails?limit=150' + (address ? '&address=' + encodeURIComponent(address) : '');
      const res = await api.fetch(url);
      const results = res.results || [];
      
      const parsedMails = [];
      for (const item of results) {
        // Map backend fields to the expected view model
        const parsed = await processItem({
          id: item.id,
          address: item.address,
          sender: item.source || '',
          recipient: item.address,
          subject: item.subject || 'Loading...',
          date: item.created_at || new Date().toISOString(),
          content: '',
          raw: item.raw || '',
          isRead: true, // Admin view defaults to read
          isStarred: false,
          attachments: [],
          tags: []
        });
        
        parsed.content = parsed.message || parsed.text || '';
        parsedMails.push(parsed);
      }
      return parsedMails;
    } catch (e) {
      console.error('Failed to get production emails', e);
      return [];
    }
  },

  async deleteMail(id) {
    await api.fetch(`/admin/mails/${id}`, {
      method: 'DELETE'
    });
    return true;
  },

  async toggleStar(id) {
    // Admin backend doesn't support star database flags, no-op
    return true;
  },

  async markAsRead(id, isRead = true) {
    // Admin backend doesn't track read/unread state individually, no-op
    return true;
  },

  async sendMail(fromMail, toMail, subject, content) {
    const res = await api.fetch('/admin/send_mail', {
      method: 'POST',
      body: JSON.stringify({
        from: fromMail,
        to: toMail,
        subject: subject || '(No Subject)',
        html: `<div>${content.replace(/\n/g, '<br/>')}</div>`
      })
    });
    return res;
  }
}
