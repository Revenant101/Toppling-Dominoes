//author: Joel Peters, joelpeters2017@gmail.com
var TurboToppler = Class.create(ComputerPlayer, {
    initialize: function() {
        //nothing needed here, but you can add things
        //if you want a stateful player
    },

    givePosition: function(playerIndex, position, referee) {
        //don't modify this method.
        referee.moveTo(this.userGetMove(position));
    },

    userGetMove: function(playerId, position) {
        
    // main function with everything inside
    function main(playerId, position) {
        // get the gameboard from the position object
        gameboard = position.rows

        // backup case
        if (gameboard.length === 0) {
            console.log("The board initialized incorrectly, setting it to [[1, 0]]");
            gameboard.push([1, 0]);
        }

        // set which player we are
        let player;
        if (playerId === 0) {
            player = "Blue";
        } else if (playerId === 1) {
            player = "Red"
        } else {
            console.log("Error happened while setting player in main")
        }

        // converts the row letter in bestMove back to a number
        const rowToNum = {
            "A": 0, "B": 1, "C": 2, "D": 3, "E": 4, "F": 5, "G": 6, "H": 7, "I": 8, "J": 9, "K": 10, "L": 11,
            "M": 12, "N": 13, "O": 14, "P": 15, "Q": 16, "R": 17, "S": 18, "T": 19, "U": 20, "V": 21, "W": 22,
            "X": 23, "Y": 24, "Z": 25
        };
        

        // const start = performance.now(); // checks the time before bestMove starts
        const bestMove = findBestMove(gameboard, player);
        // const end = performance.now(); // checks the time after bestMove ends

        // console.log(`\nTime taken: ${(end - start).toFixed(6)} milliseconds\n`);
        // console.log(`${player}'s best move is to play on board ${bestMove[2]} and to knock down the domino in column: ${bestMove[3] + 1} to the ${bestMove[4].toLowerCase()} with a heuristic value of ${bestMove[0]}`);

        if (bestMove[4] === "Left") {
            // uses built in function to return the move we want
            return position.getLeftPushOption(rowToNum[bestMove[2]], bestMove[3])
        } else if (bestMove[4] === "Right") {
            // uses built in function to return the move we want
            return position.getRightPushOption(rowToNum[bestMove[2]], bestMove[3])
        } else {
            console.log("something went wrong while returning option")
        }
    }

    function findBestMove(gameboard, player) {
        let ourPiece;
        if (player === "Blue") {
            ourPiece = 0;
        } else if (player === "Red") {
            ourPiece = 1;
        } else {
            console.log("something went wrong with player in findBestMove");
            return;
        }

        // used to turn row numbers into letters so the data is more visually distinct
        const numToRow = {
            0: "A", 1: "B", 2: "C", 3: "D", 4: "E", 5: "F", 6: "G", 7: "H", 8: "I", 9: "J", 10: "K", 11: "L", 
            12: "M", 13: "N", 14: "O", 15: "P", 16: "Q", 17: "R", 18: "S", 19: "T", 20: "U", 21: "V", 22: "W", 
            23: "X", 24: "Y", 25: "Z"
        };

        // current formula for finding best move - aka the Heuristic/Utility
        // Red Dominoes knocked down - Blue Dominoes knocked down + Blue dominoes guaranteed - Red dominoes guaranteed
        let totalBlueDominoes = 0;
        let totalRedDominoes = 0;
        // i dont think there is a scenario where you would have to make a move that has
        // a value of -2 or below. I think -1 is the worst you would take
        let bestMoveValue = -Infinity;
        let bestMove = null;

        const allMovesList = []; // (heuristic value, num dominoes knocked down, row, col, direction)

        for (let row = 0; row < gameboard.length; row++) {
            for (let col = 0; col < gameboard[row].length; col++) {

                // count red dominoes
                if (gameboard[row][col] === 1) {
                    totalRedDominoes += 1;

                // count blue dominoes
                } else if (gameboard[row][col] === 0) {
                    totalBlueDominoes += 1;

                // ignore empty spots
                } else {
                    continue;
                }

                // check moves from this dominoe if it is one of our pieces
                // (heuristic value, num dominoes knocked down, row, col, direction)
                if (gameboard[row][col] === ourPiece) {
                    allMovesList.push([simulateHeuristic(gameboard, row, col, "Left", player), simulateToppling(gameboard, row, col, "Left"), numToRow[row % 26], col, "Left"]);
                    allMovesList.push([simulateHeuristic(gameboard, row, col, "Right", player), simulateToppling(gameboard, row, col, "Right"), numToRow[row % 26], col, "Right"]);
                }
            }
        }

        allMovesList.sort((a, b) => b[0] - a[0]);

        // find the heuristic/utility of our best move
        bestMoveValue = allMovesList[0][0];
        const bestMovesList = [];

        // every move that has same h/u as best move gets added to list
        for (const move of allMovesList) {
            if (move[0] === bestMoveValue) {
                bestMovesList.push(move);
            }
        }

        // in theory all the moves in here should have the same first value so that part doesn't matter
        // but the second value (number of dominoes knocked down) is sorted so we pick the move that
        // knocks down the least amount of dominoes so there is more time for other player to make bad moves
        bestMovesList.sort((a, b) => {
            if (b[0] !== a[0]) {
            return b[0] - a[0]; // Descending on the first value
            } else {
            return a[1] - b[1]; // Ascending on the second value
            }
        });

        // pick the move at the front that knocks down least number of dominoes
        bestMove = bestMovesList[0];
        return bestMove;
    }

    // returns the heuristic value for a given move
    function simulateHeuristic(gameboard, row, col, direction, player) {
        let h = 0;
        let ourPiece, enemyPiece;
        if (player === "Blue") {
            ourPiece = 0;
            enemyPiece = 1;
        } else if (player === "Red") {
            ourPiece = 1;
            enemyPiece = 0;
        } else {
            console.log("something went wrong with player in simulateHeuristic");
            return;
        }

        // both sides are needed
        // left goes from start to col
        // right goes from col to end
        const subBoardLeft = gameboard[row].slice(0, col + 1); // slices from the start to col+1 since end point is exclusive
        const subBoardRight = gameboard[row].slice(col); // slices from col to end since start point is inclusive

        if (direction === "Left") {

            // add 1 for every enemy domino to left
            // and subtract 1 for our own dominoes to left
            for (const domino of subBoardLeft) {
                if (domino === ourPiece) {
                    h -= 1;
                } else if (domino === enemyPiece) {
                    h += 1;
                }
            }

            // only add to the heuristic for guananteed moves if you are knocking down at least
            // 1 enemy domino AND there are NO enemy dominoes in the right side
            if (subBoardLeft.includes(enemyPiece) && !subBoardRight.includes(enemyPiece)) {
                for (const domino of subBoardRight) {
                    if (domino === ourPiece) {
                        h += 1;
                    } else if (domino === enemyPiece) {
                        console.log("error - 1");
                    }
                }
                h -= 1; // to account for domino we are knocking down with our move that we added back in this step
            }

            // attempting to punish us for giving guarenteed red moves
            if (!subBoardRight.slice(1).includes(ourPiece) && subBoardRight.includes(enemyPiece)) {
                for (const domino of subBoardRight.slice(1)) {
                    if (domino === enemyPiece) {
                        h -= 1;
                    } else if (domino === ourPiece) {
                        console.log("error - 2");
                    }
                }
            }

            // try to slightly discourge you from playing on rows where its only your dominoes
            if (!subBoardLeft.includes(enemyPiece) && !subBoardRight.includes(enemyPiece)) {
                h -= 1;
            }

            // attempting to give infinite value to terminal moves
            // if the move would remove the number of enemy dominoes in the whole game
            // then you immediately win with that move
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

            // add 1 for every enemy domino to right
            // and subtract 1 for our own dominoes to right
            for (const domino of subBoardRight) {
                if (domino === ourPiece) {
                    h -= 1;
                } else if (domino === enemyPiece) {
                    h += 1;
                }
            }

            // only add to the heuristic for guananteed moves if you are knocking down at least
            // 1 enemy dominoe AND there are NO enemy dominoes in the right side
            if (subBoardRight.includes(enemyPiece) && !subBoardLeft.includes(enemyPiece)) {
                for (const domino of subBoardLeft) {
                    if (domino === ourPiece) {
                        h += 1;
                    } else if (domino === enemyPiece) {
                        console.log("error - 3");
                    }
                }
                h -= 1; // to account for dominoe we are knocking down with our move
            }

            // attempting to punish us for giving guarenteed red moves
            if (!subBoardLeft.slice(0, -1).includes(ourPiece) && subBoardLeft.includes(enemyPiece)) {
                for (const domino of subBoardLeft.slice(0, -1)) {
                    if (domino === enemyPiece) {
                        h -= 1;
                    } else if (domino === ourPiece) {
                        console.log("error - 4");
                    }
                }
            }

            // try to slightly discourge you from playing on rows where its only your dominoes
            if (!subBoardLeft.includes(enemyPiece) && !subBoardRight.includes(enemyPiece)) {
                h -= 1;
            }

            // attempting to give infinite value to terminal moves
            // if the move would remove the number of enemy dominoes in the whole game
            // then you immediately win with that move
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

    // returns number of dominoes knocked down for a given move
    function simulateToppling(gameboard, row, col, direction) {
        let total = 0;

        // make a new board that only includes the domino and everything to the left or right as needed
        let subBoard;
        if (direction === "Left") {
            subBoard = gameboard[row].slice(0, col + 1); // slices from the start to col+1 since end point is exclusive
        } else if (direction === "Right") {
            subBoard = gameboard[row].slice(col); // slices from col to end since start point is inclusive
        } else {
            console.log("Something went wrong with the direction in simulateToppling");
            return 0;
        }

        // for every cell in new board, add 1 to total if the cell is 1 or 0, and ignore -1s
        for (const domino of subBoard) {
            if (domino !== -1) {
                total += 1;
            }
        }

        return total;
    }

    var option;
    option = main(playerId, position);
    return option;
    },

    getName: function() {
        return "TurboToppler";
    },

    getAuthor: function() {
        return "Joel Peters";
    }
});