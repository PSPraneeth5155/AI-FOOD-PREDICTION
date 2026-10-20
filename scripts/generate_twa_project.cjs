const fs = require('fs');
const path = require('path');
const core = require('C:/Users/Dell/AppData/Local/npm-cache/_npx/881cef4662d2c421/node_modules/@bubblewrap/core');
const { TwaManifest, TwaGenerator, Config, AndroidSdkTools, JdkHelper, KeyTool } = core;

async function run() {
  console.log('1. Setting up Bubblewrap configuration...');
  const jdkPath = 'C:\\Users\\Dell\\.bubblewrap\\jdk\\jdk-17.0.11+9';
  const sdkPath = 'C:\\Users\\Dell\\.bubblewrap\\android_sdk';

  const jdkHelper = new JdkHelper(process, new core.Config(jdkPath, sdkPath));
  const log = new core.ConsoleLog();

  const targetDir = path.resolve(__dirname, '..', 'android_twa');
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  console.log('2. Preparing TwaManifest from public/manifest.json...');
  const rawManifest = JSON.parse(fs.readFileSync(path.resolve(__dirname, '..', 'public', 'manifest.json'), 'utf8'));

  // Use URL with localhost for local testing
  const manifestUrl = new URL('http://127.0.0.1:3000/manifest.json');
  const twaManifest = TwaManifest.fromWebManifestJson(manifestUrl, rawManifest);

  twaManifest.packageId = 'com.nutritrack.ai';
  twaManifest.name = 'NutriTrack AI';
  twaManifest.launcherName = 'NutriTrack';
  twaManifest.startUrl = '/';
  twaManifest.iconUrl = 'http://127.0.0.1:3000/icon-512.png';
  twaManifest.maskableIconUrl = 'http://127.0.0.1:3000/icon-512.png';
  twaManifest.appVersionName = '1.0.0';
  twaManifest.appVersionCode = 1;
  twaManifest.signingKey = {
    path: path.join(targetDir, 'android.keystore'),
    alias: 'nutritrack',
  };

  console.log('3. Validating TwaManifest...');
  const validationError = twaManifest.validate();
  if (validationError) {
    throw new Error('TwaManifest validation error: ' + validationError);
  }

  // Save twa-manifest.json
  await twaManifest.saveToFile(path.join(targetDir, 'twa-manifest.json'));
  console.log('Saved twa-manifest.json successfully.');

  console.log('4. Generating Android TWA project files...');
  const generator = new TwaGenerator();
  await generator.createTwaProject(targetDir, twaManifest, log);
  console.log('Created Android TWA project at:', targetDir);

  // Check if keystore exists, if not generate debug keystore
  const keytoolPath = path.join(jdkPath, 'bin', 'keytool.exe');
  const keystorePath = path.join(targetDir, 'android.keystore');
  if (!fs.existsSync(keystorePath)) {
    console.log('5. Generating signing key with keytool...');
    const { execSync } = require('child_process');
    const cmd = `"${keytoolPath}" -genkeypair -dname "cn=NutriTrack, ou=Health, o=NutriTrack, c=US" -alias nutritrack -keypass android -keystore "${keystorePath}" -storepass android -validity 10000 -keyalg RSA -keysize 2048`;
    execSync(cmd, { stdio: 'inherit' });
    console.log('Generated keystore at:', keystorePath);
  }

  console.log('Done! Ready to assemble APK.');
}

run().catch(err => {
  console.error('[Error] Generation failed:', err);
  process.exit(1);
});
