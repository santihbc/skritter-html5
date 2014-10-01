/**
 * @module Application
 */
define([
    'prompts/Prompt',
    'require.text!templates/mobile/prompts/prompt-tone.html'
], function(Prompt, DesktopTemplate) {
    /**
     * @class PromptTone
     * @extends {Prompt}
     */
    var PromptTone = Prompt.extend({
        /**
         * @method initialize
         * @param {Object} [options]
         * @param {PromptController} controller
         * @param {DataReview} review
         * @constructor
         */
        initialize: function(options, controller, review) {
            Prompt.prototype.initialize.call(this, options, controller, review);
            this.character = undefined;
            this.tones = undefined;
        },
        /**
         * @method render
         * @returns {PromptTone}
         */
        render: function() {
            app.timer.setLimits(15, 10);
            this.$el.html(this.compile(DesktopTemplate));
            Prompt.prototype.render.call(this);
            this.canvas.hideGrid().show();
            this.canvas.drawFontCharacter('background', this.review.getVocab().get('writing'), {
                alpha: 0.4
            });
            return this;
        },
        /**
         * @method renderAnswer
         * @returns {PromptTone}
         */
        renderAnswer: function() {
            Prompt.prototype.renderAnswer.call(this);
            this.canvas.disableInput();
            this.elements.fieldDefinition.html(this.vocab.getDefinition());
            this.elements.fieldMnemonic.html(this.vocab.getMnemonicText());
            this.elements.fieldReading.html(this.vocab.getReading(this.vocab.getCharacterCount() > 1 ? this.position + 1 : null, {
                hide: app.user.isChinese() ? app.user.settings.get('hideReading') : false,
                mask: true,
                style: app.user.settings.get('readingStyle')
            }));
            this.elements.fieldWriting.html(this.vocab.getWriting());
            if (app.user.settings.get('audio') && this.vocab.getAudio() && this.review.isLast()) {
                app.assets.playAudio(this.vocab.getAudio());
            }
            return this;
        },
        /**
         * @method renderQuestion
         * @returns {PromptTone}
         */
        renderQuestion: function() {
            Prompt.prototype.renderQuestion.call(this);
            this.character = this.review.getCharacter();
            this.tones = this.vocab.getTones(this.position);
            this.canvas.enableInput();
            this.elements.fieldDefinition.html(this.vocab.getDefinition());
            this.elements.fieldMnemonic.html(this.vocab.getMnemonicText());
            this.elements.fieldReading.html(this.vocab.getReading(this.position, {
                hide: app.user.settings.get('hideReading'),
                mask: true,
                style: app.user.settings.get('readingStyle')
            }));
            this.elements.fieldWriting.html(this.vocab.getWriting());
            return this;
        },
        /**
         * @method handlePromptClicked
         * @param {Event} event
         */
        handleCanvasClicked: function() {
            if (this.review.getAt('answered')) {
                this.next();
            } else {
                if (this.tones.indexOf(5) > -1) {
                    this.review.setAt('score', 3);
                    this.character.reset();
                    this.character.add(this.character.getTone(5));
                    this.canvas.drawShape('stroke', this.character.getShape());
                } else {
                    this.review.setAt('score', 1);
                    this.character.reset();
                    this.character.add(this.character.getTone(this.tones[0]));
                    this.canvas.drawShape('stroke', this.character.getShape());
                }
            }
        },
        /**
         * @method handleInputUp
         */
        handleInputUp: function(points, shape) {
            if (points && points.length > 4 && shape) {
                var stroke = this.character.recognizeStroke(points, shape);
                if (stroke) {
                    this.canvas.lastMouseDownEvent = null;
                    if (this.tones.indexOf(stroke.get('tone')) > -1) {
                        this.review.setAt('score', 3);
                        this.canvas.tweenShape('stroke', stroke.getUserShape(), stroke.getShape());
                    } else {
                        this.review.setAt('score', 1);
                        this.character.reset();
                        this.character.add(this.character.getTone(this.tones[0]));
                        this.canvas.drawShape('stroke', this.character.getShape());
                    }
                }
            }
            if (this.character.isComplete()) {
                this.renderAnswer();
            }
        },
        /**
         * @method reset
         * @returns {PromptTone}
         */
        reset: function() {
            Prompt.prototype.reset.call(this);
            this.canvas.clearAll();
            return this;
        },
        /**
         * @method resize
         * @returns {PromptTone}
         */
        resize: function() {
            Prompt.prototype.resize.call(this);
            var canvasSize = this.canvas.getWidth();
            var contentHeight = app.router.currentPage.getContentHeight();
            var contentWidth = app.router.currentPage.getContentWidth();
            this.elements.promptText.css('max-height', contentHeight - canvasSize - 1);
            if (app.isPortrait()) {
                this.$el.css({
                    'border-bottom': '1px solid #000000',
                    'border-right': 'none',
                    height: contentHeight - canvasSize - 1,
                    width: contentWidth
                });
            } else {
                this.$el.css({
                    'border-bottom': 'none',
                    'border-right': '1px solid #000000',
                    height: canvasSize,
                    width: contentWidth - canvasSize - 1
                });
            }
            return this;
        }
    });

    return PromptTone;
});
