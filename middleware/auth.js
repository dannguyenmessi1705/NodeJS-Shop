const ProtectRoute = (req, res, next) => {
  if (!req.session.isLogin) {
    return res.redirect("/");
  }
  return next();
};

module.exports = ProtectRoute;
