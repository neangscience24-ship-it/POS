const {
  getImagesByProductId,
  uploadProductImages,
  setPrimaryImage,
  deleteProductImage,
} = require("../controller/productImage.controller");
const { upload } = require("../helper/upload");

function ProductImageRoute(app) {
  // Get all images for a product
  app.get("/api/v1/product-image/product/:product_id", getImagesByProductId);

  // Upload multiple images for a product (up to 10 images at once)
  app.post(
    "/api/v1/product-image/upload/:product_id",
    upload.array("images", 10),
    uploadProductImages
  );

  // Set an image as primary
  app.put("/api/v1/product-image/set-primary/:image_id", setPrimaryImage);

  // Delete an image
  app.delete("/api/v1/product-image/delete/:image_id", deleteProductImage);
}

module.exports = ProductImageRoute;
