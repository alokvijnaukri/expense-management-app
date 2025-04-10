const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Create dist directory if it doesn't exist
if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist');
}

console.log('Building client...');
execSync('npx vite build', { stdio: 'inherit' });

console.log('Copying server files...');
// Copy server files
const serverFiles = ['server', 'shared'];
serverFiles.forEach(folder => {
  execSync(`cp -r ${folder} dist/`, { stdio: 'inherit' });
});

// Create a production package.json
const packageJson = require('./package.json');
const prodPackage = {
  name: packageJson.name,
  version: packageJson.version,
  private: true,
  scripts: {
    start: 'node server/index.js',
  },
  dependencies: packageJson.dependencies,
};

fs.writeFileSync(
  path.join('dist', 'package.json'),
  JSON.stringify(prodPackage, null, 2)
);

console.log('Compiling TypeScript...');
execSync('npx tsc --project tsconfig.prod.json', { stdio: 'inherit' });

console.log('Build completed!');