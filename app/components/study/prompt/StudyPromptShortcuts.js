/**
 * @class StudyPromptShortcuts
 * @param {Object} options
 * @constructor
 */
function StudyPromptShortcuts(options) {
  this.prompt = options.prompt;
  this.action = new keypress.Listener();
  this.grading = new keypress.Listener();
  this.navigate = new keypress.Listener();
  this.tone = new keypress.Listener();
}
/**
 * @method _handleActionAudio
 * @private
 */
StudyPromptShortcuts.prototype._handleActionAudio = function() {
  this.prompt.reviews.vocab.play();
};

/**
 * @method _handleActionErase
 * @private
 */
StudyPromptShortcuts.prototype._handleActionErase = function() {
  switch (this.prompt.reviews.part) {
    case 'rune':
      this.prompt.part.eraseCharacter();
      break;
  }
};

/**
 * @method _handleActionShow
 * @private
 */
StudyPromptShortcuts.prototype._handleActionShow = function() {
  this.prompt.canvas.clearLayer('character-hint');
  switch (this.prompt.reviews.part) {
    case 'rune':
      this.prompt.review.set('score', 1);
      this.prompt.canvas.drawShape(
        'character-hint',
        this.prompt.review.character.getTargetShape(),
        {color: '#e8ded2'}
      );
      break;
    case 'tone':
      this.prompt.review.set('score', 1);
      this.prompt.canvas.drawCharacter(
        'character-hint',
        this.prompt.review.vocab.get('writing'),
        {color: '#e8ded2', font: this.prompt.review.vocab.getFontName()}
      );
      break;
  }
};

/**
 * @method _handleGradingKeyup
 * @private
 */
StudyPromptShortcuts.prototype._handleActionTeach = function() {
  switch (this.prompt.reviews.part) {
    case 'rune':
      this.prompt.part.teachCharacter();
      break;
  }
};

/**
 * @method _handleGradingKeydown
 * @param {Number} value
 * @private
 */
StudyPromptShortcuts.prototype._handleGradingKeydown = function(value) {
  if (this.prompt.review.isComplete()) {
    this.prompt.toolbarGrading.select(value);
    this.prompt.review.set('score', value);
    this.prompt.canvas.injectLayerColor(
      'character',
      this.prompt.review.getGradingColor()
    );
  }
};

/**
 * @method _handleGradingKeyup
 * @param {Number} value
 * @private
 */
StudyPromptShortcuts.prototype._handleGradingKeyup = function(value) {
  if (this.prompt.review.isComplete()) {
    this.prompt.review.set('score', value);
    this.prompt.next();
  }
};

/**
 * @method _handleGradingToggle
 * @private
 */
StudyPromptShortcuts.prototype._handleGradingToggle = function() {

  // because num lock
  if (arguments[0].code === 'Numpad2') {
    return;
  }

  if (this.prompt.review.isComplete()) {
    this.prompt.review.set('score', this.prompt.review.get('score') === 1 ? 3 : 1);
    this.prompt.toolbarGrading.select(this.prompt.review.get('score'));
    this.prompt.canvas.injectLayerColor(
      'character',
      this.prompt.review.getGradingColor()
    );
  }
};

/**
 * @method _handleNavigateNext
 * @private
 */
StudyPromptShortcuts.prototype._handleNavigateNext = function() {
  this.prompt.review.stop();
  this.prompt.next();
};

/**
 * @method _handleNavigatePrevious
 * @private
 */
StudyPromptShortcuts.prototype._handleNavigatePrevious = function() {
  this.prompt.review.stop();
  this.prompt.previous();
};

/**
 * @method _handleNavigateReveal
 * @private
 */
StudyPromptShortcuts.prototype._handleNavigateReveal = function() {
  switch (this.prompt.reviews.part) {
    case 'rune':
      if (this.prompt.review.isComplete()) {
        this._handleNavigateNext();
      } else {
        this.prompt.part.completeCharacter();
      }
      break;
    case 'tone':
      if (this.prompt.review.isComplete()) {
        this._handleNavigateNext();
      } else {
        this.prompt.part.completeTone();
      }
      break;
    case 'rdng':
      if (this.prompt.review.isComplete()) {
        this._handleNavigateNext();
      } else {
        this.prompt.part.completeReading();
      }
      break;
    default:
      if (this.prompt.review.isComplete()) {
        this.prompt.next();
      } else {
        this.prompt.review.set('complete', true);
        this.prompt.renderPart();
      }
  }
};

/**
 * @method _handleToneKeydown
 * @param {Number} value
 * @private
 */
StudyPromptShortcuts.prototype._handleToneKeydown = function(value) {
  var possibleTones = this.prompt.review.getTones();
  var expectedTone = this.prompt.review.character.getTone(possibleTones[0]);
  if (possibleTones.indexOf(value) > -1) {
    this.prompt.review.set('score', 3);
    this.prompt.review.character.reset();
    this.prompt.review.character.add(this.prompt.review.character.getTone(value));
    this.prompt.canvas.drawShape(
      'character',
      this.prompt.review.character.getTone(value).getTargetShape(),
      {color: this.prompt.review.getGradingColor()}
    );
  } else {
    this.prompt.review.set('score', 1);
    this.prompt.review.character.reset();
    this.prompt.review.character.add(expectedTone);
    this.prompt.canvas.drawShape(
      'character',
      expectedTone.getTargetShape(),
      {color: this.prompt.review.getGradingColor()}
    );
  }
  if (this.prompt.review.character.isComplete()) {
    this.prompt.part.renderComplete();
  } else {
    this.prompt.part.renderIncomplete();
  }
};

/**
 * @method _registerAction
 * @private
 */
StudyPromptShortcuts.prototype._registerAction = function() {
  this.action.register_many([
    {
      'keys': 'apostrophe',
      'on_keydown': _.bind(this._handleActionAudio, this),
      'prevent_repeat': true
    },
    {
      'keys': 'up',
      'on_keydown': _.bind(this._handleActionShow, this),
      'prevent_repeat': true
    },
    {
      'keys': '.',
      'on_keydown': _.bind(this._handleActionErase, this),
      'prevent_repeat': true
    },
    {
      'keys': 'a',
      'on_keydown': _.bind(this._handleActionAudio, this),
      'prevent_repeat': true
    },
    {
      'keys': 'l',
      'on_keydown': _.bind(this._handleActionShow, this),
      'prevent_repeat': true
    },
    {
      'keys': 's',
      'on_keydown': _.bind(this._handleActionShow, this),
      'prevent_repeat': true
    },
    {
      'keys': 't',
      'on_keydown': _.bind(this._handleActionTeach, this),
      'prevent_repeat': true
    },
    {
      'keys': 'x',
      'on_keydown': _.bind(this._handleActionErase, this),
      'prevent_repeat': true
    }
  ]);
};

/**
 * @method _registerGrading
 * @private
 */
StudyPromptShortcuts.prototype._registerGrading = function() {
  this.grading.register_many([
    {
      'keys': 'down',
      'on_keydown': _.bind(this._handleGradingToggle, this),
      'prevent_repeat': true
    },
    {
      'keys': 'm',
      'on_keydown': _.bind(this._handleGradingToggle, this),
      'prevent_repeat': true
    },
    {
      'keys': 'v',
      'on_keydown': _.bind(this._handleGradingToggle, this),
      'prevent_repeat': true
    },
    {
      'keys': '1',
      'on_keydown': _.bind(this._handleGradingKeydown, this, 1),
      'on_keyup': _.bind(this._handleGradingKeyup, this, 1),
      'prevent_repeat': true
    },
    {
      'keys': '6',
      'on_keydown': _.bind(this._handleGradingKeydown, this, 1),
      'on_keyup': _.bind(this._handleGradingKeyup, this, 1),
      'prevent_repeat': true
    },
    {
      'keys': '2',
      'on_keydown': _.bind(this._handleGradingKeydown, this, 2),
      'on_keyup': _.bind(this._handleGradingKeyup, this, 2),
      'prevent_repeat': true
    },
    {
      'keys': '7',
      'on_keydown': _.bind(this._handleGradingKeydown, this, 2),
      'on_keyup': _.bind(this._handleGradingKeyup, this, 2),
      'prevent_repeat': true
    },
    {
      'keys': '3',
      'on_keydown': _.bind(this._handleGradingKeydown, this, 3),
      'on_keyup': _.bind(this._handleGradingKeyup, this, 3),
      'prevent_repeat': true
    },
    {
      'keys': '8',
      'on_keydown': _.bind(this._handleGradingKeydown, this, 3),
      'on_keyup': _.bind(this._handleGradingKeyup, this, 3),
      'prevent_repeat': true
    },
    {
      'keys': '4',
      'on_keydown': _.bind(this._handleGradingKeydown, this, 4),
      'on_keyup': _.bind(this._handleGradingKeyup, this, 4),
      'prevent_repeat': true
    },
    {
      'keys': '9',
      'on_keydown': _.bind(this._handleGradingKeydown, this, 4),
      'on_keyup': _.bind(this._handleGradingKeyup, this, 4),
      'prevent_repeat': true
    },
    {
      'keys': 'num_1',
      'on_keydown': _.bind(this._handleGradingKeydown, this, 1),
      'on_keyup': _.bind(this._handleGradingKeyup, this, 1),
      'prevent_repeat': true
    },
    {
      'keys': 'num_2',
      'on_keydown': _.bind(this._handleGradingKeydown, this, 2),
      'on_keyup': _.bind(this._handleGradingKeyup, this, 2),
      'prevent_repeat': true
    },
    {
      'keys': 'num_3',
      'on_keydown': _.bind(this._handleGradingKeydown, this, 3),
      'on_keyup': _.bind(this._handleGradingKeyup, this, 3),
      'prevent_repeat': true
    },
    {
      'keys': 'num_4',
      'on_keydown': _.bind(this._handleGradingKeydown, this, 4),
      'on_keyup': _.bind(this._handleGradingKeyup, this, 4),
      'prevent_repeat': true
    }
  ]);
};

/**
 * @method _registerNavigate
 * @private
 */
StudyPromptShortcuts.prototype._registerNavigate = function() {
  this.navigate.register_many([
    {
      'keys': 'enter',
      'on_keydown': _.bind(this._handleNavigateReveal, this),
      'prevent_repeat': true
    },
    {
      'keys': 'left',
      'on_keydown': _.bind(this._handleNavigatePrevious, this),
      'prevent_repeat': true
    },
    {
      'keys': 'right',
      'on_keydown': _.bind(this._handleNavigateNext, this),
      'prevent_repeat': true
    },
    {
      'keys': 'space',
      'on_keydown': _.bind(this._handleNavigateReveal, this),
      'prevent_repeat': true
    }
  ]);
};

/**
 * @method _registerTone
 * @private
 */
StudyPromptShortcuts.prototype._registerTone = function() {
  this.tone.register_many([
    {
      'keys': '1',
      'on_keydown': _.bind(this._handleToneKeydown, this, 1),
      'prevent_repeat': true
    },
    {
      'keys': '6',
      'on_keydown': _.bind(this._handleToneKeydown, this, 1),
      'prevent_repeat': true
    },
    {
      'keys': '2',
      'on_keydown': _.bind(this._handleToneKeydown, this, 2),
      'prevent_repeat': true
    },
    {
      'keys': '7',
      'on_keydown': _.bind(this._handleToneKeydown, this, 2),
      'prevent_repeat': true
    },
    {
      'keys': '3',
      'on_keydown': _.bind(this._handleToneKeydown, this, 3),
      'prevent_repeat': true
    },
    {
      'keys': '8',
      'on_keydown': _.bind(this._handleToneKeydown, this, 3),
      'prevent_repeat': true
    },
    {
      'keys': '4',
      'on_keydown': _.bind(this._handleToneKeydown, this, 4),
      'prevent_repeat': true
    },
    {
      'keys': '9',
      'on_keydown': _.bind(this._handleToneKeydown, this, 4),
      'prevent_repeat': true
    },
    {
      'keys': '5',
      'on_keydown': _.bind(this._handleToneKeydown, this, 5),
      'prevent_repeat': true
    },
    {
      'keys': '0',
      'on_keydown': _.bind(this._handleToneKeydown, this, 5),
      'prevent_repeat': true
    },
    {
      'keys': 'num_1',
      'on_keydown': _.bind(this._handleToneKeydown, this, 1),
      'prevent_repeat': true
    },
    {
      'keys': 'num_2',
      'on_keydown': _.bind(this._handleToneKeydown, this, 2),
      'prevent_repeat': true
    },
    {
      'keys': 'num_3',
      'on_keydown': _.bind(this._handleToneKeydown, this, 3),
      'prevent_repeat': true
    },
    {
      'keys': 'num_4',
      'on_keydown': _.bind(this._handleToneKeydown, this, 4),
      'prevent_repeat': true
    },
    {
      'keys': 'num_5',
      'on_keydown': _.bind(this._handleToneKeydown, this, 5),
      'prevent_repeat': true
    }
  ]);
};

/**
 * @method registerAll
 * @returns {StudyPromptShortcuts}
 */
StudyPromptShortcuts.prototype.registerAll = function() {
  this.unregisterAll();
  this._registerAction();
  this._registerGrading();
  this._registerNavigate();
  this._registerTone();
  return this;
};

/**
 * @method unregisterAll
 * @returns {StudyPromptShortcuts}
 */
StudyPromptShortcuts.prototype.unregisterAll = function() {
  this.action.reset();
  this.grading.reset();
  this.navigate.reset();
  this.tone.reset();
  return this;
};

module.exports = StudyPromptShortcuts;
