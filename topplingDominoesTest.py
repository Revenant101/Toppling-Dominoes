import math
import time
import random

from bs4 import BeautifulSoup
from collections import defaultdict
from selenium import webdriver



def main():
    # need to open chrome first with the following command for this part to work
    # "C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222 --user-data-dir="C:\selenium_chrome"
    options = webdriver.ChromeOptions()
    options.debugger_address = "127.0.0.1:9222"  # Attach to running Chrome
    driver = webdriver.Chrome(options=options)

    # manually steal html code and past in the triple quotes if needed
    html_code = '''a'''  # Replace this with your actual HTML

    html_code = driver.page_source

    driver.quit()
    # print(html_code)

    soup = BeautifulSoup(html_code, "html.parser")
    rows = defaultdict(list)  # Dictionary to store y-coordinates as keys and lists of values as values

    for rect in soup.find_all("rect"):
        y_coord = round(float(rect["y"]))  # Round y coordinate
        style = rect["style"]
        
        # Extract fill color
        fill_color = None
        for rule in style.split(";"):
            key, _, value = rule.partition(":")
            if key.strip() == "fill":
                fill_color = value.strip()
                break
        
        # Convert colors to values
        if fill_color == "blue":
            rows[y_coord].append(1)
        elif fill_color == "red":
            rows[y_coord].append(-1)
        # Brown rectangles are ignored

    # Convert to sorted 2D list (sorted by y-coordinate)
    sorted_2d_list = [rows[key] for key in sorted(rows.keys())]

    # Print the result
    for row in sorted_2d_list:
        print(row)

    # manually set gameboard in this format
    gameboard = sorted_2d_list
    # gameboard = [
    #     [-1,-1,1,1],
    #     [1,-1,-1,-1,1,-1,1,-1],
    #     [-1,1,1,1,1,-1,1,-1],
    #     [1,1,-1,1],
    #     [-1,1,-1,-1,1,-1,-1,1]
    # ]

    # testing funny big boards
    # i wonder if anyone else can even run on this :imp:
    # uncommenting this will override the webhook
    # gameboard = [[0]*260]*100
    # for row in range(len(gameboard)):
    #     for col in range(len(gameboard[row])):
    #         while gameboard[row][col] == 0:
    #             gameboard[row][col] = random.randint(-1,1)
    # print(gameboard)

    # backup board in case it starts empty
    if gameboard == []:
        print("The board initialized incorrectly, setting it to [[1]]")
        gameboard = [[1,-1]]

    # left = blue = 1
    # right = red = -1
    player = "Red"

    start_time = time.perf_counter() # checks the time before bestMove starts
    bestMove = findBestMove(gameboard, player)
    end_time = time.perf_counter() # checks the time after bestMove ends
    print(f"Time taken: {end_time - start_time:.6f} seconds") # prints how long bestMove took

    print()
    print(f"{player}'s best move is to play on board {bestMove[2]} and to knock down the domino in column: {bestMove[3]+1} to the {bestMove[4].lower()} with a heuristic value of {bestMove[0]}")
    # moves.sort()
    # moves.reverse()
    # print(moves)

def findBestMove(gameboard, player):
    if (player == "Blue"):
        ourPiece = 1
    elif (player == "Red"):
        ourPiece = -1
    else:
        print("something went wrong with player in find best move")

    # used to turn row numbers into letters so the data is more visually distinct
    numToRow = {
        0:"A",
        1:"B",
        2:"C",
        3:"D",
        4:"E",
        5:"F",
        6:"G",
        7:"H",
        8:"I",
        9:"J",
        10:"K",
        11:"L",
        12:"M",
        13:"N",
        14:"O",
        15:"P",
        16:"Q",
        17:"R",
        18:"S",
        19:"T",
        20:"U",
        21:"V",
        22:"W",
        23:"X",
        24:"Y",
        25:"Z"
    }

    # current formula for finding best move - aka the Heuristic
    # Red Dominoes knocked down - Blue Dominoes knocked down + Blue dominoes guaranteed - Red dominoes guaranteed

    totalBlueDominoes = 0
    totalRedDominoes = 0
    # i dont think there is a scenario where you would have to make a move that has
    # a value of -2 or below. I think -1 is the worst you would take
    bestMoveValue = -math.inf
    bestMove = None

    allMovesList = [] # (heuristic value, num dominoes knocked down, row, col, direction)
    
    for row in range(len(gameboard)):
        
        for col in range(len(gameboard[row])):
            
            # count red dominoes
            if gameboard[row][col] == -1:
                totalRedDominoes += 1

            # count blue dominoes
            elif gameboard[row][col] == 1:
                totalBlueDominoes += 1

            # ignore empty spots
            else:
                continue

            
            # check moves from this dominoe if it is one of our pieces
            # (heuristic value, num dominoes knocked down, row, col, direction)
            if gameboard[row][col] == ourPiece:
                allMovesList.append((simulateHeuristic(gameboard, row, col, "Left", player), simulateToppling(gameboard, row, col, "Left"), numToRow[row%26], col, "Left"))
                allMovesList.append((simulateHeuristic(gameboard, row, col, "Right", player), simulateToppling(gameboard, row, col, "Right"), numToRow[row%26], col, "Right"))

            
    # print(totalBlueDominoes)
    # print(totalRedDominoes)

    # print("All moves list before sort")
    # print(allMovesList)

    allMovesList.sort()
    # print()
    # print("All moves list after sort")
    # print(allMovesList)

    allMovesList.reverse()
    # print()
    # print("All moves list after reverse")
    # print(allMovesList)

    bestMoveValue = allMovesList[0][0]
    bestMovesList = []

    for move in allMovesList:
        if move[0] == bestMoveValue:
            bestMovesList.append(move)

    # print()
    # print("Best moves list before sort")
    # print(bestMovesList)

    bestMovesList.sort()
    # print()
    # print("Best moves list after sort")
    # print(bestMovesList)

    bestMove = bestMovesList[0]

    return bestMove


# returns the heuristic value for a given move
def simulateHeuristic(gameboard, row, col, direction, player):
    h = 0
    if (player == "Blue"):
        ourPiece = 1
        enemyPiece = -1
    elif (player == "Red"):
        ourPiece = -1
        enemyPiece = 1
    else:
        print("something went wrong with player in find best move")
    # # # #
    # # # #
    # # # #
     ###########################################################################
    
    # both sides are needed
    # left goes from start to col
    # right goes from col to end
    subBoardLeft = gameboard[row][:col+1] # slices from the start to col+1 since end point is exclusive
    subBoardRight = gameboard[row][col:] # slices from col to end since start point is inclusive

    if direction == "Left":

        for domino in subBoardLeft:
            if domino == ourPiece:
                h -= 1
            elif domino == enemyPiece:
                h += 1

        # only add to the heuristic for guananteed moves if you are knocking down at least
        # 1 red dominoe AND there are NO red dominoes in the right side
        if ((enemyPiece in subBoardLeft) and (enemyPiece not in subBoardRight)):
            for domino in subBoardRight:
                if domino == ourPiece:
                    h += 1
                elif domino == enemyPiece:
                    print("error - 1")
            h -= 1 # to account for dominoe we are knocking down with our move that we added back in this step

        # attempting to punish us for giving guarenteed red moves
        if ((ourPiece not in subBoardRight[1:]) and (enemyPiece in subBoardRight)):
            for domino in subBoardRight[1:]:
                if domino == enemyPiece:
                    h -= 1
                elif domino == ourPiece:
                    print("error - 2")

        # try to slightly discourge you from playing on rows where its only your dominoes
        if ((enemyPiece not in subBoardLeft) and (enemyPiece not in subBoardRight)):
            h -= 1

        # attempting to give infinite value to terminal moves
        # if the move would remove the number of red dominoes in the whole game
        # then you immediately win with that move
        enemyDominoesInGame = 0
        for row in gameboard:
            for domino in row:
                if domino == enemyPiece:
                    enemyDominoesInGame += 1

        enemyDominoesInSubBoardLeft = 0
        for domino in subBoardLeft:
            if domino == enemyPiece:
                enemyDominoesInSubBoardLeft += 1

        if enemyDominoesInGame == enemyDominoesInSubBoardLeft:
            h = math.inf


    elif direction == "Right":
        
        for domino in subBoardRight:
            if domino == ourPiece:
                h -= 1
            elif domino == enemyPiece:
                h += 1

        # only add to the heuristic for guananteed moves if you are knocking down at least
        # 1 red dominoe AND there are NO red dominoes in the right side
        if ((enemyPiece in subBoardRight) and (enemyPiece not in subBoardLeft)):
            for domino in subBoardLeft:
                if domino == ourPiece:
                    h += 1
                elif domino == enemyPiece:
                    print("error - 3")
            h -= 1 # to account for dominoe we are knocking down with our move

        # attempting to punish us for giving guarenteed red moves
        if ((ourPiece not in subBoardLeft[:-1]) and (enemyPiece in subBoardLeft)):
            for domino in subBoardLeft[:-1]:
                if domino == enemyPiece:
                    h -= 1
                elif domino == ourPiece:
                    print("error - 4")

        # try to slightly discourge you from playing on rows where its only your dominoes
        if ((enemyPiece not in subBoardLeft) and (enemyPiece not in subBoardRight)):
            h -= 1

        # attempting to give infinite value to terminal moves
        # if the move would remove the number of red dominoes in the whole game
        # then you immediately win with that move
        enemyDominoesInGame = 0
        for row in gameboard:
            for domino in row:
                if domino == enemyPiece:
                    enemyDominoesInGame += 1

        enemyDominoesInSubBoardRight = 0
        for domino in subBoardRight:
            if domino == enemyPiece:
                enemyDominoesInSubBoardRight += 1

        if enemyDominoesInGame == enemyDominoesInSubBoardRight:
            h = math.inf
    
    else:
        print("Something went wrong with the direction in simulate heuristic")

    return h

# returns number of dominoes knocked down for a given move
def simulateToppling(gameboard, row, col, direction):
    total = 0

    # make a new board that only includes the domino and everything to the left or right as needed
    if direction == "Left":
        subBoard = gameboard[row][:col+1] # slices from the start to col+1 since end point is exclusive
    elif direction == "Right":
        subBoard = gameboard[row][col:] # slices from col to end since start point is inclusive
    else:
        print("Something went wrong in with the direction in simulate toppling")

    # for every cell in new board, add 1 to total if the cell is 1 or -1, and ignore 0s
    for domino in subBoard:
        if domino != 0:
            total += 1
    
    return total

if __name__ == "__main__":
    main()