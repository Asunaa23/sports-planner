export function normalizeGame(game, team) {
  const isHome = game.home_team.id === team.id;

  const opponent = isHome
    ? game.visitor_team
    : game.home_team;

  return {
    id: game.id,
    date: game.date,
    datetime: game.datetime,
    season: game.season,

    home: isHome,

    opponent: {
      id: opponent.id,
      name: opponent.full_name,
      abbreviation: opponent.abbreviation,
    },

    status: game.status,
    postponed: game.postponed,
  };
}