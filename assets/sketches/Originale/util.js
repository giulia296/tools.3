// Render an image with "block" pixels
function renderImage(img, x, y, w) {
  for (let i = 0; i < img.width; i++) {
    for (let j = 0; j < img.height; j++) {
      let index = (i + j * img.width) * 4;
      let r = img.pixels[index + 0];
      let g = img.pixels[index + 1];
      let b = img.pixels[index + 2];
      fill(r, g, b);
      stroke(50);
      square(x + i * w, y + j * w, w);
    }
  }

  noFill();
  strokeWeight(1);
  stroke(0, 255, 255);
  square(x, y, img.width * w);
}

// Render only the center pixel of an image
function renderCell(img, x, y, w) {
  let i = floor(img.width / 2);
  let j = floor(img.width / 2);
  let index = (i + j * img.width) * 4;
  let r = img.pixels[index + 0];
  let g = img.pixels[index + 1];
  let b = img.pixels[index + 2];
  fill(r, g, b);
  // stroke(0);
  noStroke();
  square(x, y, w);
}

// Extract tiles from the source image
function extractTiles(img) {
  let tiles = [];
  img.loadPixels();
  for (let j = 0; j < img.height; j++) {
    for (let i = 0; i < img.width; i++) {
      // Create a new image for each tile
      let tileImage = createImage(3, 3);
      // Copy segment of source image
      copyTile(img, i, j, 3, tileImage);
      // Add to the array
      tiles.push(new Tile(tileImage, tiles.length));
    }
  }
  return tiles;
}

// Copy a tile from a source image to a new image
function copyTile(source, sx, sy, w, dest) {
  // Load the pixels of the destination image
  dest.loadPixels();

  for (let i = 0; i < w; i++) {
    for (let j = 0; j < w; j++) {
      // Find the pixel index (wrapping edges with modulo)
      let pi = (sx + i) % source.width;
      let pj = (sy + j) % source.height;
      let index = (pi + pj * source.width) * 4;

      // RGB values from source
      let r = source.pixels[index + 0];
      let g = source.pixels[index + 1];
      let b = source.pixels[index + 2];
      let a = source.pixels[index + 3];

      // Find the destination pixel index
      let index2 = (i + j * w) * 4;

      // Set the RGB values in destination
      dest.pixels[index2 + 0] = r;
      dest.pixels[index2 + 1] = g;
      dest.pixels[index2 + 2] = b;
      dest.pixels[index2 + 3] = a;
    }
  }

  dest.updatePixels();
}
