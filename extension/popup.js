const DATA_URL =
  "https://raw.githubusercontent.com/Asunaa23/sports-planner/main/data/nba/schedule.json";

const statusElement = document.getElementById("status");
const gamesElement = document.getElementById("games");

function formatDay(date) {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
}

function formatTime(date) {
  return new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getLocalDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function groupGamesByDay(games) {
  const groups = new Map();

  for (const game of games) {
    const date = new Date(game.datetime);
    const key = getLocalDateKey(date);

    if (!groups.has(key)) {
      groups.set(key, []);
    }

    groups.get(key).push(game);
  }

  return groups;
}

function createGameElement(game) {
  const element = document.createElement("div");
  element.className = "game";

  const date = new Date(game.datetime);

  element.innerHTML = `
    <div class="team">
      <strong>${game.away.abbreviation}</strong>
      <span>${game.away.name}</span>
    </div>

    <div class="game-time">
      ${formatTime(date)}
    </div>

    <div class="team">
      <strong>${game.home.abbreviation}</strong>
      <span>${game.home.name}</span>
    </div>
  `;

  return element;
}

async function loadSchedule() {
  try {
    statusElement.textContent = "Chargement du calendrier...";

    const response = await fetch(DATA_URL);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    if (data.schemaVersion !== 2) {
      throw new Error("Unsupported schedule schema.");
    }

    statusElement.textContent =
      `${data.teams.length} équipes • ${data.games.length} matchs`;

    gamesElement.innerHTML = "";

    if (data.games.length === 0) {
      gamesElement.innerHTML = `
        <div class="empty-state">
          <strong>Aucun match à venir</strong>
          <span>
            Le calendrier NBA n'est pas encore disponible
            pour cette période.
          </span>
        </div>
      `;

      return;
    }

    const groups = groupGamesByDay(data.games);

    for (const [dateKey, games] of groups) {
      const section = document.createElement("section");
      section.className = "day";

      const date = new Date(`${dateKey}T12:00:00`);

      const title = document.createElement("h2");
      title.textContent = formatDay(date);

      section.appendChild(title);

      for (const game of games) {
        section.appendChild(
          createGameElement(game)
        );
      }

      gamesElement.appendChild(section);
    }

  } catch (error) {
    console.error(error);

    statusElement.textContent =
      "Impossible de charger le calendrier.";

    gamesElement.innerHTML = `
      <div class="empty-state">
        Une erreur est survenue.
      </div>
    `;
  }
}

loadSchedule();