import { readFileSync, writeFileSync, readdirSync, statSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = join(__dirname, '../dist');

function convertToCJS(content) {
  // Convert export statements
  content = content.replace(/export \{([^}]+)\} from ['"]([^'"]+)['"]/g, (_, exports, path) => {
    const cleanPath = path.replace('.js', '');
    return `const { ${exports} } = require('${cleanPath}');\nmodule.exports = { ...module.exports, ${exports} };`;
  });

  content = content.replace(/export \* from ['"]([^'"]+)['"]/g, (_, path) => {
    const cleanPath = path.replace('.js', '');
    return `Object.assign(module.exports, require('${cleanPath}'));`;
  });

  content = content.replace(/export const (\w+)/g, 'const $1 = exports.$1');
  content = content.replace(/export (\{[^}]+\})/g, 'module.exports = $1');

  return content;
}

function processDirectory(dir, outDir) {
  if (!existsSync(outDir)) {
    mkdirSync(outDir, { recursive: true });
  }

  const files = readdirSync(dir);

  for (const file of files) {
    const filePath = join(dir, file);
    const outPath = join(outDir, file.replace('.js', '.cjs'));
    const stat = statSync(filePath);

    if (stat.isDirectory()) {
      processDirectory(filePath, join(outDir, file));
    } else if (file.endsWith('.js')) {
      const content = readFileSync(filePath, 'utf-8');
      const cjsContent = convertToCJS(content);
      writeFileSync(outPath, cjsContent);
      console.log(`Converted: ${file} -> ${file.replace('.js', '.cjs')}`);
    }
  }
}

// Simple approach: just create a CJS wrapper
const cjsWrapper = `
const types = require('./types/index.cjs');
const constants = require('./constants/index.cjs');

module.exports = {
  ...types,
  ...constants
};
`;

// Create CJS versions of each file
const typesIndex = `
const player = require('./player.cjs');
const room = require('./room.cjs');
const game = require('./game.cjs');
const events = require('./events.cjs');

module.exports = {
  ...player,
  ...room,
  ...game,
  ...events
};
`;

const constantsIndex = `
const game = require('./game.cjs');
const piano = require('./piano.cjs');

module.exports = {
  ...game,
  ...piano
};
`;

// Helper to convert simple ESM exports to CJS
function convertFile(inputPath, outputPath) {
  let content = readFileSync(inputPath, 'utf-8');

  // Remove .js extensions from imports
  content = content.replace(/from ['"]\.\/([^'"]+)\.js['"]/g, "from './$1'");

  // Convert imports
  content = content.replace(/import \{([^}]+)\} from ['"]\.\/([^'"]+)['"]/g,
    (_, imports, path) => `const {${imports}} = require('./${path}.cjs')`);
  content = content.replace(/import type \{[^}]+\} from ['"][^'"]+['"]/g, '');

  // Convert exports
  content = content.replace(/export const (\w+) = /g, 'exports.$1 = ');
  content = content.replace(/export \{([^}]+)\}/g, (_, exp) => {
    const exports = exp.split(',').map(e => e.trim());
    return exports.map(e => `exports.${e} = ${e}`).join(';\n');
  });

  writeFileSync(outputPath, content);
}

// Create directories
mkdirSync(join(distDir, 'types'), { recursive: true });
mkdirSync(join(distDir, 'constants'), { recursive: true });

// Convert type files
['player', 'room', 'game', 'events'].forEach(file => {
  convertFile(
    join(distDir, 'types', `${file}.js`),
    join(distDir, 'types', `${file}.cjs`)
  );
});

// Convert constant files
['game', 'piano'].forEach(file => {
  convertFile(
    join(distDir, 'constants', `${file}.js`),
    join(distDir, 'constants', `${file}.cjs`)
  );
});

// Write index files
writeFileSync(join(distDir, 'index.cjs'), cjsWrapper);
writeFileSync(join(distDir, 'types', 'index.cjs'), typesIndex);
writeFileSync(join(distDir, 'constants', 'index.cjs'), constantsIndex);

console.log('CJS build complete!');
