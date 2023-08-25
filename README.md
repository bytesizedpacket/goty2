# GAME OF THE YEAR 2

A project based on the [Gjorg's Arena](https://github.com/bytesizedpacket/arena) codebase, intended to be an experimental playground with no particular design direction.

The project currently features a multiplayer lobby where an arbitrary number of clients can connect. Other players can see each other's position, health, username, and currently equipped weapon.

- Move character with `WASD`
- Select weapon with `Q` and `E`
- Attack other players by left-clicking them within your weapon's range
- Set your username with the `?name=[x]` URL variable.

The name "GOTY2" is a reference to an old multiplayer chatroom named "GOTY" that was developed by BSP as a tech demo.

Made with PIXI.JS, Socket.IO, Typescript, and Webpack.

- Make sure you have [node.js](https://nodejs.org/en/download/) and `npm` installed to compile this project.
- Clone this repository with `git clone https://github.com/bytesizedpacket/goty2.git`
- Use `npm install .` in the project directory to ensure all necessary dependencies are present.
- Use `npm run-script server` on the same IP the client will be hosted from to start the server. The server runs on port `3000`.
- Use `npm run-script build` to compile the client in the `dist` directory. This directory is ready to be served as-is from your webserver.
- Alternatively, use `npm run-script start` to run a webserver at `localhost:8080` that will automatically recompile and refresh clients when you save any source file.

Play it now at [goty2.floof.zone](http://goty2.floof.zone)

This project currently uses icons from [Pixeltier's Modern RPG Icon Pack](https://pixeltier.itch.io/pixeltiers-modern-rpg-icon-set) and [Pixel_Poem Dungeon Tileset](https://pixel-poem.itch.io/dungeon-assetpuck), as well as [Justin's 16x16 Icon Pack](https://zeromatrix.itch.io/rpgiab-icons), which is licensed under [CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/).
