import "dotenv/config";

import {
  getTeams,
  getAllGames,
} from "./providers/nba/balldontlie.js";

import {
  normalizeTeam,
  normalizeGame,
} from "./normalizers/nba.js";

import fs from "node:fs/promises";
import path from "node:path";

const apiKey = process.env.BALLDONTLIE_API_KEY;

if (!apiKey) {
  console.error("❌ BALLDONTLIE_API_KEY is missing.");
  process.exit(1);
}

// BALLDONTLIE IDs for the 30 current NBA franchises.
const ACTIVE_NBA_TEAM_IDS = new Set([
  1, 2, 3, 4, 5,
  6, 7, 8, 9, 10,
  11, 12, 13, 14, 15,
  16, 17, 18, 19, 20,
  21, 22, 23, 24, 25,
  26, 27, 28, 29, 30,
]);

function formatDate(date) {
  return date.toISOString().split("T")[0];
}

console.log("🏀 Sports Planner");
console.log("📡 Connecting to BALLDONTLIE...");

try {
  // --------------------------------------------------
  // Date range
  // --------------------------------------------------

  const today = new Date();

  const end = new Date(today);
  end.setDate(end.getDate() + 120);

  const startDate = formatDate(today);
  const endDate = formatDate(end);

  console.log(`📅 Date range: ${startDate} → ${endDate}`);

  // --------------------------------------------------
  // Teams
  // --------------------------------------------------

  console.log("\n👥 Fetching NBA teams...");

  const rawTeams = await getTeams(apiKey);

  const teams = rawTeams
    .filter((team) => ACTIVE_NBA_TEAM_IDS.has(team.id))
    .map(normalizeTeam)
    .sort((a, b) => a.name.localeCompare(b.name));

  console.log(`✅ ${teams.length} active NBA teams found`);

  if (teams.length !== 30) {
    console.warn(
      `⚠️ Expected 30 active NBA teams, received ${teams.length}.`
    );
  }

  // --------------------------------------------------
  // Games
  // --------------------------------------------------

  console.log("\n🏀 Fetching NBA schedule...");

  const rawGames = await getAllGames(
    apiKey,
    startDate,
    endDate
  );

  const games = rawGames
    .map(normalizeGame)
    .sort(
      (a, b) =>
        new Date(a.datetime) - new Date(b.datetime)
    );

  console.log(`\n✅ ${games.length} games found`);

  // --------------------------------------------------
  // Sports Planner JSON
  // --------------------------------------------------

  const data = {
    schemaVersion: 2,

    sport: "nba",

    updatedAt: new Date().toISOString(),

    range: {
      start: startDate,
      end: endDate,
    },

    teams,

    games,
  };

  // --------------------------------------------------
  // Write
  // --------------------------------------------------

  const directory = path.join("data", "nba");
  const filePath = path.join(directory, "schedule.json");

  await fs.mkdir(directory, {
    recursive: true,
  });

  await fs.writeFile(
    filePath,
    JSON.stringify(data, null, 2),
    "utf8"
  );

  console.log(`💾 Written: ${filePath}`);
  console.log("\n🎉 NBA schedule update complete!");

} catch (error) {
  console.error("\n❌ Error:", error.message);
  process.exit(1);
}