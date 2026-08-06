const BASE_URL = "https://api.balldontlie.io/v1";

function getHeaders(apiKey) {
  return {
    Authorization: apiKey,
  };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getTeams(apiKey) {
  const response = await fetch(`${BASE_URL}/teams`, {
    headers: getHeaders(apiKey),
  });

  if (!response.ok) {
    throw new Error(
      `BALLDONTLIE API error: ${response.status} ${response.statusText}`
    );
  }

  const json = await response.json();

  return json.data;
}

export async function getAllGames(apiKey, startDate, endDate) {
  const games = [];

  let cursor = null;
  let page = 1;

  while (true) {
    const params = new URLSearchParams();

    params.append("start_date", startDate);
    params.append("end_date", endDate);
    params.append("per_page", "100");

    if (cursor !== null) {
      params.append("cursor", cursor);
    }

    console.log(`   📄 Fetching games page ${page}...`);

    const response = await fetch(
      `${BASE_URL}/games?${params.toString()}`,
      {
        headers: getHeaders(apiKey),
      }
    );

    // Free plan: protect ourselves against rate limiting.
    if (response.status === 429) {
      console.log(
        "   ⏳ Rate limit reached. Waiting 15 seconds..."
      );

      await sleep(15000);
      continue;
    }

    if (!response.ok) {
      throw new Error(
        `BALLDONTLIE API error: ${response.status} ${response.statusText}`
      );
    }

    const json = await response.json();

    games.push(...json.data);

    console.log(
      `   ✅ ${json.data.length} games received (${games.length} total)`
    );

    const nextCursor = json.meta?.next_cursor;

    if (!nextCursor) {
      break;
    }

    cursor = nextCursor;
    page++;

    // Keep requests safely below the API rate limit.
    await sleep(13000);
  }

  return games;
}