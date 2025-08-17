# Meeting Notes Summarizer API

An AI-powered backend service for summarizing meeting transcripts and sharing summaries via email.

## Tech Stack

- **Node.js** + **Express** + **TypeScript**
- **Prisma ORM** with **PostgreSQL** (NeonDB)
- **Groq SDK** for LLM calls (Llama 3 70B model)
- **Nodemailer** for email sending (SMTP)
- **Zod** for validation
- **Multer** for file uploads
- **Marked** for Markdown → HTML conversion
- **Security**: Helmet, CORS, Rate Limiting
- **Logging**: Pino

## Features

- 📝 Generate AI summaries from meeting transcripts
- ✏️ Edit and update summaries
- 📧 Share summaries via email with HTML formatting
- 📋 List and retrieve summaries with pagination
- 📁 Support for .txt file uploads
- 🔒 Security middleware and rate limiting
- 🗄️ PostgreSQL database with Prisma ORM

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Setup

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Update the `.env` file with your actual values:

```env
PORT=4000
WEB_ORIGIN=http://localhost:3000

# Database Configuration (NeonDB PostgreSQL)
DATABASE_URL=postgresql://username:password@host:5432/database

# Groq API Configuration
GROQ_API_KEY=your_groq_api_key

# SMTP Configuration
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your_sendgrid_api_key
MAIL_FROM="Summarizer <your-email@domain.com>"
```

### 3. Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Or run migrations (for production)
npm run db:migrate
```

### 4. Start Development Server

```bash
npm run dev
```

The API will be available at `http://localhost:4000`

## API Endpoints

### Health Check
```
GET /health
```

### Generate Summary
```
POST /api/summaries/generate
```

**JSON Body:**
```json
{
  "transcript": "Meeting transcript text...",
  "prompt": "Please summarize this meeting",
  "model": "llama3-70b-8192" // optional
}
```

**Or File Upload (multipart/form-data):**
- `transcript`: .txt file
- `prompt`: string
- `model`: string (optional)

**Response:**
```json
{
  "id": "summary_id",
  "aiSummary": "Generated summary...",
  "tokensIn": 1500,
  "tokensOut": 300,
  "model": "llama3-70b-8192"
}
```

### Update Summary
```
PATCH /api/summaries/:id
```

**Body:**
```json
{
  "editedSummary": "Updated summary text..."
}
```

### Get Summary
```
GET /api/summaries/:id
```

**Response:**
```json
{
  "id": "summary_id",
  "transcript": "...",
  "prompt": "...",
  "aiSummary": "...",
  "editedSummary": "...",
  "model": "llama3-70b-8192",
  "tokensIn": 1500,
  "tokensOut": 300,
  "status": "completed",
  "createdAt": "2025-01-01T00:00:00Z",
  "updatedAt": "2025-01-01T00:00:00Z",
  "shares": [...]
}
```

### Share Summary
```
POST /api/summaries/:id/share
```

**Body:**
```json
{
  "recipients": ["email1@example.com", "email2@example.com"],
  "subject": "Meeting Summary - Optional Custom Subject"
}
```

**Response:**
```json
{
  "success": true,
  "shareId": "share_id",
  "recipients": ["email1@example.com"],
  "subject": "Meeting Summary",
  "messageId": "email_message_id"
}
```

### List Summaries
```
GET /api/summaries?page=1&limit=10&userId=optional_user_id
```

**Response:**
```json
{
  "summaries": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

## Database Schema

### Summary
- `id`: Unique identifier
- `transcript`: Original meeting transcript
- `prompt`: User's summarization prompt
- `aiSummary`: AI-generated summary
- `editedSummary`: User-edited version (optional)
- `model`: LLM model used
- `tokensIn`/`tokensOut`: Token usage
- `status`: pending/completed/failed
- `userId`: Optional user association

### Share
- `id`: Unique identifier
- `summaryId`: Reference to summary
- `recipients`: Array of email addresses
- `subject`: Email subject
- `bodyHtml`: HTML email content
- `createdAt`: Share timestamp

### User (Optional)
- `id`: Unique identifier
- `email`: User email address

## Scripts

```bash
# Development
npm run dev          # Start dev server with hot reload
npm run build        # Build TypeScript to JavaScript
npm start           # Start production server

# Database
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to database
npm run db:migrate   # Run database migrations
npm run db:studio    # Open Prisma Studio
```

## Error Handling

The API includes comprehensive error handling:

- **400**: Bad Request (validation errors)
- **404**: Not Found (resource doesn't exist)
- **429**: Too Many Requests (rate limit exceeded)
- **500**: Internal Server Error

All errors return JSON with `error` and `message` fields.

## Security Features

- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Input Validation**: Zod schemas for all inputs
- **File Upload Limits**: 10MB max file size
- **Content Security Policy**: Restricts resource loading

## Logging

The application uses Pino for structured logging:

- Request/response logging
- Error tracking
- Performance metrics
- Database operation logs

## Development

### Project Structure

```
src/
├── server.ts           # Main Express application
├── db.ts              # Prisma database client
├── summaries/
│   ├── router.ts      # Summary API routes
│   ├── schemas.ts     # Zod validation schemas
│   └── sendEmail.ts   # Email service
└── llm/
    └── groq.ts        # Groq LLM client

prisma/
└── schema.prisma      # Database schema
```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port | No (default: 4000) |
| `WEB_ORIGIN` | CORS origin | No (default: localhost:3000) |
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `GROQ_API_KEY` | Groq API key | Yes |
| `SMTP_HOST` | SMTP server host | Yes |
| `SMTP_PORT` | SMTP server port | Yes |
| `SMTP_USER` | SMTP username | Yes |
| `SMTP_PASS` | SMTP password | Yes |
| `MAIL_FROM` | From email address | Yes |

## License

ISC
