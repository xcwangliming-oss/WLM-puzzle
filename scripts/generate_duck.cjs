const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128">
  <defs>
    <radialGradient id="bodyGrad" cx="45%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#fff59d"/>
      <stop offset="45%" stop-color="#fdd835"/>
      <stop offset="90%" stop-color="#f57f17"/>
    </radialGradient>
    <radialGradient id="headGrad" cx="40%" cy="35%" r="55%">
      <stop offset="0%" stop-color="#fff9c4"/>
      <stop offset="50%" stop-color="#fbc02d"/>
      <stop offset="100%" stop-color="#f57f17"/>
    </radialGradient>
    <linearGradient id="beakGrad" x1="0%" y1="0%" x2="100%" y2="80%">
      <stop offset="0%" stop-color="#ff9800"/>
      <stop offset="100%" stop-color="#e65100"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#000000" flood-opacity="0.35"/>
    </filter>
  </defs>
  <g filter="url(#shadow)">
    <!-- Tail feathers -->
    <path d="M22 72 Q12 60 16 50 Q26 62 33 68 Z" fill="#fbc02d"/>
    <!-- Body -->
    <path d="M28 72 C22 92 52 106 82 100 C106 95 112 78 106 66 C100 55 78 60 64 63 C48 65 33 60 28 72 Z" fill="url(#bodyGrad)" stroke="#d97706" stroke-width="2.5" stroke-linejoin="round"/>
    <!-- Wing -->
    <path d="M42 74 C36 84 52 95 68 89 C75 86 78 78 72 73 C65 68 48 68 42 74 Z" fill="#fbc02d" stroke="#d97706" stroke-width="2"/>
    <!-- Head -->
    <circle cx="84" cy="44" r="26" fill="url(#headGrad)" stroke="#d97706" stroke-width="2.5"/>
    <!-- Cheek blush -->
    <ellipse cx="76" cy="54" rx="6" ry="4" fill="#ff8a80" opacity="0.6"/>
    <!-- Beak -->
    <path d="M104 43 C118 44 124 49 116 54 C108 58 102 53 102 47 Z" fill="url(#beakGrad)" stroke="#b45309" stroke-width="2" stroke-linejoin="round"/>
    <path d="M104 48 C110 49 114 51 110 53" stroke="#b45309" stroke-width="1.2" fill="none"/>
    <!-- Eye -->
    <ellipse cx="88" cy="38" rx="5.5" ry="7" fill="#1c1917"/>
    <circle cx="90" cy="35.5" r="2.5" fill="#ffffff"/>
    <circle cx="86" cy="40.5" r="1.2" fill="#ffffff"/>
    <!-- Head fluff/tuft -->
    <path d="M80 18 Q84 10 88 16 Q84 14 80 18 Z" fill="#fdd835" stroke="#d97706" stroke-width="1.5"/>
  </g>
</svg>`;

const target = path.join(__dirname, '..', 'assets', 'concentric', 'concentric_duck.png');
sharp(Buffer.from(svg))
  .resize(128, 128)
  .png()
  .toFile(target)
  .then(() => {
    console.log('Generated:', target);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
