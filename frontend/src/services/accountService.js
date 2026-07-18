import { api } from '../api'

export const accountService = {
  async getAccounts() {
    try {
      const res = await api.fetch('/admin/address?limit=200');
      const results = res.results || [];
      return results.map((acc) => ({
        id: acc.id,
        email: acc.name,
        status: 'Active',
        creationDate: acc.created_at || new Date().toISOString(),
        password: '••••••••',
        mailCount: acc.mail_count || 0,
        sendCount: acc.send_count || 0
      }));
    } catch (e) {
      console.error('Failed to get production accounts', e);
      return [];
    }
  },

  async createAccount(email, password) {
    const [prefix, domain] = email.split('@');
    const body = {
      name: prefix,
      domain: domain || 'codeflai.tech',
      enablePrefix: false,
      enableRandomSubdomain: false
    };
    if (password) {
      body.password = password;
    }
    const res = await api.fetch('/admin/new_address', {
      method: 'POST',
      body: JSON.stringify(body)
    });
    return res;
  },

  async bulkCreateAccounts(emailsList, defaultPassword, autoGenerate = false) {
    const created = [];
    const errors = [];
    for (const emailStr of emailsList) {
      try {
        const email = emailStr.trim();
        if (!email) continue;
        const res = await this.createAccount(email, autoGenerate ? undefined : defaultPassword);
        created.push(res);
      } catch (err) {
        errors.push(err.message || 'Failed to create');
      }
    }
    return { created, errors };
  },

  async deleteAccount(id) {
    await api.adminDeleteAddress(id);
    return true;
  },

  async showPassword(id) {
    return await api.adminShowAddressCredential(id);
  },

  async exportAccounts(format, ids = null) {
    const accounts = await this.getAccounts();
    const targetAccounts = ids ? accounts.filter((acc) => ids.includes(acc.id)) : accounts;

    if (format === 'csv') {
      let csvContent = 'Email,Status,Creation Date\n';
      targetAccounts.forEach((acc) => {
        csvContent += `"${acc.email}","${acc.status}","${acc.creationDate}"\n`;
      });
      return {
        content: csvContent,
        filename: 'accounts_export.csv',
        mimeType: 'text/csv'
      };
    } else {
      let txtContent = '';
      targetAccounts.forEach((acc) => {
        txtContent += `${acc.email}\n`;
      });
      return {
        content: txtContent,
        filename: 'accounts_export.txt',
        mimeType: 'text/plain'
      };
    }
  }
}
