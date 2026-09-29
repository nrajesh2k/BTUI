# Braintree Drop-in UI — Node.js/Express

A minimal, working integration of [Braintree's Drop-in UI](https://developer.paypal.com/braintree/docs/guides/drop-in/overview) with an Express backend that generates client tokens and processes sales.

## How it works

- `GET /client_token` — server generates a Braintree client token, used by the front-end to initialize Drop-in.
- Front-end (`public/index.html` + `public/client.js`) renders the Drop-in UI, collects a payment method, and calls `requestPaymentMethod` to get a nonce.
- `POST /checkout` — server takes that nonce + amount and calls `gateway.transaction.sale()`.

## 1. Run locally

```bash
npm install
cp .env.example .env
# edit .env with your Braintree Sandbox credentials
npm start
```

Visit `http://localhost:3000`.

Get sandbox credentials from the [Braintree Control Panel](https://sandbox.braintreegateway.com/) → Settings → API Keys. Use Braintree's [test card numbers](https://developer.paypal.com/braintree/docs/reference/general/testing/node#test-cards) (e.g. `4111 1111 1111 1111`, any future expiration, any CVV) to test payments in Sandbox.

## 2. Push to GitHub

```bash
git init
git add .
git commit -m "Braintree Drop-in integration"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

(`.env` is already git-ignored — never commit real API keys.)

## 3. Deploy to Render

1. In the Render dashboard: **New +** → **Web Service** → connect this GitHub repo.
2. Settings:
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
3. Add environment variables under **Environment**:
   - `BT_ENVIRONMENT` = `Sandbox` (or `Production`)
   - `BT_MERCHANT_ID`
   - `BT_PUBLIC_KEY`
   - `BT_PRIVATE_KEY`
   - (Don't set `PORT` — Render injects this automatically and the app reads `process.env.PORT`.)
4. Deploy. Render will build and give you a public URL — the Drop-in checkout page will be live at `/`.

## Going to production

- Switch `BT_ENVIRONMENT` to `Production` and use your live Braintree API keys.
- Enable HTTPS (Render gives you this by default).
- Consider webhooks for settlement/dispute notifications (`gateway.webhookNotification`).
- Add authentication/CSRF protection around `/checkout` if this sits behind a real storefront.
