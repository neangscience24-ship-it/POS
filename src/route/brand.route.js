const {
  getBrand,
  createBrand,
  updateBrand,
  deleteBrand,
} = require("../controller/brand.controller");
const { upload } = require("../helper/upload");

function BrandRoute(app) {
  app.get("/api/v1/brand/getall", getBrand);
  app.post("/api/v1/brand/create", upload.single("image"), createBrand);
  app.put("/api/v1/brand/update/:id", upload.single("image"), updateBrand);
  app.delete("/api/v1/brand/delete/:id", deleteBrand);
}

module.exports = BrandRoute;

