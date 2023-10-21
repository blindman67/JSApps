

const WORD_COUNT = 2;
const BOARD_WIDTH = 4;
const BOARD_SIZE = BOARD_WIDTH * BOARD_WIDTH;
const MIN_WORD_LENGTH = 2;
const MAX_WORD_LENGTH = BOARD_SIZE;
const MIN_GAME_WORDS = 1; // if MAX_WORD_LENGTH == BOARD_SIZE then this value MUST BE ONE
const MAX_WORDS_LENGTH = Math.min(words.maxWordLength, BOARD_SIZE);
const MAX_WORD_TRYS = 500; // Number of times to try and find words to fit game board
const WORDS_PER_COL = 13;
const WORD_COL_ID = "wordList";
const WORD_DECK_COUNT = 3;//6;
const FONT_SIZE = 32;
const TILE_SIZE = FONT_SIZE + (FONT_SIZE * 0.3 | 0);
var wordCount = 0;
var minScoreWordLen = 2;
var longestWord ="";
var letters = [];
var wordList = [];
var topWords = [];
const selectedLetters = [];
const currentWords = [];
const currentWordEntries = [];
const combos = [];
var calCombo = false;
var comoScore = 0;
var currentWord = "";
var score = 0;
var highScore = 0;
var gameOver = true;
var cheatCount = 0;
var cheatTime = undefined;
var cheatOn = false;
const letterScores = {
	"1": "AEIOULNSTR",
	"2": "DG",
	"3": "BCMP",
	"4": "FHVWY",
	"5": "K",
	"8": "JX",
	"10": "QZ",
	scores: [1,2,3,4,5,8,10],
	scoreLetter(char) {
		var i = 0;
		while (i < letterScores.scores.length) {
			if (letterScores[letterScores.scores[i]].includes(char)) {
				return +letterScores.scores[i];
				
			}
			i++;
		}
		return 1;
	},
	wordBonus: {
		"0": 0,
		"1": 0,
		"2": 0,
		"3": 0,
		"4": 0,
		"5": 0,
		"6": 0,
		"7": 2,
		"8": 2,
		"9": 3,
		"10": 3,
		"11": 4,
		"12": 4,
		"13": 4,
		"14": 5,
		"15": 5,
		"16": 6,
	},
	wordBonusColor: {
		"7": "#060",
		"8": "#060",
		"9": "#171",
		"10": "#171",
		"11": "#282",
		"12": "#282",
		"13": "#282",
		"14": "#393",
		"15": "#393",
		"16": "#4A4",
	},
	scoreWord(word) {
		var total = 0;
		for(const c of word) {
			total += letterScores.scoreLetter(c);
		}
		letterScores.wBonus = letterScores.wordBonus[word.length];
		letterScores.wBonusCol = letterScores.wordBonusColor[word.length] ? letterScores.wordBonusColor[word.length] : "#000";
		return total;
		
	},
	
}
	
const backGround = $("canvas",{width: BOARD_WIDTH * TILE_SIZE, height: BOARD_WIDTH * TILE_SIZE});
const marks = $("canvas",{width: BOARD_WIDTH * TILE_SIZE, height: BOARD_WIDTH * TILE_SIZE});
const canvas = $("canvas",{width: BOARD_WIDTH * TILE_SIZE, height: BOARD_WIDTH * TILE_SIZE, style: {top:"20px", left:"20px"}});
const ctx = canvas.getContext("2d");
const ctxBg = backGround.getContext("2d");
const ctxMarks = marks.getContext("2d");
$$(gameContainer, canvas);



setTimeout(start,0);
function start() {
	var i = MIN_WORD_LENGTH;
	words.maxWordLength = MAX_WORDS_LENGTH;
	while(i <= MAX_WORDS_LENGTH) {
		words.catgorize("" + i, word => word.length === i);
		wordCount += words.cats[""+i].length;
		i++;
	}
	words.dumpWordList();
	newGameBtn.addEventListener("click", newGame);
	checkWordBtn.addEventListener("click", checkWord);
	updateCurrentWord();


	mouse.setElement(canvas, 10);
	displayBoard();
	log("Dictionary contains " + wordCount + " words. Longest word contains " + MAX_WORDS_LENGTH + " characters.");
	requestAnimationFrame(mainLoop);
	setTimeout(newGame,500);
}
function log(...data) {
	if(data.length === 1) {
		const el = $("div",{textContent: data[0].toString()});
		$$(logEl, el);
		return el;
		
	} else {
		for(const d of data) {
			$$(logEl, $("div",{textContent: d.toString()}));
		}
	}
}
log.info = (text, flash) => { 
	info.textContent = text;
	if(flash) {
		info.classList.add(flash);
		setTimeout(() => info.classList.remove(flash), 400);
	}
}
log.clear = () => logEl.innerHTML = "";
function searchFor(word){
	window.open("https://www.lexico.com/search?filter=dictionary&query=" + word,'_blank');	
    //window.open('http://www.google.com/search?q=' + text + "%20define",'_blank');	
}
log.searchable = (items) => {
	const searchable =  $("div",{className: "searchableList"});	
	for(const item of items) {
		const s = $("span", {className: "searchableItem", textContent: item, tiltle: "Click for definition in new tab"});
		s.addEventListener("click",()=>searchFor(item));
		$$(searchable, s);
	}
	$$(logEl,searchable);
}
log.clickable = (items, cb) => {
	var i = 0;
	const searchable =  $("div",{className: "clickableList"});	
	for(const item of items) {
		const s = $("span", {className: "clickableItem", textContent: item});
		s.addEventListener("click",()=>cb(item, s), {once: true});
		if((i % 30) === 9) {
			$$(searchable, s, $("br",{}));
		} else {
			$$(searchable, s);
		}
		i++;
	}
	$$(logEl,searchable);
}
			


function clearMarked() {
	letters.forEach(l => l.marked = false);
}
function findAllWordWithLetters() {

	const chars = letters.reduce((str,l)=> str+l.char, "");
	var i = MIN_WORD_LENGTH;
	while(i <= MAX_WORDS_LENGTH) {
		words.cats[i].forEach(w => {
			let canUse = true;
			clearMarked();
			for(const c of w) {
				const l = letters.find(l => l.marked === false && l.char === c);
				if(l === undefined) {
					canUse = false;
					break;
				} else {
					l.marked = true;
				}
			}
			if(canUse) {
				if(!wordList.includes(w)) {
					wordList.push(w);
				}
			}
		});
		i++;
	}
			
	
	
}
function emptyDeck() {
	var i = 0, d;
	while(i < 6) {
		(d = $("?#wordList"+i)).innerHTML = "";
		if(i >= wordDeckCount) { d.classList.add("hide") }
		else { d.classList.remove("hide") }
		i++;
	}

}
function createBoard() {
	cheatCount = 0;
	cheatTime = undefined;
	cheatOn = false;
	minScoreWordLen = 2;
	wordDeckCount = WORD_DECK_COUNT;

	gameOver = true;
	score = 0;
	displayScore();
	var i = MAX_WORD_LENGTH, j, wCount = WORD_COUNT, trys = 0;
	emptyDeck();

	currentWordEntries.length = selectedLetters.length = currentWords.length = wordList.length = letters.length = 0;
	log(i)
	while (i >= MIN_WORD_LENGTH) {
		j = wCount;
		while (j > 0) {
			clearMarked();
			const word = $.randItem(words.cats[i]);
			const addLetters = [];
			let lCount = 0;
			for (const c of word) {
				const idx = letters.findIndex(letter => !letter.marked && letter.char === c);
				if(idx > -1) {
					letters[idx].marked = true;
					lCount ++;
				} else if(letters.length + addLetters.length < BOARD_SIZE){
					addLetters.push({marked: true, selected: false, char: c, uchar: c.toUpperCase()});
					lCount ++;
				} else {
					break;
				}
			}
			if (lCount === word.length) {
				letters.push(...addLetters);
				wordList.push(word);
				log("Added word: " + word);
				if(letters.length === BOARD_SIZE) {
					break;
				}
				j--;
			}else{
				trys ++;
				if(trys > 500) {
					log("retry");

					return false;
				}
			}
		}
		if(letters.length === BOARD_SIZE) {
			break;
		}
		wCount += 1;
	}
	if(wordList.length < MIN_GAME_WORDS) {
		$.randShuffle(letters)
		displayBoard();
		return false;
	}
	$.randShuffle(letters)
	//log(wordList.join(", "));
	//log(letters.reduce((str,l)=> str+l.char, ""));
	const setupWords = wordList.join(", ");
	displayBoard();
	setTimeout(() => {
		findAllWordWithLetters();
		topWords = wordList.filter(w => w.length >= minScoreWordLen).sort((a,b) => b.length - a.length).map(w => w.toUpperCase());
		longestWord = topWords[0];
		log.info("Game contains " + topWords.length + " words with longest word containing " + topWords[0].length + " characters. ");
		log("Game contains " + topWords.length + " words with longest word containing " + topWords[0].length + " characters. ");
		wordList.length = 0;
		gameOver = false;
	}, 100);
	return true;
	
}
function displayScore() {
	scoreEl.textContent = "Score: " + score;
	
}
function getCombos(word) {
	combos.length = 0;
	var cw = word.slice(0, word.length - 1)
	while(cw.length >= minScoreWordLen) {
		topWords.includes(cw) && combos.push(cw);
		cw = cw.slice(0, cw.length - 1);
	}
	var i = 0;
	while(i < combos.length) {
		if(currentWords.includes(combos[i])) {
			combos.splice(i--,1);
		}
		i++;
	}
	calCombo = combos.length > 0;
	comoScore = 0;
}
function setMinWordLength(minLength) {
	minScoreWordLen = minLength;
	topWords = topWords.filter(w => w.length >= minScoreWordLen && !currentWords.includes(w));
}
function isGameOver() {
	if(topWords.length === 0) { return true }
	
}
function winGame() {
	log.info("YOU WIN!!!!  You have eliminate all words and ended the game.. Calculating END GAME BONUS", "orangeFlash");
	setTimeout(()=>{
		log.info("YOU WIN!!!!  End of game bonus is " + (score), "redFlash");		
		score *= 2;
		displayScore();

		gameOver = true;
		log.clear();
		if(score > highScore) {
			highScore = score;
			log("New high score " + score + " in a perfect game");
		}else {
			log("Game over. Score " + score + " in a perfect game");
		}
		calCombo = false;			
	}, 1500);
}
function endGameFullDeck() {
	log.info("DECK is full END of GAME.", "redFlash");
	removeLetter(selectedLetters[0].pos);
	gameOver = true;
	log.clear();
	if(score > highScore) {
		highScore = score;
		log("New high score " + score + " for " + currentWords.length + " words. Longest possible word was '" + longestWord + "'");
	}else {
		log("Game over. Score " + score + " for " + currentWords.length + " words. Longest possible word was '" + longestWord + "'");
	}
	/*topWords.length = Math.min(topWords.length, 10);
	log("Top " + topWords.length + " remaining words:");
	log.searchable(topWords);*/
	calCombo = false;		
}
function endGameBadWord() {
	log.info("GAME OVER! '"+currentWord+ "' is not a valid word!", "redFlash");		
	removeLetter(selectedLetters[0].pos);
	gameOver = true;
	log.clear();
	if(score > highScore) {
		highScore = score;
		log("New high score " + score + " for " + currentWords.length + " words. Longest possible word was '" + longestWord + "'");
	}else {
		log("Game over. Score " + score + " for " + currentWords.length + " words. Longest possible word was '" + longestWord + "'");
	}
	/*topWords.length = Math.min(topWords.length, 10);
	log("Top " + topWords.length + " remaining words:");
	log.searchable(topWords);*/
	calCombo = false;	
}
var deckPos = 0;
var fullDeckScore = 0;
var fullDeckScoringWords = 0;
function cleanDeck() {
	const nl = currentWords.filter(w => w.length > minScoreWordLen);
	const scores = currentWordEntries.filter(e => e.winning_word.length > minScoreWordLen).map(e => e.winning_word_score);
	const colors = currentWordEntries.filter(e => e.winning_word.length > minScoreWordLen).map(e => e.style.color);
	emptyDeck();

	currentWordEntries.length = 0;
	currentWords.length = 0;
	var idx = 0;
	for(const w of nl) {
		currentWords.push(w)
		let entry;
		let markWord = w.length === minScoreWordLen + 1 ? "*" : "";
		const col = $("?#" + WORD_COL_ID + ((idx) / WORDS_PER_COL | 0));
		$$(col,
			entry = $$( $("div",{className: "winningEntry"}),
				$("span",{textContent: scores[idx], className: "wordScore", style: {color:colors[idx]}}),
				$("span",{textContent: markWord+w, className: "winningWord", style: {color:colors[idx]}})
			)
		);
		entry.winning_word = w;
		entry.winning_word_score = scores[idx];
		currentWordEntries.push(entry);		
		idx++;
	}
	var deckRed = "";
	var tB = fullDeckScore * fullDeckScoringWords;
	var tally = fullDeckScore + " * " +  fullDeckScoringWords + " = ";
	if((currentWords.length < (wordDeckCount - 1) * WORDS_PER_COL) && wordDeckCount > 1) {
		wordDeckCount -= 1;
		 $("?#" + WORD_COL_ID + wordDeckCount).classList.add("hide");
		 deckRed = "DECK CLOSING * 2 BONUS plus ";
		 tb = 2 * fullDeckScore * fullDeckScoringWords;
		 tally = "2 * " + fullDeckScore + " * " +  fullDeckScoringWords + " = ";
		 fullDeckScore *= 2;
		 
	}
	score += fullDeckScore  * fullDeckScoringWords;
	setMinWordLength(minScoreWordLen + 1);
	removeLetter(selectedLetters[0].pos);
	displayScore();
	if(cheatOn) {
		addCheatWords();
	}

	if(topWords.length === 0) {
		log.info(deckRed+"FULL DECK BONUS: " + tally + tB, "purpleFlash");
		setTimeout(()=>{ winGame() },1500);
		return;
		
		
	}

	calCombo = false;
	combos.length = 0;
	log.info(deckRed +"FULL DECK BONUS: Total bonus " + tally + tB + " Min word length is now " + minScoreWordLen + " characters.", "greenFlash");
		

}
function scoreDeck() {
	while(currentWords[deckPos].length > minScoreWordLen) { 
		deckPos ++;
		if(deckPos >=  currentWords.length) {
			if(fullDeckScore === 0) {
				endGameFullDeck();			
				
			} else {
				

				log.info("FULL DECK BONUS: Total bonus " + (fullDeckScore) + " * " + fullDeckScoringWords, "purpleFlash");
				setTimeout(cleanDeck, 500);
			}
			return;
		}
	}
		
	currentWords[deckPos]
	currentWordEntries[deckPos].classList.add("purpleFlash");
	fullDeckScore += currentWordEntries[deckPos].winning_word_score;
	fullDeckScoringWords ++;
	deckPos ++;
	log.info("FULL DECK BONUS " + (fullDeckScore));
	if(currentWords[deckPos]) {
		
		setTimeout(scoreDeck, 250);
	} else {
		
		log.info("FULL DECK BONUS: Total bonus " + (fullDeckScore) + " * " +  fullDeckScoringWords, "purpleFlash");
		setTimeout(cleanDeck, 500);
	}
}

function checkWord() {
	if (currentWord.length >=  minScoreWordLen) {
		cheatCount = 0;
		cheatTime = undefined;

		const cw = currentWord.toLowerCase();
		if (currentWords.includes(currentWord)) {
			log.info("You have already use that word!", "blueFlash");
		} else if(topWords.includes(currentWord)) {
			const twIdx = topWords.indexOf(currentWord);
			topWords.splice(twIdx,1);
			if(!calCombo) { getCombos(currentWord) }

			currentWords.push(currentWord);
			var addScore = letterScores.scoreWord(currentWord) , longWord = "";
			if(letterScores.wBonus) {
				longWord = "Word length BONUS * " + letterScores.wBonus + " ";
				addScore *= letterScores.wBonus;
			}
			const isRude = words.cats.rude.includes(cw);

			let wordCol = "black";
			if(currentWord.length === BOARD_SIZE) {
				if(isRude) {
					addScore =  (addScore ** 2) * 2 * 2;
					comoScore += addScore;
					const inCombo = calCombo ? "COMBO WORD +(" + comoScore + ") ": "";
					log.info(inCombo + longWord + "UNBEFUCKINLEAVABLE BONUS!!! Full board word squares then doubles plus rude bonus doubles again.", "greenFlash");						
					wordCol = "#F33";
				} else {
					addScore = addScore ** 2 + 2;
					comoScore += addScore;
					const inCombo = calCombo ? "COMBO WORD +(" + comoScore + ") ": "";
					log.info(inCombo +  longWord + "WOW!!! Full board word squares then doubles word score.", "greenFlash");						
					wordCol = "#3D3";
				}
			} else if(currentWord.length ===  longestWord.length) {
				if(isRude) {
					addScore = (addScore**2) * 2;
					comoScore += addScore;
					const inCombo = calCombo ? "COMBO WORD +(" + comoScore + ") ": "";
					log.info(inCombo +  longWord + "PROFANITY EXTRA BONUS!!! longest word squares word score plus rude word doubles that", "greenFlash");
					wordCol = "#FA3";
				} else {
					addScore = addScore * 2;
					comoScore += addScore;
					const inCombo = calCombo ? "COMBO WORD +(" + comoScore + ") ": "";
					log.info(inCombo + longWord + "BONUS!!! Longest word squares word score.", "greenFlash");
					wordCol = "#8A3";
				}
			} else if(isRude) {
				addScore += addScore * 2;
				comoScore += addScore;
				const inCombo = calCombo ? "COMBO WORD +(" + comoScore + ") ": "";
				log.info(inCombo + longWord + "Rude words triples word score " + (addScore/ 3) + " * 3 = " +(addScore), "orangeFlash");
				wordCol = "#A50";
				
			} else if(longWord !== "" ){
				const inCombo = calCombo ? "COMBO WORD +(" + comoScore + ") ": "";
				comoScore += addScore;
				log.info(inCombo + longWord + "Word scores " + (addScore), "lightGreenFlash");
				wordCol = letterScores.wBonusCol;
			} else {
				const inCombo = calCombo ? "COMBO WORD +(" + comoScore + ") ": "";
				comoScore += addScore;
				log.info(inCombo + "Word scores " + (addScore));
			}
			score += addScore;

			let entry;
			let markWord = currentWord.length === minScoreWordLen ? "*" : "";
			const col = $("?#" + WORD_COL_ID + ((currentWords.length-1) / WORDS_PER_COL | 0));
			$$(col,
				entry = $$( $("div",{className: "winningEntry"}),
					$("span",{textContent: addScore, className: "wordScore", style: {color:wordCol}}),
					$("span",{textContent: markWord+currentWord, className: "winningWord", style: {color:wordCol}})
				)
			);
			entry.winning_word = currentWord;
			entry.winning_word_score = addScore;
			currentWordEntries.push(entry);
			if (currentWords.length + 1 > wordDeckCount * WORDS_PER_COL) {
				setTimeout(() => {
					log.info("FULL DECK BONUS " + (addScore), "purpleFlash");
					setTimeout(() => {
						deckPos = 0;
						fullDeckScore = 0;
						scoreDeck();
						
					},1000);
					
				}, 500);
				
				
				
			} else if(calCombo && combos.length) {
				setTimeout(()=>{
					currentWord = combos.shift().toUpperCase();
					checkWord();
				},500);
			} else {
				removeLetter(selectedLetters[0].pos);
				displayScore();
				calCombo = false;
				if(autoWordElement) {
					autoWordElement.classList.add("hide");
					autoWordElement = undefined;
				}
				if(cheatOn) {
					addCheatWords();
				}
				if(topWords.length === 0) {
					setTimeout(winGame, 500);
				}
			}
	
			
		} else {

			endGameBadWord();
		}
	} else if(currentWord.length === 0) {
		if(cheatTime === undefined) { cheatTime = performance.now() }
		else {
			if(cheatTime < performance.now() - 2000) {
				cheatCount += 1;
				if(cheatCount === 2) {
					cheatCount = 0;
					cheatTime = undefined;
					addCheatWords();
				}
			}
		}
	}
		
		
	
	
}

function addCheatWords() {
	cheatOn = true;
	log.clear();
	log.clickable(topWords, (word, el) => {
		if(currentWord === ""){
			el.style.background = "#F99";
			
			autoWordPos = 0;
			autoWordWord = word;
			autoWord(el);
		}
		
	});	
}
	
var autoWordPos = 0;
var autoWordWord = "";
var autoWordElement;
function autoWord(clElement) {
	autoWordElement = clElement || autoWordElement;
	if(autoWordWord.length > autoWordPos) {
		const idx = letters.findIndex(l => !l.selected && l.uchar === autoWordWord[autoWordPos]);
		if(idx > -1) { 
			selectLetter(idx);
			autoWordPos ++;
			setTimeout(autoWord, 100);
		}
		
		
	} else {
		setTimeout(checkWord, 250);
	}
		
	
}
function displayBoard() {
	var x,y,i = 0;
	ctxBg.clearRect(0,0,ctxBg.canvas.width, ctxBg.canvas.height);
	const size = TILE_SIZE;
	const sizeh = TILE_SIZE/2;
	ctxBg.font = FONT_SIZE + "px arial";
	ctxBg.textAlign = "center";
	ctxBg.textBaseline = "middle";
	ctxBg.fillStyle = "#000";
	
	for(y = 0; y <= BOARD_WIDTH; y++) {
		ctxBg.fillRect(y * size - 1,0,2,ctxBg.canvas.height);
		ctxBg.fillRect(0,y * size-1,ctxBg.canvas.width,2);
	}
	if(letters.length > 0) {
		for(y = 0; y < BOARD_WIDTH; y++) {
			for(x = 0; x < BOARD_WIDTH; x++) {
				ctxBg.fillText(letters[i++].uchar, x * size + sizeh, y * size + sizeh + 3);
			}
		}
	}	
}
function markTile(ctx, tx, ty, col) {
	ctx.fillStyle = col;
	ctx.fillRect(tx * TILE_SIZE + 1, ty * TILE_SIZE + 1, TILE_SIZE - 2, TILE_SIZE - 2);
}
function clearTile(ctx, tx, ty) {
	ctx.clearRect(tx * TILE_SIZE + 1, ty * TILE_SIZE + 1, TILE_SIZE - 2, TILE_SIZE - 2);
}

function newGame() {
	if(!createBoard()){
		setTimeout(newGame,10);
		return;
	}

	ctxMarks.clearRect(0,0,ctxMarks.canvas.width, ctxMarks.canvas.height);
	updateCurrentWord();
	
}
function updateCurrentWord() {
	currentWord = selectedLetters.reduce((str, l) => str + l.uchar, "");	
	if (currentWord.length >=  minScoreWordLen) {
		selectionTextEl.textContent = currentWord;
		checkWordBtn.classList.remove("inactive");
	} else {
		checkWordBtn.classList.add("inactive");
		selectionTextEl.textContent = currentWord.padEnd(minScoreWordLen,"-");
		
	}
	currentWordEntries.forEach(e => {
		e.classList[e.winning_word === currentWord ? "add" : "remove"]("highlightExisting");
	});
		
}
function selectLetter(idx) {
	cheatCount = 0;
	cheatTime = undefined;	
	const letter = letters[idx];
	letter.idx = selectedLetters.length;
	letter.pos = idx;
	letter.selected = true;
	selectedLetters.push(letter);
	const lx = idx % BOARD_WIDTH;
	const ly = idx / BOARD_WIDTH | 0;
	markTile(ctxMarks, lx, ly, "#Caa");
	updateCurrentWord();
}

function removeLetter(idx) {
	cheatCount = 0;
	cheatTime = undefined;	
	var i;
	const letter = letters[idx];
	const len = i = letter.idx;
	while(i < selectedLetters.length) {
		const l = selectedLetters[i];
		l.idx = -1;
		l.selected = false;
		const lx = l.pos % BOARD_WIDTH;
		const ly = l.pos / BOARD_WIDTH | 0;		
		clearTile(ctxMarks, lx, ly);
		i++;
	}
	selectedLetters.length = len;
	updateCurrentWord();
}
var globalTime;
var frameCount = 0;
function mainLoop(time) {
	globalTime = time;
	frameCount ++;
	ctx.clearRect(0,0,ctx.canvas.width, ctx.canvas.height);
	ctx.drawImage(marks, 0, 0);
	if(letters.length > 0 && mouse.over && !gameOver) {
		const lx = mouse.x / TILE_SIZE | 0;
		const ly = mouse.y / TILE_SIZE | 0;
		if(lx < 0 || ly < 0 || lx >= BOARD_WIDTH || ly >= BOARD_WIDTH) {
		}else {
			const lIdx = lx + ly * BOARD_WIDTH;
			const letter = letters[lIdx];
			if (!letter.selected) {
				if(mouse.left) {
					mouse.left = false;
					selectLetter(lIdx);
				} else {
					markTile(ctx,lx,ly, "#aCa");
				}
			} else {
				if(mouse.left) {
					mouse.left = false;
					removeLetter(lIdx);
				} else {
					markTile(ctx,lx,ly, "#CCa");
				}
			}
				
		}
	}
	ctx.globalAlpha = gameOver ? 0.25 : 1;
	ctx.drawImage(backGround, 0, 0);
	ctx.globalAlpha = 1;
	requestAnimationFrame(mainLoop);
}
	
		
	
