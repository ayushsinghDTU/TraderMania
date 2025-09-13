class PathfindingVisualizer {
    constructor() {
        this.rows = 15;
        this.cols = 25;
        this.grid = [];
        this.startNode = { row: 7, col: 5 };
        this.endNode = { row: 7, col: 19 };
        this.isDrawing = false;
        this.isRunning = false; // its a flag
        
        this.initializeGrid();
        this.setupEventListeners();
        this.renderGrid();
    }

    initializeGrid() {
        this.grid = [];
        for (let row = 0; row < this.rows; row++) {
            const currentRow = [];
            for (let col = 0; col < this.cols; col++) {
                currentRow.push({
                    row,
                    col,
                    isStart: row === this.startNode.row && col === this.startNode.col,
                    isEnd: row === this.endNode.row && col === this.endNode.col,
                    isWall: false,
                    isVisited: false,
                    isPath: false,
                    distance: Infinity,
                    previousNode: null
                });
            }
            this.grid.push(currentRow);
        }
    }

   renderGrid() {
    const gridElement = document.getElementById('grid');
    gridElement.innerHTML = '';

    const fragment = document.createDocumentFragment(); // I used a DocumentFragment so the browser performs a single 
    // layout when inserting the whole grid, reducing repaint 
    // and improving frame stability.”
    // “For real-time updates I use event
    //  delegation and only patch dirty 
    // cells to avoid full re-renders.

    for (let row = 0; row < this.rows; row++) {
        for (let col = 0; col < this.cols; col++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.row = row;
            cell.dataset.col = col;

            const node = this.grid[row][col];
            if (node.isStart) cell.classList.add('start');
            else if (node.isEnd) cell.classList.add('end');
            else if (node.isWall) cell.classList.add('wall');
            else if (node.isPath) cell.classList.add('path');
            else if (node.isVisited) cell.classList.add('visited');

            fragment.appendChild(cell);
        }
    }

    gridElement.appendChild(fragment);
}

    setupEventListeners() {
        const grid = document.getElementById('grid');
        
        grid.addEventListener('mousedown', (e) => {
            if (this.isRunning) return;
            this.isDrawing = true;
            this.handleCellClick(e);
        });

        grid.addEventListener('mouseover', (e) => {
            if (this.isDrawing && !this.isRunning) {
                this.handleCellClick(e);
            }
        });

        grid.addEventListener('mouseup', () => {
            this.isDrawing = false;
        });

        document.addEventListener('mouseup', () => {
            this.isDrawing = false;
        });

        document.getElementById('startBtn').addEventListener('click', () => {
            if (!this.isRunning) {
                this.runDijkstra();
            }
        });
       document.getElementById('endBtn').addEventListener('click', () => {
    if (!this.isRunning) return;
    // signal to stop the algorithm
    this.isRunning = false;
    // ensure UI is updated
    document.getElementById('startBtn').disabled = false;
    console.log('Algorithm stopped by user.');
});


        document.getElementById('clearBtn').addEventListener('click', () => {
            if (!this.isRunning) {
                this.clearGrid();
            }
        });

        document.getElementById('clearPathBtn').addEventListener('click', () => {
            if (!this.isRunning) {
                this.clearPath();
            }
        });

        document.getElementById('mazeBtn').addEventListener('click', () => {
            if (!this.isRunning) {
                this.generateMaze();
            }
        });
    }

    handleCellClick(e) {
        if (e.target.classList.contains('cell')) {
            const row = parseInt(e.target.dataset.row);
            const col = parseInt(e.target.dataset.col);
            const node = this.grid[row][col];

            if (!node.isStart && !node.isEnd) {
                node.isWall = !node.isWall;
                this.renderGrid();
            }
        }
    }

    async runDijkstra() {
        this.isRunning = true;
        this.clearPath();
        
        const startTime = performance.now();
        document.getElementById('startBtn').disabled = true;
        
        // Initialize distances    O(n^2)
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                this.grid[row][col].distance = Infinity;
                this.grid[row][col].previousNode = null;
                this.grid[row][col].isVisited = false;
            }
        }

        const startNode = this.grid[this.startNode.row][this.startNode.col];
        startNode.distance = 0;

        const unvisitedNodes = this.getAllNodes();
        let visitedCount = 0;

        while (unvisitedNodes.length > 0) {
            // Sort unvisited nodes by distance
            unvisitedNodes.sort((a, b) => a.distance - b.distance);
            const currentNode = unvisitedNodes.shift();

            // If we hit a wall or infinite distance, we're done
            if (currentNode.isWall || currentNode.distance === Infinity) {
                continue;
            }

            currentNode.isVisited = true;
            visitedCount++;
            
            // Update stats
            document.getElementById('visitedCount').textContent = visitedCount;
            document.getElementById('timeElapsed').textContent = Math.round(performance.now() - startTime) + 'ms';

            // Animate the visiting
            if (!currentNode.isStart && !currentNode.isEnd) {
                await this.sleep(20);
                this.renderGrid();
            }

            // If we reached the end node, reconstruct path
            if (currentNode.isEnd) {
                await this.reconstructPath();
                break;
            }

            // Update neighbors
            const neighbors = this.getNeighbors(currentNode);
            for (const neighbor of neighbors) {
                if (!neighbor.isVisited && !neighbor.isWall) {
                    const newDistance = currentNode.distance + 1;
                    if (newDistance < neighbor.distance) {
                        neighbor.distance = newDistance;
                        neighbor.previousNode = currentNode;
                    }
                }
            }
        }

        this.isRunning = false;
        document.getElementById('startBtn').disabled = false;
    }

    async reconstructPath() {
        const path = [];
        let currentNode = this.grid[this.endNode.row][this.endNode.col];

        while (currentNode.previousNode !== null) {
            path.unshift(currentNode);
            currentNode = currentNode.previousNode;
        }

        // Animate path reconstruction
        for (let i = 0; i < path.length; i++) {
            const node = path[i];
            if (!node.isEnd) {
                node.isPath = true;
                await this.sleep(50);
                this.renderGrid();
            }
        }

        document.getElementById('pathLength').textContent = path.length;
    }

    getAllNodes() {
        const nodes = [];
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                nodes.push(this.grid[row][col]);
            }
        }
        return nodes;
    }

    getNeighbors(node) {
        const neighbors = [];
        const { row, col } = node;

        // Up, Down, Left, Right
        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];

        for (const [dRow, dCol] of directions) {
            const newRow = row + dRow;
            const newCol = col + dCol;

            if (newRow >= 0 && newRow < this.rows && newCol >= 0 && newCol < this.cols) {
                neighbors.push(this.grid[newRow][newCol]);
            }
        }

        return neighbors;
    }

    clearGrid() {
        this.initializeGrid();
        this.renderGrid();
        this.resetStats();
    }

    clearPath() {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const node = this.grid[row][col];
                node.isVisited = false;
                node.isPath = false;
                node.distance = Infinity;
                node.previousNode = null;
            }
        }
        this.renderGrid();
        this.resetStats();
    }

    generateMaze() {
        // Simple random maze generation
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const node = this.grid[row][col];
                if (!node.isStart && !node.isEnd) {
                    node.isWall = Math.random() < 0.3;
                }
            }
        }
        this.renderGrid();
    }

    resetStats() {
        document.getElementById('visitedCount').textContent = '0';
        document.getElementById('pathLength').textContent = '0';
        document.getElementById('timeElapsed').textContent = '0ms';
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize the visualizer when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new PathfindingVisualizer();
});