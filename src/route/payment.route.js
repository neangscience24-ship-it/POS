const {
    createcheckoutSession,
    PaymentSuccess,
    generatekHQR,
    verifykHoR,
    checkpaymentstatus,
    processCash,
} = require("../controller/payment.controller");

const cardpaywayRoute = (app) => {
    // Stripe
    app.post('/api/v1/cardpayway/createCheckoutSession', createcheckoutSession);
    app.get('/api/v1/cardpayway/Success', PaymentSuccess);

    // Bakong KHQR
    app.post('/api/v1/cardpayway/generate', generatekHQR);
    app.post('/api/v1/cardpayway/verify', verifykHoR);
    app.post('/api/v1/cardpayway/check-payment', checkpaymentstatus);

    // Cash / Card checkout — creates Sale + SaleItems + SalePayment + SaleReceipt in one call
    app.post('/api/v1/cardpayway/process-cash', processCash);
};

module.exports = cardpaywayRoute;