// Tetris Kafkiano - Implementación en JavaScript

document.addEventListener('DOMContentLoaded', () => {
    // Configuración del canvas
    const canvas = document.getElementById('tetris');
    const ctx = canvas.getContext('2d');
    const startButton = document.getElementById('start-button');
    const pauseButton = document.getElementById('pause-button');
    
    // Tamaño de cada cuadro del tetris
    const BLOCK_SIZE = 30;
    // Dimensiones del tablero (en bloques)
    const BOARD_WIDTH = 10;
    const BOARD_HEIGHT = 20;
    
    // Colores para las diferentes piezas
    const COLORS = [
        null,
        '#FF0D72', // I
        '#0DC2FF', // J
        '#0DFF72', // L
        '#F538FF', // O
        '#FF8E0D', // S
        '#FFE138', // T
        '#3877FF'  // Z
    ];
    
    // Definición de las piezas de Tetris
    const PIECES = [
        // I
        [
            [0, 0, 0, 0],
            [1, 1, 1, 1],
            [0, 0, 0, 0],
            [0, 0, 0, 0]
        ],
        // J
        [
            [2, 0, 0],
            [2, 2, 2],
            [0, 0, 0]
        ],
        // L
        [
            [0, 0, 3],
            [3, 3, 3],
            [0, 0, 0]
        ],
        // O
        [
            [4, 4],
            [4, 4]
        ],
        // S
        [
            [0, 5, 5],
            [5, 5, 0],
            [0, 0, 0]
        ],
        // T
        [
            [0, 6, 0],
            [6, 6, 6],
            [0, 0, 0]
        ],
        // Z
        [
            [7, 7, 0],
            [0, 7, 7],
            [0, 0, 0]
        ]
    ];
    
    // Variables del juego
    let board = [];
    let gameOver = false;
    let paused = false;
    let dropCounter = 0;
    let dropInterval = 1000; // Tiempo en ms entre caídas
    let lastTime = 0;
    let score = 0;
    
    // Jugador (pieza actual)
    const player = {
        pos: {x: 0, y: 0},
        matrix: null,
        score: 0
    };
    
    // Inicialización del tablero
    function createBoard() {
        board = [];
        for (let y = 0; y < BOARD_HEIGHT; y++) {
            board.push(new Array(BOARD_WIDTH).fill(0));
        }
        return board;
    }
    
    // Dibujar un bloque
    function drawBlock(x, y, color) {
        ctx.fillStyle = color;
        ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
        ctx.strokeStyle = '#000';
        ctx.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
    }
    
    // Dibujar la matriz (pieza)
    function drawMatrix(matrix, offset) {
        matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    drawBlock(
                        x + offset.x,
                        y + offset.y,
                        COLORS[value]
                    );
                }
            });
        });
    }
    
    // Dibujar el tablero
    function drawBoard() {
        board.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    drawBlock(x, y, COLORS[value]);
                }
            });
        });
    }
    
    // Dibujar todo
    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawBoard();
        drawMatrix(player.matrix, player.pos);
    }
    
    // Combinar la pieza con el tablero cuando se asienta
    function merge() {
        player.matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    board[y + player.pos.y][x + player.pos.x] = value;
                }
            });
        });
    }
    
    // Comprobar colisiones
    function collide() {
        const [m, o] = [player.matrix, player.pos];
        for (let y = 0; y < m.length; y++) {
            for (let x = 0; x < m[y].length; x++) {
                if (m[y][x] !== 0 &&
                    (board[y + o.y] &&
                    board[y + o.y][x + o.x]) !== 0) {
                    return true;
                }
            }
        }
        return false;
    }
    
    // Rotar la pieza
    function rotate() {
        const matrix = player.matrix;
        const N = matrix.length;
        
        // Transponer la matriz
        for (let y = 0; y < N; y++) {
            for (let x = 0; x < y; x++) {
                [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
            }
        }
        
        // Invertir cada fila
        for (let y = 0; y < N; y++) {
            matrix[y].reverse();
        }
        
        // Comprobar si la rotación causa una colisión
        if (collide()) {
            // Si colisiona, deshacer la rotación
            rotate(); // Rotar 3 veces más para volver a la posición original
            rotate();
            rotate();
        }
    }
    
    // Mover la pieza (izquierda/derecha/abajo)
    function playerMove(dir) {
        player.pos.x += dir;
        if (collide()) {
            player.pos.x -= dir;
        }
    }
    
    // Hacer caer la pieza
    function playerDrop() {
        player.pos.y++;
        if (collide()) {
            player.pos.y--;
            merge();
            resetPlayer();
            clearLines();
            updateScore();
        }
        dropCounter = 0;
    }
    
    // Caída inmediata
    function playerDropToBottom() {
        while(!collide()) {
            player.pos.y++;
        }
        player.pos.y--;
        merge();
        resetPlayer();
        clearLines();
        updateScore();
        dropCounter = 0;
    }
    
    // Crear una nueva pieza aleatoria
    function createPiece() {
        const pieces = 'IJLOSTZ';
        const randPiece = pieces[Math.floor(Math.random() * pieces.length)];
        const index = pieces.indexOf(randPiece);
        return PIECES[index];
    }
    
    // Restablecer la posición del jugador con una nueva pieza
    function resetPlayer() {
        player.matrix = createPiece();
        player.pos.y = 0;
        player.pos.x = Math.floor(BOARD_WIDTH / 2) - Math.floor(player.matrix[0].length / 2);
        
        // Comprobar si el juego ha terminado
        if (collide()) {
            gameOver = true;
            alert('¡Juego terminado! Puntuación: ' + score);
        }
    }
    
    // Eliminar líneas completas
    function clearLines() {
        let linesCleared = 0;
        
        outer: for (let y = board.length - 1; y >= 0; y--) {
            for (let x = 0; x < board[y].length; x++) {
                if (board[y][x] === 0) {
                    continue outer;
                }
            }
            
            // Eliminar la línea
            const row = board.splice(y, 1)[0].fill(0);
            board.unshift(row);
            y++; // Para que no se salte una línea
            
            linesCleared++;
        }
        
        // Actualizar puntuación según las líneas eliminadas
        if (linesCleared > 0) {
            player.score += linesCleared * 100;
            // Aumentar la velocidad después de cierta puntuación
            if (player.score > 0 && player.score % 1000 === 0) {
                dropInterval = Math.max(100, dropInterval - 100);
            }
        }
    }
    
    // Actualizar puntuación en la interfaz
    function updateScore() {
        score = player.score;
    }
    
    // Bucle del juego
    function update(time = 0) {
        if (!gameOver && !paused) {
            const deltaTime = time - lastTime;
            lastTime = time;
            
            dropCounter += deltaTime;
            if (dropCounter > dropInterval) {
                playerDrop();
            }
            
            draw();
        }
        
        requestAnimationFrame(update);
    }
    
    // Iniciar el juego
    function startGame() {
        gameOver = false;
        paused = false;
        player.score = 0;
        dropInterval = 1000;
        createBoard();
        resetPlayer();
        update();
    }
    
    // Manejo de eventos de teclado
    document.addEventListener('keydown', event => {
        if (gameOver || paused) return;
        
        switch (event.keyCode) {
            case 37: // Flecha izquierda
                playerMove(-1);
                break;
            case 39: // Flecha derecha
                playerMove(1);
                break;
            case 40: // Flecha abajo
                playerDrop();
                break;
            case 38: // Flecha arriba
                rotate();
                break;
            case 32: // Espacio
                playerDropToBottom();
                break;
        }
    });
    
    // Botones de control
    startButton.addEventListener('click', () => {
        startGame();
    });
    
    pauseButton.addEventListener('click', () => {
        paused = !paused;
        pauseButton.textContent = paused ? 'Reanudar' : 'Pausar';
    });
    
    // Inicializar el juego
    createBoard();
});
