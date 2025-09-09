const fs = require("fs");

const rows = 5;
const cols = 10;

let state = JSON.parse(fs.readFileSync("game/state.json", "utf8"));
let { playerRow, botRow, ball, score } = state;

function randDy() {
  return Math.floor(Math.random() * 3) - 1;
}

function resetBall(towards) {
  ball.col = Math.floor(cols / 2);
  ball.row = Math.floor(rows / 2);
  if (towards === "bot") ball.dx = 1;
  else if (towards === "player") ball.dx = -1;
  else ball.dx = Math.random() < 0.5 ? -1 : 1;
  ball.dy = randDy();
}

function render() {
  const grid = Array.from({ length: rows }, () => Array(cols).fill("⬛"));
  if (playerRow >= 0 && playerRow < rows) grid[playerRow][0] = "🟩";
  if (botRow >= 0 && botRow < rows) grid[botRow][cols - 1] = "🟦";
  if (
    ball.row >= 0 &&
    ball.row < rows &&
    ball.col >= 0 &&
    ball.col < cols
  ) {
    grid[ball.row][ball.col] = "⚪";
  }
  return grid.map((r) => r.join("")).join("\n");
}

function stepGame(move) {
  if (move === "up" && playerRow > 0) playerRow--;
  if (move === "down" && playerRow < rows - 1) playerRow++;

  if (botRow < ball.row) botRow++;
  else if (botRow > ball.row) botRow--;

  ball.col += ball.dx;
  ball.row += ball.dy;

  if (ball.row < 0) {
    ball.row = 0;
    ball.dy *= -1;
  }
  if (ball.row > rows - 1) {
    ball.row = rows - 1;
    ball.dy *= -1;
  }

  if (ball.col <= 0) {
    if (playerRow === ball.row) {
      ball.dx = 1;
      ball.dy = randDy();
      ball.col = 0;
    } else {
      score.bot++;
      resetBall("bot");
    }
  } else if (ball.col >= cols - 1) {
    if (botRow === ball.row) {
      ball.dx = -1;
      ball.dy = randDy();
      ball.col = cols - 1;
    } else {
      score.player++;
      resetBall("player");
    }
  }
}

// Run step
const move = process.argv[2];
stepGame(move);

// Save state
state = { playerRow, botRow, ball, score };
fs.writeFileSync("game/state.json", JSON.stringify(state, null, 2));

// Update README
let readme = fs.readFileSync("README.md", "utf8");

const pongSection = `
\`\`\`
${render()}
\`\`\`
Score: Player ${score.player} — Bot ${score.bot}

[⬆️ Up](../../actions/workflows/pong.yml?inputs[move]=up)  
[⬇️ Down](../../actions/workflows/pong.yml?inputs[move]=down)  
[▶ Advance](../../actions/workflows/pong.yml?inputs[move]=none)
`;

readme = readme.replace(
  /<!-- PONG-START -->[\s\S]*<!-- PONG-END -->/,
  `<!-- PONG-START -->\n${pongSection}\n<!-- PONG-END -->`
);

fs.writeFileSync("README.md", readme);
