# Legends of Learning API Demo

A simple demo application showcasing integration with the Legends of Learning API. This project demonstrates OAuth 2.0 authentication and API proxying for Legends of Learning endpoints.

## Features

- OAuth 2.0 two-legged authentication
- API proxying for Legends of Learning public endpoints
- Simple frontend interface to explore the API
- Standard assignment creation and launch URL generation
- Robust error handling for user creation

## Recent Updates

- Changed terminology from "Launch Game" to "Launch Standard" to align with API documentation
- Improved error handling for user creation to handle "User already exists with different params" errors
- Updated UI to reflect the correct terminology throughout the application

## Setup

1. Clone the repository
2. Create a `.env` file with your credentials (copy from `.env.example`):
```
LEGENDS_API_BASE_URL=https://api.legendsoflearning.com/api/v3
LEGENDS_CLIENT_ID=your_client_id
LEGENDS_CLIENT_SECRET=your_client_secret
```

3. Install dependencies:
```bash
npm install
```

4. Start the development server:
```bash
npm run dev
```

## Project Structure

```
├── src/
│   ├── pages/
│   │   ├── api/    # API proxy routes
│   │   └── index.tsx # Main page
│   └── components/ # React components
├── .env           # Environment variables (gitignored)
├── .env.example   # Example environment variables
└── package.json
```

## API Routes

The server proxies the following Legends of Learning endpoints:

- `/api/content` - List and search content
- `/api/assignments` - Create assignments
- `/api/join` - Generate join URLs

## Environment Variables

- `LEGENDS_API_BASE_URL` - Base URL for the Legends of Learning API
- `LEGENDS_CLIENT_ID` - Your Legends of Learning client ID
- `LEGENDS_CLIENT_SECRET` - Your Legends of Learning client secret

## Deployment to Vercel

This project is configured for easy deployment to Vercel:

1. Push your code to a Git repository
2. Connect the repository to Vercel
3. Add the environment variables in the Vercel dashboard:
   - `LEGENDS_API_BASE_URL`
   - `LEGENDS_CLIENT_ID`
   - `LEGENDS_CLIENT_SECRET`
4. Deploy

Vercel will automatically pick up the environment variables from your Vercel project settings for each deployment.

## Security

- Environment variables are never exposed to the client
- OAuth token management is handled server-side
- All API requests are proxied through the backend

## License

MIT 