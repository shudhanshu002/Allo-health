// print-env.js
console.log('--- ENV DEBUG START ---');
console.log('DATABASE_URL =>', process.env.DATABASE_URL ? 'SET' : 'UNSET');
console.log('DIRECT_URL   =>', process.env.DIRECT_URL ? 'SET' : 'UNSET');
console.log('--- ENV DEBUG END ---');
