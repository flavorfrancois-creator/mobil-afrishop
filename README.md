# Mobil AfriShop

Lightweight Android/iOS customer mobile app for AfriShop.

## API base URL

The app connects to:

`https://africashop.win/api/mobile`

## Included features

- Customer login
- Customer account creation
- Persistent login with local token storage
- Logout that fully disconnects the account
- Nearby shops list
- Nearby products list

## Main mobile endpoints

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/logout`
- `GET /auth/me`
- `GET /shops`
- `GET /products`

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

