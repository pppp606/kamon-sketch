#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, 'dist');

function fixImports(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // Fix relative imports to include .js extension
  const fixedContent = content.replace(
    /from ['"](\.[^'"]*?)['"];/g, 
    (match, importPath) => {
      if (!importPath.endsWith('.js') && !importPath.includes('/')) {
        return `from '${importPath}.js';`;
      }
      return match;
    }
  ).replace(
    /import ['"](\.[^'"]*?)['"];/g,
    (match, importPath) => {
      if (!importPath.endsWith('.js') && !importPath.includes('/')) {
        return `import '${importPath}.js';`;
      }
      return match;
    }
  );
  
  if (content !== fixedContent) {
    fs.writeFileSync(filePath, fixedContent, 'utf-8');
    console.log(`Fixed imports in: ${path.relative(__dirname, filePath)}`);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      walkDir(filePath);
    } else if (file.endsWith('.js')) {
      fixImports(filePath);
    }
  }
}

if (fs.existsSync(distDir)) {
  walkDir(distDir);
  console.log('Import fixing complete');
}