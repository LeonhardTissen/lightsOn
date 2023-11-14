import { loadGameAssets } from './pixi/assets';
import './pixi/app';

import './css/style.css';
import { startGame } from './game';

loadGameAssets().then(startGame);
