# KRAM Mobile

Expo Android client for the KRAM project management API. It uses the same backend and account as the web app.

## Run locally

```sh
cd mobile
npm install
npm start
```

Set `EXPO_PUBLIC_API_URL` before starting. Android Emulator uses `http://10.0.2.2:5000/api` to reach a backend running on the host machine. A physical device must use the host computer's LAN IP, such as `http://192.168.1.20:5000/api`.

The backend must allow the device to reach port 5000. Register or log in with the same account used by the web app. Pull down on Dashboard, Tasks, or Projects to refresh shared data.

## Production build

Set `EXPO_PUBLIC_API_URL` to the deployed backend URL ending in `/api`, then run:

```sh
npx expo login
npx eas login
npx eas build:configure
npx eas build --platform android --profile preview
```

The app stores access and refresh tokens in `expo-secure-store` (Android Keystore). The backend returns a mobile refresh token only when the app sends `X-Client: mobile`; browser clients continue to use the HttpOnly cookie flow.
