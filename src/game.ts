import { Container, Sprite } from 'pixi.js';
import { app } from './pixi/app';
import { getTexture } from './pixi/assets';
import { Level, levels } from './levels';
import { Howl } from 'howler';
import spriteData from './assets/sprite.json';

const tileSize = 160;

interface Light {
	lit: boolean;
	sprite: Sprite;
}

let currentLevel: number = 0;
let width: number = 0;
let height: number = 0;
let levelTransition: boolean = false;

let container: null | Container = null;
let lightLookup: Record<number, Light> = {};

const overlay = document.getElementById('overlay') as HTMLElement;
const levelNum = document.getElementById('levelNum') as HTMLElement;
const levelText = document.getElementById('levelText') as HTMLElement;
const restart = document.getElementById('restart') as HTMLElement;
const bestpossible = document.getElementById('bestpossibletext') as HTMLElement;
const userclicks = document.getElementById('userclicks') as HTMLElement;
let moves: number = 0;

const sound = new Howl({
	src: spriteData.urls,
	sprite: {
		next: [spriteData.sprite.next[0], spriteData.sprite.next[1]],
		off: [spriteData.sprite.off[0], spriteData.sprite.off[1]],
		on: [spriteData.sprite.on[0], spriteData.sprite.on[1]],
		win: [spriteData.sprite.win[0], spriteData.sprite.win[1]],
	},
});

function restartGame(): void {
	if (levelTransition) return;
	startGame();
	sound.play('off');
}
restart.addEventListener('click', restartGame);

export function startGame(): void {
	createLevel(levels[currentLevel]);
}
document.body.addEventListener('keydown', (ev) => {
	if (ev.code === 'KeyR') {
		restartGame();
	}
});

function createLevel(level: Level): void {
	const [w, h, best, data] = level;
	if (container !== null) {
		container.destroy({ children: true });
	}

	lightLookup = {};
	container = new Container();
	width = w;
	height = h;
	moves = 0;
	userclicks.innerText = '0';

	if (data.length !== width * height) {
		throw new Error(`Invalid data length ${width * height} !== ${data.length}`);
	}

	bestpossible.innerText = `${best}`;

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
					flipPlus(posId);
				});
				sprite.on('touchstart', () => {
					flipPlus(posId);
				});

				// sprite.on('rightclick', () => {
				// 	flipLight(posId);
				// });

				sprite.cursor = 'pointer';
			}
		}
	}
	positionLevelContainer();

	app.stage.addChild(container);
}

function positionLevelContainer(): void {
	if (container === null) return;

	const scale = Math.min(1, Math.min(window.innerWidth / width, window.innerHeight / height) / tileSize);
	container.position.set(
		(window.innerWidth - width * tileSize * scale) / 2,
		(window.innerHeight - height * tileSize * scale) / 2,
	);
	container.pivot.set(0.5, 0.5);
	container.scale.set(scale, scale);
}
window.addEventListener('resize', positionLevelContainer);

function flipPlus(posId: number): void {
	const x = posId % width;
	const y = Math.floor(posId / width);
	flipLight(posId);
	moves ++;
	userclicks.innerText = `${moves}`;
	const light = lightLookup[posId];
	if (light !== undefined) {
		sound.play(light.lit ? 'off' : 'on');
	}

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

	checkWin();
}
function flipLight(id: number): void {
	const light = lightLookup[id];
	if (light === undefined) return;
	light.lit = !light.lit;
	light.sprite.texture = getTexture(`glass${light.lit ? 'lit' : ''}`);
}

function checkWin(): void {
	const hasWon = !Object.values(lightLookup).some((light) => !light.lit);

	exportLevel();
	if (!hasWon) return;

	levelTransition = true;
	currentLevel ++;
	const nextLevel = levels[currentLevel];

	overlay.style.pointerEvents = 'all';
	overlay.style.opacity = '1';
	sound.play('win');

	setTimeout(() => {
		levelText.style.opacity = '1';
	}, 1000);

	if (nextLevel === undefined) {
		levelText.innerText = 'You win! Thanks for playing.';
		return;
	}

	setTimeout(() => {
		sound.play('next');
		levelNum.innerText = `${currentLevel + 1}`;
		createLevel(nextLevel);
	}, 2000);

	setTimeout(() => {
		overlay.style.opacity = '0';
		overlay.style.pointerEvents = 'none';
		levelText.style.opacity = '0';
		levelTransition = false;
	}, 3000);
}

function setCharAt(str: string, index: number, char: string): string {
	if(index > str.length - 1) return str;
	return str.substring(0,index) + char + str.substring(index+1);
}

function exportLevel(): void {
	let output = ' '.repeat(width * height);
	for (const [keyStr, value] of Object.entries(lightLookup)) {
		const key = parseInt(keyStr);
		output = setCharAt(output, key, value.lit ? 'X' : 'O');
	}
	console.log(output);
}
