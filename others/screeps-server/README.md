# Screeps Server

## Requirements
- Node v10


## How to install
`npm install`


## How to run
1. Init the server (only once): `npm run init`.
1. Modify `mods.json` to add all plugins.
1. Start the server: `npm run start`.


## Set user password
To allow using the API to read/write information into the account, we need to set a password.

1. Make sure `screepsmod-auth` is added in `mods.json`.
1. Connect in the server: `npm run cli`.
1. Set the user password: `setPassword('<username>', 'password')`.


## How to change the tick duration
1. Connect to the server: `npm run cli`.
1. Set the tick duration: `system.setTickDuration(ms)`.
