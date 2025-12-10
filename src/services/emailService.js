const sgMail = require('@sendgrid/mail');

class EmailService {
  constructor() {
    // Check if SendGrid is configured
    const sendGridApiKey = process.env.SENDGRID_API_KEY;
    
    if (sendGridApiKey) {
      this.isDevMode = false;
      sgMail.setApiKey(sendGridApiKey);
      console.log('✅ EMAIL SERVICE: SendGrid HTTP API yapılandırıldı.');
    } else {
      // Development mode: log to console instead of sending
      this.isDevMode = true;
      console.log('⚠️  EMAIL SERVICE: SendGrid API Key bulunamadı. E-postalar konsola yazdırılacak.');
      console.log('   Lütfen .env dosyasına SENDGRID_API_KEY ekleyin.');
    }
    
    // From email address (must be verified in SendGrid)
    this.fromEmail = process.env.EMAIL_FROM || process.env.SENDGRID_FROM_EMAIL || 'noreply@kampüs.edu.tr';
  }

  async sendVerificationEmail(email, token) {
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3001'}/verify-email?token=${token}`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #0ea5e9; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background-color: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
          .button { display: inline-block; padding: 14px 28px; background-color: #0ea5e9; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>E-posta Doğrulama</h1>
          </div>
          <div class="content">
            <p>Merhaba,</p>
            <p>Hesabınızı oluşturduğunuz için teşekkürler. E-posta adresinizi doğrulamak için aşağıdaki bağlantıya tıklayın:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" class="button">E-postamı Doğrula</a>
            </div>
            <p style="margin-top: 20px;"><strong>Buton çalışmıyorsa:</strong> Aşağıdaki linki tarayıcınızın adres çubuğuna kopyalayıp yapıştırın:</p>
            <div style="background-color: #e5e7eb; padding: 15px; border-radius: 5px; margin: 15px 0; word-break: break-all; font-family: monospace; font-size: 12px;">
              ${verificationUrl}
            </div>
            <p><strong>⚠️ Not:</strong> Bu link 24 saat içinde geçerliliğini yitirecektir.</p>
            <p>Eğer bu işlemi siz yapmadıysanız, bu e-postayı görmezden gelebilirsiniz.</p>
          </div>
          <div class="footer">
            <p>Web Programlama Final Projesi</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const msg = {
      to: email,
      from: {
        email: this.fromEmail,
        name: process.env.EMAIL_FROM_NAME || 'Web Programlama Final Projesi'
      },
      subject: 'E-posta Doğrulama - Web Programlama Final Projesi',
      html: htmlContent
    };

    // Development mode: log to console instead of sending
    if (this.isDevMode) {
      console.log('\n========================================');
      console.log('📧 E-POSTA DOĞRULAMA (Geliştirme Modu)');
      console.log('========================================');
      console.log('Kime:', email);
      console.log('Konu:', msg.subject);
      console.log('\nDoğrulama Linki:');
      console.log(verificationUrl);
      console.log('\nToken (manuel kullanım için):');
      console.log(token);
      console.log('========================================\n');
      return { messageId: 'dev-mode-' + Date.now() };
    }

    try {
      const result = await sgMail.send(msg);
      console.log('✅ Doğrulama e-postası gönderildi:', email);
      return result;
    } catch (error) {
      console.error('❌ SendGrid e-posta gönderme hatası:', error.message);
      if (error.response) {
        console.error('   SendGrid Response:', JSON.stringify(error.response.body, null, 2));
      }
      throw error;
    }
  }

  async sendPasswordResetEmail(email, token) {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3001'}/reset-password?token=${token}`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #ef4444; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background-color: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
          .button { display: inline-block; padding: 14px 28px; background-color: #ef4444; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #6b7280; }
          .warning { background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 10px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Şifre Sıfırlama</h1>
          </div>
          <div class="content">
            <p>Merhaba,</p>
            <p>Hesabınız için şifre sıfırlama talebi aldık. Şifrenizi sıfırlamak için aşağıdaki bağlantıya tıklayın:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" class="button">Şifremi Sıfırla</a>
            </div>
            <p style="margin-top: 20px;"><strong>Buton çalışmıyorsa:</strong> Aşağıdaki linki tarayıcınızın adres çubuğuna kopyalayıp yapıştırın:</p>
            <div style="background-color: #e5e7eb; padding: 15px; border-radius: 5px; margin: 15px 0; word-break: break-all; font-family: monospace; font-size: 12px;">
              ${resetUrl}
            </div>
            <div class="warning">
              <p><strong>⚠️ Önemli:</strong> Bu link 1 saat içinde geçerliliğini yitirecektir.</p>
            </div>
            <p>Eğer bu işlemi siz yapmadıysanız, bu e-postayı görmezden gelebilirsiniz. Şifreniz değiştirilmeyecektir.</p>
          </div>
          <div class="footer">
            <p>Web Programlama Final Projesi</p>
            <p>Bu e-postayı siz talep etmediyseniz, lütfen destek ekibiyle iletişime geçin.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const msg = {
      to: email,
      from: {
        email: this.fromEmail,
        name: process.env.EMAIL_FROM_NAME || 'Web Programlama Final Projesi'
      },
      subject: 'Şifre Sıfırlama - Web Programlama Final Projesi',
      html: htmlContent
    };

    // Development mode: log to console instead of sending
    if (this.isDevMode) {
      console.log('\n========================================');
      console.log('📧 ŞİFRE SIFIRLAMA (Geliştirme Modu)');
      console.log('========================================');
      console.log('Kime:', email);
      console.log('Konu:', msg.subject);
      console.log('\nSıfırlama Linki:');
      console.log(resetUrl);
      console.log('\nToken (manuel kullanım için):');
      console.log(token);
      console.log('========================================\n');
      return { messageId: 'dev-mode-' + Date.now() };
    }

    try {
      const result = await sgMail.send(msg);
      console.log('✅ Şifre sıfırlama e-postası gönderildi:', email);
      return result;
    } catch (error) {
      console.error('❌ SendGrid e-posta gönderme hatası:', error.message);
      if (error.response) {
        console.error('   SendGrid Response:', JSON.stringify(error.response.body, null, 2));
      }
      throw error;
    }
  }
}

module.exports = new EmailService();

