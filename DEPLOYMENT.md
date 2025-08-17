# AI Meeting Notes - Deployment Guide

## Production Deployment on EC2 Ubuntu

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- PM2 globally installed
- PostgreSQL database (NeonDB configured)

### Environment Setup

1. **Clone the repository:**
```bash
git clone <your-repo-url>
cd ai-meeting-notes
```

2. **Install dependencies:**
```bash
npm install
```

3. **Create .env file:**
```bash
cp .env.example .env
# Edit .env with your production values
```

4. **Build the project:**
```bash
npm run build
```

### PM2 Deployment

#### Option 1: Using the startup script (Recommended)
```bash
chmod +x start.sh
./start.sh
```

#### Option 2: Manual PM2 commands
```bash
# Start the application
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system boot
pm2 startup
```

### PM2 Management Commands

```bash
# View application status
pm2 status

# View logs
pm2 logs ai-meeting-notes

# Monitor application
pm2 monit

# Restart application
pm2 restart ai-meeting-notes

# Stop application
pm2 stop ai-meeting-notes

# Delete application from PM2
pm2 delete ai-meeting-notes
```

### NPM Scripts

```bash
# Build and start with PM2
npm run deploy

# PM2 management
npm run pm2:start
npm run pm2:stop
npm run pm2:restart
npm run pm2:delete
npm run pm2:logs
npm run pm2:monit
```

### Troubleshooting

#### Environment Variables Not Found
If you see "GROQ_API_KEY environment variable is required":
1. Ensure `.env` file exists in the project root
2. Check that PM2 is using the correct working directory
3. Verify environment variables are properly formatted

#### Application Crashes
1. Check PM2 logs: `pm2 logs ai-meeting-notes`
2. Verify database connection
3. Ensure all dependencies are installed
4. Check Node.js version compatibility

#### Port Issues
- Default port is 4000
- Update `PORT` in `.env` file if needed
- Ensure port is not blocked by firewall

### Health Check

Test the API endpoint:
```bash
curl http://localhost:4000/api/summaries
```

### Security Considerations

1. **Environment Variables**: Never commit `.env` file to version control
2. **Database**: Use secure connection strings with SSL
3. **API Keys**: Rotate API keys regularly
4. **Firewall**: Configure proper security groups/firewall rules
5. **HTTPS**: Use a reverse proxy (nginx) for HTTPS in production

### Performance Optimization

1. **PM2 Clustering**: For high traffic, consider using cluster mode
2. **Memory Management**: Monitor memory usage with `pm2 monit`
3. **Log Rotation**: Configure log rotation to prevent disk space issues
4. **Database**: Ensure proper database indexing and connection pooling

### Monitoring

Set up monitoring for:
- Application uptime
- Memory usage
- CPU usage
- Database performance
- API response times
- Error rates
