# KARM

![KARM logo](logo.png)

KARM is a calm, precise workspace for planning projects and moving tasks forward.

## Development

You need Node.js 22 or later and npm.

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

`npm run dev` starts both the Vite frontend and the API. The API needs MongoDB running at `mongodb://127.0.0.1:27017/kram`, or a `backend/.env` file with a MongoDB Atlas connection string. Register once from the app, then use the same email and password to sign in. Passwords are stored as bcrypt hashes; the API returns a short-lived access JWT and keeps the refresh JWT in an HttpOnly cookie.

## Mobile app

The Expo Android client lives in [`mobile/`](mobile/README.md) and uses the same API and database. It supports registration, login/logout, dashboard statistics, project/task viewing, task search and filtering, task creation/editing/deletion, completion, pull-to-refresh, network errors, expired sessions, and Android secure token storage through `expo-secure-store`.

```sh
cd mobile
npm install
# copy .env.example to .env and set EXPO_PUBLIC_API_URL
npm start
```

For an Android emulator, use `http://10.0.2.2:5000/api`. For a physical device, use the development computer's LAN IP. For an Android preview build, set the variable to the deployed backend URL ending in `/api` and run `npx eas build --platform android --profile preview`.

## Submission status

- Web app: implemented and production build verified with `npm run build`.
- Backend: implemented and TypeScript build verified with `npm run build:backend`.
- Mobile app: Expo source added under `mobile/`; the workspace editor reports no TypeScript errors in the new source.
- API documentation: [`backend/README.md`](backend/README.md).
- Schema diagram: [`docs/schema.md`](docs/schema.md).
- Deployment URLs and APK/Expo distribution link still require a hosting account, deployed MongoDB URI, and Expo/EAS credentials; they cannot be generated from this local workspace alone.
- Rubric gap: the brief requires PostgreSQL or MySQL, while the current backend uses MongoDB/Mongoose. See [`docs/schema.md`](docs/schema.md).

### Authentication troubleshooting

- `Invalid email or password.` means the email is not present in the MongoDB database or the password does not match. Registration and login use normalized lowercase email addresses.
- `Unable to connect to KRAM.` means the backend is not running or MongoDB is unavailable. Run `npm run dev` from the repository root and check `http://localhost:5000/api/health`.
- Each newly registered account receives a persisted starter workspace with 6 projects and 24 tasks. In development, if an authenticated workspace request cannot load its API data, KRAM also fills the screen with a deterministic local fallback.

For production, set `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, and `MONGODB_URI` in `backend/.env`; the backend rejects missing production secrets.

## Built With

- TanStack Start
- TypeScript
- React
- Tailwind CSS

## Contributing

1. Create a feature branch.
2. Install dependencies with `npm install`.
3. Run `npm run dev` and make your changes.
4. Run `npm test` and `npm run lint`.
5. Open a pull request with a concise description of the change.
