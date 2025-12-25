const roleGuard = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to access this route'
      });
    }

    // Case-insensitive role check
    // roles becomes [['admin']] if called as roleGuard(['admin']) due to ...roles
    const allowedRoles = roles.flat().map(r => String(r).toLowerCase());
    const userRole = req.user.role ? req.user.role.toLowerCase() : '';

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: `User role '${req.user.role}' is not authorized to access this route`
      });
    }

    next();
  };
};

module.exports = roleGuard;

