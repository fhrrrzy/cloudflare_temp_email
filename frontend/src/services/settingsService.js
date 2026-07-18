const SETTINGS_STORAGE_KEY = 'temp_mail_mock_settings';

const DEFAULT_SETTINGS = {
  smtp: {
    host: 'smtp.codeflai.tech',
    port: 587,
    username: 'mail-agent@codeflai.tech',
    password: 'superSecretSmtpPassword123!',
    encryption: 'STARTTLS',
    senderName: 'Codeflai Mailer',
    senderEmail: 'noreply@codeflai.tech'
  },
  thirdParty: {
    apiUrl: 'https://api.codeflai.tech/v1',
    apiKey: 'sk_test_mock_api_key_value_123456',
    provider: 'Cloudflare Workers AI / Resend',
    webhookUrl: 'https://webhook.codeflai.tech/inbox-events',
    enableWebhook: true
  }
};

export const settingsService = {
  getSettings() {
    let settings = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!settings) {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(DEFAULT_SETTINGS));
      return DEFAULT_SETTINGS;
    }
    return JSON.parse(settings);
  },

  saveSettings(newSettings) {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(newSettings));
    return newSettings;
  }
};
