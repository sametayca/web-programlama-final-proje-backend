// Mock nodemailer before requiring emailService
const mockSendMail = jest.fn();
const mockTransporter = {
  sendMail: mockSendMail
};

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => mockTransporter)
}));

const emailService = require('../../services/emailService');
const nodemailer = require('nodemailer');

describe('EmailService', () => {
  beforeEach(() => {
    mockSendMail.mockClear();
    
    process.env.EMAIL_HOST = 'smtp.test.com';
    process.env.EMAIL_PORT = '587';
    process.env.EMAIL_USER = 'test@example.com';
    process.env.EMAIL_PASSWORD = 'testpassword';
    process.env.EMAIL_FROM = 'noreply@test.com';
    process.env.FRONTEND_URL = 'http://localhost:3001';
  });

  afterEach(() => {
    mockSendMail.mockClear();
  });

  describe('sendVerificationEmail', () => {
    it('should send verification email with correct options', async () => {
      const email = 'test@example.com';
      const token = 'test-verification-token';
      const expectedUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

      mockSendMail.mockResolvedValue({ messageId: 'test-message-id' });

      const result = await emailService.sendVerificationEmail(email, token);

      expect(mockSendMail).toHaveBeenCalledWith({
        from: process.env.EMAIL_FROM,
        to: email,
        subject: 'Email Verification - Web Programlama Final Projesi',
        html: expect.stringContaining(expectedUrl)
      });
      expect(result.messageId).toBe('test-message-id');
    });

    it('should include verification URL in email body', async () => {
      const email = 'test@example.com';
      const token = 'test-token-123';
      
      mockSendMail.mockResolvedValue({ messageId: 'test' });

      await emailService.sendVerificationEmail(email, token);

      const callArgs = mockSendMail.mock.calls[0][0];
      expect(callArgs.html).toContain(token);
      expect(callArgs.html).toContain('/verify-email?token=');
      expect(callArgs.html).toContain('expire in 24 hours');
    });

    it('should handle email sending errors', async () => {
      const email = 'test@example.com';
      const token = 'test-token';
      const error = new Error('SMTP Error');
      
      mockSendMail.mockRejectedValue(error);

      await expect(emailService.sendVerificationEmail(email, token)).rejects.toThrow('SMTP Error');
    });
  });

  describe('sendPasswordResetEmail', () => {
    it('should send password reset email with correct options', async () => {
      const email = 'test@example.com';
      const token = 'test-reset-token';
      const expectedUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

      mockSendMail.mockResolvedValue({ messageId: 'test-message-id' });

      const result = await emailService.sendPasswordResetEmail(email, token);

      expect(mockSendMail).toHaveBeenCalledWith({
        from: process.env.EMAIL_FROM,
        to: email,
        subject: 'Password Reset - Web Programlama Final Projesi',
        html: expect.stringContaining(expectedUrl)
      });
      expect(result.messageId).toBe('test-message-id');
    });

    it('should include reset URL in email body', async () => {
      const email = 'test@example.com';
      const token = 'reset-token-456';
      
      mockSendMail.mockResolvedValue({ messageId: 'test' });

      await emailService.sendPasswordResetEmail(email, token);

      const callArgs = mockSendMail.mock.calls[0][0];
      expect(callArgs.html).toContain(token);
      expect(callArgs.html).toContain('/reset-password?token=');
      expect(callArgs.html).toContain('expire in 1 hour');
      expect(callArgs.html).toContain("didn't request this");
    });

    it('should handle email sending errors', async () => {
      const email = 'test@example.com';
      const token = 'test-token';
      const error = new Error('SMTP Connection Error');
      
      mockSendMail.mockRejectedValue(error);

      await expect(emailService.sendPasswordResetEmail(email, token)).rejects.toThrow('SMTP Connection Error');
    });
  });
});

