const DATA_URL =
  "https://raw.githubusercontent.com/Asunaa23/sports-planner/main/data/nba/schedule.json";

const statusElement = document.getElementById("status");
const gamesElement = document.getElementById("games");

const filterToggle = document.getElementById("filter-toggle");
const filterPanel = document.getElementById("filter-panel");
const teamList = document.getElementById("team-list");
const teamSearch = document.getElementById("team-search");
const clearFilter = document.getElementById("clear-filter");

let schedule = null;
let selectedTeams = [];

// --------------------------------------------------
// Dates / local timezone
// --------------------------------------------------

function formatDay(date) {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
}

function formatTime(date) {
  return new Intl.DateTimeFormat(undefined, {
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
    // datetime from our JSON is UTC.
    // JavaScript automatically converts it to the user's local timezone.
    const date = new Date(game.datetime);

    const key = getLocalDateKey(date);

    if (!groups.has(key)) {
      groups.set(key, []);
    }

    groups.get(key).push(game);
  }

  return groups;
}

// --------------------------------------------------
// Storage
// --------------------------------------------------

async function loadPreferences() {
  const result = await chrome.storage.local.get([
    "selectedTeams",
  ]);

  if (Array.isArray(result.selectedTeams)) {
    selectedTeams = result.selectedTeams;
  }
}

async function savePreferences() {
  await chrome.storage.local.set({
    selectedTeams,
  });
}

// --------------------------------------------------
// Filters
// --------------------------------------------------

function isTeamSelected(abbreviation) {
  return selectedTeams.includes(abbreviation);
}

function getFilteredGames() {
  if (!schedule) {
    return [];
  }

  // No selection = show entire NBA.
  if (selectedTeams.length === 0) {
    return schedule.games;
  }

  return schedule.games.filter((game) => {
    return (
      selectedTeams.includes(game.home.abbreviation) ||
      selectedTeams.includes(game.away.abbreviation)
    );
  });
}

function updateFilterButton() {
  if (selectedTeams.length === 0) {
    filterToggle.firstChild.textContent =
      "Toutes les équipes ";

    return;
  }

  if (selectedTeams.length === 1) {
    const team = schedule.teams.find(
      (team) =>
        team.abbreviation === selectedTeams[0]
    );

    filterToggle.firstChild.textContent =
      `${team?.name ?? selectedTeams[0]} `;

    return;
  }

  filterToggle.firstChild.textContent =
    `${selectedTeams.length} équipes sélectionnées `;
}

function renderTeamList(search = "") {
  teamList.innerHTML = "";

  const query = search.trim().toLowerCase();

  const teams = schedule.teams.filter((team) => {
    return (
      team.name.toLowerCase().includes(query) ||
      team.abbreviation.toLowerCase().includes(query)
    );
  });

  for (const team of teams) {
    const label = document.createElement("label");
    label.className = "team-option";

    const checkbox = document.createElement("input");

    checkbox.type = "checkbox";
    checkbox.checked = isTeamSelected(team.abbreviation);

    checkbox.addEventListener("change", async () => {
      if (checkbox.checked) {
        if (!selectedTeams.includes(team.abbreviation)) {
          selectedTeams.push(team.abbreviation);
        }
      } else {
        selectedTeams = selectedTeams.filter(
          (abbreviation) =>
            abbreviation !== team.abbreviation
        );
      }

      await savePreferences();

      updateFilterButton();
      renderGames();
    });

    const text = document.createElement("span");

    text.innerHTML = `
      <strong>${team.name}</strong>
      <small>${team.abbreviation}</small>
    `;

    label.appendChild(checkbox);
    label.appendChild(text);

    teamList.appendChild(label);
  }
}

// --------------------------------------------------
// Games
// --------------------------------------------------

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

function renderGames() {
  const games = getFilteredGames();

  gamesElement.innerHTML = "";

  statusElement.textContent =
    `${schedule.teams.length} équipes • ${games.length} matchs`;

  if (games.length === 0) {
    gamesElement.innerHTML = `
      <div class="empty-state">
        <strong>Aucun match à venir</strong>

        <span>
          Aucun match n'est disponible pour cette période
          avec les filtres actuels.
        </span>
      </div>
    `;

    return;
  }

  const groups = groupGamesByDay(games);

  for (const [dateKey, dayGames] of groups) {
    const section = document.createElement("section");
    section.className = "day";

    const date = new Date(`${dateKey}T12:00:00`);

    const title = document.createElement("h2");
    title.textContent = formatDay(date);

    section.appendChild(title);

    for (const game of dayGames) {
      section.appendChild(
        createGameElement(game)
      );
    }

    gamesElement.appendChild(section);
  }
}

// --------------------------------------------------
// Events
// --------------------------------------------------

filterToggle.addEventListener("click", () => {
  filterPanel.classList.toggle("hidden");
});

teamSearch.addEventListener("input", () => {
  renderTeamList(teamSearch.value);
});

clearFilter.addEventListener("click", async () => {
  selectedTeams = [];

  await savePreferences();

  renderTeamList(teamSearch.value);
  updateFilterButton();
  renderGames();
});

// --------------------------------------------------
// Load
// --------------------------------------------------

async function loadSchedule() {
  try {
    statusElement.textContent =
      "Chargement du calendrier...";

    await loadPreferences();

    const response = await fetch(DATA_URL);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    schedule = await response.json();

    if (schedule.schemaVersion !== 2) {
      throw new Error(
        "Unsupported schedule schema."
      );
    }

    // Remove saved teams that no longer exist.
    const validTeams = new Set(
      schedule.teams.map(
        (team) => team.abbreviation
      )
    );

    selectedTeams = selectedTeams.filter(
      (abbreviation) =>
        validTeams.has(abbreviation)
    );

    await savePreferences();

    renderTeamList();
    updateFilterButton();
    renderGames();

  } catch (error) {
    console.error(error);

    statusElement.textContent =
      "Impossible de charger le calendrier.";

    gamesElement.innerHTML = `
      <div class="empty-state">
        <strong>Erreur de chargement</strong>

        <span>
          Impossible de récupérer les données NBA.
        </span>
      </div>
    `;
  }
}

loadSchedule();