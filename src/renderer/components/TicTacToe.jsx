import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const WINNING_COMBINATIONS = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Cols
    [0, 4, 8], [2, 4, 6]             // Diagonals
];

const TicTacToe = ({ onClose, onGameEnd }) => {
    const [board, setBoard] = useState(Array(9).fill(null));
    const [isPlayerTurn, setIsPlayerTurn] = useState(true); // Player is X
    const [winner, setWinner] = useState(null); // 'X', 'O', 'Draw'
    const [winningLine, setWinningLine] = useState([]);
    const [isAiThinking, setIsAiThinking] = useState(false);

    // AI Turn
    useEffect(() => {
        if (!isPlayerTurn && !winner) {
            setIsAiThinking(true);
            const timer = setTimeout(() => {
                makeAiMove();
                setIsAiThinking(false);
            }, 800 + Math.random() * 500); // Random delay 0.8s - 1.3s
            return () => clearTimeout(timer);
        }
    }, [isPlayerTurn, winner]);

    const checkWinner = (squares) => {
        for (let combo of WINNING_COMBINATIONS) {
            const [a, b, c] = combo;
            if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
                return { winner: squares[a], line: combo };
            }
        }
        if (squares.every(s => s)) return { winner: 'Draw', line: [] };
        return null;
    };

    const handleSquareClick = (index) => {
        if (board[index] || winner || !isPlayerTurn) return;

        const newBoard = [...board];
        newBoard[index] = 'X';
        setBoard(newBoard);

        const result = checkWinner(newBoard);
        if (result) {
            setWinner(result.winner);
            setWinningLine(result.line);
            onGameEnd?.(result.winner);
        } else {
            setIsPlayerTurn(false);
        }
    };

    const makeAiMove = () => {
        // Simple AI: 1. Win, 2. Block, 3. Center, 4. Random
        const available = board.map((v, i) => v === null ? i : null).filter(v => v !== null);
        if (available.length === 0) return;

        let move = -1;

        // Helper to simulate move
        const findBestMove = (player) => {
            for (let i of available) {
                const tempBoard = [...board];
                tempBoard[i] = player;
                if (checkWinner(tempBoard)?.winner === player) return i;
            }
            return -1;
        };

        // 1. Try to win
        move = findBestMove('O');

        // 2. Block player
        if (move === -1) move = findBestMove('X');

        // 3. Take center
        if (move === -1 && board[4] === null) move = 4;

        // 4. Random
        if (move === -1) move = available[Math.floor(Math.random() * available.length)];

        const newBoard = [...board];
        newBoard[move] = 'O';
        setBoard(newBoard);
        setIsPlayerTurn(true);

        const result = checkWinner(newBoard);
        if (result) {
            setWinner(result.winner);
            setWinningLine(result.line);
            onGameEnd?.(result.winner);
        }
    };

    const resetGame = () => {
        setBoard(Array(9).fill(null));
        setWinner(null);
        setWinningLine([]);
        setIsPlayerTurn(true);
    };

    return (
        <motion.div
            className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm rounded-2xl"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
        >
            <div className="relative w-full max-w-xs aspect-square bg-white/10 rounded-xl p-4 shadow-2xl border border-white/20">
                {/* Header */}
                <div className="absolute -top-12 left-0 right-0 flex justify-between items-center text-white">
                    <div className="font-bold text-lg drop-shadow-md">Tic-Tac-Toe</div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        ✖
                    </button>
                </div>

                {/* Status */}
                <div className="absolute -bottom-12 left-0 right-0 text-center h-8">
                    {winner ? (
                        <motion.div
                            key="result"
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className={`font-bold text-xl ${winner === 'X' ? 'text-green-400' : winner === 'O' ? 'text-red-400' : 'text-blue-400'}`}
                        >
                            {winner === 'X' ? 'You Won! 🎉' : winner === 'O' ? 'I Won! 😜' : 'Draw! 🤝'}
                        </motion.div>
                    ) : (
                        <div className="text-white/80 animate-pulse">
                            {isPlayerTurn ? "Your turn (X)" : "Thinking..."}
                        </div>
                    )}
                </div>

                {/* Board */}
                <div className="grid grid-cols-3 grid-rows-3 gap-2 h-full w-full">
                    {board.map((cell, i) => (
                        <motion.button
                            key={i}
                            whileHover={!cell && !winner && isPlayerTurn ? { scale: 1.05, backgroundColor: "rgba(255,255,255,0.15)" } : {}}
                            whileTap={!cell && !winner && isPlayerTurn ? { scale: 0.95 } : {}}
                            className={`relative rounded-lg flex items-center justify-center text-4xl font-bold transition-colors
                                ${cell === 'X' ? 'text-cyan-400 bg-cyan-900/30' : cell === 'O' ? 'text-pink-400 bg-pink-900/30' : 'bg-white/5'}
                                ${winningLine.includes(i) ? 'ring-2 ring-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.5)]' : ''}
                            `}
                            onClick={() => handleSquareClick(i)}
                            disabled={!!cell || !!winner || !isPlayerTurn}
                        >
                            <AnimatePresence>
                                {cell && (
                                    <motion.span
                                        initial={{ scale: 0, rotate: -45 }}
                                        animate={{ scale: 1, rotate: 0 }}
                                        key={cell}
                                    >
                                        {cell}
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </motion.button>
                    ))}
                </div>

                {/* Play Again Overlay */}
                {winner && (
                    <motion.div
                        className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-xl backdrop-blur-[2px]"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1 }}
                    >
                        <motion.button
                            onClick={resetGame}
                            className="bg-white text-black font-bold py-2 px-6 rounded-full shadow-lg hover:scale-105 transition-transform"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            Play Again
                        </motion.button>
                    </motion.div>
                )}
            </div>
        </motion.div>
    );
};

export default TicTacToe;
