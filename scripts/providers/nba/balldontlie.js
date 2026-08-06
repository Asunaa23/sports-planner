const BASE_URL = "https://api.balldontlie.io/v1";

export async function getTeams(apiKey) {
  const response = await fetch(`${BASE_URL}/teams`, {
    headers: {
      Authorization: apiKey,
    },
  });

  if (!response.ok) {
    throw new Error(
      `BALLDONTLIE API error: ${response.status} ${response.statusText}`
    );
  }

  const json = await response.json();

  return json.data;
}

export async function getGames(apiKey, teamId, startDate, endDate) {
  const params = new URLSearchParams();

  params.append("team_ids[]", teamId);
  params.append("start_date", startDate);
  params.append("end_date", endDate);
  params.append("per_page", "100");

  const response = await fetch(`${BASE_URL}/games?${params}`, {
    headers: {
      Authorization: apiKey,
    },
  });

  if (!response.ok) {
    throw new Error(
      `BALLDONTLIE API error: ${response.status} ${response.statusText}`
    );
  }

  const json = await response.json();

  return json.data;
}