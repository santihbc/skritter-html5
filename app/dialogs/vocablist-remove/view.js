const BootstrapDialog = require('base/bootstrap-dialog');

/**
 * @class VocablistRemoveDialog
 * @extends {BootstrapDialog}
 */
module.exports = BootstrapDialog.extend({
  /**
   * @property events
   * @type {Object}
   */
  events: {
    'click #confirm-btn': 'handleClickConfirmButton',
    'click #cancel-btn': 'handleClickCancelButton'
  },

  /**
   * @property template
   * @type {Function}
   */
  template: require('dialogs/vocablist-remove/template'),

  /**
   * @method initialize
   * @param {Object} options
   */
  initialize: function(options) {
    this.vocablist = options.vocablist;
    this.vocablistId = this.vocablist.id;

    this.itemsCursor = '';
    this.itemsRemoved = 0;
    this.itemsToRemove = 0;
    this.toRemove = ["item", "sect_complete"];

    if (!this.vocablist) {
      throw new Error('VocablistRemoveDialog requires a vocablist passed in!')
    }
  },

  /**
   * @method render
   * @returns {VocablistRemoveDialog}
   */
  render: function() {
    this.renderTemplate();

    return this;
  },

  /**
   * Gets a count of all the vocab in the list, then deletes them
   */
  deleteVocabFromList: function() {

    this.getListVocabCount().then(() => {

      // TODO: update UI with count
      this._removeVocab().then(() => {
        this.close();
      }, (error) => {
        this.showError('Error deleting associated vocab from list. Please contact the Skritter team regarding list ' + this.vocablistId);
      });
    }, (error) => {
      this.showError('Error deleting associated vocab from list. Please contact the Skritter team regarding list ' + this.vocablistId);
    });
  },

  /**
   * Gets the total count
   * @return {Promise}
   */
  getListVocabCount: function() {
    return new Promise((resolve, reject) => {
      $.ajax({
        context: this,
        url: app.getApiUrl() + 'vocablists/' + this.vocablistId + '/vocab-count?cursor=' + this.itemsCursor,
        type: 'GET',
        headers: app.user.session.getHeaders(),
        error: function(error) {
          reject();
        },
        success: (resp) => {
          this.itemsToRemove += resp.num;

          if (resp.cursor) {
            this.itemsCursor = resp.cursor;
            this.getListVocabCount().then(() => {
              resolve();
            }, (error) => {
              reject();
            });
          } else {
            resolve();
          }
        }
      });
    });
  },

  /**
   * @method handleClickCloseButton
   * @param {Event} e
   */
  handleClickCancelButton: function(e) {
    this.close();
  },

  /**
   * @method handleClickSaveButton
   * @param {Event} e
   */
  handleClickConfirmButton: function(e) {
    this.vocablist.save({'studyingMode': 'not studying'}, {
      patch: true,
      method: 'PUT',
      success: () => {
        this.hideError();

        if (app.isDevelopment()) {
          this.deleteVocabFromList();
        } else {
          this.close();
        }
      },
      error: (error) => {
        this.resetUI();
        this.showError('There was a problem deleting the list. Please try again.');
      }
    });

    this.$('.step-1').addClass('hidden');
    this.$('#confirm-btn').addClass('hidden');
    this.$('.step-2').removeClass('hidden');
  },

  /**
   * Hides the error message from the user
   */
  hideError: function() {
    this.$('#error-msg').text('').addClass('hidden');
  },

  /**
   * Shows an error message to the user
   * @param {String} error the error message to show
   */
  showError: function(error) {
    this.$('#error-msg').text(error).removeClass('hidden');
  },

  /**
   * Shows an update message to the user on the progress of deleting the vocab associations from the list
   * @param {String} msg the error message to show
   */
  showVocabDeletionStatusText: function(msg) {
    this.$('#deleting-status').text(msg).removeClass('hidden');
  },

  /**
   * Resets the dialog to its initial state and hides any error messages
   */
  resetUI: function() {
    this.hideError();
    this.$('.#confirm-btn').removeClass('hidden');
    this.$('.step-1').removeClass('hidden');
    this.$('.step-2').addClass('hidden');
  },

  /**
   * Generates a status text update on the progress of the vocab deletion
   */
  updateVocabDeletionStatusText: function() {
    let percentDone = 100 * this.itemsRemoved / Math.max(this.itemsToRemove, 1);
    percentDone = parseInt(Math.min(99, percentDone), 10);

    let toGo = this.itemsToRemove - this.itemsRemoved;
    let statusText = percentDone + "% complete ";
    if (toGo > 0) {
      statusText += "(" + to_go + " to process)";
    }

    if (this.toRemove[0] !== 'item') {
      statusText = 'WrappingUp';
    }
    this.showVocabDeletionStatusText(statusText);
  },

  /**
   * Removes associated vocab from the user's study queue in batches.
   */
  _removeVocab: function() {
    this.updateVocabDeletionStatusText();

    return new Promise((resolve, reject) => {
      $.ajax({
        context: this,
        url: app.getApiUrl() + 'vocablists/' + this.vocablistId + '/vocab',
        type: 'DELETE',
        headers: app.user.session.getHeaders(),
        data: {
          kind: this.toRemove[0],
          offset: this.itemsRemoved
        },
        error: function(error) {
          reject();
        },
        success: (resp) => {
          this.itemsRemoved += resp.num;

          if (resp.more) {
            this._removeVocab().then(() => {
              resolve();
            }, (error) => {
              reject();
            });
          } else {
            this.toRemove.shift();

            // means we still have sect_complete to update
            if (this.toRemove.length) {
              this._removeVocab().then(() => {
                resolve();
              }, (error) => {
                reject();
              });
            }

            // means we've updated both items and sect_complete, we're done
            else {
              resolve();
            }
          }
        }
      });
    });
  }
});
