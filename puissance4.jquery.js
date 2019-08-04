$.fn.puissance4 = function (settings)
{
    let canvasElement = $('<canvas>').appendTo($(this));
    let game = new Connect4Game(canvasElement, settings);
    game.start();
};

var c_cellSize = 80;
var c_spacing = 10;
var c_arrowSize = 15;
var c_gridBackgroundColor = '#007fff';

class PlayerInfo {
    constructor(id, color) {
        this.playerId = id;
        this.color = color;
    }
}

class MatchState {
    constructor() {
        this.currentPlayerId = null;
    }

    setCurrentPlayerId(newPlayerId) {
        this.currentPlayerId = newPlayerId;
    }
}

class GameBoardCell {
    constructor(board, posX, posY) {
        this.ownerBoard = board;
        this.ownerPlayer = null;
        this.posX = posX;
        this.posY = posY;
    }

    getFillColor() {
        let board = this.ownerBoard;
        let game = board.ownerGame;

        if (this.ownerPlayer !== null)
            return this.ownerPlayer.color + "FF";

        if (this.ownerBoard.currentHintedCell === this)
            return game.getCurrentPlayer().color + "7F";

        return "white";
    }

    getPosX2D() {
        return c_spacing + (this.posX * (c_cellSize + c_spacing)) + (c_cellSize / 2);
    }

    getPosY2D() {
        return (c_arrowSize + c_spacing) + c_spacing + (this.posY * (c_cellSize + c_spacing)) + (c_cellSize / 2);
    }

    /**
     * @param {HTMLCanvasElement} canvas
     */
    render(canvas) {
        let context = canvas.getContext('2d');
        context.beginPath();
        context.arc(this.getPosX2D(), this.getPosY2D(), c_cellSize / 2, 0, 2 * Math.PI);
        context.fillStyle = "white";
        context.fill();
        context.fillStyle = this.getFillColor();
        context.fill();
    }
}

class GameBoard
{
    constructor(game, numCellsX, numCellsY) {
        this.ownerGame = game;
        this.numCellsX = numCellsX;
        this.numCellsY = numCellsY;
        this.currentHoveredColumn = null;
        this.populateCells();
    }

    populateCells() {
        this.cells = [];
        for (let iRow = 0; iRow < this.numCellsY; ++iRow) {
            this.cells[iRow] = [];
            for (let iCol = 0; iCol < this.numCellsX; ++iCol)
                this.cells[iRow][iCol] = new GameBoardCell(this, iCol, iRow);
        }
    }

    /**
     * @param {number} iRow
     * @param {number} iCol
     * @returns {GameBoardCell}
     */
    getCell(iRow, iCol) {
        return this.cells[iRow][iCol];
    }

    /**
     * @param {number} iCol 
     */
    getAvailableCellInColumn(iCol) {
        let result = null;

        for(let iRow = 0; iRow < this.numCellsY; ++iRow) {
            let cell = this.cells[iRow][iCol];
            if (cell.ownerPlayer === null)
                result = cell;
        }
        
        return result;
    }

    getCellAtPos2D(x, y) {
        for (let iRow = 0; iRow < this.numCellsY; ++iRow) {
            for (let iCol = 0; iCol < this.numCellsX; ++iCol) {
                let cell = this.getCell(iRow, iCol);
                let cellPosX = cell.getPosX2D() - (c_cellSize / 2);
                let cellPosY = cell.getPosY2D() - (c_cellSize / 2);

                if (cellPosX <= x
                    && x <= cellPosX + c_cellSize
                    && cellPosY <= y
                    && y <= cellPosY + c_cellSize)
                    return cell;
            }
        }

        return null;
    }

    getColumnAtPos2D(x) {
        for (let iRow = 0; iRow < this.numCellsY; ++iRow) {
            for (let iCol = 0; iCol < this.numCellsX; ++iCol) {
                let cell = this.getCell(iRow, iCol);
                let cellPosX = cell.getPosX2D() - (c_cellSize / 2);

                if (cellPosX <= x && x <= cellPosX + c_cellSize)
                    return cell.posX;
            }
        }

        return null;
    }

    drawArrow(context, iColumn) {
        let width = c_cellSize / 2;
        let left = this.cells[0][iColumn].getPosX2D() - (width / 2);
        let activePlayer = this.ownerGame.getCurrentPlayer();

        context.strokeStyle = "black";
        context.fillStyle = activePlayer.color;
        context.beginPath();
        context.moveTo(left, c_spacing);
        context.lineTo(left + width, c_spacing);
        context.lineTo(left + (width / 2), c_spacing + c_arrowSize);
        context.lineTo(left, c_spacing);
        context.closePath();
        context.stroke();
        context.fill();
    }

    render(canvas) {
        canvas.height = ((c_cellSize + c_spacing) * this.numCellsY) + c_spacing + (c_arrowSize + c_spacing);
        canvas.width = ((c_cellSize + c_spacing) * this.numCellsX) + c_spacing;

        let context = canvas.getContext('2d');
        context.fillStyle = c_gridBackgroundColor;
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.fillRect(0, 0, canvas.width, canvas.height);

        for (let iRow = 0; iRow < this.numCellsY; ++iRow) {
            for (let iCol = 0; iCol < this.numCellsX; ++iCol) {
                if (this.currentHoveredColumn === iCol)
                    this.drawArrow(context, iCol);

                this.cells[iRow][iCol].render(canvas);
            }
        }
    }
}

class Connect4Game {
    constructor(canvasElement, settings) {
        this.canvas = canvasElement;
        this.board = new GameBoard(this, 7, 6);
        this.matchState = new MatchState();
        this.players = [];

        this.setupPlayers();
        this.setupEvents();
    }

    start() {
        this.matchState.currentPlayerId = 0;
        this.render();
    }

    setupPlayers() {
        this.players = [];

        let p1 = new PlayerInfo(1, "#FF0000");
        let p2 = new PlayerInfo(2, "#FFFF00");

        this.players = [p1, p2];
    }

    setupEvents() {
        let self = this;
        this.canvas.click(function (e) {
            self.onCanvasClick(e);
        });
        this.canvas.mousemove(function (e) {
            self.onCanvasHover(e);
        });
    }

    render() {
        this.board.render(this.canvas[0]);
    }

    getCurrentPlayer() {
        return this.players[this.matchState.currentPlayerId];
    }

    /**
     * @param {MouseEvent} event
     */
    onCanvasHover(event) {
        if (this.matchState.currentPlayerId === null)
            return false;

        let mouseLeft = event.pageX - this.canvas[0].offsetLeft;
        let mouseTop = event.pageY - this.canvas[0].offsetTop;
        let shouldRedraw = false;
        let matchedAnything = false;

        let column = this.board.getColumnAtPos2D(mouseLeft, mouseTop);
        if (column !== null)
        {
            matchedAnything = true;

            if (this.board.currentHoveredColumn !== column) {
                this.board.currentHoveredColumn = column;
                this.board.currentHintedCell = this.board.getAvailableCellInColumn(column);
                shouldRedraw = true;
            }
        }

        if (!matchedAnything) {
            this.board.currentHoveredColumn = null;
            shouldRedraw = true;
        }

        if (shouldRedraw)
            this.render();
    }

    /**
     * @param {MouseEvent} event
     */
    onCanvasClick(event) {
        let matchState = this.matchState;
        if (matchState.currentPlayerId === null)
            return false;

        let mouseLeft = event.pageX - this.canvas[0].offsetLeft;        
        let board = this.board;
        let column = board.getColumnAtPos2D(mouseLeft);

        if (column === null)
            return false;

        let cell = board.getAvailableCellInColumn(column);
        if (cell === null || cell.ownerPlayer !== null)
            return false;

        cell.ownerPlayer = this.getCurrentPlayer();
        let activePlayerId = matchState.currentPlayerId;
        activePlayerId = (activePlayerId + 1) % this.players.length;
        matchState.setCurrentPlayerId(activePlayerId);

        this.board.currentHintedCell = this.board.getAvailableCellInColumn(column);
        this.render();
    }
}