const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  console.error('Error:', err);

  // Sequelize validation error
  if (err.name === 'SequelizeValidationError') {
    const message = Object.values(err.errors).map(e => e.message).join(', ');
    error = {
      statusCode: 400,
      message
    };
  }

  // Sequelize unique constraint error
  if (err.name === 'SequelizeUniqueConstraintError') {
    let message = 'Bu bilgi zaten kullanılıyor';

    // More specific error messages
    if (err.errors && err.errors.length > 0) {
      const field = err.errors[0].path;
      if (field === 'employeeNumber') {
        message = 'Bu personel numarası zaten kullanılıyor';
      } else if (field === 'studentNumber') {
        message = 'Bu öğrenci numarası zaten kullanılıyor';
      } else if (field === 'email') {
        message = 'Bu e-posta adresi zaten kullanılıyor';
      }
    }

    error = {
      statusCode: 400,
      message
    };
  }

  // Sequelize foreign key constraint error
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    const message = 'Resource not found';
    error = {
      statusCode: 404,
      message
    };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = {
      statusCode: 401,
      message
    };
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = {
      statusCode: 401,
      message
    };
  }

  // Turkish error messages for common errors
  let errorMessage = error.message || 'Sunucu hatası';

  if (error.message === 'Invalid credentials') {
    errorMessage = 'Geçersiz e-posta veya şifre';
  } else if (error.message === 'User not found') {
    errorMessage = 'Kullanıcı bulunamadı';
  } else if (error.message === 'Email not verified') {
    errorMessage = 'E-posta adresiniz doğrulanmamış. Lütfen e-postanızı kontrol edin.';
  } else if (error.message.includes('password')) {
    errorMessage = 'Şifre hatalı';
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: errorMessage,
    stack: err.stack, // Debugging: Always show stack
    originalError: error.message,
    details: err.parent ? err.parent.message : null // Sequelize details
  });
};

module.exports = errorHandler;

