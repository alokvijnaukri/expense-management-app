# Deployment Guide for Expense Management Application

This guide will help you deploy the Expense Management application on your own server.

## Prerequisites

- Node.js (v16 or later)
- npm (v8 or later)
- PostgreSQL database (optional, for persistent storage)
- A Linux/Unix server environment (recommended)

## Deployment Steps

### 1. Clone or Copy the Application

First, copy all the project files to your server. You can use git, scp, rsync, or any method you prefer.

### 2. Install Dependencies

Navigate to the project directory and install the dependencies:

```bash
cd /path/to/expense-app
npm install --production
```

### 3. Build the Application

Run the build script to create a production-ready version:

```bash
node build.js
```

This will:
- Build the React frontend with Vite
- Compile the TypeScript files
- Create a production distribution in the `dist` folder

### 4. Configure the Environment

Run the setup script to configure your server environment:

```bash
node setup-server.js
```

Follow the prompts to set:
- Port number (default: 5000)
- Database type (memory or PostgreSQL)
- Database connection string (if using PostgreSQL)

This will create an `.env` file with your configuration.

### 5. Start the Application

#### Using Node Directly

```bash
cd dist
node server/index.js
```

#### Using PM2 (Recommended for Production)

If you want to run the application as a service that automatically restarts on crashes or server reboots, install PM2:

```bash
npm install -g pm2
cd dist
pm2 start server/index.js --name "expense-app"
pm2 save
pm2 startup
```

Follow the instructions provided by the `pm2 startup` command to make the service start automatically on server boot.

#### Using Docker (Alternative)

If you prefer using Docker, you can create a Dockerfile and build a container image for the application.

### 6. Access the Application

Once the application is running, you can access it at:

```
http://your-server-ip:5000
```

## Database Configuration

### Using In-Memory Database (Default)

By default, the application uses an in-memory database which is reset when the server restarts. This is good for testing but not for production use.

### Using PostgreSQL Database

For production, it's recommended to use a PostgreSQL database:

1. Create a new PostgreSQL database
2. During setup, select "postgres" as the database type
3. Provide the connection string in the format: `postgresql://username:password@hostname:port/database`

## Troubleshooting

### Application Not Starting

- Check if the required port is already in use
- Verify that Node.js is installed correctly
- Check the application logs for errors

### Database Connection Issues

- Verify your PostgreSQL credentials
- Make sure the PostgreSQL server is running and accessible
- Check firewall rules that might block the connection

### Interface Not Loading

- Ensure that the build process completed successfully
- Check for JavaScript errors in the browser console
- Verify that all static assets were copied correctly

## Maintenance

### Updating the Application

To update the application:

1. Copy the new code to your server
2. Rebuild the application with `node build.js`
3. Restart the server process

### Backing Up Data

If using PostgreSQL, regularly backup your database:

```bash
pg_dump -U username database_name > backup.sql
```

## Security Considerations

- Set up a firewall to restrict access to necessary ports only
- Consider using HTTPS with a reverse proxy like Nginx
- Regularly update dependencies to patch security vulnerabilities
- Use strong, unique passwords for database access