const DATA_URL =
  "https://raw.githubusercontent.com/Asunaa23/sports-planner/main/data/nba/phoenix-suns.json";

const statusElement = document.getElementById("status");
const gamesElement = document.getElementById("games");

async function loadGames() {
  try {
    const response = await fetch(DATA_URL);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    statusElement.textContent =
      `${data.team.name} • ${data.games.length} matchs`;

    if (data.games.length === 0) {
      gamesElement.innerHTML = `
        <div class="game">
          Aucun match à venir pour le moment.
        </div>
      `;

      return;
    }

    for (const game of data.games) {
      const gameElement = document.createElement("div");

      gameElement.className = "game";

      const location = game.home
        ? "vs"
        : "@";

      const date = new Date(game.datetime);

      gameElement.innerHTML = `
        <div class="game-date">
          ${date.toLocaleString()}
        </div>

        <div class="game-opponent">
          ${location} ${game.opponent.name}
        </div>
      `;

      gamesElement.appendChild(gameElement);
    }

  } catch (error) {
    console.error(error);

    statusElement.textContent =
      "Impossible de charger les données.";
  }
}

loadGames();