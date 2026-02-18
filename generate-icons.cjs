const fs = require('fs');
const { createCanvas } = require('canvas');

function createIcon(size, filename) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  ctx.fillStyle = '#e44145';
  ctx.fillRect(0, 0, size, size);
  
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${size * 0.6}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('M', size / 2, size / 2);
  
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(`public/${filename}`, buffer);
  console.log(`Created ${filename}`);
}

createIcon(192, 'icon-192.png');
createIcon(512, 'icon-512.png');
