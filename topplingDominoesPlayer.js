const puppeteer = require('puppeteer');
const cheerio = require('cheerio');

async function main() {
    const browser = await puppeteer.connect({
        browserURL: 'http://127.0.0.1:9222',
        defaultViewport: null
    });

    const page = (await browser.pages())[0];
    const html = await page.content();
    await browser.disconnect();

    const $ = cheerio.load(html);
    const rows = {};

    $('rect').each((_, element) => {
        const y = Math.round(parseFloat($(element).attr('y')));
        const style = $(element).attr('style');

        let fillColor = null;
        const styleRules = style.split(';');
        for (let rule of styleRules) {
            const [key, value] = rule.split(':').map(str => str.trim());
            if (key === 'fill') {
                fillColor = value;
                break;
            }
        }

        if (!(y in rows)) rows[y] = [];

        if (fillColor === 'blue') {
            rows[y].push(1);
        } else if (fillColor === 'red') {
            rows[y].push(-1);
        }
    });

    const sortedKeys = Object.keys(rows).map(Number).sort((a, b) => a - b);
    const gameboard = sortedKeys
        .map(key => rows[key])
        .filter(row => row.length > 0); // <-- filter out empty rows

    console.log("Gameboard:");
    gameboard.forEach(row => console.log(row));

    if (gameboard.length === 0) {
        console.log("The board initialized incorrectly, setting it to [[1, -1]]");
        gameboard.push([1, -1]);
    }

    const player = "Red";

    const start = performance.now();
    const bestMove = findBestMove(gameboard, player); // This assumes you’ve already converted and imported findBestMove
    const end = performance.now();

    console.log(`\nTime taken: ${(end - start).toFixed(6)} milliseconds\n`);

    console.log(`${player}'s best move is to play on board ${bestMove[2]} and to knock down the domino in column: ${bestMove[3] + 1} to the ${bestMove[4].toLowerCase()} with a heuristic value of ${bestMove[0]}`);
}

function findBestMove(gameboard, player) {
    let ourPiece;
    if (player === "Blue") {
        ourPiece = 1;
    } else if (player === "Red") {
        ourPiece = -1;
    } else {
        console.log("something went wrong with player in findBestMove");
        return;
    }

    const numToRow = {
        0: "A", 1: "B", 2: "C", 3: "D", 4: "E", 5: "F", 6: "G", 7: "H", 8: "I", 9: "J", 10: "K", 11: "L", 
        12: "M", 13: "N", 14: "O", 15: "P", 16: "Q", 17: "R", 18: "S", 19: "T", 20: "U", 21: "V", 22: "W", 
        23: "X", 24: "Y", 25: "Z"
    };

    let totalBlueDominoes = 0;
    let totalRedDominoes = 0;
    let bestMoveValue = -Infinity;
    let bestMove = null;

    const allMovesList = [];

    for (let row = 0; row < gameboard.length; row++) {
        for (let col = 0; col < gameboard[row].length; col++) {
            if (gameboard[row][col] === -1) {
                totalRedDominoes += 1;
            } else if (gameboard[row][col] === 1) {
                totalBlueDominoes += 1;
            } else {
                continue;
            }

            if (gameboard[row][col] === ourPiece) {
                allMovesList.push([simulateHeuristic(gameboard, row, col, "Left", player), simulateToppling(gameboard, row, col, "Left"), numToRow[row % 26], col, "Left"]);
                allMovesList.push([simulateHeuristic(gameboard, row, col, "Right", player), simulateToppling(gameboard, row, col, "Right"), numToRow[row % 26], col, "Right"]);
            }
        }
    }

    allMovesList.sort((a, b) => b[0] - a[0]);

    bestMoveValue = allMovesList[0][0];
    const bestMovesList = [];

    for (const move of allMovesList) {
        if (move[0] === bestMoveValue) {
            bestMovesList.push(move);
        }
    }

    bestMovesList.sort((a, b) => {
        if (b[0] !== a[0]) {
          return b[0] - a[0]; // Descending on the first value
        } else {
          return a[1] - b[1]; // Ascending on the second value
        }
      });
    console.log(bestMovesList)

    bestMove = bestMovesList[0];
    console.log(bestMove)

    return bestMove;
}

function simulateHeuristic(gameboard, row, col, direction, player) {
    let h = 0;
    let ourPiece, enemyPiece;
    if (player === "Blue") {
        ourPiece = 1;
        enemyPiece = -1;
    } else if (player === "Red") {
        ourPiece = -1;
        enemyPiece = 1;
    } else {
        console.log("something went wrong with player in simulateHeuristic");
        return;
    }

    const subBoardLeft = gameboard[row].slice(0, col + 1);
    const subBoardRight = gameboard[row].slice(col);

    if (direction === "Left") {
        for (const domino of subBoardLeft) {
            if (domino === ourPiece) {
                h -= 1;
            } else if (domino === enemyPiece) {
                h += 1;
            }
        }

        if (subBoardLeft.includes(enemyPiece) && !subBoardRight.includes(enemyPiece)) {
            for (const domino of subBoardRight) {
                if (domino === ourPiece) {
                    h += 1;
                } else if (domino === enemyPiece) {
                    console.log("error - 1");
                }
            }
            h -= 1;
        }

        if (!subBoardRight.slice(1).includes(ourPiece) && subBoardRight.includes(enemyPiece)) {
            for (const domino of subBoardRight.slice(1)) {
                if (domino === enemyPiece) {
                    h -= 1;
                } else if (domino === ourPiece) {
                    console.log("error - 2");
                }
            }
        }

        if (!subBoardLeft.includes(enemyPiece) && !subBoardRight.includes(enemyPiece)) {
            h -= 1;
        }

        let enemyDominoesInGame = 0;
        for (const row of gameboard) {
            for (const domino of row) {
                if (domino === enemyPiece) {
                    enemyDominoesInGame += 1;
                }
            }
        }

        let enemyDominoesInSubBoardLeft = 0;
        for (const domino of subBoardLeft) {
            if (domino === enemyPiece) {
                enemyDominoesInSubBoardLeft += 1;
            }
        }

        if (enemyDominoesInGame === enemyDominoesInSubBoardLeft) {
            h = Infinity;
        }
    } else if (direction === "Right") {
        for (const domino of subBoardRight) {
            if (domino === ourPiece) {
                h -= 1;
            } else if (domino === enemyPiece) {
                h += 1;
            }
        }

        if (subBoardRight.includes(enemyPiece) && !subBoardLeft.includes(enemyPiece)) {
            for (const domino of subBoardLeft) {
                if (domino === ourPiece) {
                    h += 1;
                } else if (domino === enemyPiece) {
                    console.log("error - 3");
                }
            }
            h -= 1;
        }

        if (!subBoardLeft.slice(0, -1).includes(ourPiece) && subBoardLeft.includes(enemyPiece)) {
            for (const domino of subBoardLeft.slice(0, -1)) {
                if (domino === enemyPiece) {
                    h -= 1;
                } else if (domino === ourPiece) {
                    console.log("error - 4");
                }
            }
        }

        if (!subBoardLeft.includes(enemyPiece) && !subBoardRight.includes(enemyPiece)) {
            h -= 1;
        }

        let enemyDominoesInGame = 0;
        for (const row of gameboard) {
            for (const domino of row) {
                if (domino === enemyPiece) {
                    enemyDominoesInGame += 1;
                }
            }
        }

        let enemyDominoesInSubBoardRight = 0;
        for (const domino of subBoardRight) {
            if (domino === enemyPiece) {
                enemyDominoesInSubBoardRight += 1;
            }
        }

        if (enemyDominoesInGame === enemyDominoesInSubBoardRight) {
            h = Infinity;
        }
    } else {
        console.log("Something went wrong with the direction in simulateHeuristic");
    }

    return h;
}

function simulateToppling(gameboard, row, col, direction) {
    let total = 0;

    let subBoard;
    if (direction === "Left") {
        subBoard = gameboard[row].slice(0, col + 1);
    } else if (direction === "Right") {
        subBoard = gameboard[row].slice(col);
    } else {
        console.log("Something went wrong with the direction in simulateToppling");
        return 0;
    }

    for (const domino of subBoard) {
        if (domino !== 0) {
            total += 1;
        }
    }

    return total;
}

main();