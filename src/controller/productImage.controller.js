const { ProductImage, ProductMaster } = require("../models");
const { removeFile } = require("../helper/upload");
const logError = require("../helper/log_error");

// 1. GET ALL IMAGES FOR A PRODUCT
const getImagesByProductId = async (req, res) => {
  try {
    const { product_id } = req.params;

    if (!product_id) {
      return res.status(400).json({
        success: false,
        message: "product_id is required",
      });
    }

    const product = await ProductMaster.findByPk(product_id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: `Product with ID ${product_id} not found`,
      });
    }

    const images = await ProductImage.findAll({
      where: { product_id },
      order: [
        ["is_primary", "DESC"],
        ["display_order", "ASC"],
        ["image_id", "ASC"],
      ],
    });

    res.status(200).json({
      success: true,
      total: images.length,
      list: images,
    });
  } catch (error) {
    logError(res, error, "productImage.getImagesByProductId");
  }
};

// 2. UPLOAD MULTIPLE IMAGES FOR A PRODUCT
const uploadProductImages = async (req, res) => {
  const files = req.files || (req.file ? [req.file] : []);

  try {
    const { product_id } = req.params;
    const { image_alt } = req.body;

    if (!product_id) {
      // Clean up uploaded files if error
      files.forEach((f) => removeFile(f.filename));
      return res.status(400).json({
        success: false,
        message: "product_id is required",
      });
    }

    const product = await ProductMaster.findByPk(product_id);
    if (!product) {
      files.forEach((f) => removeFile(f.filename));
      return res.status(404).json({
        success: false,
        message: `Product with ID ${product_id} not found`,
      });
    }

    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No image files provided for upload",
      });
    }

    // Check existing images count and primary status
    const existingImages = await ProductImage.findAll({
      where: { product_id },
      order: [["display_order", "DESC"]],
    });

    const hasPrimary = existingImages.some((img) => img.is_primary);
    let startOrder = existingImages.length > 0 ? existingImages[0].display_order || existingImages.length : 0;

    const recordsToCreate = files.map((file, index) => {
      const isFirst = index === 0 && !hasPrimary;
      return {
        product_id: Number(product_id),
        image_name: file.originalname,
        image_url: file.filename,
        image_alt: image_alt ? image_alt.trim() : product.product_name,
        is_primary: isFirst,
        display_order: startOrder + index + 1,
      };
    });

    const createdImages = await ProductImage.bulkCreate(recordsToCreate);

    // If product master has no main image, set it to the first uploaded image
    if (!product.image && createdImages.length > 0) {
      await product.update({ image: createdImages[0].image_url });
    }

    res.status(201).json({
      success: true,
      message: `${createdImages.length} image(s) uploaded successfully`,
      list: createdImages,
    });
  } catch (error) {
    files.forEach((f) => removeFile(f.filename));
    logError(res, error, "productImage.uploadProductImages");
  }
};

// 3. SET AN IMAGE AS PRIMARY
const setPrimaryImage = async (req, res) => {
  try {
    const { image_id } = req.params;

    if (!image_id) {
      return res.status(400).json({
        success: false,
        message: "image_id is required",
      });
    }

    const targetImage = await ProductImage.findByPk(image_id);
    if (!targetImage) {
      return res.status(404).json({
        success: false,
        message: `Image with ID ${image_id} not found`,
      });
    }

    // Reset primary flag for all images of this product
    await ProductImage.update(
      { is_primary: false },
      { where: { product_id: targetImage.product_id } }
    );

    // Set target image as primary
    await targetImage.update({ is_primary: true });

    // Sync product master thumbnail image
    await ProductMaster.update(
      { image: targetImage.image_url },
      { where: { product_id: targetImage.product_id } }
    );

    res.status(200).json({
      success: true,
      message: "Primary image updated successfully",
      data: targetImage,
    });
  } catch (error) {
    logError(res, error, "productImage.setPrimaryImage");
  }
};

// 4. DELETE PRODUCT IMAGE
const deleteProductImage = async (req, res) => {
  try {
    const { image_id } = req.params;

    if (!image_id) {
      return res.status(400).json({
        success: false,
        message: "image_id is required",
      });
    }

    const image = await ProductImage.findByPk(image_id);
    if (!image) {
      return res.status(404).json({
        success: false,
        message: `Image with ID ${image_id} not found`,
      });
    }

    const { product_id, is_primary, image_url } = image;

    // Delete disk file
    removeFile(image_url);

    // Destroy record
    await image.destroy();

    // If deleted image was primary, pick the first remaining image as primary
    if (is_primary) {
      const remainingImage = await ProductImage.findOne({
        where: { product_id },
        order: [["display_order", "ASC"], ["image_id", "ASC"]],
      });

      if (remainingImage) {
        await remainingImage.update({ is_primary: true });
        await ProductMaster.update(
          { image: remainingImage.image_url },
          { where: { product_id } }
        );
      } else {
        // No remaining images
        await ProductMaster.update(
          { image: null },
          { where: { product_id } }
        );
      }
    }

    res.status(200).json({
      success: true,
      message: "Image deleted successfully",
    });
  } catch (error) {
    logError(res, error, "productImage.deleteProductImage");
  }
};

module.exports = {
  getImagesByProductId,
  uploadProductImages,
  setPrimaryImage,
  deleteProductImage,
};
