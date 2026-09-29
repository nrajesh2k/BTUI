require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const braintree = require('braintree');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ---- Braintree gateway setup ----
const environment =
  (process.env.BT_ENVIRONMENT || 'Sandbox').toLowerCase() === 'production'
    ? braintree.Environment.Production
    : braintree.Environment.Sandbox;

const gateway = new braintree.BraintreeGateway({
  environment,
  merchantId: process.env.BT_MERCHANT_ID,
  publicKey: process.env.BT_PUBLIC_KEY,
  privateKey: process.env.BT_PRIVATE_KEY,
});

// ---- Routes ----

// 1. Client token - the front-end Drop-in UI needs this to initialize
app.get('/client_token', async (req, res) => {
  try {
    const response = await gateway.clientToken.generate({});
    res.json({ clientToken: response.clientToken });
  } catch (err) {
    console.error('Error generating client token:', err);
    res.status(500).json({ error: 'Failed to generate client token' });
  }
});

// 2. Checkout - takes the payment method nonce from Drop-in and creates a sale
app.post('/checkout', async (req, res) => {
  const { paymentMethodNonce, amount } = req.body;

  if (!paymentMethodNonce || !amount) {
    return res.status(400).json({ error: 'paymentMethodNonce and amount are required' });
  }

  try {
    const result = await gateway.transaction.sale({
      amount: amount.toString(),
      paymentMethodNonce,
      options: {
        submitForSettlement: true,
      },
    });

    if (result.success) {
      res.json({
        success: true,
        transactionId: result.transaction.id,
        status: result.transaction.status,
      });
    } else {
      res.status(422).json({
        success: false,
        message: result.message,
        errors: result.errors ? result.errors.deepErrors() : [],
      });
    }
  } catch (err) {
    console.error('Error processing transaction:', err);
    res.status(500).json({ error: 'Transaction failed' });
  }
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Braintree Drop-in app listening on port ${PORT}`);
});
