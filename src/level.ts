import { Container, Sprite } from 'pixi.js';
import { app } from './pixi/app';
import { getTexture } from './pixi/assets';
import { Level } from './levels';

const tileSize = 160;

interface Light {
	lit: boolean;
	sprite: Sprite;
}

let width: number = 0;
let height: number = 0;

let container: null | Container = null;
let lightLookup: Record<number, Light> = {};

export function createLevel(level: Level): void {
	const [w, h, data] = level;
	if (container !== null) {
		container.destroy({ children: true });
	}

	lightLookup = {};
	container = new Container();
	width = w;
	height = h;

	if (data.length !== width * height) {
		throw new Error(`Invalid data length ${width * height} !== ${data.length}`);
	}

	for (let x = 0; x < width; x ++) {
		for (let y = 0; y < height; y ++) {
			const posId = x + y * width;
			const tile = data[posId];
			if (tile !== ' ') {
				const lit = tile === 'X';
				const sprite = new Sprite(getTexture(`glass${lit ? 'lit' : ''}`));
				sprite.position.set(x * tileSize, y * tileSize);
				container.addChild(sprite);
				lightLookup[posId] = { sprite, lit };

				sprite.interactive = true;
				sprite.on('click', () => {
					flipLight(posId);
					if (x > 0) {
						flipLight(posId - 1);
					}
					if (x < width - 1) {
						flipLight(posId + 1);
					}
					if (y > 0) {
						flipLight(posId - width);
					}
					if (y < height - 1) {
						flipLight(posId + width);
					}
				});
				sprite.cursor = 'pointer';
			}
		}
	}
	positionLevelContainer();

	app.stage.addChild(container);
}

export function positionLevelContainer(): void {
	if (container === null) return;

	container.position.set(
		(window.innerWidth - width * tileSize) / 2,
		(window.innerHeight - height * tileSize) / 2,
	);
}
window.addEventListener('resize', positionLevelContainer);

export function flipLight(id: number): void {
	const light = lightLookup[id];
	if (light === undefined) return;
	light.lit = !light.lit;
	light.sprite.texture = getTexture(`glass${light.lit ? 'lit' : ''}`);
}
