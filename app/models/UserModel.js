const OfflineModel = require('models/OfflineModel');
const SkritterModel = require('base/BaseSkritterModel');
const SessionModel = require('models/SessionModel');
const SubscriptionModel = require('models/SubscriptionModel');
const CharacterCollection = require('collections/CharacterCollection');
const VocablistCollection = require('collections/VocablistCollection');
const ProgressStatsCollection = require('collections/ProgressStatsCollection');
const GelatoCollection = require('gelato/collection');

/**
 * A model that represents a Skritter user.
 * @class UserModel
 * @extends {SkritterModel}
 */
const UserModel = SkritterModel.extend({

  /**
   * @property defaults
   * @type {Object}
   */
  defaults: {
    addItemOffset: 0,
    avatar: require('data/default-avatar'),
    allChineseParts: ['defn', 'rdng', 'rune', 'tone'],
    allJapaneseParts: ['defn', 'rdng', 'rune'],
    audioEnabled: true,
    autoAdvancePrompts: 1.0,
    dailyItemAddingLimit: 20,
    disabled: false,
    disablePinyinReadingPromptInput: false,
    filteredChineseParts: ['defn', 'rdng', 'rune', 'tone'],
    filteredChineseStyles: ['both', 'simp', 'trad'],
    filteredJapaneseParts: ['defn', 'rdng', 'rune'],
    filteredJapaneseStyles: [],
    hideDefinition: false,
    gradingColors: {1: '#e74c3c', 2: '#ebbd3e', 3: '#87a64b', 4: '#4d88e3'},
    goals: {ja: {items: 20}, zh: {items: 20}},
    lastChineseItemUpdate: 0,
    lastJapaneseItemUpdate: 0,
    readingChinese: 'pinyin',
    readingJapanese: 'kana',
    spaceItems: false,
    studyKana: false,
    teachingMode: true,
    timezone: 'America/New_York',
    volume: 1.0,
    wordDictionary: null
  },

  /**
   * @property urlRoot
   * @type {String}
   */
  urlRoot: 'users',

  /**
   * A vocablist collection
   * @property vocablists
   * @type {VocablistCollection}
   */
  vocablists: new VocablistCollection(),

  /**
   * A progress stats collection
   * @property stats
   * @type {ProgressStatsCollection}
   */
  stats: new ProgressStatsCollection(),

  /**
   * @method initialize
   * @constructor
   */
  initialize: function() {
    this.characters = new CharacterCollection();
    this.offline = new OfflineModel(null, {user: this});
    this.session = new SessionModel(null, {user: this});
    this.subscription = new SubscriptionModel({id: this.id});
  },

  /**
   * @method sync
   * @param {String} method
   * @param {Model} model
   * @param {Object} options
   */
  sync: function(method, model, options) {
    options.headers = _.result(this, 'headers');

    if (!options.url) {
      options.url = app.getApiUrl() + _.result(this, 'url');
    }

    if (method === 'read' && app.config.useV2Gets.users) {
      options.url = app.getApiUrl(2) + 'gae/users/';
      // options.url = 'http://localhost:3210/v2/gae/users/';
    }

    // TODO: figure out why null values crash the legacy api
    if (model.get('aboutMe') === null) {
      model.unset('aboutMe');
    }

    // TODO: figure out why null values crash the legacy api
    if (model.get('wordDictionary') === null) {
      model.unset('wordDictionary');
    }

    GelatoCollection.prototype.sync.call(this, method, model, options);
  },

  validate: function() {

    // because the backend checks for data it didn't
    if (typeof this.get('disabled') !== 'boolean') {
      this.set('disabled', Boolean(this.get('disabled')));
    }
  },

  /**
   * @method cache
   */
  cache: function() {
    app.setLocalStorage(this.id + '-user', this.toJSON());
  },

  /**
   * @method getAccountAgeBy
   * @param {String} [unit]
   * @returns {Number}
   */
  getAccountAgeBy: function(unit) {
    return moment().diff(this.get('created') * 1000, unit || 'days');
  },

  /**
   * @method getAllStudyParts
   * @returns {Array}
   */
  getAllStudyParts: function() {
    return app.isChinese() ? this.get('allChineseParts') : this.get('allJapaneseParts');
  },

  /**
   * @method getAllStudyStyles
   * @returns {Array}
   */
  getAllStudyStyles: function() {
    return app.isChinese() ? ['both', 'simp', 'trad'] : ['none'];
  },

  /**
   * @method getFilterParts
   * @returns {Array}
   */
  getFilteredParts: function() {
    var filteredParts = app.isChinese() ? this.get('filteredChineseParts') : this.get('filteredJapaneseParts');

    return _.intersection(this.getStudyParts(), filteredParts);
  },

  /**
   * @method getFilteredStyles
   * @returns {Array}
   */
  getFilteredStyles: function() {
    var filteredParts = app.isChinese() ? this.get('filteredChineseStyles') : this.get('filteredChineseStyles');

    return _.intersection(this.getStudyStyles(), filteredParts);
  },

  /**
   * @method getLastItemUpdate
   * @returns {Number}
   */
  getLastItemUpdate: function() {
    return app.isChinese() ? this.get('lastChineseItemUpdate') : this.get('lastJapaneseItemUpdate')
  },

  /**
   * Gets the preferred version of a string of characters given the current user's preferences
   * @param {String} simp the simplified zh version of the string
   * @param {String} [trad] the traditional zh version of the string. Defaults to simp if not provided
   * @param {String} [ja] the ja version of the string. Defaults to trad zh or simp if not provided
   * @return {String} the variant that the user prefers
   */
  getPreferredCharSet: function(simp, trad, ja) {
    if (app.isChinese()) {
      if (this.get('reviewTraditional') && !this.get('reviewSimplified')) {
        return trad || simp;
      }

      return simp;
    }

    return ja || trad || simp;
  },

  /**
   * @method getStudyParts
   * @returns {Array}
   */
  getStudyParts: function() {
    return app.isChinese() ? this.get('chineseStudyParts') : this.get('japaneseStudyParts');
  },

  /**
   * @method getStudyStyles
   * @returns {Array}
   */
  getStudyStyles: function() {
    var styles = ['both'];

    if (app.isChinese()) {
      if (this.get('reviewSimplified')) {
        styles.push('simp');
      }
      if (this.get('reviewTraditional')) {
        styles.push('trad');
      }
    }

    return styles;
  },

  /**
   * @method getRaygunTags
   * @returns {Array}
   */
  getRaygunTags: function() {
    var tags = [];
    if (app.isChinese()) {
      tags.push('chinese');
      if (this.get('reviewSimplified')) {
        tags.push('simplified');
      }
      if (this.get('reviewTraditional')) {
        tags.push('traditional');
      }
    } else if (app.isJapanese()) {
      tags.push('japanese');
    }
    return tags;
  },

  /**
   * @method isAddingPart
   * @param {String} part
   * @returns {Boolean}
   */
  isAddingPart: function(part) {
    return _.includes(this.getStudyParts(), part);
  },

  /**
   * @method isAddingStyle
   * @param {String} style
   * @returns {Boolean}
   */
  isAddingStyle: function(style) {
    return _.includes(this.getStudyStyles(), style);
  },

  /**
   * @method isAudioEnabled
   * @returns {Boolean}
   */
  isAudioEnabled: function() {
    return !!this.get('audioEnabled');
  },

  /**
   * @method isItemAddingAllowed
   * @returns {Boolean}
   */
  isItemAddingAllowed: function() {
    return this.get('addFrequency') > 0;
  },

  /**
   * @method isLoggedIn
   * @returns {Boolean}
   */
  isLoggedIn: function() {
    return this.session.has('user_id');
  },

  /**
   * @method isReviewingPart
   * @param {String} part
   * @returns {Boolean}
   */
  isReviewingPart: function(part) {
    return _.includes(this.getFilteredParts(), part);
  },

  /**
   * @method isReviewingStyle
   * @param {String} style
   * @returns {Boolean}
   */
  isReviewingStyle: function(style) {
    return _.includes(this.getFilteredStyles(), style);
  },

  /**
   * Asynchronously checks whether the user's subscription is active while
   * optimizing fetches using memoization kinda.
   * Can also get a synchronous return if things have already been fetched.
   * This is bad design. I'm sorry. Will refactor once we do ES6. I..."promise".
   * @param {Function} [callback] called when it can be determined
   *                            whether the subscription is active.
   */
  isSubscriptionActive: function(callback) {
    var self = this;

    if (this.subscription.isFetched) {

      if (_.isFunction(callback)) {
        callback(this.subscription.getStatus() !== 'Expired');
      }

      return this.subscription.getStatus() !== 'Expired';
    } else {
      this.subscription.fetch({
        success: function() {
          if (_.isFunction(callback)) {
            callback(self.subscription.getStatus() !== 'Expired');
          }
        }
      });
    }
  },

  /**
   * @method login
   * @param {String} username
   * @param {String} password
   * @param {Function} callback
   */
  login: function(username, password, callback) {
    var self = this;
    async.waterfall([
      function(callback) {
        self.session.authenticate('password', username, password,
          function(result) {
            callback(null, result);
          }, function(error) {
            callback(error);
          });
      },
      function(result, callback) {
        self.set('id', result.id);
        self.fetch({
          error: function(error) {
            callback(error);
          },
          success: function(user) {
            callback(null, user);
          }
        })
      }
    ], function(error, user) {
      if (error) {
        callback(error);
      } else {
        self.cache();
        self.session.cache();
        app.removeSetting('session');
        app.removeSetting('siteRef');
        app.setSetting('user', self.id);
        mixpanel.identify(self.id);
        callback(null, user);
      }
    });
  },

  /**
   * Logs out a user
   * @method logout
   */
  logout: function() {
    var self = this;

    if (app.user.db) {
      app.user.db.delete()
        .then(function() {
          self._removeUserLocalStorageData()
        })
        .catch(function(error) {
          console.error(error);
          app.reload();
        });
    } else {
      // catches weird states where maybe some user data is still left over
      // but the login isn't valid
      self._removeUserLocalStorageData();
    }
  },

  /**
   * @method parse
   * @param {Object} response
   * @returns Array
   */
  parse: function(response) {
    if (response.User && response.User.autoAdvancePrompts) {
      response.User.autoAdvancePrompts = Boolean(response.User.autoAdvancePrompts);
    }
    return response.User;
  },

  /**
   * Deletes local storage and app settings related to user login
   * @method _removeUserLocalStorageData
   * @private
   */
  _removeUserLocalStorageData: function() {
    app.removeLocalStorage(self.id + '-session');
    app.removeLocalStorage(self.id + '-user');
    app.removeSetting('user');
    app.removeSetting('siteRef');
    app.reload();
  }

});

module.exports = UserModel;
