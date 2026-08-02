function superadmin(req, res, next) {
  if (!req.user.is_superadmin) return res.status(403).json({ error: 'Недостаточно прав' });
  next();
}

module.exports = { superadmin };
