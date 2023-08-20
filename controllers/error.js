const notFound = (req, res) => {
  res.status(404).render("404", { title: "Page Not Found", path: "/404" });
};
const serverError = (req, res, next) => {
  res.status(500).render("500", { title: "Server maintenance", path: "/500" });
};
module.exports = {
  notFound,
  serverError
}
