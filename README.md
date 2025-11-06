# SlotSwapper - Peer-to-Peer Time Slot Scheduling Application

SlotSwapper is a full-stack MERN application that allows users to swap their busy time slots with other users through a marketplace system.

## Features

- **User Authentication**: Sign up and login with JWT-based authentication
- **Calendar Management**: Create, edit, and delete events with status management (BUSY, SWAPPABLE, SWAP_PENDING)
- **Marketplace**: Browse and request swaps for available slots from other users
- **Swap Requests**: Send and receive swap requests with accept/reject functionality
- **Real-time Updates**: Dynamic state management for instant UI updates

## Tech Stack

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- JWT for authentication
- bcryptjs for password hashing

### Frontend
- React 18
- Vite
- React Router DOM
- Bootstrap 5 & React Bootstrap
- Axios for API calls

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas)
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the backend directory:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/slotswapper
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
```

4. Start MongoDB (if running locally):
```bash
# On Windows, make sure MongoDB service is running
# Or start MongoDB manually
```

5. Start the backend server:
```bash
npm run dev
```

The backend server will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register a new user
- `POST /api/auth/login` - Login user

### Events
- `GET /api/events` - Get all events for logged-in user
- `POST /api/events` - Create a new event
- `PUT /api/events/:id` - Update an event
- `DELETE /api/events/:id` - Delete an event

### Swap Requests
- `GET /api/swappable-slots` - Get all swappable slots from other users
- `POST /api/swap-request` - Create a swap request
- `POST /api/swap-response/:requestId` - Respond to a swap request (accept/reject)
- `GET /api/swap-requests/incoming` - Get incoming swap requests
- `GET /api/swap-requests/outgoing` - Get outgoing swap requests


## Usage

1. **Sign Up**: Create a new account with your name, email, and password
2. **Create Events**: Go to Dashboard and create events with titles, start/end times
3. **Make Swappable**: Click "Make Swappable" on any BUSY event to make it available for swapping
4. **Browse Marketplace**: Visit the Marketplace to see available slots from other users
5. **Request Swap**: Click "Request Swap" on any slot and select one of your swappable slots to offer
6. **Manage Requests**: Go to Notifications to see incoming and outgoing swap requests
7. **Accept/Reject**: Accept or reject incoming swap requests from the Notifications page

## Notes

- All protected routes require JWT authentication
- Slots with status SWAP_PENDING cannot be modified until the swap is resolved
- When a swap is accepted, the slot ownership is exchanged between users
- The frontend automatically refreshes swap requests every 5 seconds

## Development

For development with auto-reload:
- Backend: `npm run dev` (uses nodemon)
- Frontend: `npm run dev` (uses Vite)


