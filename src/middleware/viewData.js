module.exports = function viewData(req, res, next) {
  res.locals.currentPath = req.path;
  res.locals.isAdmin = Boolean(req.session.adminUserId);
  next();
};
