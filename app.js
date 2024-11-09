const express= require ('express')

const http = require("http");
const { Server } = require("socket.io");
const app = express();
const server = http.createServer(app);
const io = new Server(server);
app.use(express.static("public"));
const port = process.env.PORT || 10000;
let currentPlayer = "red";
let players = []; // Start with red
let gameBoard = []; // To store the board state

// Initialize the game board
function initializeBoard() {
  gameBoard = []; // Reset the board
  for (let row = 0; row < 8; row++) {
    gameBoard[row] = [];
    for (let col = 0; col < 8; col++) {
      if ((row + col) % 2 === 1) { // Dark squares
        if (row < 3) {
          gameBoard[row][col] = { color: "black", isKing: false };
        } else if (row > 4) {
          gameBoard[row][col] = { color: "red", isKing: false };
        } else {
          gameBoard[row][col] = null;
        }
      } else {
        gameBoard[row][col] = null;
      }
    }
  }
}

// Handle socket connection
io.on("connection", (socket) => {
  console.log("A user connected");

  // Handle player joining
  if (players.length < 2) {
    const playerColor = players.length === 0 ? "red" : "black";
    players.push({ id: socket.id, color: playerColor });

    socket.emit("updateTurn", currentPlayer);
    socket.emit("playerAssigned", { color: playerColor });
    console.log(`Player ${playerColor} joined`);

    // Start the game when two players are in
    if (players.length === 2) {
      initializeBoard(); // Initialize the game board
      io.emit("startGame", "Game Started");
      io.emit("updateBoard", gameBoard); // Send the initial board state to both players
    }
  } else {
    socket.emit("gameFull", "Game is already full. Please try again later.");
  }

  // Listen for move events from players
  socket.on("move", (data) => {
    if (data.player === currentPlayer) {
      console.log("Move received:", data);

      // Update the board with the move
      const { start, end, extraJump } = data;
      const piece = gameBoard[start.row][start.col];
      gameBoard[end.row][end.col] = piece; // Move the piece
      gameBoard[start.row][start.col] = null; // Empty the start square

      // If a piece is captured (jump), remove the captured piece
      if (Math.abs(end.row - start.row) === 2 && Math.abs(end.col - start.col) === 2) {
        const middleRow = (start.row + end.row) / 2;
        const middleCol = (start.col + end.col) / 2;
        gameBoard[middleRow][middleCol] = null; // Remove the captured piece
      }

      // Promote to king if the piece reaches the other side
      if ((piece.color === "red" && end.row === 0) || (piece.color === "black" && end.row === 7)) {
        piece.isKing = true;
      }

      // Broadcast the move to the other player
      socket.broadcast.emit("move", data);
      io.emit("updateBoard", gameBoard);

      // If no extra jump, switch turn
      if (!extraJump) {
        currentPlayer = currentPlayer === "red" ? "black" : "red";
        io.emit("updateTurn", currentPlayer);
      }
    }
  });

  // Listen for reset game event
  socket.on("resetGame", () => {
    currentPlayer = "red"; // Reset to red's turn
    players = []; // Reset players list
    initializeBoard(); // Reset the board
    io.emit("resetGame");
    io.emit("updateBoard", gameBoard); // Send the reset board state
    io.emit("updateTurn", currentPlayer); // Reset turn for all players
  });

  // Handle player disconnection
  socket.on("disconnect", () => {
    console.log("A user disconnected");
    // Remove player from the players array if disconnected
    players = players.filter(player => player.id !== socket.id);

    // If a player disconnects, reset the game
    if (players.length === 0) {
      currentPlayer = "red"; // Reset to red's turn
      io.emit("resetGame");
    }
  });
});
const path =require('path')
const mongoose=require('mongoose')
const mongostore= require ('connect-mongo')
const session=require('express-session');
const cookieParser = require('cookie-parser');
const passport=require('passport')
const user= require('./src/models/users');
require('./src/strategies/local')
const { error } = require('console');
//middleware
const uri = "mongodb+srv://filexmbogo:filexmbogo.691@cluster0.rff4u.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// Create Mongoose connection
mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});
app.use(express.static(path.join(__dirname,'src/public')));
app.use(express.urlencoded({extended:true}))
app.use(passport.initialize())
app.use(session({
    secret:'filex',
    saveUninitialize:false,
    resave:false,cookie:{maxAge:600000},
    store:mongostore.create({client:mongoose.connection.getClient()

    })
}))

app.use(passport.session())

app.set('views','src/views');
app.set('view engine','ejs');

//handle homepage 
app.get('/',(req,res)=>{
    res.render('checkers',{})
})

//handle login
app.get('/login',(req,res)=>{
    res.render('login',{})

})
//handle registration
app.get
( "/register",(req,res)=>{
res.render('register',{})

})

app.post('/register',  async (req,res)=>{console.log(req.session);
    const {name,email,password}=req.body
    let finduser
    try { finduser= await user.findOne({name:name})}
    catch(err){}
    console.log(finduser);
    
         
    
     if(finduser!=null){
         console.log
         ('user exists')
         
     }
     if(finduser===null){
         console.log('creating user');
         
         try{
         let createduser= new user 
         createduser.name=name;
         createduser.givenid=password;
         createduser.email=email;
         await createduser.save()}
         
       catch(err){}}
      

    res.sendStatus(200)
    


 

    
    

})


app.post('/login',passport.authenticate('local'),(req,res)=>{
   
    const {email,password}=req.body;
    console.log(req.body);
    
    
    res.sendStatus(200)
})








server.listen(port, () => {
  console.log(`Server is running on http://127.0.0.1:${port}`);
});