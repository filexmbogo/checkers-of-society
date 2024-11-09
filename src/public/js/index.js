const socket = io();

const boardSize = 8;
let board = [];
let currentPlayer = "red"; // Starting player
let myPlayerColor = "red";  // This will be set dynamically based on the player
let selectedPiece = null;  // Store selected piece

// Initialize the board with pieces
function initializeBoard() {
  board = []; // Reset the board
  for (let row = 0; row < boardSize; row++) {
    board[row] = [];
    for (let col = 0; col < boardSize; col++) {
      if ((row + col) % 2 === 1) { // Dark squares
        if (row < 3) {
          board[row][col] = { color: "black", isKing: false };
        } else if (row > 4) {
          board[row][col] = { color: "red", isKing: false };
        } else {
          board[row][col] = null;
        }
      } else {
        board[row][col] = null;
      }
    }
  }
  renderBoard();
}

// Render the checkers board
function renderBoard() {
  const boardDiv = document.getElementById("board");
  boardDiv.innerHTML = ""; // Clear the board before rendering

  for (let row = 0; row < boardSize; row++) {
    for (let col = 0; col < boardSize; col++) {
      const square = document.createElement("div");
      square.classList.add("square", (row + col) % 2 === 1 ? "dark" : "light");
      square.dataset.row = row;
      square.dataset.col = col;

      // Add piece if there's one on the square
      const piece = board[row][col];
      if (piece) {
        const pieceDiv = document.createElement("div");
        pieceDiv.classList.add("piece", piece.color);
        if (piece.isKing) pieceDiv.classList.add("king");
        square.appendChild(pieceDiv);
      }

      // Attach the click event listener for each square
      square.addEventListener("click", () => handleSquareClick(row, col));
      boardDiv.appendChild(square);
    }
  }
}

// Handle click on a square
function handleSquareClick(row, col) {
  // If it's not the player's turn, do nothing
  if (currentPlayer !== myPlayerColor) return;

  const piece = board[row][col];

  if (selectedPiece) {
    // Make a move if a piece is selected
    const moveResult = makeMove(selectedPiece.row, selectedPiece.col, row, col);
    if (moveResult) {
      socket.emit("move", {
        start: selectedPiece,
        end: { row, col },
        player: myPlayerColor,
        extraJump: moveResult.extraJump,
      });

      if (!moveResult.extraJump) {
        selectedPiece = null; // Reset selected piece
      } else {
        selectedPiece = { row, col }; // Keep piece selected if extra jump
      }
    }
  } else if (piece && piece.color === myPlayerColor) {
    // Select a piece if clicked
    selectedPiece = { row, col };
  }
}

// Switch turns after a move
function switchTurn(newTurn) {
  currentPlayer = newTurn;
  document.getElementById("player-turn").innerText = `Player Turn: ${currentPlayer}`;
}

// Reset the game
function resetGame() {
  initializeBoard();
  currentPlayer = "red"; // Reset turn to red
  socket.emit("resetGame");
}

// Make a move on the board
function makeMove(startRow, startCol, endRow, endCol) {
  const piece = board[startRow][startCol];
  const direction = piece.color === "red" ? -1 : 1;
  const isKing = piece.isKing;

  // Normal move (diagonal)
  if (Math.abs(endRow - startRow) === 1 && Math.abs(endCol - startCol) === 1) {
    if (board[endRow][endCol] === null) {
      board[endRow][endCol] = piece;
      board[startRow][startCol] = null;

      if (endRow === 0 || endRow === boardSize - 1) {
        piece.isKing = true; // Promote to king
      }

      renderBoard();
      return { extraJump: false };
    }
  }

  // Capture move (jump over opponent's piece)
  if (Math.abs(endRow - startRow) === 2 && Math.abs(endCol - startCol) === 2) {
    const middleRow = (startRow + endRow) / 2;
    const middleCol = (startCol + endCol) / 2;
    const capturedPiece = board[middleRow][middleCol];

    if (capturedPiece && capturedPiece.color !== piece.color) {
      board[endRow][endCol] = piece;
      board[startRow][startCol] = null;
      board[middleRow][middleCol] = null;

      if (endRow === 0 || endRow === boardSize - 1) {
        piece.isKing = true; // Promote to king
      }

      renderBoard();
      const extraJump = hasExtraJump(endRow, endCol, piece.color, piece.isKing);
      return { extraJump };
    }
  }

  return null;
}

// Check if an extra jump is possible after capturing
function hasExtraJump(row, col, color, isKing) {
  const directions = isKing ? [[-1, -1], [-1, 1], [1, -1], [1, 1]] : [[1, -1], [1, 1]];
  for (const [dx, dy] of directions) {
    const captureRow = row + dx * 2;
    const captureCol = col + dy * 2;
    if (captureRow >= 0 && captureRow < boardSize && captureCol >= 0 && captureCol < boardSize &&
        board[captureRow][captureCol] === null &&
        board[row + dx][col + dy] && board[row + dx][col + dy].color !== color) {
      return true;
    }
  }
  return false;
}

// Socket listeners
socket.on("playerAssigned", (data) => {
  myPlayerColor = data.color; // Set the player's color (red or black)
  currentPlayer = "red"; // Red always starts
  document.getElementById("player-turn").innerText = `Player Turn: ${currentPlayer}`;
  initializeBoard();
});

socket.on("move", (data) => {
  board[data.end.row][data.end.col] = board[data.start.row][data.start.col];
  board[data.start.row][data.start.col] = null;

  renderBoard();

  if (!data.extraJump) {
    switchTurn(currentPlayer === "red" ? "black" : "red");
  }
});

socket.on("resetGame", () => {
  initializeBoard();
});

socket.on("updateTurn", (turn) => {
  switchTurn(turn);
});

// Event listeners
document.getElementById("reset-button").addEventListener("click", resetGame);

// Initial game setup
socket.emit("joinGame"); // Emit to server that this player wants to join
