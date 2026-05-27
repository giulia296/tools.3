// Source image
let sourceImage;
// Tiles extracted from the source image
let tiles;
// Number of cells along one dimension of the grid
let DIM = 40;
// Maximum depth for recursive checking of cells
let maxDepth = 5;
// Grid of cells for the Wave Function Collapse algorithm
let grid = [];

// Variabili globali aggiunte per gestire il centramento dinamico
let cellW;
let offsetX;
let offsetY;

// --- VARIABILI DI STATO ---
let generazioneAttiva = false; // Controlla lo stato di attivazione del WFC

// --- VARIABILI PER L'EDITOR SULLA DESTRA ---
let editCanvasSize = 225; // Dimensione visiva del quadrato di disegno
let editX, editY;         // Posizione del quadrato di disegno
let editPixels = [];      // Array bidimensionale per i pixel (15x15)
let editDIM = 15;         // Risoluzione dell'immagine sorgente (15x15)
let generateButton;       // Pulsante per inviare il disegno
let clearButton;          // Pulsante per cancellare il disegno

// --- VARIABILI PER LA PALETTE COLORI AGGIORNATA ---
let coloriPalette = ['#000000', '#ffffff', '#F98513', '#223382', '#9BACD8']; // Nero, Bianco, Arancione, Blu scuro, Carta da zucchero
let bottoniColori = [];
let coloreSelezionato = '#F98513'; // Colore iniziale di disegno impostato sull'arancione per visibilità

// Variabili per tracciare la dimensione originale del doodle
let originalWidth = 200;
let originalHeight = 200;

function preload() {
  sourceImage = loadImage("images/doodle.png", img => {
    // Memorizza le dimensioni reali del file doodle.png per replicarle fedelmente
    originalWidth = img.width;
    originalHeight = img.height;
  });
}

function setup() {
  // Canvas a tutto schermo (prende le dimensioni 100vw per 600px dell'iframe)
  createCanvas(windowWidth, windowHeight);

  // Inizializza o resetta l'array dei pixel
  resettaPixelEditor();

  // --- CREAZIONE PALETTE COLORI (IN ALTO) ---
  for (let i = 0; i < coloriPalette.length; i++) {
    let col = coloriPalette[i];
    let btn = createButton('');
    btn.style('width', '28px');
    btn.style('height', '28px');
    btn.style('border-radius', '50%');
    btn.style('background-color', col);
    btn.style('cursor', 'pointer');
    
    // Gestione del bordo per mostrare quale colore è attivo
    if (col === coloreSelezionato) {
      btn.style('border', '2px solid #ffffff');
      btn.style('outline', '2px solid #7d7d7d');
    } else {
      btn.style('border', '1px solid #cccccc');
      btn.style('outline', 'none');
    }

    // Al click cambia il colore attivo e aggiorna i bordi visivi
    btn.mousePressed(() => {
      coloreSelezionato = col;
      aggiornaBordiPalette();
    });
    
    bottoniColori.push(btn);
  }

  // Pulsante Genera (Play) Grigio
  generateButton = createButton('&#9654;'); 
  formattaPulsanteIcona(generateButton, '#7d7d7d');
  generateButton.mousePressed(avviaNuovaGenerazione);

  // Pulsante Cancella (Gomma stilizzata) Grigio
  clearButton = createButton('&#9003;'); 
  formattaPulsanteIcona(clearButton, '#7d7d7d');
  clearButton.mousePressed(svuotaDisegno);

  // Calcola le dimensioni e posiziona gli elementi
  aggiornaDimensioni();

  // Extract tiles and calculate their adjacencies
  tiles = extractTiles(sourceImage);
  for (let tile of tiles) {
    tile.calculateNeighbors(tiles);
  }

  // Avvia la creazione della griglia per la prima volta
  initGrid();
}

// Funzione di supporto per aggiornare i bordi della palette quando si cambia colore
function aggiornaBordiPalette() {
  for (let i = 0; i < bottoniColori.length; i++) {
    let col = coloriPalette[i];
    let btn = bottoniColori[i];
    if (col === coloreSelezionato) {
      btn.style('border', '2px solid #ffffff');
      btn.style('outline', '2px solid #7d7d7d');
    } else {
      btn.style('border', '1px solid #cccccc');
      btn.style('outline', 'none');
    }
  }
}

// Funzione di supporto per applicare uno stile da icona circolare ai pulsanti di controllo
function formattaPulsanteIcona(bottone, coloreSfondo) {
  bottone.style('width', '45px');
  bottone.style('height', '45px');
  bottone.style('border', 'none');
  bottone.style('border-radius', '50%');
  bottone.style('background-color', coloreSfondo);
  bottone.style('color', 'white');
  bottone.style('font-size', '18px');
  bottone.style('cursor', 'pointer');
  bottone.style('display', 'flex');
  bottone.style('align-items', 'center');
  bottone.style('justify-content', 'center');
  bottone.style('box-shadow', '0px 4px 6px rgba(0,0,0,0.1)');
  
  bottone.mouseOver(() => bottone.style('background-color', '#5a5a5a'));
  bottone.mouseOut(() => bottone.style('background-color', coloreSfondo));
}

// Funzione di supporto per pulire la matrice dei pixel portandola a bianco
function resettaPixelEditor() {
  for (let i = 0; i < editDIM; i++) {
    editPixels[i] = [];
    for (let j = 0; j < editDIM; j++) {
      editPixels[i][j] = color(255); // Sfondo dell'editor impostato su bianco lucido
    }
  }
}

function svuotaDisegno() {
  generazioneAttiva = false; // Disattiva la generazione al reset
  resettaPixelEditor();
  loop(); 
  initGrid();
}

// Funzione per calcolare dinamicamente dimensioni, offset e centrare tutti i controlli HTML
function aggiornaDimensioni() {
  // MODIFICATO: Portata la dimensione della griglia da 400 a 500 pixel
  let dimensioneGriglia = 500; 
  
  cellW = dimensioneGriglia / DIM;
  
  // Calcolo dell'offset per centrare la griglia rispetto allo schermo intero (100vw dell'iframe)
  offsetX = (windowWidth - dimensioneGriglia) / 2;
  offsetY = (windowHeight - dimensioneGriglia) / 2;

  // Spostamento dell'editor a destra staccato esattamente di 40px dalla fine del disegno centrale
  editX = offsetX + dimensioneGriglia + 40; 
  editY = (windowHeight - editCanvasSize) / 2;

  let centroEditor = editX + (editCanvasSize / 2);

  // Posizionamento palette colori (esattamente a 20px sopra la sezione di disegno)
  if (bottoniColori.length > 0) {
    let larghezzaBottoneColore = 28;
    let spazioColori = 12;
    let larghezzaTotalePalette = (larghezzaBottoneColore * bottoniColori.length) + (spazioColori * (bottoniColori.length - 1));
    let xInizioPalette = centroEditor - (larghezzaTotalePalette / 2);
    
    for (let i = 0; i < bottoniColori.length; i++) {
      bottoniColori[i].position(xInizioPalette + i * (larghezzaBottoneColore + spazioColori), editY - 48); 
    }
  }

  // Posiziona le icone sotto (Play e Cancella esattamente a 20px sotto la sezione di disegno)
  if (generateButton && clearButton) {
    let spazioTraPulsanti = 20; 
    let larghezzaPulsante = 45;
    let xInizioControlli = centroEditor - larghezzaPulsante - (spazioTraPulsanti / 2);

    generateButton.position(xInizioControlli, editY + editCanvasSize + 20);
    clearButton.position(xInizioControlli + larghezzaPulsante + spazioTraPulsanti, editY + editCanvasSize + 20);
  }
}

// Ridimensiona il canvas se l'utente cambia la dimensione della finestra del browser
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  aggiornaDimensioni();
}

// Funzione per inizializzare o resettare la griglia
function initGrid() {
  grid = []; 
  let count = 0;
  
  for (let j = 0; j < DIM; j++) {
    for (let i = 0; i < DIM; i++) {
      grid.push(new Cell(tiles, i * cellW, j * cellW, cellW, count));
      count++;
    }
  }

  // Chiama wfc() all'inizializzazione SOLO se la generazione è già in corso
  if (generazioneAttiva) {
    wfc();
  }
}

// Gestione del disegno al clic del mouse
function mousePressed() {
  if (mouseX >= editX && mouseX <= editX + editCanvasSize && mouseY >= editY && mouseY <= editY + editCanvasSize) {
    gestisciDisegno();
  }
}

// Permette di disegnare tenendo premuto e trascinando il mouse
function mouseDragged() {
  if (mouseX >= editX && mouseX <= editX + editCanvasSize && mouseY >= editY && mouseY <= editY + editCanvasSize) {
    gestisciDisegno();
  }
}

function gestisciDisegno() {
  let pixelW = editCanvasSize / editDIM;
  let i = floor((mouseX - editX) / pixelW);
  let j = floor((mouseY - editY) / pixelW);
  
  if (i >= 0 && i < editDIM && j >= 0 && j < editDIM) {
    editPixels[i][j] = color(coloreSelezionato); 
  }
}

// Intercetta la pressione del tasto sulla tastiera
function keyPressed() {
  if (keyCode === ENTER) {
    avviaNuovaGenerazione();
  }
}

function avviaNuovaGenerazione() {
  generazioneAttiva = true; // Attiva l'algoritmo al comando di invio

  let piccolaImg = createImage(editDIM, editDIM);
  piccolaImg.loadPixels();
  for (let x = 0; x < editDIM; x++) {
    for (let y = 0; y < editDIM; y++) {
      let c = editPixels[x][y];
      piccolaImg.set(x, y, c);
    }
  }
  piccolaImg.updatePixels();
  
  let grandeImg = createImage(originalWidth, originalHeight);
  grandeImg.copy(piccolaImg, 0, 0, editDIM, editDIM, 0, 0, originalWidth, originalHeight);
  
  sourceImage = grandeImg;
  tiles = extractTiles(sourceImage);
  
  if (tiles && tiles.length > 0) {
    for (let tile of tiles) {
      tile.calculateNeighbors(tiles);
    }
    loop(); 
    initGrid();
  } else {
    console.error("Nessun tassello trovato. Prova a disegnare un pattern più definito.");
    generazioneAttiva = false;
  }
}

function draw() {
  // Pulisce lo schermo lasciandolo trasparente
  clear(); 
  
  // --- DISEGNO DELLA GRIGLIA GENERATA (CENTRO) ---
  push();
  translate(offsetX, offsetY);
  for (let i = 0; i < grid.length; i++) {
    if (!generazioneAttiva) {
      // Sfondo iniziale grigio prima dell'invio
      fill(220); 
      stroke(200);
      strokeWeight(1);
      rect(grid[i].x, grid[i].y, grid[i].w, grid[i].w);
    } else {
      // Rendering standard dei tasselli una volta partiti
      noStroke(); 
      grid[i].show();
    }
    grid[i].checked = false;
  }
  pop();

  // --- DISEGNO DELL'EDITOR INTERATTIVO (DESTRA) ---
  push();
  stroke(180); 
  strokeWeight(1);
  let pixelW = editCanvasSize / editDIM;
  
  for (let i = 0; i < editDIM; i++) {
    for (let j = 0; j < editDIM; j++) {
      fill(editPixels[i][j]);
      rect(editX + i * pixelW, editY + j * pixelW, pixelW, pixelW);
    }
  }
  pop();

  // Calcola il passo WFC successivo solo se l'utente ha avviato la generazione
  if (generazioneAttiva) {
    wfc();
  }
}

function wfc() {
  let gridCopy = grid.slice();
  gridCopy = gridCopy.filter((a) => !a.collapsed);

  if (gridCopy.length == 0) {
    noLoop();
    return;
  }

  gridCopy.sort((a, b) => {
    return a.options.length - b.options.length;
  });

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
    if (checked) {
      reduceEntropy(grid, rightCell, depth + 1);
    }
  }

  if (i - 1 >= 0) {
    let leftCell = grid[i - 1 + j * DIM];
    let checked = checkOptions(cell, leftCell, TLEFT);
    if (checked) {
      reduceEntropy(grid, leftCell, depth + 1);
    }
  }

  if (j + 1 < DIM) {
    let downCell = grid[i + (j + 1) * DIM];
    let checked = checkOptions(cell, downCell, TDOWN);
    if (checked) {
      reduceEntropy(grid, downCell, depth + 1);
    }
  }

  if (j - 1 >= 0) {
    let upCell = grid[i + (j - 1) * DIM];
    let checked = checkOptions(cell, upCell, TUP);
    if (checked) {
      reduceEntropy(grid, upCell, depth + 1);
    }
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