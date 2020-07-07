# GAME OF THE YEAR 2

A project based on the [Gjorg's Arena](https://github.com/bytesizedpacket/arena) codebase, intended to be an experimental playground with no particular design direction.

The name "GOTY2" is a reference to an old multiplayer chatroom named "GOTY" that was developed by BSP as a tech demo.

Made with PIXI.JS, Typescript, and Webpack.

- Make sure you have [node.js](https://nodejs.org/en/download/) and `npm` installed to compile this project.
- Clone this repository with `git clone https://github.com/bytesizedpacket/goty2.git`
- Use `npm install .` in the project directory to ensure all necessary dependencies are present.
- Use `npm run-script build` to generate output in the `dist` directory. This directory is ready to be served from your webserver.
- OR
- Use `npm run-script start` to run a webserver at localhost:8080 that will automatically recompile and refresh when you save any source file.

For multiplayer functionality, use `npm run-script server` on the same IP the client is served from.

This project currently uses icons from [Pixeltier's Modern RPG Icon Pack](https://pixeltier.itch.io/pixeltiers-modern-rpg-icon-set) and [Pixel_Poem Dungeon Tileset](https://pixel-poem.itch.io/dungeon-assetpuck), as well as [Justin's 16x16 Icon Pack](https://zeromatrix.itch.io/rpgiab-icons), which is licensed under [CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/).
