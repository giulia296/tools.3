// Class for a cell
class Cell {
  constructor(value) {
    // Is it collapsed?
    this.collapsed = false;

    // Initial options via constructor
    if (value instanceof Array) {
      this.options = value;
    } else {
      // or all options to start
      this.options = [];
      for (let i = 0; i < value; i++) {
        this.options[i] = i;
      }
    }
  }
}
