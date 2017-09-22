const _ = require('lodash')

const PORTAL = 'P'
const OPEN = ' '
const SKIP = 'S'
const WALL = '▓'

const P = PORTAL
const O = OPEN
const S = SKIP
const W = WALL

const WIDTH = 10
const HEIGHT = 8

class CostMatrix {
    constructor(width, height, matrix) {
        this.matrix = matrix
        this.width = width
        this.height = height
    }

    get(x, y) {
        return this.matrix[y * this.width + x]
    }

    set(x, y, v) {
        this.matrix[y * this.width + x] = v
    }

    toString() {
        let output = ''

        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                output += this.get(x, y)
            }

            output += '\n'
        }

        console.log(output)

        return output
    }
}

function getNeighbors(matrix, x, y) {
    const positions = [
        [x - 1, y - 1], [x, y - 1], [x + 1, y - 1],
        [x - 1,     y],           , [x + 1,     y],
        [x - 1, y + 1], [x, y + 1], [x + 1, y + 1]
    ]

    return positions.filter(pos => pos[0] >= 0 && pos[1] >= 0)
}

function markNeightbors(matrix, x, y, mark) {
    getNeighbors(matrix, x, y)
        .filter(pos => matrix.get(pos[0], pos[1]) === OPEN)
        .forEach(pos => matrix.set(pos[0], pos[1], SKIP))
}

function markCellsCloseToPortal(matrix) {
    for (let x = 0; x < matrix.width; x++) {
        if (matrix.get(x, 0) === PORTAL) {
            markNeightbors(matrix, x, 0, SKIP)
        }

        if (matrix.get(x, matrix.height - 1) === PORTAL) {
            markNeightbors(matrix, x, matrix.height - 1, SKIP)
        }
    }

    for (let y = 0; y < matrix.height; y++) {
        if (matrix.get(0, y) === PORTAL) {
            markNeightbors(matrix, 0, y, SKIP)
        }

        if (matrix.get(matrix.width - 1, y) === PORTAL) {
            markNeightbors(matrix, matrix.width - 1, y, SKIP)
        }
    }
}

function main() {
    const map = [
        W, W, W, W, W, P, P, P, W, W,
        W, O, O, O, O, O, O, O, O, W,
        P, O, O, O, O, O, O, O, O, W,
        P, O, O, O, O, O, O, O, O, W,
        P, O, W, O, O, O, W, O, O, W,
        P, O, W, O, O, O, W, O, O, P,
        P, O, W, O, O, O, W, O, O, P,
        W, W, W, W, W, W, W, W, W, W,
    ]

    const matrix = new CostMatrix(10, 8, map)

    markCellsCloseToPortal(matrix)

    console.log(matrix.toString())
}

main()

