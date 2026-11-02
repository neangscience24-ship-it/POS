const { getCategory, createCategory, updateCategory, deleteCategory } = require("../controller/category.controller");
function CategoryRoute(app) {
  app.get("/api/v1/category/getall", getCategory);
  app.post("/api/v1/category/create", createCategory);
  app.put("/api/v1/category/update/:id", updateCategory);
  app.delete("/api/v1/category/delete/:id", deleteCategory);
}

module.exports = CategoryRoute;
    