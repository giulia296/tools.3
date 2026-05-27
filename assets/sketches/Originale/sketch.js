// Elenco delle immagini sorgente
let sourceImage;
let imgAcqua, imgDoodle, imgEdera, imgNuvole;

// Tiles extracted from the current source image
let tiles;
// Number of cells along one dimension of the grid
let DIM = 40;
// Maximum depth for recursive checking of cells
let maxDepth = 5;
// Grid of cells for the Wave Function Collapse algorithm
let grid = [];

function preload() {
  // Carica le immagini sorgente
  imgAcqua = loadImage("images/acqua.png");
  imgDoodle = loadImage("images/doodle.png");
  imgEdera = loadImage("images/edera.png");
  imgNuvole = loadImage("images/nuvole.png");
}

function setup() {
  // FORZATURA BIANCO ASSOLUTO: Sovrascrive lo stile nativo dell'iframe via codice
  document.documentElement.style.backgroundColor = "rgb(255, 255, 255)";
  document.body.style.backgroundColor = "rgb(255, 255, 255)";
  document.body.style.margin = "0";
  document.body.style.padding = "0";
  document.body.style.overflow = "hidden";

  // Imposta l'immagine iniziale di default
  sourceImage = imgDoodle;

  // Crea la canvas principale (500x500), centrata nello schermo
  let canvasSize = 500;
  let canvas = createCanvas(canvasSize, canvasSize);
  canvas.style('position', 'absolute');
  canvas.style('top', '50%');
  canvas.style('left', '50%');
  canvas.style('transform', 'translate(-50%, -50%)');

  // --- MODIFICA: Contenitore verticale ancorato a sinistra del quadrato ---
  let container = createDiv('');
  container.style('position', 'absolute');
  container.style('top', '50%');
  
  // Calcolo: 50% (centro) - 300px (metà quadrato) - 35px (larghezza miniatura) - 30px (distanza richiesta)
  let offsetSinistro = `calc(50% - ${canvasSize / 2}px - 35px - 30px)`;
  container.style('left', offsetSinistro);
  
  container.style('transform', 'translateY(-50%)'); // Centrato verticalmente rispetto al quadrato
  container.style('display', 'flex');
  container.style('flex-direction', 'column'); // Allineamento in verticale
  container.style('gap', '10px'); // Spazio tra le miniature

  // Creazione delle miniature (35x35 px)
  creaMiniatura("images/acqua.png", imgAcqua, container);
  creaMiniatura("images/doodle.png", imgDoodle, container);
  creaMiniatura("images/edera.png", imgEdera, container);
  creaMiniatura("images/nuvole.png", imgNuvole, container);

  // Avvia la griglia per la prima volta
  cambiaSorgente(sourceImage);
}

// Funzione helper per generare i tag <img> HTML e assegnare il click
function creaMiniatura(url, imgOggetto, contenitore) {
  let thumb = createImg(url, 'miniatura');
  thumb.size(35, 35); 
  
  thumb.style('cursor', 'pointer');
  thumb.style('border', '1px solid #aaa');
  thumb.style('border-radius', '3px');
  thumb.style('transition', 'transform 0.1s ease');
  
  // Hover effect
  thumb.mouseOver(() => thumb.style('transform', 'scale(1.1)'));
  thumb.mouseOut(() => thumb.style('transform', 'scale(1.0)'));
  
  thumb.parent(contenitore);
  
  // Al click cambia la sorgente ed esegue il reset
  thumb.mousePressed(() => {
    cambiaSorgente(imgOggetto);
  });
}

// Cambia l'immagine sorgente attuale e rigenera l'algoritmo
function cambiaSorgente(nuovaImg) {
  sourceImage = nuovaImg;
  
  tiles = extractTiles(sourceImage);
  for (let tile of tiles) {
    tile.calculateNeighbors(tiles);
  }
  
  loop();
  initGrid();
}

// Funzione per inizializzare o resettare la griglia
function initGrid() {
  grid = []; 
  let w = width / DIM;
  let count = 0;
  
  for (let j = 0; j < DIM; j++) {
    for (let i = 0; i < DIM; i++) {
      grid.push(new Cell(tiles, i * w, j * w, w, count));
      count++;
    }
  }

  wfc();
}

// Reset se si clicca sulla canvas grande
function mousePressed(e) {
  if (mouseY > 0 && mouseY < height && mouseX > 0 && mouseX < width) {
    loop(); 
    initGrid();
  }
}

function draw() {
  // MODIFICATO: Sfondo portato da nero (0) a bianco pulito (255)
  background(255); 
  let w = width / DIM;

  for (let i = 0; i < grid.length; i++) {
    grid[i].show();
    grid[i].checked = false;
  }

  wfc();
}

// --- Algoritmo WFC identico ---
function wfc() {
  let gridCopy = grid.slice();
  gridCopy = gridCopy.filter((a) => !a.collapsed);

  if (gridCopy.length == 0) {
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
  const pick = random(cell.options);
  
  if (pick == undefined) {
    console.log("Conflitto su cella " + cell.index + ". Tento riparazione locale...");
    cell.collapsed = false;
    cell.options = Array.from({length: tiles.length}, (_, k) => k);

    let index = cell.index;
    let i = floor(index % DIM);
    let j = floor(index / DIM);
    
    let neighborsIndices = [];
    if (i + 1 < DIM) neighborsIndices.push((i + 1) + j * DIM);
    if (i - 1 >= 0)  neighborsIndices.push((i - 1) + j * DIM);
    if (j + 1 < DIM) neighborsIndices.push(i + (j + 1) * DIM);
    if (j - 1 >= 0)  neighborsIndices.push(i + (j - 1) * DIM);

    for (let nIdx of neighborsIndices) {
      let neighbor = grid[nIdx];
      neighbor.collapsed = false;
      neighbor.options = Array.from({length: tiles.length}, (_, k) => k);
    }
    return;
  }
  
  cell.collapsed = true;
  cell.options = [pick];

  reduceEntropy(grid, cell, 0);
}

function reduceEntropy(grid, cell, depth) {
  if (depth > maxDepth) return;
  if (cell.checked) return;
  cell.checked = true;

  let index = cell.index;
  let i = floor(index % DIM);
  let j = floor(index / DIM);

  if (i + 1 < DIM) {
    let rightCell = grid[i + 1 + j * DIM];
    let checked = checkOptions(cell, rightCell, TRIGHT);
    if (checked) reduceEntropy(grid, rightCell, depth + 1);
  }
  if (i - 1 >= 0) {
    let leftCell = grid[i - 1 + j * DIM];
    let checked = checkOptions(cell, leftCell, TLEFT);
    if (checked) reduceEntropy(grid, leftCell, depth + 1);
  }
  if (j + 1 < DIM) {
    let downCell = grid[i + (j + 1) * DIM];
    let checked = checkOptions(cell, downCell, TDOWN);
    if (checked) reduceEntropy(grid, downCell, depth + 1);
  }
  if (j - 1 >= 0) {
    let upCell = grid[i + (j - 1) * DIM];
    let checked = checkOptions(cell, upCell, TUP);
    if (checked) reduceEntropy(grid, upCell, depth + 1);
  }
}

function checkOptions(cell, neighbor, direction) {
  if (neighbor && !neighbor.collapsed) {
    let validOptions = [];
    for (let option of cell.options) {
      validOptions = validOptions.concat(tiles[option].neighbors[direction]);
    }
    neighbor.options = neighbor.options.filter((elt) =>
      validOptions.includes(elt)
    );
    return true;
  } else {
    return false;
  }
}