import fs from "node:fs/promises";
import path from "node:path";

export async function writeTeamData(sport, slug, data) {
  const directory = path.join("data", sport);

  await fs.mkdir(directory, {
    recursive: true,
  });

  const filePath = path.join(
    directory,
    `${slug}.json`
  );

  await fs.writeFile(
    filePath,
    JSON.stringify(data, null, 2) + "\n",
    "utf8"
  );

  return filePath;
}