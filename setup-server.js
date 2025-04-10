// This script sets up the server environment
const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const config = {
  PORT: 5000,
  NODE_ENV: 'production',
  DATABASE_TYPE: 'memory', // or 'postgres'
  DATABASE_URL: '',
  SESSION_SECRET: Math.random().toString(36).substring(2, 15) + 
                  Math.random().toString(36).substring(2, 15)
};

console.log('Expense Management App - Server Setup\n');

function askQuestions() {
  rl.question('Port number (default: 5000): ', (port) => {
    if (port) config.PORT = port;
    
    rl.question('Database type (memory/postgres) (default: memory): ', (dbType) => {
      if (dbType && ['memory', 'postgres'].includes(dbType.toLowerCase())) {
        config.DATABASE_TYPE = dbType.toLowerCase();
      }
      
      if (config.DATABASE_TYPE === 'postgres') {
        rl.question('PostgreSQL connection URL: ', (dbUrl) => {
          config.DATABASE_URL = dbUrl;
          writeConfig();
        });
      } else {
        writeConfig();
      }
    });
  });
}

function writeConfig() {
  let envContent = '';
  
  for (const [key, value] of Object.entries(config)) {
    envContent += `${key}=${value}\n`;
  }
  
  fs.writeFileSync('.env', envContent);
  console.log('\nConfiguration saved to .env file');
  console.log('Setup complete! You can now start the server with:');
  console.log('npm start');
  
  rl.close();
}

askQuestions();