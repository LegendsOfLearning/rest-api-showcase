# Legends API Showcase

A Next.js application for managing and launching educational standards. This project demonstrates integration with the Legends API for managing educational content and assignments.

## Features

- User Management (teachers/students)
- Standards-based Assignment Creation
- Student Assignment Launch Flow
- Real-time Assignment Status Updates

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm or pnpm
- A Legends API key and secret

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/LegendsOfLearning/rest-api-showcase.git
   cd rest-api-showcase
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   pnpm install
   ```

3. Create a `.env` file with any overrides:
   ```
   LEGENDS_API_URL=https://api.smartlittlecookies.com/api
   ```

4. Start the development server:
   ```bash
   npm run dev
   # or
   pnpm dev
   ```

The application will be available at `http://localhost:3000`.

## Project Structure

```
.
├── src/              # Application source code
├── public/           # Static assets
├── docs/            # Documentation
│   └── api-documentation.md  # Detailed API documentation
├── tests/           # Test files
└── package.json     # Project configuration
```

## Contributing

1. Create a new branch:
   - For features: `feat/feature-name`
   - For fixes: `fix/fix-name`

2. Make your changes and commit using the format:
   ```
   feat(rest-api-showcase): description
   ```

3. Push your changes and create a pull request

### Development Guidelines

- Follow TypeScript best practices
- Write tests for new features
- Update documentation as needed
- Follow the existing code style

## Documentation

- [API Documentation](docs/api-documentation.md) - Detailed API integration guide
- [OpenAPI Spec](https://api.smartlittlecookies.com/api/v3/docs/openapi) - Official API specification

## License

MIT License

Copyright (c) 2024 Legends

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.