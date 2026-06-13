// Shared E2E selectors — single source of truth for UI element targeting
export const SELECTORS = {
  login: {
    emailInput: 'input[name="email"]',
    passwordInput: 'input[name="password"]',
    submitButton: 'button[type="submit"]',
  },
  dashboard: {
    heading: 'h1',
    missionCard: '[data-testid="mission-card"], .mission-card, section',
    progressBar: '[role="progressbar"], .progress-bar, [class*="progress"]',
  },
  brandDiscovery: {
    chatInput: 'input[type="text"], textarea, [contenteditable]',
    sendButton: 'button:has(svg), button[type="submit"]',
    confidenceScore: 'text=/品牌就绪|readiness|kesiapsiagaan/i',
  },
  contentEngine: {
    generateButton: 'button:has-text("Generate"), button:has-text("生成")',
    platformSelector: 'button:has-text("IG"), button:has-text("FB"), button:has-text("TikTok")',
  },
  admin: {
    userTable: 'table, [data-testid="user-table"]',
    pendingBadge: 'text=/pending|待审批/i',
  },
};
