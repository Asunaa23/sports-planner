export function normalizeTeam(team) {
  return {
    id: team.id,
    name: team.full_name,
    abbreviation: team.abbreviation,
    city: team.city,
    conference: team.conference,
    division: team.division,
  };
}

export function normalizeGame(game) {
  return {
    id: game.id,
    date: game.date,
    datetime: game.datetime,
    season: game.season,

    home: {
      id: game.home_team.id,
      name: game.home_team.full_name,
      abbreviation: game.home_team.abbreviation,
    },

    away: {
      id: game.visitor_team.id,
      name: game.visitor_team.full_name,
      abbreviation: game.visitor_team.abbreviation,
    },
   
    score: {
      home: game.home_team_score ?? null,
      away: game.visitor_team_score ?? null,
    },

    status: game.status,
    postseason: game.postseason,
    postponed: game.postponed,
  };
}