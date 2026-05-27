// Confronta due bordi in modo diretto: ora controlla se le stringhe sono identiche
function compareEdge(a, b) {
  return a == b;
}

// Classe Tile
class Tile {
  constructor(img, edges) {
    // Immagine della tessera
    this.img = img;
    
    // Array dei bordi nell'ordine: [NORD, EST, SUD, OVEST]
    this.edges = edges;
    
    // Array che conterranno gli indici dei vicini validi
    this.up = [];
    this.right = [];
    this.down = [];
    this.left = [];
  }
  
  // Analizza tutte le tessere per trovare le adiacenze valide
  analyze(tiles) {
    for (let i = 0; i < tiles.length; i++) {
      let tile = tiles[i];
      
      // UP: Il mio NORD (edges[0]) deve essere identico al SUD del vicino (edges[2])
      if (compareEdge(tile.edges[2], this.edges[0])) {
        this.up.push(i);
      }
      
      // RIGHT: Il mio EST (edges[1]) deve essere identico al OVEST del vicino (edges[3])
      if (compareEdge(tile.edges[3], this.edges[1])) {
        this.right.push(i);
      }
      
      // DOWN: Il mio SUD (edges[2]) deve essere identico al NORD del vicino (edges[0])
      if (compareEdge(tile.edges[0], this.edges[2])) {
        this.down.push(i);
      }
      
      // LEFT: Il mio OVEST (edges[3]) deve essere identico al EST del vicino (edges[1])
      if (compareEdge(tile.edges[1], this.edges[3])) {
        this.left.push(i);
      }
    }
  }
}