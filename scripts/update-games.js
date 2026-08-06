import "dotenv/config";
import fs from "node:fs/promises";

import {
  getTeams,
  getGames,
} from "./providers/nba/balldontlie.js";

import {
  normalizeGame,
} from "./normalizers/nba.js";

import {
  writeTeamData,
} from "./writer.js";

const apiKey = process.env.BALLDONTLIE_API_KEY;

if (!apiKey) {
  console.error("❌ BALLDONTLIE_API_KEY is missing.");
  process.exit(1);
}

// Load project configuration
const config = JSON.parse(
  await fs.readFile("./config/teams.json", "utf8")
);

// Date range: today → 120 days
const today = new Date();

const end = new Date();
end.setDate(end.getDate() + 120);

const startDate = today.toISOString().split("T")[0];
const endDate = end.toISOString().split("T")[0];

console.log("🏀 Sports Planner");
console.log("📡 Connecting to BALLDONTLIE...");
console.log(`📅 Date range: ${startDate} → ${endDate}`);

try {
  // Fetch NBA teams once
  const nbaTeams = await getTeams(apiKey);

  // Process every configured team
  for (const teamConfig of config.teams) {
    console.log("");
    console.log(`🔄 Updating ${teamConfig.slug}...`);

    // V1 currently supports NBA + BALLDONTLIE
    if (
      teamConfig.sport !== "nba" ||
      teamConfig.provider !== "balldontlie"
    ) {
      console.warn(
        `⚠️ Unsupported configuration: ${teamConfig.sport}/${teamConfig.provider}`
      );
      continue;
    }

    // Find team from provider
    const team = nbaTeams.find(
      (nbaTeam) =>
        nbaTeam.abbreviation === teamConfig.abbreviation
    );

    if (!team) {
      console.warn(
        `⚠️ Team not found: ${teamConfig.slug}`
      );
      continue;
    }

    console.log(`✅ Found ${team.full_name}`);

    // Fetch games
    const rawGames = await getGames(
      apiKey,
      team.id,
      startDate,
      endDate
    );

    console.log(`📦 ${rawGames.length} games found`);

    // Convert provider format → Sports Planner format
    const games = rawGames
      .map((game) => normalizeGame(game, team))
      .sort(
        (a, b) =>
          new Date(a.datetime) - new Date(b.datetime)
      );

    // Final public JSON format
    const data = {
      schemaVersion: 1,

      sport: teamConfig.sport,

      updatedAt: new Date().toISOString(),

      range: {
        start: startDate,
        end: endDate,
      },

      team: {
        id: team.id,
        slug: teamConfig.slug,
        name: team.full_name,
        abbreviation: team.abbreviation,
      },

      games,
    };

    // Write public JSON
    const filePath = await writeTeamData(
      teamConfig.sport,
      teamConfig.slug,
      data
    );

    console.log(`💾 Written: ${filePath}`);
  }

  console.log("");
  console.log("🎉 All teams updated!");

} catch (error) {
  console.error("");
  console.error("❌ Update failed:", error.message);
  process.exit(1);
}