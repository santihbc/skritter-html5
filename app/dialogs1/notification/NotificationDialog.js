const GelatoDialog = require('gelato/dialog');

/**
 * @class VocabViewer
 * @extends {GelatoDialog}
 */
module.exports = GelatoDialog.extend({
  events: {
    'click #notification-button': 'handleNotificationButtonClicked'
  },

  /**
   * @property template
   * @type {Function}
   */
  template: require('./NotificationDialog.jade'),

  /**
   * @method initialize
   * @constructor
   */
  initialize: function(options) {
    this.set(options);
  },

  /**
   * @method render
   * @returns {VocabViewer}
   */
  render: function() {
    this.renderTemplate({
      dialogTitle: this.dialogTitle,
      showTitle: this.showTitle,
      body: this.body,
      buttonText: this.buttonText,
      showConfirmButton: this.showConfirmButton
    });

    if (this.style) {
      _.defer(() => {
        this.setStyle(this.style);
      });
    }

    return this;
  },

  /**
   *
   * @param {jQuery.Event}event
   */
  handleNotificationButtonClicked: function(event) {
    if (this.next) {
      this.set(this.next);
      return;
    }

    this.close();
  },

  /**
   * Sets the content of the dialog
   * @param {Object} options content and display options for the dialog
   * @param {String} [options.dialogTitle] the title for the dialog
   * @param {Boolean} [options.showTitle] whether to show a title on the dialog
   * @param {String} [options.body] the text to display
   * @param {String} [options.buttonText] the text for the confirm/close button
   * @param {Boolean} [options.showConfirmButton] whether to show a button to confirm/close the dialog
   */
  set: function(options) {
    options = options || {};

    this.dialogTitle = options.dialogTitle;
    this.showTitle = options.showTitle;
    this.body = options.body;
    this.buttonText = options.buttonText;
    this.showConfirmButton = options.showConfirmButton;
    this.next = options.next;
    this.style = options.style;

    if (this.style) {
      this.setStyle(this.style);
    }

    this.updateValues();

    return this;
  },

  /**
   *
   * @param {Object} style
   * @param {Object} [style.dialog] style options for the dialog
   * @param {Object} [style.backdrop] style options for the backdrop
   */
  setStyle: function(style) {
    if (style.dialog) {
      let dialogStyle = 'display: block;';
      for (let key in style.dialog) {
        dialogStyle += key + ': ' + style.dialog[key] + ';';
      }

      this.$('.modal').attr('style', dialogStyle);
    }

    if (style.backdrop) {
      let backdropStyle = '';
      for (let key in style.backdrop) {
        backdropStyle += key + ': ' + style.backdrop[key] + ';';
      }
      $('.modal-backdrop').attr('style', backdropStyle);
    }
  },

  updateValues: function() {
    this.$('.dialog-title').toggleClass('hidden', !this.dialogTitle).text(this.dialogTitle);
    this.$('.button-wrapper').toggleClass('hidden', !this.showConfirmButton);
    this.$('.modal-body').html(this.body);
    if (this.showConfirmButton) {
      this.$('#notification-button').text(this.buttonText || 'OK');
    }
  }
});
