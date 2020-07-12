/* eslint-disable class-methods-use-this */
/* eslint-disable max-classes-per-file */
/* eslint-disable linebreak-style */
/* eslint-disable prefer-destructuring */
import './scss/main.scss';
import View from './js/View/View';
import createField from './js/createField/createField';
import Model from './js/model/Model';

let coordinate = [];
let chooseCoordinate = [];
let isMouseDown = false;
let isUserRight = false;
let innerArrWord = [];
let keyWord = [];
let keyWordTranslate = [];
let field = [];
const innerWord = document.getElementById('keyword');
const table = document.getElementById('gameTable');
const wordTranslate = document.getElementById('translate');

const readCoordsFromAttribute = (element) => {
  const attrValue = element.getAttribute('data-coordinate');

  if (!attrValue) {
    return null;
  }

  const cordArray = attrValue.split('_');

  if (cordArray.length !== 2) {
    return null;
  }

  return [
    parseInt(cordArray[0], 10),
    parseInt(cordArray[1], 10)];
};

const mouseMoveHandler = (event) => {
  if (isMouseDown) {
    event.currentTarget.classList.add('select');
  }

  if (innerArrWord.length !== 0
    && innerArrWord[innerArrWord.length - 1] !== event.currentTarget.innerText
    && isMouseDown) {
    innerArrWord.push(event.currentTarget.innerText);
    innerWord.innerText = innerArrWord.join('');
    return;
  }

  if (!isMouseDown || !isUserRight) {
    return;
  }

  const currentCord = readCoordsFromAttribute(event.target);

  if (chooseCoordinate.length !== 0
    && chooseCoordinate[chooseCoordinate.length - 1][0] === currentCord[0]
    && chooseCoordinate[chooseCoordinate.length - 1][1] === currentCord[1]) {
    return;
  }

  isUserRight = coordinate.length > chooseCoordinate.length
    && coordinate[chooseCoordinate.length][0] === currentCord[0]
    && coordinate[chooseCoordinate.length][1] === currentCord[1];

  if (isUserRight) {
    chooseCoordinate.push(currentCord);
  }
};

const mouseDownHandler = (event) => {
  isMouseDown = true;

  const currentCord = readCoordsFromAttribute(event.currentTarget);

  isUserRight = !!currentCord
    && coordinate[0][0] === currentCord[0]
    && coordinate[0][1] === currentCord[1];

  if (isUserRight) {
    chooseCoordinate.push(currentCord);
  }
  innerArrWord.push(event.currentTarget.innerText);
  innerWord.innerText = innerArrWord.join('');
};

function renderField(newField) {
  for (let i = 0; i < newField.length; i += 1) {
    const tr = document.createElement('tr');

    for (let j = 0; j < newField[i].length; j += 1) {
      const td = document.createElement('td');
      td.innerText = newField[i][j];
      td.setAttribute('data-coordinate', `${i}_${j}`);

      td.addEventListener('mousemove', mouseMoveHandler);
      td.addEventListener('mousedown', mouseDownHandler);

      tr.append(td);
    }

    table.append(tr);
  }
  wordTranslate.innerText = `${keyWordTranslate.toUpperCase()}`;
}

function clearGameField() {
  innerArrWord = [];
}

export default class Controller {
  constructor(model, view) {
    this.model = model;
    this.view = view;
    this.counterWord = 0;

    this.view.bindChangeRound(this.handlerChangeRound.bind(this));
    this.view.bindChangeLevel(this.handlerChangeLevel.bind(this));
    this.view.bindClickClose(this.handlerClickClose.bind(this));
    this.view.bindDropOptions();
    this.view.bindClickStartGame(this.handlerClickStartGame.bind(this));
    this.view.bindClickSound(this.handlerClickSound.bind(this));
    this.view.bindClickHelp(this.handlerClickHelp.bind(this));
    this.view.bindClickRefresh(this.handlerClickRefresh.bind(this));
  }

  init() {
    this.model.init();
    console.log('hi!');
  }

  async handlerClickStartGame() {
    this.view.hideStartPage();
    this.view.showLouder();
    await this.model.initGame();
    setTimeout(() => {
      this.view.hideLouder();
      this.view.showFillWord();
      this.gameStart();
      console.log(this.model.gameWords2);
      console.log(this.model.gameWords);
      console.log(this.model.gameWord);
    }, 3000);
  }

  gameStart() {
    keyWordTranslate = this.model.gameWord.ru;
    keyWord = this.model.gameWord.en;
    this.model.wordsService.updateRepetition(this.model.gameWord.id, this.difficultGroup);
    field = createField(keyWord, 5, 6, coordinate);
    renderField(field);
  }

  isUserRightHandler() {
    setTimeout(() => {
      this.model.gameRound += 1;
      if (this.model.gameRound === this.model.gameWords.length) {
        console.log(this.model.arrayCorrectAnswer);
        return;
      }
      this.view.innerTextLocalResult('');
      this.model.addCorrectAnswerResult();
      this.model.getWord();
      this.model.wordsService.updateKnowledge(this.model.gameWord.id, this.difficultGroup);
      keyWordTranslate = this.model.gameWord.ru;
      keyWord = this.model.gameWord.en;

      this.view.deleteOldGameTable();
      this.view.clearChooseWordContainer();
      clearGameField();
      coordinate = [];
      chooseCoordinate = [];
      field = createField(keyWord, 5, 6, coordinate);
      renderField(field);
    }, 1000);
  }

  isUserFalseHandler() {
    setTimeout(() => {
      this.model.addIncorrectAnswer();
      this.view.innerTextLocalResult('');
      chooseCoordinate = [];
      this.view.clearChooseWordContainer();
      clearGameField();
      console.log('word not found');
    }, 1000);
  }

  handlerClickRefresh() {
    this.view.deleteOldGameTable();
    clearGameField();
    field = createField(keyWord, 5, 6, coordinate);
    renderField(field);
  }

  handlerClickHelp() {
    console.log('help');
  }

  handlerClickSound() {
    this.model.setMuteAudio();
  }

  handlerChangeRound(round) {
    this.model.setRound(round);
  }

  handlerChangeLevel(level) {
    this.model.setLevel(level);
  }

  handlerClickClose() {
    window.location.href = '/';
  }
}

const model = new Model();
const view = new View();
const controller = new Controller(model, view);
controller.init();

const mouseUpHandler = () => {
  isMouseDown = false;
  if (isUserRight) {
    controller.view.innerTextLocalResult('верно');
    controller.isUserRightHandler();
  } else {
    controller.view.innerTextLocalResult('неверно');
    controller.isUserFalseHandler();
  }
  isUserRight = false;
  const cell = document.querySelectorAll('td');
  cell.forEach((e) => {
    e.classList.remove('select');
  });
};

table.addEventListener('mouseup', mouseUpHandler);
