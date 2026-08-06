const DATA_URL =  "https://raw.githubusercontent.com/Asunaa23/sports-planner/main/data/nba/schedule.json";

const statusElement = document.getElementById("status");
const gamesElement = document.getElementById("games");
const selectedDateLabel =
  document.getElementById("selected-date-label");

const filterToggle = document.getElementById("filter-toggle");
const filterLabel = document.getElementById("filter-label");
const filterPanel = document.getElementById("filter-panel");
const teamList = document.getElementById("team-list");
const teamSearch = document.getElementById("team-search");
const clearFilter = document.getElementById("clear-filter");

const dateStrip = document.getElementById("date-strip");
const previousDay = document.getElementById("previous-day");
const nextDay = document.getElementById("next-day");

let schedule = null;
let selectedTeams = [];
let selectedDate = null;

// --------------------------------------------------
// Dates / timezone
// --------------------------------------------------

function formatTime(date) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatSectionDate(date) {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
}

function getLocalDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function dateFromKey(key) {
  return new Date(`${key}T12:00:00`);
}

function getGameDateKey(game) {
  return getLocalDateKey(new Date(game.datetime));
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
// Teams
// --------------------------------------------------

function getFilteredGames() {
  if (!schedule) {
    return [];
  }

  if (selectedTeams.length === 0) {
    return schedule.games;
  }

  return schedule.games.filter((game) =>
    selectedTeams.includes(game.home.abbreviation) ||
    selectedTeams.includes(game.away.abbreviation)
  );
}

function updateFilterButton() {
  if (selectedTeams.length === 0) {
    filterLabel.textContent = "Toutes les équipes";
    return;
  }

  if (selectedTeams.length === 1) {
    const team = schedule.teams.find(
      (team) => team.abbreviation === selectedTeams[0]
    );

    filterLabel.textContent =
      team?.name ?? selectedTeams[0];

    return;
  }

  filterLabel.textContent =
    `${selectedTeams.length} équipes sélectionnées`;
}

function renderTeamList(search = "") {
  teamList.innerHTML = "";

  const query = search.trim().toLowerCase();

  const teams = schedule.teams.filter((team) =>
    team.name.toLowerCase().includes(query) ||
    team.abbreviation.toLowerCase().includes(query)
  );

  for (const team of teams) {
    const label = document.createElement("label");
    label.className = "team-option";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked =
      selectedTeams.includes(team.abbreviation);

    checkbox.addEventListener("change", async () => {
      if (checkbox.checked) {
        if (!selectedTeams.includes(team.abbreviation)) {
          selectedTeams.push(team.abbreviation);
        }
      } else {
        selectedTeams = selectedTeams.filter(
          (value) => value !== team.abbreviation
        );
      }

      await savePreferences();

      updateFilterButton();
      selectInitialDate();
      renderDateStrip();
      renderGames();
    });

    const text = document.createElement("span");

    const name = document.createElement("strong");
    name.textContent = team.name;

    const abbreviation = document.createElement("small");
    abbreviation.textContent = team.abbreviation;

    text.appendChild(name);
    text.appendChild(abbreviation);

    label.appendChild(checkbox);
    label.appendChild(text);

    teamList.appendChild(label);
  }
}

// --------------------------------------------------
// Date navigation
// --------------------------------------------------

function getAvailableDates() {
  return [
    ...new Set(
      getFilteredGames().map(getGameDateKey)
    ),
  ].sort();
}

function selectInitialDate() {
  const dates = getAvailableDates();

  if (dates.length === 0) {
    selectedDate = null;
    return;
  }

  if (selectedDate && dates.includes(selectedDate)) {
    return;
  }

  const today = getLocalDateKey(new Date());

  selectedDate =
    dates.find((date) => date >= today) ?? dates[0];
}

function changeSelectedDate(direction) {
  const dates = getAvailableDates();

  if (!selectedDate || dates.length === 0) {
    return;
  }

  const currentIndex = dates.indexOf(selectedDate);

  const newIndex = currentIndex + direction;

  if (newIndex < 0 || newIndex >= dates.length) {
    return;
  }

  selectedDate = dates[newIndex];

  renderDateStrip();
  renderGames();
}

function renderDateStrip() {
  dateStrip.innerHTML = "";

  const dates = getAvailableDates();

  if (!selectedDate || dates.length === 0) {
    document.querySelector(".date-navigation")
      .classList.add("hidden");

    return;
  }

  document.querySelector(".date-navigation")
    .classList.remove("hidden");

  const selectedIndex = dates.indexOf(selectedDate);

  const start = Math.max(
    0,
    Math.min(selectedIndex - 2, dates.length - 5)
  );

  const visibleDates = dates.slice(start, start + 5);

  for (const dateKey of visibleDates) {
    const date = dateFromKey(dateKey);

    const button = document.createElement("button");
    button.className = "date-item";

    if (dateKey === selectedDate) {
      button.classList.add("active");
    }

    const weekday =
      new Intl.DateTimeFormat(undefined, {
        weekday: "short",
      })
        .format(date)
        .replace(".", "")
        .toUpperCase();

    button.innerHTML = `
      <span>${weekday}</span>
      <strong>${date.getDate()}</strong>
    `;

    button.addEventListener("click", () => {
      selectedDate = dateKey;

      renderDateStrip();
      renderGames();
    });

    dateStrip.appendChild(button);
  }

  previousDay.disabled = selectedIndex === 0;
  nextDay.disabled = selectedIndex === dates.length - 1;
}

// --------------------------------------------------
// Games
// --------------------------------------------------

function createGameElement(game) {
  const element = document.createElement("div");
  element.className = "game";

  const date = new Date(game.datetime);

  const awaySelected =
    selectedTeams.includes(game.away.abbreviation);

  const homeSelected =
    selectedTeams.includes(game.home.abbreviation);

  const isFinal =
    String(game.status).toLowerCase() === "final";

  const hasScore =
    game.score &&
    game.score.away !== null &&
    game.score.home !== null;

  let mainDisplay;
  let statusDisplay;

  if (isFinal && hasScore) {
    mainDisplay =
      `${game.score.away} — ${game.score.home}`;

    statusDisplay = "FINAL";
  } else {
    mainDisplay = formatTime(date);

    statusDisplay =
      game.postponed
        ? "POSTPONED"
        : game.status || "SCHEDULED";
  }

  element.innerHTML = `
    <div class="team ${awaySelected ? "favorite" : ""}">
      <strong>${game.away.abbreviation}</strong>
      <span>${game.away.name}</span>
    </div>

    <div class="game-center">
      <strong>${mainDisplay}</strong>
      <span>${statusDisplay}</span>
    </div>

    <div class="team ${homeSelected ? "favorite" : ""}">
      <strong>${game.home.abbreviation}</strong>
      <span>${game.home.name}</span>
    </div>
  `;

  return element;
}

function renderGames() {
  const filteredGames = getFilteredGames();

  statusElement.textContent =
    `${schedule.teams.length} équipes • ${filteredGames.length} matchs`;

  gamesElement.innerHTML = "";

  // Update the date displayed next to "MATCHS"
  if (selectedDate) {
    selectedDateLabel.textContent =
      formatSectionDate(dateFromKey(selectedDate));
  } else {
    selectedDateLabel.textContent = "";
  }

  // No games available with current filters
  if (filteredGames.length === 0) {
    selectedDateLabel.textContent = "";

    gamesElement.innerHTML = `
      <div class="empty-state">
        <strong>Aucun match à venir</strong>
        <span>
          Aucun match n'est disponible avec les filtres actuels.
        </span>
      </div>
    `;

    return;
  }

  // Select a valid date if none is currently selected
  if (!selectedDate) {
    selectInitialDate();

    if (selectedDate) {
      selectedDateLabel.textContent =
        formatSectionDate(dateFromKey(selectedDate));
    }
  }

  // Only display games from the selected day
  const games = filteredGames.filter(
    (game) => getGameDateKey(game) === selectedDate
  );

  // Safety fallback
  if (games.length === 0) {
    gamesElement.innerHTML = `
      <div class="empty-state">
        <strong>Aucun match ce jour</strong>
        <span>
          Sélectionne une autre date pour afficher les matchs.
        </span>
      </div>
    `;

    return;
  }

  const section = document.createElement("section");
  section.className = "day";

  for (const game of games) {
    section.appendChild(createGameElement(game));
  }

  gamesElement.appendChild(section);
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

  selectInitialDate();
  renderDateStrip();
  renderGames();
});

previousDay.addEventListener("click", () => {
  changeSelectedDate(-1);
});

nextDay.addEventListener("click", () => {
  changeSelectedDate(1);
});

// --------------------------------------------------
// Load
// --------------------------------------------------

async function loadSchedule() {
  try {
    await loadPreferences();

    const response = await fetch(DATA_URL);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    schedule = await response.json();

    if (schedule.schemaVersion !== 2) {
      throw new Error("Unsupported schedule schema.");
    }

    const validTeams = new Set(
      schedule.teams.map((team) => team.abbreviation)
    );

    selectedTeams = selectedTeams.filter(
      (team) => validTeams.has(team)
    );

    await savePreferences();

    updateFilterButton();
    renderTeamList();

    selectInitialDate();
    renderDateStrip();
    renderGames();

  } catch (error) {
    console.error(error);

    statusElement.textContent =
      "Impossible de charger le calendrier.";

    gamesElement.innerHTML = `
      <div class="empty-state">
        <strong>Erreur de chargement</strong>
        <span>Impossible de récupérer les données NBA.</span>
      </div>
    `;
  }
}

loadSchedule();