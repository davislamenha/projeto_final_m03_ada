import readlineSync from 'readline-sync';

class GameController {
  #match;
  #player;
  #status;

  constructor(player) {
    this.#player = player;
    this.#match = new Match(this.#player);
    this.#status = {
      message: '',
      canContinue: false,
      playerWon: false,
    };
  }

  start() {
    console.log('Jogo iniciado!');
    this.#match.setData();
    let menuOption;

    do {
      this.#guessInput();

      console.log(this.#status.message);

      menuOption = this.#menuHandler(menuOption);

      if (menuOption === '2') this.#reset();
    } while (menuOption !== '3');

    console.log('Encerrando jogo...');
  }

  #menuHandler(menuOption) {
    const continuePlaying =
      this.#status.canContinue &&
      this.#match.tries.triesLeft &&
      !this.#status.playerWon;

    menuOption = continuePlaying ? this.#callMainMenu() : this.#callEndMenu();

    return menuOption;
  }

  #callMainMenu() {
    let option;

    option = readlineSync.question(`
  Escolha uma opção:
  
  1 - Continuar
  2 - Reiniciar jogo
  3 - Encerrar jogo
  `);

    return option;
  }

  #callEndMenu() {
    let option;

    do {
      option = readlineSync.question(`
        
      Escolha uma opção:  
      1 - Pontuação   
      2 - Reiniciar jogo
      3 - Encerrar jogo
      `);

      if (option === '1')
        console.log(`
      Total de pontos: ${this.#player.points} 
      Pontos da Partida Anterior: ${this.#match.points} 
      `);
    } while (option !== '2' && option !== '3');

    return option;
  }

  #guessInput() {
    do {
      const formatHangmanWord = this.#match.hangmanWord.join(' ');
      const gameData = `
    A dica é: ${this.#match.tip}
    
    ${formatHangmanWord}
    `;
      console.log(this.#status.message);
      console.log(gameData);

      const guess = readlineSync.question(
        `Digite sua ${this.#match.tries.currentTry}º tentativa: `,
      );

      this.#status = this.#match.guessHandler(guess);
    } while (!this.#status.canContinue);
  }

  #reset() {
    this.#status = {
      message: '',
      canContinue: false,
      playerWon: false,
    };
    this.#match.reset();
  }
}

class Match {
  #data = [
    { word: 'alagoas', tip: 'Rio são francisco - quilombo - cangaço' },
    { word: 'bahia', tip: 'Axé - acarajé - carnaval' },
    { word: 'pernambuco', tip: 'frevo - maracatu - mangue beat' },
    { word: 'sergipe', tip: 'caju - mangue - cangaço' },
    { word: 'ceará', tip: 'cordel - baião de dois - forró' },
  ];
  #word;
  #player;
  #hangmanWord = [];
  #lettersGuessed = 0;
  #points = 0;
  #tip;

  constructor(player) {
    this.#player = player;
    this.tries = {
      currentTry: 1,
      maxTries: 6,
      triesLeft: 6,
    };
  }

  get word() {
    return this.#word;
  }

  get tip() {
    return this.#tip;
  }

  get points() {
    return this.#points;
  }

  get hangmanWord() {
    return this.#hangmanWord;
  }

  get player() {
    return this.#player;
  }

  #validationsResult(validations) {
    let validationIndex;

    const status = {
      0: { message: 'Palpite inválido!', canContinue: false },
      1: {
        message:
          this.tries.triesLeft - 1
            ? 'Não foi dessa vez, tente novamente!'
            : 'GAME OVER!!! Suas tentativas acabaram.',
        canContinue: true,
      },
      2: {
        message: 'Opa!!! Você já deu este palpite! Tente novamente!',
        canContinue: true,
      },
      3: {
        message: 'Sua palpite está correto, continue assim!',
        canContinue: true,
      },
      4: {
        message: `A palavra é ${this.#word.toUpperCase()}. Você acertou!`,
        canContinue: true,
        playerWon: true,
      },
    };

    for (let i = 0; i < validations.length; i++) {
      const validation = validations[i];

      if (!validation) {
        validationIndex = i;
        break;
      }

      validationIndex = i;
    }

    if (validationIndex === 1) this.#updateTries();

    return status[validationIndex];
  }

  guessHandler(guess) {
    const validations = [
      Guess.isValid(guess),
      Guess.isRight(guess, this.#word),
      this.#isLetterGuessed(guess, this.#hangmanWord),
      this.#isPlayerWinner(guess),
      this.#playerWon(),
    ];

    const status = this.#validationsResult(validations);

    if (status.playerWon) {
      const earnedPoints = this.#calculatePoints();
      this.#addPoints(earnedPoints);
    }

    return status;
  }

  #updateTries() {
    this.tries.currentTry += 1;
    this.tries.triesLeft -= 1;
  }

  #playerWon() {
    return true;
  }

  #calculatePoints() {
    const pointsForWordLength = this.#word.length * 5;
    const pointsForTriesLeft = this.tries.triesLeft * 10;
    const pointsForLettersLeft =
      (this.#word.length - this.#lettersGuessed) * 15;
    const pointsForLetter = this.#lettersGuessed * 5;

    const earnedPoints =
      pointsForLetter +
      pointsForWordLength +
      pointsForTriesLeft +
      pointsForLettersLeft;

    return earnedPoints;
  }

  #addPoints(points) {
    this.#player.points = points;
    this.#points = points;
  }

  #updateLetterGuess(guess, matchesIndex) {
    const guessMatches = matchesIndex.length;
    this.#lettersGuessed += guessMatches;
    this.#updatePlayerGuess(guess, matchesIndex);
  }

  #isLetterGuessed(guess, guessedLetters) {
    const matches = Guess.getMatchesIndex(guess, guessedLetters);
    return !matches.length;
  }

  #isPlayerWinner(guess) {
    const guessType = Guess.guessType(guess);
    const matchesIndex = Guess.getMatchesIndex(guess, this.#word);

    if (guessType === 'word') return true;
    if (guessType === 'letter') this.#updateLetterGuess(guess, matchesIndex);

    if (this.#lettersGuessed === this.#word.length) return true;

    return false;
  }

  setData() {
    const randomicNumber = Math.floor(Math.random() * this.#data.length);
    const data = this.#data[randomicNumber];

    this.#word = data.word;
    this.#createHangmanWord();
    this.#tip = data.tip;
  }

  reset() {
    this.#hangmanWord = [];
    this.setData();
    this.#lettersGuessed = 0;
    this.tries = {
      currentTry: 1,
      maxTries: 6,
      triesLeft: 6,
    };
  }

  #createHangmanWord() {
    for (let i = 0; i < this.#word.length; i++) {
      this.#hangmanWord.push('_');
    }
  }

  #updatePlayerGuess(guess, matchesIndex) {
    matchesIndex.forEach((matchIndex) => {
      this.#hangmanWord[matchIndex] = guess.toUpperCase();
    });
  }
}

class Player {
  #name;
  #points;
  constructor(name) {
    this.#name = name;
    this.#points = 0;
  }

  get name() {
    return this.#name;
  }

  get points() {
    return this.#points;
  }

  set points(points) {
    this.#points += points;
  }
}

class Guess {
  static isValid(guess) {
    const formatedGuess = guess.trim();

    if (formatedGuess && typeof formatedGuess === 'string') return true;
    return false;
  }

  static isRight(guess, word) {
    const guessType = this.guessType(guess);

    if (guessType === 'word') return this.#isWordGuessCorrect(guess, word);

    if (guessType === 'letter') return this.#isLetterGuessCorrect(guess, word);
  }

  static guessType(guess) {
    const guessType = guess.length > 1 ? 'word' : 'letter';
    return guessType;
  }

  static #isWordGuessCorrect(guess, word) {
    const isGuessRight = guess.toLowerCase() === word.toLowerCase();
    return isGuessRight;
  }

  static #isLetterGuessCorrect(guess, word) {
    const matchesIndex = this.getMatchesIndex(guess, word);
    return matchesIndex.length > 0;
  }

  static getMatchesIndex(guess, word) {
    const matchesIndex = [];

    for (let i = 0; i < word.length; i++) {
      const rightWordLetter = word[i].toUpperCase();

      if (guess.toUpperCase() === rightWordLetter) matchesIndex.push(i);
    }

    return matchesIndex;
  }
}

const davis = new Player('Davis');

const hangman = new GameController(davis);

hangman.start();
