var express = require('express');
const cors = require("cors");
const path = require("path");
var  { sequelize } = require('./src/config/sequelizeConfig');
var app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Serve static assets (images/uploads)
app.use('/assets', express.static(path.join(__dirname, 'src/assets')));
app.use('/src/assets', express.static(path.join(__dirname, 'src/assets')));
var userRoute = require('./src/route/user.route');
var categoryRoute = require('./src/route/category.route');
var brandRoute = require('./src/route/brand.route');
var attributeRoute = require('./src/route/attribute.route');
var productMasterRoute = require('./src/route/productMaster.route');
var cardpaywayRoute = require('./src/route/payment.route');
var productImageRoute = require('./src/route/productImage.route');
var customerRoute = require('./src/route/customer.route');

//import models
const {
  Category,
  Brand,
  Attribute,
  ProductMaster,
  ProductImage,
  CustomerProfile,
  User,
  Sale,
  SaleItem,
  SalePayment,
  SaleReceipt,
} = require('./src/models');
userRoute(app);
categoryRoute(app);
brandRoute(app);
attributeRoute(app);
productMasterRoute(app);
productImageRoute(app);
customerRoute(app);
cardpaywayRoute(app);
// auto sync models
sequelize.sync().then(() => {
    console.log("Database synced!");
}).catch(err => {
    console.log("Sync error:", err);
});

//runing server
const port = process.env.PORT || 5000;
app.listen(port, ()=>{
    console.log(`server is running on http://localhost:${port}`)
})
