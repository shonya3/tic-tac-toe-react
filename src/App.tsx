import { useState } from 'react';

function Cell({ cell, onClick }: { cell: Cell; onClick: (cell: Cell) => void }) {
	return (
		<div onClick={() => onClick(cell)} className="w-24 h-24 bg-gray-800 flex justify-center items-center text-5xl">
			{/* {cell.value ?? cell.id} */ cell.value}
		</div>
	);
}

const _GAME_ERRORS = {
	CELL_ALREADY_HAS_VALUE: 'This cell already has value',
	GAME_IS_OVER_CANNOT_MAKE_THE_MOVE: 'The Game is already over. You cannot make the move',
} as const;
export type ErrKind = keyof typeof _GAME_ERRORS;

export class GameError extends Error {
	constructor(kind: ErrKind) {
		super(_GAME_ERRORS[kind]);
	}
}

export interface Cell {
	id: number;
	value: CellValue;
}

export type CellValue = 'X' | 'O' | null | number;
export type GameStatus = 'X turn' | 'O turn' | 'X won' | 'O won' | 'Stalemate';

function createCells(): Cell[] {
	return Array(9)
		.fill(undefined)
		.map((_, i): Cell => ({ id: i + 1, value: null }));
}

function Status({ status }: { status: GameStatus }) {
	return <p className="text-5xl text-sky-200">{status}</p>;
}

function Board({ cells, onCellClick }: { cells: Cell[]; onCellClick: (cell: Cell) => void }) {
	return (
		<div className="grid grid-rows-3 grid-cols-3  bg-light-200 text-3xl w-fit gap-2">
			{cells.map(c => (
				<Cell
					key={c.id}
					onClick={cell => {
						onCellClick(cell);
					}}
					cell={c}
				/>
			))}
		</div>
	);
}

function checkWinCondition(cells: Cell[]): GameStatus | null {
	const winConditions = [
		[1, 2, 3],
		[4, 5, 6],
		[7, 8, 9],
		[1, 4, 7],
		[2, 5, 8],
		[3, 6, 9],
		[1, 5, 9],
		[3, 5, 7],
	];

	const cellValue = (id: number): CellValue => cells.find(c => c.id === id)!.value;

	for (const slice of winConditions) {
		const v0 = cellValue(slice[0]);
		const v1 = cellValue(slice[1]);

		if (v0 === v1 && v1 === cellValue(slice[2])) {
			if (v0 === 'O') {
				return 'O won';
			} else if (v0 === 'X') {
				return 'X won';
			}
		}
	}

	return null;
}

interface MoveHistoryEntry {
	id: number;
	cells: Cell[];
	status: GameStatus;
	label: string;
}

function createMove(id: number, cells: Cell[], status: GameStatus, label?: string): MoveHistoryEntry {
	let updatedLabel: string;
	if (label) {
		updatedLabel = label;
	} else if (id === 0) {
		updatedLabel = 'Go to game start';
	} else {
		updatedLabel = `Go to move #${id}`;
	}

	return {
		id,
		cells,
		status,
		label: updatedLabel,
	};
}

function MovesHistory({
	moves,
	moveClicked,
}: {
	moves: MoveHistoryEntry[];
	moveClicked: (move: MoveHistoryEntry) => void;
}) {
	return (
		<ul>
			{moves.map(({ id, status, cells, label }) => (
				<li key={id}>
					{`${id + 1}. `}
					<button
						onClick={() => {
							moveClicked({ id, status, cells, label });
						}}
						className="bg-gray-600 rounded p-1 hover:bg-gray-700"
					>
						{label}
					</button>
				</li>
			))}
		</ul>
	);
}

export default function Game() {
	const [status, setStatus] = useState<GameStatus>('X turn');
	const [moves, setMoves] = useState<MoveHistoryEntry[]>([createMove(0, createCells(), 'X turn')]);
	const [cells, setCells] = useState(createCells());
	const [moveId, setMoveId] = useState(0);
	const [gameOver, setGameOver] = useState(false);

	const goToMove = ({ cells, status, id }: MoveHistoryEntry) => {
		setMoveId(id);
		setStatus(status);
		setCells(cells);
	};

	const startNewGame = () => {
		setStatus('X turn');
		setMoves([createMove(0, createCells(), 'X turn')]);
		setCells(createCells());
		setMoveId(0);
		setGameOver(false);
	};

	const makeTurn = async (cell: Cell) => {
		try {
			if (status === 'X won' || status === 'O won') {
				throw new GameError('GAME_IS_OVER_CANNOT_MAKE_THE_MOVE');
			}

			const updatedCells = cells.map((c): Cell => {
				if (c.id === cell.id) {
					if (c.value) {
						throw new GameError('CELL_ALREADY_HAS_VALUE');
					}

					return {
						...c,
						value: status === 'X turn' ? 'X' : 'O',
					};
				}
				return c;
			});

			let gameOver = checkWinCondition(updatedCells);
			let updatedStatus: GameStatus = gameOver ? gameOver : status === 'X turn' ? 'O turn' : 'X turn';

			setCells(updatedCells);
			setStatus(updatedStatus);

			const updatedMoveId = moveId + 1;
			setMoveId(updatedMoveId);

			if (updatedMoveId === 9 && !gameOver) {
				gameOver = 'Stalemate';
				updatedStatus = 'Stalemate';
			}

			const label = gameOver ? `Go to game over: ${updatedStatus}` : undefined;
			setGameOver(Boolean(gameOver));

			const updatedMoves = [
				...moves.slice(0, updatedMoveId),
				createMove(updatedMoveId, updatedCells, updatedStatus, label),
			];

			setMoves(updatedMoves);
			setStatus(updatedStatus);

			if (gameOver) {
				await new Promise(r => setTimeout(r));
				alert(`Game is over! ${updatedStatus}`);
			}
		} catch (err) {
			if (err instanceof GameError) {
				alert(err.message);
			}
		}
	};

	return (
		<div className=" mt-24 w-[800px] m-auto flex flex-col">
			<div className="text-center">
				<Status status={status} />
			</div>
			<div className=" mt-16 flex gap-16 justify-center">
				<Board
					cells={cells}
					onCellClick={cell => {
						makeTurn(cell);
					}}
				/>
				<div className="min-w-64">
					<MovesHistory moveClicked={goToMove} moves={moves} />
				</div>
			</div>
			{gameOver && (
				<button
					className="mt-24 text-4xl bg-blue-500 hover:bg-blue-700 text-white py-2 px-4 rounded"
					onClick={() => {
						startNewGame();
					}}
				>
					Start new Game!
				</button>
			)}
		</div>
	);
}
