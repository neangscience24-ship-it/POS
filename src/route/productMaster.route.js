const {
  getProductMaster,
  getProductMasterById,
  createProductMaster,
  updateProductMaster,
  deleteProductMaster,
} = require("../controller/productMaster.controller");
const { upload } = require("../helper/upload");

function ProductMasterRoute(app) {
  // Friendly aliases
  app.get("/api/v1/productmaster/getall", getProductMaster);
  app.get("/api/v1/productmaster/getone/:id", getProductMasterById);
  app.post("/api/v1/productmaster/create", upload.single("image"), createProductMaster);
  app.put("/api/v1/productmaster/update/:id", upload.single("image"), updateProductMaster);
  app.delete("/api/v1/productmaster/delete/:id", deleteProductMaster);
}

module.exports = ProductMasterRoute;

