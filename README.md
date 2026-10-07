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

### Authentication troubleshooting

- `Invalid email or password.` means the email is not present in the MongoDB database or the password does not match. Registration and login use normalized lowercase email addresses.
- `Unable to connect to KRAM.` means the backend is not running or MongoDB is unavailable. Run `npm run dev` from the repository root and check `http://localhost:5000/api/health`.
- In development, if an authenticated workspace request cannot load its API data, KRAM fills the workspace with deterministic mock content: 12 projects, 46 tasks, and recent activity entries. This fallback does not create accounts or replace MongoDB authentication.

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
