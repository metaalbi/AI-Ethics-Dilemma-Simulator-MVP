const sharp = require('sharp');

sharp('public/iaca-logo.png')
  .metadata()
  .then(metadata => console.log(metadata))
  .catch(err => console.error('Error:', err));