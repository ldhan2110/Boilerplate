const fs = require('fs');
const path = require('path');

const messagePath = path.resolve(__dirname, 'src/locales/message.json');
const enJsonPath = path.resolve(__dirname, 'src/locales/en.json');

// Load both JSON files
const messages = JSON.parse(fs.readFileSync(messagePath, 'utf-8'));
const enJson = JSON.parse(fs.readFileSync(enJsonPath, 'utf-8'));

let updated = false;

for (const [key, value] of Object.entries(messages)) {
  if (!(key in enJson)) {
    enJson[key] = value;
    updated = true;
  }
}

if (updated) {
  fs.writeFileSync(enJsonPath, JSON.stringify(enJson, null, 2), 'utf-8');
  console.log('✅ en.json updated with missing messages.');
} else {
  console.log('✅ No new keys to add. en.json is up to date.');
}
