# AfriMarket mobile app

Customer-only Android/iOS mobile app for AfriMarket, built with Expo.

This version is a redesigned mobile marketplace app with:

- real tab + stack navigation
- dedicated marketplace home page after login
- reusable app state for auth, cart, and favorites
- structured Expo app files under `src/`
- customer-only flows aligned with the AfriMarket web platform

## API base URLs

The app uses both:

- `https://africashop.win/api/mobile` for customer mobile authentication and lightweight discovery
- `https://africashop.win/api` for the rest of the customer features already available in the web app backend

## Included customer features

- Customer login
- Customer account creation
- Forgot password request
- Persistent login with local token storage
- Optional fingerprint login with credentials stored in the device secure store
- Logout that disconnects the account
- Browse products
- Search products
- Browse shops
- Search shops
- Product detail
- Shop detail
- Local favorites
- Local cart
- Checkout / order creation
- Order history
- Receipt confirmation by tracking/reference code
- Customer wallet view
- Customer withdrawals
- Invitation / referral code
- Profile overview
- Change password, email, and phone number
- Request and cancel account deletion
- Save account language preference
- Profile address from the most recent order
- Phone verification helper
- E-mail verification helper
- Product reporting

## Main endpoints used

### Mobile auth

- `POST /mobile/auth/register`
- `POST /mobile/auth/login`
- `POST /mobile/auth/logout`
- `GET /mobile/auth/me`
- `GET /mobile/products`
- `GET /mobile/shops`

### Customer web-app APIs reused by the mobile app

- `POST /auth/forgot-password`
- `POST /account/password`
- `POST /account/contact/request`
- `POST /account/contact/confirm`
- `GET /account/deletion`
- `POST /account/deletion`
- `DELETE /account/deletion`
- `PUT /auth/language`
- `POST /auth/send-phone-otp`
- `POST /auth/verify-phone`
- `POST /auth/resend-email`
- `POST /auth/verify-email`
- `GET /products`
- `GET /products/{id}`
- `POST /products/{id}/report`
- `GET /shops`
- `GET /shops/{id}`
- `POST /orders`
- `GET /orders/mine`
- `POST /orders/confirm-by-tracking`
- `GET /wallet`
- `GET /withdrawals/mine`
- `POST /withdrawals`

## Run locally

```bash
npm install
npm start
```

Then open with Expo Go on Android/iPhone, or run:

```bash
npm run android
npm run ios
```
