function requireAdmin(req, res, next) {
  if (!req.session.adminUserId) {
    return res.redirect('/admin/login');
  }
  return next();
}

module.exports = { requireAdmin };
