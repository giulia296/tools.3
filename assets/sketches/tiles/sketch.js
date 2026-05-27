// Array per i tile e le immagini
const tiles = [];
const tileImages = [];

// Stato corrente della griglia
let grid = [];

// Griglia 4x4
const DIM = 4;

// Carica le immagini
function preload() {
  const path = "circuit";
  for (let i = 0; i < 5; i++) {
    tileImages[i] = loadImage(`${path}/${i}.png`);
  }
}

function setup() {
  // === INGRANDITO: Portato da 400x400 a 800x800 ===
  createCanvas(500, 500);

  // =========================================================================
  // MAPPATURA LETTERALE DELLE TUE TESSERE [NORD, EST, SUD, OVEST]
  // =========================================================================
  tiles[0] = new Tile(tileImages[0], ["BIA", "BIA", "BIA", "BIA"]); 
  tiles[1] = new Tile(tileImages[1], ["ARA", "ARA", "BIA", "ARA"]); 
  tiles[2] = new Tile(tileImages[2], ["ARA", "ARA", "ARA", "BIA"]); 
  tiles[3] = new Tile(tileImages[3], ["BIA", "ARA", "ARA", "ARA"]); 
  tiles[4] = new Tile(tileImages[4], ["ARA", "BIA", "ARA", "ARA"]); 

  for (let i = 0; i < tiles.length; i++) {
    const tile = tiles[i];
    tile.analyze(tiles);
  }

  startOver();
}

function startOver() {
  for (let i = 0; i < DIM * DIM; i++) {
    grid[i] = new Cell(tiles.length);
  }
}

function checkValid(arr, valid) {
  for (let i = arr.length - 1; i >= 0; i--) {
    let element = arr[i];
    if (!valid.includes(element)) {
      arr.splice(i, 1);
    }
  }
}

function draw() {
  // MODIFICATO: Sfondo cambiato dal nero (0) a blu scuro (13, 13, 51)
  background(13, 13, 51);
  noStroke(); 

  const w = width / DIM;
  const h = height / DIM;
  const overdraw = 1;

  for (let j = 0; j < DIM; j++) {
    for (let i = 0; i < DIM; i++) {
      let cell = grid[i + j * DIM];
      if (cell.collapsed) {
        let index = cell.options[0];
        image(tiles[index].img, i * w, j * h, w + overdraw, h + overdraw);
      } else {
        // MODIFICATO: Anche i rettangoli delle celle non ancora caricate usano il nuovo colore di sfondo
        fill(13, 13, 51);
        rect(i * w, j * h, w, h);
      }
    }
  }

  let gridCopy = grid.slice().filter((a) => !a.collapsed);
  
  if (gridCopy.length === 0) {
    noLoop(); 
    return;
  }
  
  gridCopy.sort((a, b) => a.options.length - b.options.length);

  let len = gridCopy[0].options.length;
  let stopIndex = 0;
  for (let i = 1; i < gridCopy.length; i++) {
    if (gridCopy[i].options.length > len) {
      stopIndex = i;
      break;
    }
  }
  if (stopIndex > 0) gridCopy.splice(stopIndex);
  
  const cell = random(gridCopy);
  cell.collapsed = true;
  const pick = random(cell.options);
  
  if (pick === undefined) {
    startOver();
    // MODIFICATO: Colore corretto nel reset automatico in caso di errore
    background(13, 13, 51);
    loop();
    return;
  }
  cell.options = [pick];
  
  const nextGrid = [];
  for (let j = 0; j < DIM; j++) {
    for (let i = 0; i < DIM; i++) {
      let index = i + j * DIM;
      if (grid[index].collapsed) {
        nextGrid[index] = grid[index];
      } else {
        let options = new Array(tiles.length).fill(0).map((x, i) => i);
        
        if (j > 0) {
          let up = grid[i + (j - 1) * DIM];
          let validOptions = [];
          for (let option of up.options) {
            validOptions = validOptions.concat(tiles[option].down);
          }
          checkValid(options, validOptions);
        }
        if (i < DIM - 1) {
          let right = grid[i + 1 + j * DIM];
          let validOptions = [];
          for (let option of right.options) {
            validOptions = validOptions.concat(tiles[option].left);
          }
          checkValid(options, validOptions);
        }
        if (j < DIM - 1) {
          let down = grid[i + (j + 1) * DIM];
          let validOptions = [];
          for (let option of down.options) {
            validOptions = validOptions.concat(tiles[option].up);
          }
          checkValid(options, validOptions);
        }
        if (i > 0) {
          let left = grid[i - 1 + j * DIM];
          let validOptions = [];
          for (let option of left.options) {
            validOptions = validOptions.concat(tiles[option].right);
          }
          checkValid(options, validOptions);
        }

        nextGrid[index] = new Cell(options);
      }
    }
  }

  grid = nextGrid;
}

function mousePressed() {
  startOver();
  // MODIFICATO: Colore corretto quando clicchi con il mouse per rigenerare la griglia
  background(13, 13, 51);
  loop(); 
}