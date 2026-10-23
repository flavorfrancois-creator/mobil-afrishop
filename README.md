# AfriMarket customer mobile app

AfriMarket is the customer shopping app for the `africashop.win` marketplace. It is built with Expo and connects to the same customer API used by the website.

## Customer features

- Sign in, create an account, recover a forgotten password, and complete optional two-factor verification.
- Browse and search products and shops; view product variants and stock.
- Save products as favorites and keep a local shopping cart.
- Get the website-calculated order quote, including currency conversion, shipping, customs, and the selected customs payment timing.
- Checkout with an optional wallet balance and review order history and delivery status.
- View account details and recent delivery address; change password, email, phone number, and language.
- Request or cancel account deletion through the website's approval and email-confirmation process.
- Enable device fingerprint login using Expo Local Authentication and SecureStore.

## Website API

- Mobile customer authentication and marketplace discovery: `https://africashop.win/api/mobile`
- Customer shopping, checkout, account, and wallet APIs: `https://africashop.win/api`
- Checkout obtains its authoritative quote from `POST /orders/quote`; the app does not estimate conversion, transport, or customs locally.

## Run the app

```bash
npm install
npm start
```

Use Expo Go for development, or run `npm run android` with Android tooling installed.

## Build an Android APK with EAS

```bash
npx eas-cli build --platform android --profile preview
```

The Expo slug, project ID, and Android package are retained so updates use the existing AfriMarket app identity.
