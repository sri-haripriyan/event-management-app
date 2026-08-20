const adminAuth = (req, res, next) => {
  const token = req.headers.authorization;
  if (token !== `Bearer ${process.env.ADMIN_SECRET}`) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
};

export default adminAuth;
