/**
 * Script to run the seeder using ESM modules
 */

// Run the require-based script directly using Node
import { execSync } from 'child_process';

try {
  console.log('Starting the data seeding process...');
  execSync('node scripts/seed-demo-data.js', { stdio: 'inherit' });
  console.log('Seeding process completed successfully!');
} catch (error) {
  console.error('Error running seeder:', error);
  process.exit(1);
}