function ensureAuthenticated(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.status(401).json({
      error: 'Ikke logget ind'
    });
  }

  next();
}

function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.session || !req.session.user) {
      return res.status(401).json({
        error: 'Ikke logget ind'
      });
    }

    const userRole = req.session.user.role;

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        error: 'Ingen adgang til denne handling'
      });
    }

    next();
  };
}

module.exports = {
  ensureAuthenticated,
  authorizeRoles
};