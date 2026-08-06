const adminMiddleware = (req, res, next) => {
  if (req.user.email !== process.env.ADMIN_EMAIL) {
    return res.status(403).json({ message: 'Only the admin can perform this action' });
  }
  next();
};

export default adminMiddleware;