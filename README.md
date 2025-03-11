# Legends of Learning REST API Demo

This is a simple demo application showcasing how to interact with the Legends of Learning REST API using Next.js 14.

## Features

- Modern React with Next.js 14
- Server-side API proxying for security
- Client-side authentication with OAuth 2.0
- TypeScript for type safety
- Tailwind CSS for styling
- ESLint and Prettier for code quality

## Prerequisites

- Node.js 18.17 or later
- npm or yarn
- A Legends of Learning account with API access

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/lol-rest-api-demo.git
   cd lol-rest-api-demo
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Create a `.env` file in the root directory:
   ```
   LEGENDS_API_BASE_URL=https://api.smartlittlecookies.com/api/v3
   INTERNAL_API_BASE_URL=http://localhost:3000
   ```

4. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

Required environment variables:

- `LEGENDS_API_BASE_URL` - The base URL for the Legends of Learning API
- `INTERNAL_API_BASE_URL` - The base URL for the internal API (usually http://localhost:3000)

## Authentication

This application uses OAuth 2.0 client credentials flow for authentication. You'll need to:

1. Log in to your Legends of Learning account
2. Navigate to the API settings page
3. Generate API credentials (Client ID and Client Secret)
4. Enter these credentials in the application's login form

## API Documentation

For detailed information about the Legends of Learning API, please refer to the [official API documentation](https://docs.legendsoflearning.com/api/).

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. 