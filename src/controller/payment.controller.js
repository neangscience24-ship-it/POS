const stripe = require("stripe");
const axios = require("axios");
const { sequelize } = require("../config/sequelizeConfig");
const { Sale, SaleItem, SalePayment, SaleReceipt, ProductMaster } = require("../models");
const { BakongKHQR, IndividualInfo } = require("bakong-khqr");

// ─── Stripe Setup ─────────────────────────────────────────────────────────────
const stripeKey = process.env.STRIPE_SECRET_KEY || "";
if (!stripeKey) console.warn("[payment] WARNING: STRIPE_SECRET_KEY is not set.");
const stripeInstance = stripe(stripeKey);

// ─── App URL ──────────────────────────────────────────────────────────────────
const appUrl =
  process.env.CLIENT_URL || process.env.APP_URL || "http://localhost:5173";

// ─── Zero-decimal currencies ──────────────────────────────────────────────────
const ZERO_DECIMAL_CURRENCIES = new Set([
  "bif", "clp", "djf", "gnf", "jpy", "kmf", "krw",
  "mga", "pyg", "rwf", "ugx", "vnd", "vuv", "xaf", "xof", "xpf",
]);

function toStripeAmount(amount, currency = "usd") {
  return ZERO_DECIMAL_CURRENCIES.has(currency.toLowerCase())
    ? Math.round(amount)
    : Math.round(amount * 100);
}

// ─── Helper: generate unique sale number ──────────────────────────────────────
function generateSaleNo() {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `SL-${ts}-${rand}`;
}

// ─── Helper: generate unique receipt number ───────────────────────────────────
function generateReceiptNumber() {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `RCT-${ts}-${rand}`;
}

// ══════════════════════════════════════════════════════════════════════════════
//  STRIPE — Create Checkout Session
//  POST /api/v1/cardpayway/createCheckoutSession
//  Body: { sale_id, amount, currency? }
// ══════════════════════════════════════════════════════════════════════════════
const createcheckoutSession = async (req, res) => {
  try {
    const { sale_id, amount, currency = "usd" } = req.body;

    if (!sale_id || !amount) {
      return res
        .status(400)
        .json({ success: false, message: "sale_id and amount are required." });
    }

    const sale = await Sale.findByPk(sale_id);
    if (!sale) {
      return res
        .status(404)
        .json({ success: false, message: `Sale #${sale_id} not found.` });
    }

    const session = await stripeInstance.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency,
            product_data: { name: `Sale #${sale.sale_no}` },
            unit_amount: toStripeAmount(amount, currency),
          },
          quantity: 1,
        },
      ],
      metadata: { sale_id: String(sale_id) },
      success_url: `${appUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/payment/cancel`,
    });

    return res
      .status(200)
      .json({ success: true, url: session.url, session_id: session.id });
  } catch (err) {
    console.error("[createcheckoutSession]", err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
//  STRIPE — Payment Success (redirect callback)
//  GET /api/v1/cardpayway/Success?session_id=xxx
// ══════════════════════════════════════════════════════════════════════════════
const PaymentSuccess = async (req, res) => {
  try {
    const { session_id } = req.query;
    if (!session_id) {
      return res
        .status(400)
        .json({ success: false, message: "session_id is required." });
    }

    const session = await stripeInstance.checkout.sessions.retrieve(session_id);
    if (session.payment_status !== "paid") {
      return res
        .status(402)
        .json({ success: false, message: "Payment not completed yet." });
    }

    const sale_id = Number(session.metadata?.sale_id);
    if (!sale_id) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid sale_id in session metadata." });
    }

    // Idempotent: skip if already recorded
    const existing = await SalePayment.findOne({
      where: { reference_number: session.id },
    });

    let payment = existing;
    if (!existing) {
      const amountPaid = ZERO_DECIMAL_CURRENCIES.has(
        (session.currency || "usd").toLowerCase()
      )
        ? session.amount_total
        : session.amount_total / 100;

      payment = await SalePayment.create({
        sale_id,
        payment_method: "card",
        amount: amountPaid,
        status: "completed",
        reference_number: session.id,
      });

      await SaleReceipt.create({
        sale_id,
        receipt_number: generateReceiptNumber(),
        total_amount: amountPaid,
        tax_amount: 0,
        notes: `Stripe session: ${session.id}`,
      });

      await Sale.update({ status: "completed" }, { where: { sale_id } });
    }

    return res.status(200).json({
      success: true,
      message: "Payment recorded successfully.",
      payment,
    });
  } catch (err) {
    console.error("[PaymentSuccess]", err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
//  BAKONG KHQR — Step 1: Create Sale + Items, Generate QR
//
//  POST /api/v1/cardpayway/generate
//  Body:
//  {
//    store_id,          // required
//    user_id,           // required (cashier)
//    customer_id,       // optional
//    discount,          // optional, default 0
//    tax_amount,        // optional, default 0
//    notes,             // optional
//    currency,          // "KHR" | "USD", default "KHR"
//    items: [           // required — array of cart products
//      { product_id, quantity, unit_price, discount_percent }
//    ]
//  }
//
//  Flow:
//   1. Calculate totals from items
//   2. INSERT tbl_sale   (status = "pending")
//   3. INSERT tbl_sale_item (bulk)
//   4. Generate KHQR from Bakong SDK
//   5. Return { qr, md5, sale_id, sale_no }
// ══════════════════════════════════════════════════════════════════════════════
const generatekHQR = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const {
      store_id,
      user_id,
      customer_id = null,
      discount = 0,
      tax_amount = 0,
      notes = null,
      currency = "KHR",
      items,
    } = req.body;

    // ── Validate required fields ──────────────────────────────────────────────
    if (!store_id || !user_id) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: "store_id and user_id are required.",
      });
    }
    if (!Array.isArray(items) || items.length === 0) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: "items array is required and must not be empty.",
      });
    }

    // Resolve default product_id if item has invalid or mock product_id
    const fallbackProduct = await ProductMaster.findOne({ attributes: ["product_id"], transaction: t });
    const defaultPid = fallbackProduct ? fallbackProduct.product_id : 1;

    // ── Calculate line totals & grand total ───────────────────────────────────
    const processedItems = items.map((item) => {
      const qty = Number(item.quantity) || 1;
      const unitPrice = Number(item.unit_price) || 0;
      const discPct = Number(item.discount_percent || 0);
      const lineTotal = qty * unitPrice * (1 - discPct / 100);
      const rawPid = Number(item.product_id);
      const resolvedPid = !isNaN(rawPid) && rawPid > 0 ? rawPid : defaultPid;
      return {
        product_id: resolvedPid,
        quantity: qty,
        unit_price: unitPrice,
        discount_percent: discPct,
        total_price: parseFloat(lineTotal.toFixed(2)),
      };
    });

    const subtotal = processedItems.reduce((sum, i) => sum + i.total_price, 0);
    const totalAmount = parseFloat(
      (subtotal - Number(discount) + Number(tax_amount)).toFixed(2)
    );

    // ── 1. Create Sale (status = pending) ─────────────────────────────────────
    const sale = await Sale.create(
      {
        sale_no: generateSaleNo(),
        store_id: Number(store_id),
        user_id: Number(user_id),
        customer_id: customer_id ? Number(customer_id) : null,
        total_amount: totalAmount,
        discount: Number(discount),
        tax_amount: Number(tax_amount),
        status: "pending",
        notes,
      },
      { transaction: t }
    );

    // ── 2. Create Sale Items ───────────────────────────────────────────────────
    const saleItemsData = processedItems.map((item) => ({
      ...item,
      sale_id: sale.sale_id,
    }));
    await SaleItem.bulkCreate(saleItemsData, { transaction: t });

    // ── 3. Generate KHQR ──────────────────────────────────────────────────────
    const khqr = new BakongKHQR();
    const resolvedCurrency = currency.toUpperCase() === "USD" ? "USD" : "KHR";

    const individualInfo = new IndividualInfo(
      process.env.BAKONG_ACCOUNT_ID,           // bakongAccountID
      process.env.MERCHANT_NAME || "POS Store", // merchantName
      process.env.MERCHANT_CITY || "Phnom Penh",// merchantCity
      resolvedCurrency,                          // currency
      totalAmount,                               // amount
      process.env.STORE_LABEL || "POS",          // storeLabel
      process.env.MERCHANT_PHONE || "",          // mobileNumber
      sale.sale_no,                              // billNumber
      `Sale-${sale.sale_id}`                     // terminalLabel
    );

    const response = khqr.generateIndividual(individualInfo);

    if (!response || !response.data || response.status?.code !== 0) {
      await t.rollback();
      return res
        .status(500)
        .json({ success: false, message: "Failed to generate KHQR." });
    }

    await t.commit();

    return res.status(200).json({
      success: true,
      qr: response.data.qr,
      md5: response.data.md5,
      sale_id: sale.sale_id,
      sale_no: sale.sale_no,
      total_amount: totalAmount,
      currency: currency.toUpperCase(),
    });
  } catch (err) {
    await t.rollback();
    console.error("[generatekHQR]", err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
//  BAKONG KHQR — Step 2: Verify Payment & Finalize
//
//  POST /api/v1/cardpayway/verify
//  Body: { md5, sale_id }
//
//  Flow:
//   1. Call Bakong API to confirm payment
//   2. On success → UPDATE tbl_sale status = "completed"
//   3. INSERT tbl_sale_payment
//   4. INSERT tbl_sale_receipt
//   5. Return full sale + payment + receipt details
// ══════════════════════════════════════════════════════════════════════════════
const verifykHoR = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { md5, sale_id } = req.body;

    if (!md5 || !sale_id) {
      await t.rollback();
      return res
        .status(400)
        .json({ success: false, message: "md5 and sale_id are required." });
    }

    // ── Find the pending sale ─────────────────────────────────────────────────
    const sale = await Sale.findByPk(Number(sale_id), {
      include: [{ association: "items" }],
      transaction: t,
    });

    if (!sale) {
      await t.rollback();
      return res
        .status(404)
        .json({ success: false, message: `Sale #${sale_id} not found.` });
    }

    // ── Idempotent: already completed ─────────────────────────────────────────
    const existingPayment = await SalePayment.findOne({
      where: { reference_number: md5 },
      transaction: t,
    });
    if (existingPayment) {
      await t.rollback();
      return res.status(200).json({
        success: true,
        status: "paid",
        message: "Payment was already recorded.",
        sale_id: sale.sale_id,
      });
    }

    // ── Call Bakong API ───────────────────────────────────────────────────────
    const bakongApiEnabled = process.env.BAKONG_API_ENABLED !== "false";
    const bakongApiUrl =
      process.env.BAKONG_API_URL || "https://api-bakong.nbc.gov.kh";
    const bakongToken = process.env.BAKONG_API_TOKEN;
    const { manual_confirm } = req.body;

    let isPaid = false;
    let bakongData = null;

    if (manual_confirm || !bakongApiEnabled) {
      // Cashier manual override or mock/offline mode
      isPaid = true;
      bakongData = { manual: true, notes: "Confirmed by cashier / dev mode" };
    } else {
      try {
        const verifyResponse = await axios.post(
          `${bakongApiUrl}/v1/check_transaction_by_md5`,
          { md5 },
          {
            headers: {
              Authorization: `Bearer ${bakongToken}`,
              "Content-Type": "application/json",
              "User-Agent": "POS-System/1.0",
            },
            timeout: 10000,
          }
        );

        bakongData = verifyResponse.data;
        isPaid =
          bakongData?.responseCode === 0 &&
          bakongData?.data?.status?.toLowerCase() === "success";
      } catch (apiErr) {
        console.warn("[verifykHoR] Bakong API error:", apiErr.response?.status, apiErr.message);
        await t.rollback();
        const is403 = apiErr.response?.status === 403;
        const msg = is403
          ? "Bakong API access denied (403 Forbidden). The BAKONG_API_TOKEN is expired or blocked by CloudFront. Please renew the token in .env or click 'Confirm Manually'."
          : (apiErr.response?.data?.message || apiErr.message);
        return res.status(400).json({
          success: false,
          status: is403 ? "token_expired" : "api_error",
          message: msg,
        });
      }
    }

    if (!isPaid) {
      await t.rollback();
      return res.status(200).json({
        success: false,
        status: "pending",
        message: "Payment not yet confirmed by Bakong.",
        raw: bakongData,
      });
    }

    // ── 1. Update Sale status → completed ─────────────────────────────────────
    await Sale.update(
      { status: "completed" },
      { where: { sale_id: sale.sale_id }, transaction: t }
    );

    // ── 2. Insert SalePayment ─────────────────────────────────────────────────
    const payment = await SalePayment.create(
      {
        sale_id: sale.sale_id,
        payment_method: "online",
        amount: sale.total_amount,
        status: "completed",
        reference_number: md5,
      },
      { transaction: t }
    );

    // ── 3. Insert SaleReceipt ─────────────────────────────────────────────────
    const receipt = await SaleReceipt.create(
      {
        sale_id: sale.sale_id,
        receipt_number: generateReceiptNumber(),
        total_amount: sale.total_amount,
        tax_amount: sale.tax_amount,
        notes: manual_confirm
          ? `Bakong KHQR (Manual/Cashier Confirmed) | md5: ${md5} | sale_no: ${sale.sale_no}`
          : `Bakong KHQR | md5: ${md5} | sale_no: ${sale.sale_no}`,
      },
      { transaction: t }
    );

    await t.commit();

    return res.status(200).json({
      success: true,
      status: "paid",
      message: "Payment verified and all records saved successfully.",
      data: {
        sale: {
          sale_id: sale.sale_id,
          sale_no: sale.sale_no,
          total_amount: sale.total_amount,
          discount: sale.discount,
          tax_amount: sale.tax_amount,
          status: "completed",
        },
        payment: {
          sale_payment_id: payment.sale_payment_id,
          payment_method: payment.payment_method,
          amount: payment.amount,
          reference_number: payment.reference_number,
          status: payment.status,
        },
        receipt: {
          receipt_id: receipt.receipt_id,
          receipt_number: receipt.receipt_number,
          total_amount: receipt.total_amount,
          tax_amount: receipt.tax_amount,
        },
      },
    });
  } catch (err) {
    await t.rollback();
    console.error("[verifykHoR]", err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
//  BAKONG KHQR — Poll payment status (lightweight, no DB write)
//  POST /api/v1/cardpayway/check-payment
//  Body: { md5 }
// ══════════════════════════════════════════════════════════════════════════════
const checkpaymentstatus = async (req, res) => {
  try {
    const { md5 } = req.body;
    if (!md5) {
      return res
        .status(400)
        .json({ success: false, message: "md5 is required." });
    }

    const bakongApiEnabled = process.env.BAKONG_API_ENABLED !== "false";
    const bakongApiUrl =
      process.env.BAKONG_API_URL || "https://api-bakong.nbc.gov.kh";
    const bakongToken = process.env.BAKONG_API_TOKEN;

    if (!bakongApiEnabled || !bakongToken) {
      return res.status(200).json({
        success: true,
        status: "pending",
        warning: "Bakong API polling disabled or token not configured.",
      });
    }

    try {
      const response = await axios.post(
        `${bakongApiUrl}/v1/check_transaction_by_md5`,
        { md5 },
        {
          headers: {
            Authorization: `Bearer ${bakongToken}`,
            "Content-Type": "application/json",
            "User-Agent": "POS-System/1.0",
          },
          timeout: 8000,
        }
      );

      const data = response.data;
      const status =
        data?.responseCode === 0 &&
        data?.data?.status?.toLowerCase() === "success"
          ? "paid"
          : "pending";

      return res.status(200).json({ success: true, status, raw: data });
    } catch (apiErr) {
      // Bakong returned 403 (expired token/blocked) or connection timeout
      // Do NOT crash the polling loop with 500! Keep status: "pending" and report warning.
      const is403 = apiErr.response?.status === 403;
      return res.status(200).json({
        success: true,
        status: "pending",
        apiWarning: is403
          ? "Bakong Open API 403 Forbidden (Token expired or CloudFront block). Use manual confirmation or renew BAKONG_API_TOKEN."
          : apiErr.message,
      });
    }
  } catch (err) {
    console.error("[checkpaymentstatus]", err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ══════════════════════════════════════════════════════════════════════════════
//  CASH / CARD — Process full checkout in one request
//  POST /api/v1/cardpayway/process-cash
//  Body:
//  {
//    store_id, user_id, customer_id?,
//    discount, tax_amount,
//    payment_method: 'cash'|'card',
//    tendered_amount,
//    notes?,
//    items: [{ product_id, quantity, unit_price, discount_percent }]
//  }
//
//  Creates atomically:
//   tbl_sale  →  tbl_sale_item (bulk)  →  tbl_sale_payment  →  tbl_sale_receipt
// ══════════════════════════════════════════════════════════════════════════════
const processCash = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const {
      store_id,
      user_id,
      customer_id = null,
      discount = 0,
      tax_amount = 0,
      payment_method = "cash",
      tendered_amount,
      notes = null,
      items,
    } = req.body;

    // ── Validate ──────────────────────────────────────────────────────────────
    if (!store_id || !user_id) {
      await t.rollback();
      return res.status(400).json({ success: false, message: "store_id and user_id are required." });
    }
    if (!Array.isArray(items) || items.length === 0) {
      await t.rollback();
      return res.status(400).json({ success: false, message: "items array is required and must not be empty." });
    }

    // Resolve default product_id if item has invalid or mock product_id
    const fallbackProduct = await ProductMaster.findOne({ attributes: ["product_id"], transaction: t });
    const defaultPid = fallbackProduct ? fallbackProduct.product_id : 1;

    // ── Calculate totals ──────────────────────────────────────────────────────
    const processedItems = items.map((item) => {
      const qty = Number(item.quantity) || 1;
      const unitPrice = Number(item.unit_price) || 0;
      const discPct = Number(item.discount_percent || 0);
      const rawPid = Number(item.product_id);
      const resolvedPid = !isNaN(rawPid) && rawPid > 0 ? rawPid : defaultPid;
      return {
        product_id: resolvedPid,
        quantity: qty,
        unit_price: unitPrice,
        discount_percent: discPct,
        total_price: parseFloat((qty * unitPrice * (1 - discPct / 100)).toFixed(2)),
      };
    });

    const subtotal = processedItems.reduce((s, i) => s + i.total_price, 0);
    const totalAmount = parseFloat((subtotal - Number(discount) + Number(tax_amount)).toFixed(2));

    // ── 1. Create Sale ─────────────────────────────────────────────────────────
    const sale = await Sale.create(
      {
        sale_no: generateSaleNo(),
        store_id: Number(store_id),
        user_id: Number(user_id),
        customer_id: customer_id ? Number(customer_id) : null,
        total_amount: totalAmount,
        discount: Number(discount),
        tax_amount: Number(tax_amount),
        status: "completed",
        notes,
      },
      { transaction: t }
    );

    // ── 2. Create Sale Items ───────────────────────────────────────────────────
    await SaleItem.bulkCreate(
      processedItems.map((item) => ({ ...item, sale_id: sale.sale_id })),
      { transaction: t }
    );

    // ── 3. Create Sale Payment ─────────────────────────────────────────────────
    const payment = await SalePayment.create(
      {
        sale_id: sale.sale_id,
        payment_method,
        amount: totalAmount,
        status: "completed",
        reference_number: null,
      },
      { transaction: t }
    );

    // ── 4. Create Sale Receipt ─────────────────────────────────────────────────
    const receipt = await SaleReceipt.create(
      {
        sale_id: sale.sale_id,
        receipt_number: generateReceiptNumber(),
        total_amount: totalAmount,
        tax_amount: Number(tax_amount),
        notes: notes || `${payment_method} payment`,
      },
      { transaction: t }
    );

    await t.commit();

    return res.status(200).json({
      success: true,
      message: "Sale completed successfully.",
      data: {
        sale: {
          sale_id: sale.sale_id,
          sale_no: sale.sale_no,
          total_amount: sale.total_amount,
          discount: sale.discount,
          tax_amount: sale.tax_amount,
          status: sale.status,
        },
        payment: {
          sale_payment_id: payment.sale_payment_id,
          payment_method: payment.payment_method,
          amount: payment.amount,
          tendered_amount: Number(tendered_amount) || totalAmount,
          change_due: Math.max(0, (Number(tendered_amount) || 0) - totalAmount),
          status: payment.status,
        },
        receipt: {
          receipt_id: receipt.receipt_id,
          receipt_number: receipt.receipt_number,
          total_amount: receipt.total_amount,
          tax_amount: receipt.tax_amount,
        },
      },
    });
  } catch (err) {
    await t.rollback();
    console.error("[processCash]", err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  createcheckoutSession,
  PaymentSuccess,
  generatekHQR,
  verifykHoR,
  checkpaymentstatus,
  processCash,
};
