const notFound = (req, res) => {
  res.status(404).render("404", { title: "Page Not Found", path: "" });
};
module.exports = notFound;
