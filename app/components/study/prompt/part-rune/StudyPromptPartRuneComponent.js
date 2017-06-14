const GelatoComponent = require('gelato/component');
const config = require('config');

/**
 * @class StudyPromptPartRuneComponent
 * @extends {GelatoComponent}
 */
const StudyPromptPartRuneComponent = GelatoComponent.extend({

  /**
   * @property el
   * @type {String}
   */
  el: '#review-container',

  /**
   * Whether the keyboard shortcuts should be registered for this prompt
   * @type {Boolean}
   */
  registerShortcuts: true,

  /**
   * @property template
   * @type {Function}
   */
  template: require('./StudyPromptPartRuneComponent.jade'),

  /**
   * @method initialize
   * @param {Object} options
   * @param {StudyPromptComponent} options.prompt the prompt component
   * @constructor
   */
  initialize: function(options) {

    /**
     * The parent prompt instance
     * @type {StudyPromptComponent}
     */
    this.prompt = options.prompt;

    /**
     * UTC timestamp of when the last attempted stroke finished (mouseup)
     * @type {number}
     * @private
     */
    this._lastStrokeAttempt = Date.now();

    /**
     * How long to wait (in milliseconds) between when a user finishes a stroke
     * and when to allow stroke-revealing hints through mouse clicks.
     * @type {number}
     * @private
     */
    this._helpInterval = 300;

    this.listenTo(this.prompt.canvas, 'click', this.handlePromptCanvasClick);
    this.listenTo(this.prompt.canvas, 'doubletap', this.handlePromptDoubleTap);
    this.listenTo(this.prompt.canvas, 'swipeup', this.handlePromptCanvasSwipeUp);
    this.listenTo(this.prompt.canvas, 'tap', this.handlePromptCanvasTap);
    this.listenTo(this.prompt.canvas, 'input:up', this.handlePromptCanvasInputUp);
    this.listenTo(this.prompt.toolbarAction, 'click:correct', this.handlePromptToolbarActionCorrect);
    this.listenTo(this.prompt.toolbarAction, 'click:erase', this.handlePromptToolbarActionErase);
    this.listenTo(this.prompt.toolbarAction, 'click:show', this.handlePromptToolbarActionShow);
    this.listenTo(this.prompt.toolbarAction, 'click:teach', this.handlePromptToolbarActionTeach);
    this.listenTo(this.prompt.toolbarGrading, 'mousedown', this.handlePromptToolbarGradingMousedown);
    this.listenTo(this.prompt.toolbarGrading, 'mouseup', this.handlePromptToolbarGradingMouseup);
    this.listenTo(this.prompt.toolbarGrading, 'mousemove', this.handlePromptToolbarGradingMousemove);

    this.on('attempt:fail', this.handleAttemptFail);
    this.on('attempt:success', this.handleAttemptSuccess);
    this.on('resize', this.render);
  },

  /**
   * @method render
   * @returns {StudyPromptPartRuneComponent}
   */
  render: function() {
    this.prompt.review = this.prompt.reviews.current();
    this.prompt.canvas.grid = true;
    this.prompt.canvas.reset();
    this.prompt.shortcuts.tone.stop_listening();
    this.prompt.toolbarAction.buttonCorrect = true;
    this.prompt.toolbarAction.buttonErase = true;
    this.prompt.toolbarAction.buttonShow = true;
    this.prompt.toolbarAction.buttonTeach = true;

    if (app.isMobile()) {
      this.prompt.vocabDefinition.render();
      this.prompt.vocabMnemonic.render();
      this.prompt.vocabReading.render();
      this.prompt.vocabSentence.render();
      this.prompt.vocabStyle.render();
    }

    if (app.user.get('squigs')) {
      this.prompt.canvas.drawShape(
        'character',
        this.prompt.review.character.getUserSquig()
      );
    } else {
      this.prompt.canvas.drawShape(
        'character',
        this.prompt.review.character.getUserShape()
      );
    }

    if (this.prompt.review.isComplete()) {
      this.renderComplete();
    } else {
      this.renderIncomplete();
    }

    this.renderTemplate();

    return this;
  },

  /**
   * @method renderComplete
   * @returns {StudyPromptPartRuneComponent}
   */
  renderComplete: function() {
    this.prompt.review.stop();
    this.prompt.review.set('complete', true);
    this.prompt.shortcuts.grading.listen();
    this.prompt.canvas.clearLayer('character-teach');
    this.prompt.canvas.disableInput();

    this.prompt.navigation.render();
    this.prompt.toolbarAction.render();
    this.prompt.toolbarGrading.render({delayEvents: true});
    this.prompt.toolbarGrading.select(this.prompt.review.get('score'));
    this.prompt.vocabReading.render();
    this.prompt.vocabWriting.render();


    if (!app.isMobile()) {
      this.prompt.toolbarVocab.render();
      this.prompt.vocabContained.render();
      this.prompt.vocabDefinition.render();
      this.prompt.vocabMnemonic.render();
      this.prompt.vocabSentence.render();
      this.prompt.vocabStyle.render();
    }

    if (this.prompt.review.get('showTeaching')) {
      this.prompt.review.set('score', 1);
    } else {
      this.prompt.canvas.injectLayerColor(
        'character',
        this.prompt.review.getGradingColor()
      );
    }

    if (app.user.get('squigs')) {
      this.prompt.canvas.drawShape(
        'character-reveal',
        this.prompt.review.character.getTargetShape(),
        {color: '#2c261b'}
      );
    }

    if (app.user.isAudioEnabled() &&
      app.user.get('hideReading') &&
      this.prompt.reviews.isLast()) {
      this.prompt.reviews.vocab.play();
    }

    this.prompt.trigger('character:complete');

    return this;
  },

  /**
   * @method renderIncomplete
   * @returns {StudyPromptPartRuneComponent}
   */
  renderIncomplete: function() {
    this.prompt.review.start();
    this.prompt.review.set('complete', false);
    this.prompt.shortcuts.grading.stop_listening();

    this.prompt.canvas.enableInput();

    this.prompt.navigation.render();
    this.prompt.toolbarAction.render();
    this.prompt.toolbarGrading.render();
    this.prompt.vocabReading.render();
    this.prompt.vocabWriting.render();

    if (!app.isMobile()) {
      this.prompt.toolbarVocab.render();
      this.prompt.vocabContained.render();
      this.prompt.vocabDefinition.render();
      this.prompt.vocabMnemonic.render();
      this.prompt.vocabSentence.render();
      this.prompt.vocabStyle.render();
    }

    if (this.prompt.reviews.isTeachable() || this.prompt.review.get('showTeaching')) {
      this.teachCharacter();
    }

    if (this.prompt.review.item && this.prompt.review.item.isLeech()) {
      this.prompt.$('#leech-ribbon').removeClass('hidden');
      this.prompt.review.item.consecutiveWrong = 0;
      this.teachCharacter();
    } else {
      this.prompt.$('#leech-ribbon').addClass('hidden');
    }

    if (app.user.isAudioEnabled() && !app.user.get('hideReading') &&
      this.prompt.reviews.isFirst()) {
      this.prompt.reviews.vocab.play();
    }

    return this;
  },

  /**
   * @method handleAttemptFail
   */
  handleAttemptFail: function() {
    var character = this.prompt.review.character;
    var failedConsecutive = this.prompt.review.get('failedConsecutive') + 1;
    var failedTotal = this.prompt.review.get('failedTotal') + 1;
    var maxStrokes = character.getMaxPosition();

    this.prompt.review.set('failedConsecutive', failedConsecutive);
    this.prompt.review.set('failedTotal', failedTotal);

    if (maxStrokes > 11) {
      if (failedTotal > 3) {
        this.prompt.review.set('score', 1);
      }
    } else if (maxStrokes > 6) {
      if (failedTotal > 3) {
        this.prompt.review.set('score', 1);
      }
    } else if (maxStrokes > 2) {
      if (failedTotal > 2) {
        this.prompt.review.set('score', 1);
      }
    } else {
      if (failedTotal > 0) {
        this.prompt.review.set('score', 1);
      }
    }

    if (failedConsecutive > 2) {
      var expectedStroke = character.getExpectedStroke();
      if (expectedStroke) {
        this.prompt.canvas.fadeShape('stroke-hint', expectedStroke.getTargetShape());
      }
    }
  },

  /**
   * @method handleAttemptSuccess
   */
  handleAttemptSuccess: function() {
    this.prompt.review.set('failedConsecutive', 0);

    if (this.prompt.review.character.isComplete()) {
      // inject the grading color before expensive rendering
      if (this.prompt.review.get('showTeaching')) {
        this.prompt.review.set('score', 1);
      } else {
        this.prompt.canvas.injectLayerColor(
          'character',
          this.prompt.review.getGradingColor()
        );
      }

      // wait until events finish firing and call stack is cleared
      _.defer(() => {
        this.renderComplete();

        if (app.user.get('autoAdvancePrompts')) {
          this.prompt.startAutoAdvance();
        }
      });

    }

    if (this.prompt.review.get('showTeaching')) {
      this.teachCharacter();
    }
  },

  /**
   * @method handlePromptCanvasClick
   */
  handlePromptCanvasClick: function() {
    if (this.prompt.review.isComplete()) {
      if (this.prompt.review.item) {
        if (this.prompt.review.get('score') === 1) {
          this.prompt.review.item.consecutiveWrong++;
        } else {
          this.prompt.review.item.consecutiveWrong = 0;
        }
      }

      if (this.prompt.isAutoAdvancing) {
        this.prompt.stopAutoAdvance();
      } else {
        this.prompt.next();
      }
    } else {
      const now = Date.now();

      if (now - this._lastStrokeAttempt > this._helpInterval) {
        this.prompt.canvas.fadeLayer('character-hint');
      }
    }
  },

  /**
   * @method handlePromptCanvasInputUp
   * @param {Array} points
   * @param {createjs.Shape} shape
   */
  handlePromptCanvasInputUp: function(points, shape) {
    if (app.fn.getLength(points) >= 5) {
      const stroke = this.prompt.review.character.recognize(points, shape);

      this._lastStrokeAttempt = Date.now();

      if (stroke) {
        const targetShape = stroke.getTargetShape();
        const userShape = stroke.getUserShape();

        if (app.user.get('squigs')) {
          this.prompt.canvas.drawShape(
            'character',
            shape
          );
        } else {
          stroke.set('tweening', true);

          this.prompt.canvas.tweenShape(
            'character',
            userShape,
            targetShape
          );
        }

        this.trigger('attempt:success');
      } else {
        this.trigger('attempt:fail');
      }
    }
  },

  /**
   * Handles a swipeup event from the canvas and erases/resets the canvas
   * @method handlePromptCanvasSwipeUp
   */
  handlePromptCanvasSwipeUp: function() {
    this.prompt.review.set({
      failedConsecutive: 0,
      failedTotal: 0,
    });

    this.eraseCharacter();
  },

  /**
   * @method handlePromptDoubleTap
   */
  handlePromptDoubleTap: function() {
    const expectedShape = this.prompt.review.character.getTargetShape();

    // make delay a little longer for double tap--could misinterpret two
    // consecutive strokes/attempts
    const pastHelpThreshold = Date.now() - this._lastStrokeAttempt > this._helpInterval * 1.5;

    if (pastHelpThreshold && expectedShape) {
      this.prompt.canvas.clearLayer('character-hint');
      this.prompt.canvas.drawShape(
        'character-hint',
        this.prompt.review.character.getTargetShape(),
        {color: '#e8ded2'}
      );
      this.prompt.review.set('score', 1);
    }
  },

  /**
   * @method handlePromptCanvasTap
   */
  handlePromptCanvasTap: function() {
    var expectedStroke = this.prompt.review.character.getExpectedStroke();
    if (expectedStroke) {
      this.prompt.canvas.clearLayer('stroke-hint');
      this.prompt.canvas.fadeShape('stroke-hint', expectedStroke.getTargetShape());
      this.handleAttemptFail();
    }
  },

  /**
   * @method handlePromptToolbarActionCorrect
   */
  handlePromptToolbarActionCorrect: function() {
    this.prompt.review.set('score', this.prompt.review.get('score') === 1 ? 3 : 1);
    this.prompt.toolbarGrading.select(this.prompt.review.get('score'));

    if (this.prompt.review.isComplete()) {
      this.prompt.canvas.injectLayerColor(
        'character',
        this.prompt.review.getGradingColor()
      );
      this.prompt.toolbarAction.render();
    } else {
      this.completeCharacter();
    }

  },

  /**
   * @method handlePromptToolbarActionErase
   */
  handlePromptToolbarActionErase: function() {
    this.eraseCharacter();
  },

  /**
   * @method handlePromptToolbarActionShow
   */
  handlePromptToolbarActionShow: function() {
    this.showCharacter();
  },

  /**
   * @method handlePromptToolbarActionTeach
   */
  handlePromptToolbarActionTeach: function() {
    this.teachCharacter();
  },

  /**
   * Handles a mousemove event from the grading component.
   * Changes the color of the prompt to reflect the selected grade.
   * @method handlePromptToolbarGradingMousedown
   * @param {Number} score the new grade to apply
   */
  handlePromptToolbarGradingMousedown: function(score) {
    if (this.prompt.review.isComplete()) {
      this.prompt.review.set('score', score);
      this.prompt.canvas.injectLayerColor(
        'character',
        this.prompt.review.getGradingColor()
      );
    }
  },

  /**
   * Handles a mousemove event from the grading component.
   * Changes the color of the prompt to reflect the selected grade.
   * @method handlePromptToolbarGradingMousemove
   * @param {Number} score the new grade to apply
   */
  handlePromptToolbarGradingMousemove: function(score) {
    this.prompt.stopAutoAdvance();
    this.changeReviewScore(score);
  },

  /**
   * Handles a mouseup event from the grading component.
   * Changes the color of the prompt to reflect the selected grade.
   * @method handlePromptToolbarGradingMouseup
   * @param {Number} score the new grade to apply
   */
  handlePromptToolbarGradingMouseup: function(score) {
    this.prompt.stopAutoAdvance();
    this.changeReviewScore(score);

    setTimeout(() => {
      this.prompt.next();
    }, config.gradingBarClickAdvanceDelay);
  },

  /**
   * Changes the score for a review and updates the UI accordingly.
   * Stops any auto-advance features.
   * @param {Number} score the score to change the review to
   */
  changeReviewScore: function(score) {
    this.prompt.review.set('score', score);
    this.prompt.canvas.injectLayerColor(
      'character',
      this.prompt.review.getGradingColor()
    );
  },

  /**
   * @method completeCharacter
   */
  completeCharacter: function() {
    this.prompt.canvas.clearLayer('character');
    this.prompt.review.set('complete', true);
    this.prompt.review.character.reset();
    this.prompt.review.character.add(this.prompt.review.character.targets[0].models);
    this.render();
  },

  /**
   * @method eraseCharacter
   */
  eraseCharacter: function() {
    this.prompt.review.set({complete: false, showTeaching: false});
    this.prompt.review.character.reset();
    this.render();

    this.prompt.trigger('character:erased', this.prompt.review);
  },

  /**
   * @method showCharacter
   */
  showCharacter: function() {
    this.prompt.review.set('score', 1);
    this.prompt.canvas.clearLayer('character-hint');
    this.prompt.canvas.drawShape(
      'character-hint',
      this.prompt.review.character.getTargetShape(),
      {color: '#e8ded2'}
    );
  },

  /**
   * @method teachCharacter
   */
  teachCharacter: function() {
    if (!this.prompt.review.isComplete()) {
      var stroke = this.prompt.review.character.getExpectedStroke();
      if (stroke) {
        this.prompt.review.set('score', 1);
        this.prompt.review.set('showTeaching', true);
        this.prompt.canvas.clearLayer('character-teach');
        this.prompt.canvas.drawShape(
          'character-teach',
          this.prompt.review.character.getTargetShape(),
          {color: '#e8ded2'}
        );
        this.prompt.canvas.drawShape(
          'character-teach',
          stroke.getTargetShape(),
          {color: '#e8ded2'}
        );
        this.prompt.canvas.tracePath(
          'character-teach',
          stroke.getParamPath()
        );
      }
    }
  }

});

module.exports = StudyPromptPartRuneComponent;
