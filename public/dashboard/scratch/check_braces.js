const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'script.js');
const code = fs.readFileSync(filePath, 'utf8');

let lineNum = 1;
let colNum = 1;
const stack = [];

// Very simple parser to skip comments and string literals
let inString = null; // '"', "'", '`'
let inComment = false; // '//' or '/*'
let inRegex = false;

for (let i = 0; i < code.length; i++) {
  const char = code[i];
  const nextChar = code[i + 1] || '';

  if (char === '\n') {
    lineNum++;
    colNum = 1;
    if (inComment === '//') {
      inComment = false;
    }
    continue;
  } else {
    colNum++;
  }

  // Handle comments
  if (inComment) {
    if (inComment === '/*' && char === '*' && nextChar === '/') {
      inComment = false;
      i++; // skip /
    }
    continue;
  }

  // Handle strings
  if (inString) {
    if (char === '\\') {
      i++; // skip next char
      continue;
    }
    if (char === inString) {
      inString = null;
    }
    continue;
  }

  // Check for start of comment or string
  if (char === '/' && nextChar === '/') {
    inComment = '//';
    i++;
    continue;
  }
  if (char === '/' && nextChar === '*') {
    inComment = '/*';
    i++;
    continue;
  }
  if (char === '"' || char === "'" || char === '`') {
    inString = char;
    continue;
  }

  // Bracket tracking
  if (char === '{' || char === '(' || char === '[') {
    stack.push({ char, line: lineNum, col: colNum });
  } else if (char === '}' || char === ')' || char === ']') {
    const last = stack.pop();
    if (!last) {
      console.log(`Unmatched closing ${char} at line ${lineNum}, col ${colNum}`);
      continue;
    }
    const matching = { '}': '{', ')': '(', ']': '[' };
    if (last.char !== matching[char]) {
      console.log(`Mismatched braces: opened ${last.char} at line ${last.line}, col ${last.col} but closed ${char} at line ${lineNum}, col ${colNum}`);
    }
  }
}

if (stack.length > 0) {
  console.log('Unclosed braces left on stack:');
  stack.forEach(item => {
    console.log(`  Opened '${item.char}' at line ${item.line}, col ${item.col}`);
  });
} else {
  console.log('No mismatched braces found by this simple parser.');
}
