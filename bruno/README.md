# SkillLink API in Bruno

Open this `bruno` folder as a collection in Bruno and select the `local` environment. Start the backend with `npm run dev` from `backend/`; the local environment expects it at `http://localhost:5000`.

## Endpoint reference

| Method | Path | Authentication | Purpose |
| --- | --- | --- | --- |
| GET | `/` | None | Backend health response. |
| GET | `/api/auth/google` | None | Starts Google OAuth and redirects to Google; requires Google credentials in the backend environment. |
| GET | `/api/auth/google/callback` | None | OAuth callback; normally called by Google with `code` and `state`, then redirects to the client. |
| POST | `/api/auth/signup` | None | Create an account with `name`, `username`, and `password` (minimum 6 characters). |
| POST | `/api/auth/login` | None | Authenticate with `username` and `password`; returns a one-hour JWT. |
| GET | `/api/users` | None | List up to 50 users. |
| GET | `/api/users/:username` | None | Read a profile, connections, and post summaries. |
| PUT | `/api/users/:username` | Bearer JWT | Update your own `bio` and/or `skills`. |
| GET | `/api/posts` | None | List posts, newest first. |
| POST | `/api/posts` | Bearer JWT | Create a post as the authenticated user. The request accepts JSON or multipart form data; an optional attachment is limited to 10 MB and PDF, JPEG, PNG, WebP, or plain text. |
| PUT | `/api/posts/:id` | Bearer JWT | Update your own post's `title` and/or `description`. |
| DELETE | `/api/posts/:id` | Bearer JWT | Delete your own post. Returns `204` on success. |
| POST | `/api/users/:username/connections` | Bearer JWT | Connect the authenticated user to `targetUsername`; the connection is reciprocal. |

Authenticated requests use `Authorization: Bearer <JWT>`. Sign in with the login request, then set the `token` variable in the selected Bruno environment to the returned token. Replace the sample usernames and `postId` with values present in your database.

## Expected success statuses

- Account signup and post creation: `201`
- Login, reads, updates, and connection creation: `200` (connection creation returns `201`)
- Post deletion: `204`
- Invalid or missing authentication: `401`; ownership failures: `403`; missing records: `404`; invalid input: `400`.

The OAuth callback is intended for the Google redirect flow, not as a standalone request: its `state` must have been created by `/api/auth/google` in the same running server process.