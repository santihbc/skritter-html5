const GelatoPage = require('gelato/page');
const AccountSidebar = require('components/account/AccountSidebarComponent');
const ResetVocablistPositionDialog = require('dialogs1/reset-vocablist-position/view');

/**
 * @class AccountSettingsStudyPage
 * @extends {GelatoPage}
 */
const AccountSettingsStudyPage = GelatoPage.extend({

  /**
   * @property events
   * @type {Object}
   */
  events: {
    // 'change select': 'handleChangeSelect',
    // 'change input[type="checkbox"]': 'handleChangeCheckbox',
    // 'change #field-target-language': 'handleChangeTargetLanguage',
    'click #button-save': 'handleClickButtonSave'
  },

  /**
   * @property title
   * @type {String}
   */
  title: 'Study Settings - Skritter',

  /**
   * @property template
   * @type {Function}
   */
  template: require('./AccountSettingsStudy'),

  /**
   * @method initialize
   * @constructor
   */
  initialize: function() {
    this.sidebar = new AccountSidebar();
    this.sourceLanguages = require('data/source-languages');
    this.listenTo(app.user, 'state', this.render);
    app.user.fetch();
  },

  /**
   * @method render
   * @returns {AccountSettingsStudyPage}
   */
  render: function() {
    if (app.isMobile()) {
      this.template = require('./MobileAccountSettingsStudy.jade');
    }

    this.renderTemplate();
    this.sidebar.setElement('#sidebar-container').render();
    return this;
  },

  /**
   * Displays an error message to the user.
   * @param {String} msg the message to display to the user
   */
  displayErrorMessage: function(msg) {
    this.$('#error-alert').text(msg).removeClass('hidden');
  },

  /**
   * @method getSelectedParts
   * @returns {Array}
   */
  getSelectedParts: function() {
    var parts = [];
    this.$('#field-parts :checked').each(function() {
      parts.push($(this).val());
    });
    return parts;
  },

  /**
   * Responds to the user changing a checkbox input's value
   * @param {jQuery.Event} event
   */
  handleChangeCheckbox: function(event) {
    this.handleClickButtonSave(event);
  },

  /**
   * Responds to the user changing a select input's value
   * @param {jQuery.Event} event
   */
  handleChangeSelect: function(event) {
    this.handleClickButtonSave(event);
  },

  /**
   * @method handleChangeTargetLanguage
   * @param {Event} event
   */
  handleChangeTargetLanguage: function(event) {
    event.preventDefault();
    app.user.set('targetLang', this.$('#field-target-language').val());
    this.render();
  },

  /**
   * @method handleClickButtonSave
   * @param {Event} event
   */
  handleClickButtonSave: function(event) {
    event.preventDefault();

    const self = this;
    let zhStudyStyleChanged;

    app.user.set({
      autoAddComponentCharacters: this.$('#field-add-contained').is(':checked'),
      autoAdvancePrompts: this.$('#field-auto-advance').is(':checked') ? 1.0 : 0,
      hideDefinition: this.$('#field-hide-definition').is(':checked'),
      hideReading: this.$('#field-hide-reading').is(':checked'),
      showHeisig: this.$('#field-heisig').is(':checked'),
      sourceLang: this.$('#field-source-language').val(),
      squigs: this.$('#field-squigs').is(':checked'),
      targetLang: this.$('#field-target-language').val() || app.getLanguage(),
      teachingMode: this.$('#field-teaching-mode').is(':checked'),
    });

    if (app.isChinese()) {
      app.user.set({
        addSimplified: this.$('#field-styles [value="simp"]').is(':checked'),
        addTraditional: this.$('#field-styles [value="trad"]').is(':checked'),
        chineseStudyParts: this.getSelectedParts(),
        disablePinyinReadingPromptInput: this.$('#field-pinyin-input').is(':checked'),
        readingChinese: this.$('#field-bopomofo').is(':checked') ? 'zhuyin' : 'pinyin'
      });
    }

    if (app.isJapanese()) {
      app.user.set({
        japaneseStudyParts: this.getSelectedParts(),
        readingJapanese: this.$('#field-romaji').is(':checked') ? 'romaji' : 'kana',
        studyKana: this.$('#field-study-kana').is(':checked'),
        studyRareWritings: this.$('#field-study-rare-writings').is(':checked'),
        studyAllListWritings: this.$('#field-study-all-list-writings').is(':checked')
      });
    }

    zhStudyStyleChanged = (app.isChinese() && app.user.hasChanged('addSimplified') ||
    app.user.hasChanged('addTraditional'));
    app.user.cache();
    app.user.save(null, {
      error: function(req, error) {
        let msg = error.responseJSON.message;
        self.displayErrorMessage(msg);
      },
      success: () => {
        if (zhStudyStyleChanged) {
          this.dialog = new ResetVocablistPositionDialog();
          this.dialog.render();
          this.dialog.open();
        }

        app.notifyUser({
          message: 'Settings saved.',
          type: 'pastel-success'
        });
      }
    });
  },

  /**
   * @method remove
   * @returns {AccountSettingsStudyPage}
   */
  remove: function() {
    this.sidebar.remove();
    return GelatoPage.prototype.remove.call(this);
  }

});

module.exports = AccountSettingsStudyPage;
