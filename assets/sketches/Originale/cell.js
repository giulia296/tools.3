// A Cell is a single element of the grid.
class Cell {
  constructor(tiles, x, y, w, index) {
    // xy and size of cell
    this.x = x;
    this.y = y;
    this.w = w;
    // Index in the grid array
    this.index = index;

    // The indices of tiles that can be placed in this cell
    this.options = [];

    // Has it been collapsed to a single tile?
    this.collapsed = false;
    // Has it already been checked during recursion?
    this.checked = false;

    // Initialize the options with all possible tile indices
    for (let i = 0; i < tiles.length; i++) {
      this.options.push(i);
    }
  }

  // Render the cell based on its state
  show() {
    // If no valid options remain
    if (this.options.length == 0) {
      fill(255, 0, 255);
      square(this.x, this.y, this.w);
    }
    // If the cell is collapsed
    else if (this.collapsed) {
      // Get the selected tile index and associated image
      let tileIndex = this.options[0];
      let img = tiles[tileIndex].img;
      // Draw that image
      renderCell(img, this.x, this.y, this.w);
    }

    // If the cell is not collapsed
    else {
      // Calculate and an average color of possible options
      let sumR = 0;
      let sumG = 0;
      let sumB = 0;

      // Iterate through all possible tile options
      for (let i = 0; i < this.options.length; i++) {
        let tileIndex = this.options[i];
        let img = tiles[tileIndex].img;
        // RGB value of each tile option
        sumR += img.pixels[16];
        sumG += img.pixels[17];
        sumB += img.pixels[18];
      }

      // Compute the average RGB values
      sumR /= this.options.length;
      sumG /= this.options.length;
      sumB /= this.options.length;

      // Fill the cell with the averaged color
      fill(sumR, sumG, sumB);
      square(this.x, this.y, this.w);
    }
  }
}
