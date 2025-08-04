# Database Setup Guide

## Prerequisites
- PostgreSQL installed and running
- Node.js and npm installed

## Setup Steps

### 1. Create Database
```sql
CREATE DATABASE podnbeyond;
```

### 2. Environment Variables
Create a `.env` file in the backend directory:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/podnbeyond"
PORT=4000
NODE_ENV=development
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Run Database Migrations
```bash
npx prisma migrate dev --name init
```

### 5. Seed the Database
```bash
npm run seed
```

### 6. Generate Prisma Client
```bash
npx prisma generate
```

## Database Models

### Room Model
- `id`: Unique identifier
- `type`: Room type (Standard Room, Deluxe Room, etc.)
- `price`: Price per night
- `capacity`: Maximum number of guests
- `createdAt`: Creation timestamp
- `updatedAt`: Last update timestamp

### Booking Model
- `id`: Unique identifier
- `guestName`: Guest's full name
- `email`: Guest's email
- `phone`: Guest's phone number (optional)
- `checkIn`: Check-in date
- `checkOut`: Check-out date
- `guests`: Number of guests
- `totalPrice`: Total booking price
- `specialRequests`: Special requests (optional)
- `status`: Booking status (PENDING, CONFIRMED, CANCELLED, COMPLETED)
- `roomId`: Reference to the booked room
- `createdAt`: Creation timestamp
- `updatedAt`: Last update timestamp

## API Endpoints

### Rooms
- `GET /api/booking/rooms` - Get all available rooms

### Bookings
- `POST /api/booking/book` - Create a new booking
- `GET /api/booking/bookings` - Get all bookings
- `PATCH /api/booking/bookings/:id/status` - Update booking status 