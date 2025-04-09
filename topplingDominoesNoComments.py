import math
import time
import random

from bs4 import BeautifulSoup
from collections import defaultdict
from selenium import webdriver

def main():
    options = webdriver.ChromeOptions()
    options.debugger_address = "127.0.0.1:9222"
    driver = webdriver.Chrome(options=options)

    html_code = '''a'''

    html_code = driver.page_source

    driver.quit()

    soup = BeautifulSoup(html_code, "html.parser")
    rows = defaultdict(list)

    for rect in soup.find_all("rect"):
        y_coord = round(float(rect["y"]))
        style = rect["style"]
        

        fill_color = None
        for rule in style.split(";"):
            key, _, value = rule.partition(":")
            if key.strip() == "fill":
                fill_color = value.strip()
                break

        if fill_color == "blue":
            rows[y_coord].append(1)
        elif fill_color == "red":
            rows[y_coord].append(-1)

    sorted_2d_list = [rows[key] for key in sorted(rows.keys())]

    for row in sorted_2d_list:
        print(row)

    gameboard = sorted_2d_list

    if gameboard == []:
        print("The board initialized incorrectly, setting it to [[1]]")
        gameboard = [[1,-1]]

    player = "Red"

    start_time = time.perf_counter()
    bestMove = findBestMove(gameboard, player)
    end_time = time.perf_counter()
    print(f"Time taken: {end_time - start_time:.6f} seconds")

    print()
    print(f"{player}'s best move is to play on board {bestMove[2]} and to knock down the dominoe in column: {bestMove[3]+1} to the {bestMove[4].lower()} with a heuristic value of {bestMove[0]}")

def findBestMove(gameboard, player):
    if (player == "Blue"):
        ourPiece = 1
    elif (player == "Red"):
        ourPiece = -1
    else:
        print("something went wrong with player in find best move")

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

    totalBlueDominoes = 0
    totalRedDominoes = 0
    bestMoveValue = -math.inf
    bestMove = None

    allMovesList = []
    
    for row in range(len(gameboard)):
        
        for col in range(len(gameboard[row])):
            
            if gameboard[row][col] == -1:
                totalRedDominoes += 1

            elif gameboard[row][col] == 1:
                totalBlueDominoes += 1

            else:
                continue

            if gameboard[row][col] == ourPiece:
                allMovesList.append((simulateHeuristic(gameboard, row, col, "Left", player), simulateToppling(gameboard, row, col, "Left"), numToRow[row%26], col, "Left"))
                allMovesList.append((simulateHeuristic(gameboard, row, col, "Right", player), simulateToppling(gameboard, row, col, "Right"), numToRow[row%26], col, "Right"))

    allMovesList.sort()

    allMovesList.reverse()

    bestMoveValue = allMovesList[0][0]
    bestMovesList = []

    for move in allMovesList:
        if move[0] == bestMoveValue:
            bestMovesList.append(move)

    bestMovesList.sort()

    bestMove = bestMovesList[0]

    return bestMove

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

    subBoardLeft = gameboard[row][:col+1]
    subBoardRight = gameboard[row][col:]

    if direction == "Left":

        for dominoe in subBoardLeft:
            if dominoe == ourPiece:
                h -= 1
            elif dominoe == enemyPiece:
                h += 1

        if ((enemyPiece in subBoardLeft) and (enemyPiece not in subBoardRight)):
            for dominoe in subBoardRight:
                if dominoe == ourPiece:
                    h += 1
                elif dominoe == enemyPiece:
                    print("error - 1")
            h -= 1

        if ((ourPiece not in subBoardRight[1:]) and (enemyPiece in subBoardRight)):
            for dominoe in subBoardRight[1:]:
                if dominoe == enemyPiece:
                    h -= 1
                elif dominoe == ourPiece:
                    print("error - 2")

        if ((enemyPiece not in subBoardLeft) and (enemyPiece not in subBoardRight)):
            h -= 1

        enemyDominoesInGame = 0
        for row in gameboard:
            for dominoe in row:
                if dominoe == enemyPiece:
                    enemyDominoesInGame += 1

        enemyDominoesInSubBoardLeft = 0
        for dominoe in subBoardLeft:
            if dominoe == enemyPiece:
                enemyDominoesInSubBoardLeft += 1

        if enemyDominoesInGame == enemyDominoesInSubBoardLeft:
            h = math.inf

    elif direction == "Right":
        
        for dominoe in subBoardRight:
            if dominoe == ourPiece:
                h -= 1
            elif dominoe == enemyPiece:
                h += 1

        if ((enemyPiece in subBoardRight) and (enemyPiece not in subBoardLeft)):
            for dominoe in subBoardLeft:
                if dominoe == ourPiece:
                    h += 1
                elif dominoe == enemyPiece:
                    print("error - 3")
            h -= 1

        if ((ourPiece not in subBoardLeft[:-1]) and (enemyPiece in subBoardLeft)):
            for dominoe in subBoardLeft[:-1]:
                if dominoe == enemyPiece:
                    h -= 1
                elif dominoe == ourPiece:
                    print("error - 4")

        if ((enemyPiece not in subBoardLeft) and (enemyPiece not in subBoardRight)):
            h -= 1

        enemyDominoesInGame = 0
        for row in gameboard:
            for dominoe in row:
                if dominoe == enemyPiece:
                    enemyDominoesInGame += 1

        enemyDominoesInSubBoardRight = 0
        for dominoe in subBoardRight:
            if dominoe == enemyPiece:
                enemyDominoesInSubBoardRight += 1

        if enemyDominoesInGame == enemyDominoesInSubBoardRight:
            h = math.inf
    
    else:
        print("Something went wrong with the direction in simulate heuristic")

    return h

def simulateToppling(gameboard, row, col, direction):
    total = 0

    if direction == "Left":
        subBoard = gameboard[row][:col+1]
    elif direction == "Right":
        subBoard = gameboard[row][col:]
    else:
        print("Something went wrong in with the direction in simulate toppling")

    for dominoe in subBoard:
        if dominoe != 0:
            total += 1
    
    return total

if __name__ == "__main__":
    main()