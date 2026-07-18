const ACCOUNTS_STORAGE_KEY = 'temp_mail_mock_accounts';

const INITIAL_ACCOUNTS = [
  { id: '1', email: 'john@codeflai.tech', status: 'Active', creationDate: '2026-07-10T10:00:00Z', password: 'password123', mailCount: 12, sendCount: 3 },
  { id: '2', email: 'alex@codeflai.tech', status: 'Active', creationDate: '2026-07-12T14:30:00Z', password: 'alexSecurePass!', mailCount: 4, sendCount: 0 },
  { id: '3', email: 'support@codeflai.tech', status: 'Active', creationDate: '2026-07-14T08:15:00Z', password: 'supportPass2026', mailCount: 48, sendCount: 15 },
  { id: '4', email: 'billing@codeflai.tech', status: 'Suspended', creationDate: '2026-07-15T09:00:00Z', password: 'billingSecretKey', mailCount: 0, sendCount: 0 },
  { id: '5', email: 'test@codeflai.tech', status: 'Active', creationDate: '2026-07-18T18:00:00Z', password: 'testPassword99', mailCount: 2, sendCount: 1 },
  { id: '6', email: 'admin@codeflai.tech', status: 'Active', creationDate: '2026-07-18T18:05:00Z', password: 'admin_codeflai', mailCount: 5, sendCount: 2 }
];

export const accountService = {
  getAccounts() {
    let accounts = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
    if (!accounts) {
      localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(INITIAL_ACCOUNTS));
      return INITIAL_ACCOUNTS;
    }
    return JSON.parse(accounts);
  },

  saveAccounts(accounts) {
    localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
  },

  createAccount(email, password) {
    const accounts = this.getAccounts();
    const newAccount = {
      id: Date.now().toString(),
      email,
      status: 'Active',
      creationDate: new Date().toISOString(),
      password: password || Math.random().toString(36).slice(-10),
      mailCount: 0,
      sendCount: 0
    };
    accounts.unshift(newAccount);
    this.saveAccounts(accounts);
    return newAccount;
  },

  bulkCreateAccounts(emailsList, defaultPassword, autoGenerate = false) {
    const accounts = this.getAccounts();
    const created = [];
    const errors = [];

    emailsList.forEach((emailStr) => {
      const email = emailStr.trim();
      if (!email) return;

      // Simple email validation
      if (!email.includes('@') || email.split('@')[0].length === 0) {
        errors.push(`Invalid account name: ${email}`);
        return;
      }

      // Check duplicate
      if (accounts.some(acc => acc.email === email)) {
        errors.push(`Account already exists: ${email}`);
        return;
      }

      const password = autoGenerate 
        ? Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8).toUpperCase()
        : defaultPassword;

      const newAccount = {
        id: (Date.now() + Math.random()).toString(),
        email,
        status: 'Active',
        creationDate: new Date().toISOString(),
        password,
        mailCount: 0,
        sendCount: 0
      };

      accounts.unshift(newAccount);
      created.push(newAccount);
    });

    this.saveAccounts(accounts);
    return { created, errors };
  },

  deleteAccount(id) {
    const accounts = this.getAccounts();
    const filtered = accounts.filter(acc => acc.id !== id);
    this.saveAccounts(filtered);
    return true;
  },

  exportAccounts(format, ids = null) {
    const accounts = this.getAccounts();
    const targetAccounts = ids ? accounts.filter(acc => ids.includes(acc.id)) : accounts;

    if (format === 'csv') {
      let csvContent = 'Email,Password,Status,Creation Date\n';
      targetAccounts.forEach(acc => {
        csvContent += `"${acc.email}","${acc.password}","${acc.status}","${acc.creationDate}"\n`;
      });
      return { content: csvContent, filename: 'accounts.csv', mimeType: 'text/csv' };
    } else {
      // Default TXT (email:password)
      let txtContent = '';
      targetAccounts.forEach(acc => {
        txtContent += `${acc.email}:${acc.password}\n`;
      });
      return { content: txtContent, filename: 'accounts.txt', mimeType: 'text/plain' };
    }
  }
};
