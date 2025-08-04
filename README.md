# Pod & Beyond Hotel

A full-stack hotel booking application built with Next.js (frontend) and Express.js (backend).

## Project Structure

```
podnbeyond.com/
├── backend/          # Express.js API server
│   ├── controllers/  # Route controllers
│   ├── models/       # Data models
│   ├── prisma/       # Database schema and migrations
│   ├── routes/       # API routes
│   └── server.js     # Main server file
├── frontend/         # Next.js React application
│   ├── components/   # React components
│   ├── pages/        # Next.js pages
│   └── styles/       # CSS styles
└── package.json      # Root package.json for managing both projects
```

## Prerequisites

- Node.js (v18 or higher)
- npm (comes with Node.js)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd podnbeyond.com
```

2. Install all dependencies:
```bash
npm run install:all
```

## Running the Application

### Development Mode (Recommended)

Run both backend and frontend simultaneously:
```bash
npm run dev
```

This will start:
- Backend server on http://localhost:4000
- Frontend development server on http://localhost:3000

### Running Separately

**Backend only:**
```bash
npm run dev:backend
```

**Frontend only:**
```bash
npm run dev:frontend
```

### Production

Build the frontend:
```bash
npm run build
```

Start the backend:
```bash
npm start
```

## Available Scripts

- `npm run install:all` - Install dependencies for all projects
- `npm run dev` - Start both backend and frontend in development mode
- `npm run dev:backend` - Start only the backend server
- `npm run dev:frontend` - Start only the frontend development server
- `npm run build` - Build the frontend for production
- `npm start` - Start the backend server

## API Endpoints

- `POST /api/booking/book` - Create a new booking
- `GET /api/loyalty/*` - Loyalty program endpoints

## Technologies Used

### Backend
- Express.js - Web framework
- Prisma - Database ORM
- CORS - Cross-origin resource sharing

### Frontend
- Next.js - React framework
- TypeScript - Type safety
- Tailwind CSS - Styling
- Axios - HTTP client

## Development

The frontend is configured to proxy API requests to the backend automatically. When you make requests to `/api/*` from the frontend, they will be forwarded to the backend server running on port 4000.

## Database

The project uses Prisma as the ORM. Database schema and migrations are located in the `backend/prisma/` directory.

To set up the database:
1. Configure your database connection in `backend/prisma/schema.prisma`
2. Run `npx prisma generate` to generate the Prisma client
3. Run `npx prisma db push` to push the schema to your database 