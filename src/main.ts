import { loadGameAssets } from './pixi/assets';
import './pixi/app';

import './css/style.css';
import { createLevel } from './level';
import { levels } from './levels';

loadGameAssets().then(() => {
	createLevel(levels[0]);
});
