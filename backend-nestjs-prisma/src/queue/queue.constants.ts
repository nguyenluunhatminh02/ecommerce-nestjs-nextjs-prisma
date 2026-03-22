export const QUEUE_NAMES = {
  EMAIL: 'email',
  NOTIFICATION: 'notification',
  ORDER: 'order',
} as const;

export const JOB_NAMES = {
  // Email jobs
  SEND_WELCOME_EMAIL: 'send-welcome-email',
  SEND_VERIFICATION_EMAIL: 'send-verification-email',
  SEND_PASSWORD_RESET_EMAIL: 'send-password-reset-email',
  SEND_ACCOUNT_LOCKED_EMAIL: 'send-account-locked-email',
  SEND_PASSWORD_CHANGED_EMAIL: 'send-password-changed-email',
  SEND_ORDER_CONFIRMATION_EMAIL: 'send-order-confirmation-email',
  SEND_NEWSLETTER_EMAIL: 'send-newsletter-email',

  // Notification jobs
  SEND_NOTIFICATION: 'send-notification',

  // Order jobs
  ORDER_CREATED: 'order-created',
  ORDER_STATUS_CHANGED: 'order-status-changed',
} as const;
