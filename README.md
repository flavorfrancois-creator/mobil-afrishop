# AfriMarket customer mobile app

AfriMarket is the customer shopping app for [africashop.win](https://africashop.win). It is built with Expo Router and React Native, and uses the marketplace's production API.

## Customer features

- Customer sign-in, registration, forgot-password, and two-factor verification.
- Product/category search, promotions, shops, product variants, and inventory.
- Local cart and favorites, saved delivery address, and customer profile.
- Server-calculated multi-currency quotes, shipping and customs estimates, and wallet checkout.
- Order history, tracking timeline, delivery receipt confirmation, and wallet overview.
- Change password, email, and phone; choose account language; request or cancel account deletion.
- Optional fingerprint/biometric sign-in using device secure storage.
- French, English, and Spanish UI translations.

## Website connection

The API client defaults to `https://africashop.win/api` and can be configured with `EXPO_PUBLIC_BACKEND_URL`. The Android package and EAS project identity are retained for AfriMarket updates.

The app uses the website's customer endpoints, including `/mobile/auth/*`, `/products`, `/categories`, `/shops`, `/orders/quote`, `/orders`, `/orders/mine`, `/wallet`, and `/account/*`.

## Local development

Install the pinned dependencies with Yarn:

```bash
yarn install --frozen-lockfile
yarn start
```

## Android APK

```bash
npx eas-cli build --platform android --profile preview
```
