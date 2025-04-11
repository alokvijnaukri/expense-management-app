# Expense Management Application

A modern responsive expense management web application with comprehensive features for claim processing through intuitive role-based approval workflows.

## Features
- Authentication system with role-based access control (Manager, Employee, Admin, Finance)
- Interactive dashboard with expense analytics and visualizations
- Claim submission and multi-level approval workflows
- Timeline visualization of expense approval journeys
- Comprehensive reporting and analytics for claimed vs. approved amounts
- Mobile-responsive design for all device sizes

## Technologies Used
- **Frontend**: React.js, TypeScript, Tailwind CSS, shadcn/ui, Recharts
- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Passport.js with session-based auth
- **State Management**: TanStack Query (React Query)

## Getting Started

### Prerequisites
- Node.js 18 or 20
- PostgreSQL database

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/alokvijnaukri/expense-management-app.git
   cd expense-management-app
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Set up environment variables
   ```bash
   # Create a .env file with your PostgreSQL database URL
   DATABASE_URL=postgresql://username:password@hostname:port/database
   SESSION_SECRET=your_random_session_secret
   ```

4. Push schema to database
   ```bash
   npm run db:push
   ```

5. Start the development server
   ```bash
   npm run dev
   ```

## Login Credentials for Demo
- Manager: username: `manager`, password: `manager123`
- Employee: username: `employee`, password: `employee123`

## License
This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments
- Built with modern web technologies and best practices
- Designed for real-world enterprise expense management workflows