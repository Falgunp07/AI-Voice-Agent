# Backend Server - PropCall AI

## 🚀 Quick Start

### Running the Backend

```bash
# Development mode (auto-reload)
npm run server

# Production mode
npm run server:prod
```

The server will start on **http://localhost:4000**

## 📁 Backend Structure

```
server/
├── index.ts              # Main Express server
├── routes/               # API route handlers
│   ├── leads.ts         # Lead management + Excel upload
│   ├── calls.ts         # Call logs & analytics
│   └── properties.ts    # Property CRUD operations
├── controllers/         # Business logic (future)
├── middleware/          # Auth, validation (future)
└── utils/
    └── supabase.ts      # Supabase client
```

## 🔌 API Endpoints

### Health Check
```
GET /api/health
```

### Leads
```
GET    /api/leads           - Get all leads
GET    /api/leads/:id       - Get single lead
POST   /api/leads/upload    - Upload Excel file with leads
PATCH  /api/leads/:id       - Update lead status/score
DELETE /api/leads/:id       - Delete lead
```

### Calls
```
GET  /api/calls              - Get all call logs
GET  /api/calls/lead/:leadId - Get calls for specific lead
POST /api/calls              - Create call log
GET  /api/calls/analytics    - Get analytics & stats
```

### Properties
```
GET    /api/properties     - Get all properties
GET    /api/properties/:id - Get single property
POST   /api/properties     - Create property
PATCH  /api/properties/:id - Update property
DELETE /api/properties/:id - Delete property
```

## 📊 Database Schema

See `database/schema.sql` for the complete database schema.

### Tables:
- **users** - Client and admin accounts
- **leads** - Customer leads from Excel uploads
- **call_logs** - Call history and transcripts
- **properties** - Real estate property listings
- **campaigns** - Calling campaigns

## 🔧 Next Steps

1. **Set up Supabase:**
   - Sign up at https://supabase.com
   - Create a new project
   - Run the SQL from `database/schema.sql` in Supabase SQL Editor
   - Copy your project URL and anon key to `.env.local`

2. **Configure Environment Variables:**
   - Copy `.env.local.example` to `.env.local`
   - Add your Supabase credentials

3. **Test the API:**
   - Start the server with `npm run server`
   - Visit http://localhost:4000/api/health

## 🛠️ Technologies

- **Express** - Web framework
- **TypeScript** - Type safety
- **Supabase** - Database & auth
- **Multer** - File upload handling
- **XLSX** - Excel file parsing
