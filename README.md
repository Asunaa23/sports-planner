# Sports Planner

Sports Planner is an open-source browser extension for viewing sports schedules and results directly from your browser.

The project is currently in development. **NBA support is available in version 0.1.0.**

> Sports Planner is an independent and unofficial project. It is not affiliated with or endorsed by the NBA, its teams, or BALLDONTLIE.

## Features

### NBA

- View NBA games by date
- Browse the NBA schedule
- Filter games by one or multiple teams
- Search for teams
- Remember selected teams between sessions
- Display game times in the user's local timezone
- Display final scores for completed games
- Navigate between available game days
- Automatic sports data updates

Additional sports and leagues may be added in future versions.

## How it works

Sports Planner separates data collection from the browser extension.

```text
BALLDONTLIE API
        │
        ▼
GitHub Actions
        │
        ▼
Data normalization
        │
        ▼
data/nba/schedule.json
        │
        ▼
Browser extension
        │
        ▼
Sports Planner
```

The BALLDONTLIE API key is never included in the browser extension or exposed to its users.

Sports data is periodically retrieved and converted into Sports Planner's internal data format before being consumed by the extension.

## Automatic updates

Sports data is automatically refreshed using GitHub Actions.

The current workflow runs approximately every 6 hours.

```text
.github/workflows/update-games.yml
```

API credentials are stored using GitHub Actions Secrets and are not included in the repository.

## Project structure

```text
sports-planner/
├── .github/
│   └── workflows/
│       └── update-games.yml
├── config/
│   └── teams.json
├── data/
│   └── nba/
│       └── schedule.json
├── extension/
│   ├── icons/
│   ├── manifest.json
│   ├── popup.css
│   ├── popup.html
│   └── popup.js
├── scripts/
│   ├── normalizers/
│   │   └── nba.js
│   ├── providers/
│   │   └── nba/
│   │       └── balldontlie.js
│   ├── update-games.js
│   └── writer.js
├── .gitignore
├── LICENSE
├── package.json
└── package-lock.json
```

## Installation

Sports Planner can currently be installed as an unpacked Chromium extension.

### Chrome / Brave / Chromium-based browsers

1. Clone or download this repository.
2. Open your browser's extensions management page.
3. Enable **Developer mode**.
4. Click **Load unpacked**.
5. Select the `extension/` directory.
6. Pin Sports Planner to the browser toolbar if desired.

No API key is required to use the browser extension.

## Development

### Requirements

- Node.js
- npm
- A BALLDONTLIE API key

Install the dependencies:

```bash
npm install
```

Create a `.env` file at the root of the project:

```text
BALLDONTLIE_API_KEY=your_api_key_here
```

Never commit your `.env` file or API credentials.

Run the data update pipeline with:

```bash
npm run update
```

The generated NBA schedule is written to:

```text
data/nba/schedule.json
```

## Data Source

Sports data used by Sports Planner is obtained through the BALLDONTLIE API and processed into Sports Planner's internal data format.

BALLDONTLIE provides sports data on a best-effort basis. Sports Planner does not represent this data as official league data.

Use of BALLDONTLIE services remains subject to the BALLDONTLIE Terms of Service.

## Privacy

Sports Planner does not require a user account.

Team preferences are stored locally using the browser extension storage API.

The extension does not expose the project's BALLDONTLIE API credentials to users.

## Status

Current version:

```text
0.1.0
```

| Sport / League | Status |
| --- | --- |
| NBA | Supported |
| Additional sports | Planned |

Sports Planner is under active development. Features, data formats, and the user interface may change before version 1.0.0.

## Roadmap

Potential future improvements include:

- Additional sports and leagues
- Improved schedule navigation
- Additional game information
- UI and accessibility improvements
- Browser extension store distribution

## Contributing

Issues, suggestions, and contributions are welcome.

As the project is still in early development, major architectural changes should preferably be discussed before implementation.

## License

Sports Planner source code is licensed under the MIT License.

The MIT License applies to the original source code of Sports Planner.

Third-party trademarks, league names, team names, sports data, and other third-party materials remain the property of their respective owners and are not licensed under the MIT License.

See the `LICENSE` file for the full license text.

## Disclaimer

Sports Planner is an independent and unofficial open-source project.

It is not affiliated with, endorsed by, or sponsored by the NBA, its teams, BALLDONTLIE, or any other sports league or organization.

NBA and team names are used solely for identification purposes. All trademarks belong to their respective owners.

Sports Planner does not claim that the displayed data is official league data.
