
var requestAnimFrame = (function () {
    return window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        function (callback) {
            window.setTimeout(callback, 1000 / 60);
        };
})();


var canvas = document.createElement("canvas");
var ctx = canvas.getContext("2d");
canvas.width = 512;
canvas.height = 480;
document.body.appendChild(canvas);


var lastTime;
function main() {
    var now = Date.now();
    var dt = (now - lastTime) / 1000.0;

    update(dt);
    render();

    lastTime = now;
    requestAnimFrame(main);
};

function init() {
    terrainPattern = ctx.createPattern(resources.get('img/terrain.png'), 'repeat');

    document.getElementById('play-again').addEventListener('click', function () {
        reset();
    });

    reset();
    lastTime = Date.now();
    main();
}

resources.load([
    'img/sprites.png',
    'img/terrain.png'
]);
resources.onReady(init);


var player = {
    pos: [0, 0],
    sprite: new Sprite('img/sprites.png', [0, 0], [39, 39], 16, [0, 1])
};


var bullets = [];
var enemies = [];
var explosions = [];
var megaliths = [];

var lastFire = Date.now();
var gameTime = 0;
var isGameOver;
var level = 0;
var terrainPattern;

var score = 0;
var scoreEl = document.getElementById('score');
var levelEl = document.getElementById('level');

var playerSpeed = 200;
var bulletSpeed = 500;
var enemySpeed = 50;


function stonesForLevel(currentlevel) {


    megaliths.push({
        pos: [100 * currentlevel, currentlevel * 10],
        sprite: new Sprite('img/sprites.png', [80, 5], [30, 30],
            10, [0, 1])
    });
    megaliths.push({
        pos: [300, 100 * currentlevel],
        sprite: new Sprite('img/sprites.png', [80, 5], [30, 30],
            10, [0, 1])
    });
    megaliths.push({
        pos: [400 * currentlevel, 400],
        sprite: new Sprite('img/sprites.png', [80, 5], [30, 30],
            10, [0, 1])
    });
    megaliths.push({
        pos: [150 * currentlevel, 400],
        sprite: new Sprite('img/sprites.png', [80, 5], [30, 30],
            10, [0, 1])
    });
    megaliths.push({
        pos: [200 * currentlevel, 200],
        sprite: new Sprite('img/sprites.png', [80, 5], [30, 30],
            10, [0, 1])
    });
}



function update(dt) {
    gameTime += dt;

    handleInput(dt);
    updateEntities(dt);

    stonesForLevel(level);
 
    if (Math.random() < 1 - Math.pow(.993, gameTime)) {
        enemies.push({
            pos: [canvas.width,
            Math.random() * (canvas.height - 39)],
            sprite: new Sprite('img/sprites.png', [0, 78], [80, 39],
                6, [0, 1, 2, 3, 2, 1])
        });
    }

    checkCollisions();

    scoreEl.innerHTML = score;
    levelEl.innerHTML = level;
};



function handleInput(dt) {
    if (input.isDown('DOWN') || input.isDown('s')) {
        player.pos[1] += playerSpeed * dt;
    }

    if (input.isDown('UP') || input.isDown('w')) {
        player.pos[1] -= playerSpeed * dt;
    }

    if (input.isDown('LEFT') || input.isDown('a')) {
        player.pos[0] -= playerSpeed * dt;
    }

    if (input.isDown('RIGHT') || input.isDown('d')) {
        player.pos[0] += playerSpeed * dt;
    }

    if (input.isDown('SPACE') &&
        !isGameOver &&
        Date.now() - lastFire > 100) {
        var x = player.pos[0] + player.sprite.size[0] / 2;
        var y = player.pos[1] + player.sprite.size[1] / 2;

        bullets.push({
            pos: [x, y],
            dir: 'forward',
            sprite: new Sprite('img/sprites.png', [0, 39], [18, 8])
        });
        bullets.push({
            pos: [x, y],
            dir: 'up',
            sprite: new Sprite('img/sprites.png', [0, 50], [9, 5])
        });
        bullets.push({
            pos: [x, y],
            dir: 'down',
            sprite: new Sprite('img/sprites.png', [0, 60], [9, 5])
        });

        lastFire = Date.now();
    }
}

function updateEntities(dt) {
   
    player.sprite.update(dt);


    for (var i = 0; i < bullets.length; i++) {
        var bullet = bullets[i];

        switch (bullet.dir) {
            case 'up': bullet.pos[1] -= bulletSpeed * dt; break;
            case 'down': bullet.pos[1] += bulletSpeed * dt; break;
            default:
                bullet.pos[0] += bulletSpeed * dt;
        }

    
        if (bullet.pos[1] < 0 || bullet.pos[1] > canvas.height ||
            bullet.pos[0] > canvas.width) {
            bullets.splice(i, 1);
            i--;
        }
    }


    for (var i = 0; i < enemies.length; i++) {
        enemies[i].pos[0] -= enemySpeed * dt;
        enemies[i].sprite.update(dt);


     
        if (enemies[i].pos[0] + enemies[i].sprite.size[0] < 0) {
            enemies.splice(i, 1);
            i--;
        }
    }

   
    for (var i = 0; i < explosions.length; i++) {
        explosions[i].sprite.update(dt);

 
        if (explosions[i].sprite.done) {
            explosions.splice(i, 1);
            i--;
        }
    }
}



function collides(x, y, r, b, x2, y2, r2, b2) {
    return !(r <= x2 || x > r2 ||
        b <= y2 || y > b2);
}

function boxCollides(pos, size, pos2, size2) {
    return collides(pos[0], pos[1],
        pos[0] + size[0], pos[1] + size[1],
        pos2[0], pos2[1],
        pos2[0] + size2[0], pos2[1] + size2[1]);
}

function checkCollisions() {
    checkPlayerBounds();

    for (var i = 0; i < enemies.length; i++) {
        var pos = enemies[i].pos;
        var size = enemies[i].sprite.size;

        for (var j = 0; j < bullets.length; j++) {
            var pos2 = bullets[j].pos;
            var size2 = bullets[j].sprite.size;

            if (boxCollides(pos, size, pos2, size2)) {
                
                enemies.splice(i, 1);
                i--;                
                score += 100;

                explosions.push({
                    pos: pos,
                    sprite: new Sprite('img/sprites.png',
                        [0, 117],
                        [39, 39],
                        16,
                        [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
                        null,
                        true)
                });

                
                     bullets.splice(j, 1);
                break;
            }
        }

        if (boxCollides(pos, size, player.pos, player.sprite.size)) {
            gameOver();
        }
    }
    

    for (var k = 0; k < megaliths.length; k++) {
        var pos = megaliths[k].pos;
        var size = megaliths[k].sprite.size;

        for (var j = 0; j < bullets.length; j++) {
            var pos2 = bullets[j].pos;
            var size2 = bullets[j].sprite.size;

            if (boxCollides(pos, size, pos2, size2)) {

                bullets.splice(j, 1);
                break;
            }
        }

        if (boxCollides(pos, size, player.pos, player.sprite.size)) {
            gameOver();
        }

    }

    for (var k = 0; k < megaliths.length; k++) {
        var pos = megaliths[k].pos;
        var size = megaliths[k].sprite.size;

        for (var j = 0; j < enemies.length; j++) {
            var pos2 = enemies[j].pos;
            var size2 = enemies[j].sprite.size;

            if (boxCollides(pos, size, pos2, size2)) {
                enemies.splice(j, 1);
                j--;
                var y = pos[1] + size[1] / 2;
                var y2 = pos2[1] + size2[1] / 2;
                if (y2 > y) {

                    enemies.push({
                        pos: [pos2[0], pos2[1] + 10],
                        sprite: new Sprite('img/sprites.png', [0, 78], [80, 39], 6, [0, 1, 2, 3, 2, 1])
                    });
                    j++;

                }

                if (y2 <= y) {

                    enemies.push({
                        pos: [pos2[0], pos2[1] - 10],
                        sprite: new Sprite('img/sprites.png', [0, 78], [80, 39], 6, [0, 1, 2, 3, 2, 1])
                    });
                    j++;


                }
                break;
            }

            if (boxCollides(pos, size, player.pos, player.sprite.size)) {
                gameOver();
            }
        }
    }



}





function checkPlayerBounds() {
 
    if (player.pos[0] < 0) {
        player.pos[0] = 0;
    }
    else if (player.pos[0] > canvas.width - player.sprite.size[0]) {
        player.pos[0] = canvas.width - player.sprite.size[0];
    }

    if (player.pos[1] < 0) {
        player.pos[1] = 0;
    }
    else if (player.pos[1] > canvas.height - player.sprite.size[1]) {
        player.pos[1] = canvas.height - player.sprite.size[1];
    }
}

function render() {
    ctx.fillStyle = terrainPattern;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

  
    if (!isGameOver) {
        renderEntity(player);
    }
    
    renderEntities(bullets);
    renderEntities(enemies);
    renderEntities(explosions);
    renderEntities(megaliths);
};

function renderEntities(list) {
    for (var i = 0; i < list.length; i++) {
        renderEntity(list[i]);
    }
}

function renderEntity(entity) {
    ctx.save();
    ctx.translate(entity.pos[0], entity.pos[1]);
    entity.sprite.render(ctx);
    ctx.restore();
}


function gameOver() {
    document.getElementById('game-over').style.display = 'block';
    document.getElementById('game-over-overlay').style.display = 'block';
    isGameOver = true;
}


function reset() {
    document.getElementById('game-over').style.display = 'none';
    document.getElementById('game-over-overlay').style.display = 'none';
    isGameOver = false;
    gameTime = 0;
    score = 0;
    level++;
    megaliths = [];
    bullets = [];
    enemies = [];
    player.pos = [50, canvas.height / 2];
};