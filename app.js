const winPatterns = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];

new Vue({
  el: '#app',
  data: {
    grid: [],
    myTurn: true,         // true = X's turn (human in single, X in double), false = O's turn
    gameActive: true,
    winner: null,
    gameMode: 'single',
    thinking: false,
    showPopup: false,
    scores: { X: 0, O: 0, draw: 0 }
  },
  computed: {
    turnMessage() {
      if (!this.gameActive) {
        if (this.winner) return `🏆 ${this.winner} VICTORY! 🏆`;
        return "🤝 STALEMATE! Great game!";
      }
      if (this.gameMode === 'single') {
        return this.myTurn ? "✨ YOUR TURN (X) — tap the board ✨" : "🧠 AI THINKING ... (O)";
      }
      return this.myTurn ? "❌ PLAYER X's TURN" : "⭕ PLAYER O's TURN";
    },
    popupTitle() {
      if (this.winner) return this.winner === 'X' ? 'X WINS!' : 'O WINS!';
      return 'DRAW!';
    },
    popupMessage() {
      if (this.winner) return '⭐ Incredible move! ⭐';
      return '🤍 Well played, clever match!';
    }
  },
  mounted() {
    this.initGame();
  },
  methods: {
    initGame() {
      this.grid = Array(9).fill().map(() => ({ figure: -1 }));
      this.myTurn = true;
      this.gameActive = true;
      this.winner = null;
      this.showPopup = false;
      this.thinking = false;
    },
    checkWinner() {
      for (let pattern of winPatterns) {
        const [a,b,c] = pattern;
        const valA = this.grid[a].figure;
        const valB = this.grid[b].figure;
        const valC = this.grid[c].figure;
        if (valA !== -1 && valA === valB && valB === valC) {
          this.winner = valA === 1 ? 'X' : 'O';
          this.gameActive = false;
          if (this.winner === 'X') this.scores.X++;
          else this.scores.O++;
          this.showPopup = true;
          return true;
        }
      }
      return false;
    },
    checkDraw() {
      const allFilled = this.grid.every(cell => cell.figure !== -1);
      if (allFilled && !this.winner && this.gameActive) {
        this.gameActive = false;
        this.scores.draw++;
        this.showPopup = true;
        return true;
      }
      return false;
    },
    makeMove(index) {
      if (!this.gameActive || this.winner) return false;
      if (this.grid[index].figure !== -1) return false;

      // double player mode
      if (this.gameMode === 'double') {
        this.grid[index].figure = this.myTurn ? 1 : 0;
        const ended = this.checkWinner() || this.checkDraw();
        if (!ended && this.gameActive) {
          this.myTurn = !this.myTurn;
        }
        return true;
      } 
      // single player mode: only human (X) can move here
      else {
        if (!this.myTurn) return false;   // AI turn, block
        this.grid[index].figure = 1;      // X mark
        const winOrDraw = this.checkWinner() || this.checkDraw();
        if (winOrDraw) return true;
        // switch to AI turn
        this.myTurn = false;
        // slight smooth delay for AI (feels more responsive)
        setTimeout(() => this.computerMove(), 260);
        return true;
      }
    },
    // smarter computerMove with minimax inspired but polished & fast decision
    computerMove() {
      if (!this.gameActive || this.winner || this.myTurn === true) {
        this.thinking = false;
        return;
      }
      this.thinking = true;

      // small artificial delay for "thinking" realism and smoothness
      setTimeout(() => {
        if (!this.gameActive || this.winner || this.myTurn === true) {
          this.thinking = false;
          return;
        }
        
        const emptyIndices = [];
        for (let i = 0; i < 9; i++) if (this.grid[i].figure === -1) emptyIndices.push(i);
        if (emptyIndices.length === 0) {
          this.thinking = false;
          return;
        }

        let bestMove = null;

        // 1. Immediate win for AI (O = 0)
        for (let idx of emptyIndices) {
          let testGrid = this.grid.map(cell => cell.figure);
          testGrid[idx] = 0;
          if (this.wouldWin(testGrid, 0)) {
            bestMove = idx;
            break;
          }
        }

        // 2. Block player win (X = 1)
        if (bestMove === null) {
          for (let idx of emptyIndices) {
            let testGrid = this.grid.map(cell => cell.figure);
            testGrid[idx] = 1;
            if (this.wouldWin(testGrid, 1)) {
              bestMove = idx;
              break;
            }
          }
        }

        // 3. Prefer center
        if (bestMove === null && this.grid[4].figure === -1) bestMove = 4;

        // 4. Prefer corners (randomized but attractive)
        const corners = [0,2,6,8];
        if (bestMove === null) {
          const availableCorners = corners.filter(c => this.grid[c].figure === -1);
          if (availableCorners.length) {
            bestMove = availableCorners[Math.floor(Math.random() * availableCorners.length)];
          }
        }

        // 5. fallback to first empty or random (smooth)
        if (bestMove === null && emptyIndices.length) {
          bestMove = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
        }

        if (bestMove !== null) {
          this.grid[bestMove].figure = 0;   // O placed
          const ended = this.checkWinner() || this.checkDraw();
          if (!ended && this.gameActive) {
            this.myTurn = true;  // give turn back to human
          }
        }
        this.thinking = false;
      }, 210); // silky delay, not too slow
    },
    wouldWin(testGrid, val) {
      return winPatterns.some(([a,b,c]) => testGrid[a] === val && testGrid[b] === val && testGrid[c] === val);
    },
    setMode(mode) {
      if (this.gameMode === mode) return;
      this.gameMode = mode;
      this.resetGame();
    },
    resetGame() {
      this.initGame();
    },
    playAgain() {
      this.initGame();
    },
    closePopup() {
      this.showPopup = false;
    }
  }
});
