const Dexie = require('dexie');
const GelatoModel = require('gelato/model');

/**
 * A model that represents a Skritter offline cache state.
 * @class OfflineModel
 * @extends {GelatoModel}
 */
const OfflineModel = GelatoModel.extend({

  /**
   * @method initialize
   * @param {Object} [attributes]
   * @param {Object} [options]
   * @constructor
   */
  initialize: function(attributes, options) {
    options = _.defaults(options, {});

    this.database = null;
    this.user = options.user;
  },

  items: [],

  reviews: [],

  /**
   * @property defaults
   * @type {Object}
   */
  defaults: {
    lastItemSync: 0,
    lastListSync: 0,
    lastVocabSync: 0
  },

  /**
   * Stores offline sync meta data to localStorage.
   */
  cache: function () {
    app.setLocalStorage(this.user.id + '-offline', this.toJSON());
  },

  /**
   * Returns an array of items actively being studied.
   * @returns {Array}
   */
  getActiveItems: function () {
    const parts = app.user.getFilteredParts();
    const styles = app.user.getFilteredStyles();

    return _.filter(this.items, item => {
      // exclude items without vocabIds
      if (!item.vocabIds.length) {
        return false;
      }

      // exclude part not including in user settings
      if (!_.includes(parts, item.part)) {
        return false;
      }

      // exclude style not including in user settings
      if (!_.includes(styles, item.style)) {
        return false;
      }

      return true;
    });
  },

  /**
   * Returns an array of item to be studied next.
   * @returns {Array}
   */
  getNextItems: function () {
    const now = moment().unix();
    const reviews = this.getSortedReviews();

    return _.chain(this.getActiveItems())
      .sortBy(item => {
        const related = _.filter(reviews, {itemId: item._id});
        const clonedItem = _.cloneDeep(item);

        if (related.length) {
          _.forEach(related, review => {
            const interval = app.fn.interval.quantify(clonedItem, review.score);

            clonedItem.interval = interval;
            clonedItem.last = review.timestamp;
            clonedItem.next += interval;
            clonedItem.reviews++;
            clonedItem.successes++;
          });
        }

        item.readiness = app.fn.interval.calculateReadiness(clonedItem || item, now);

        return -item.readiness;
      })
      .value();
  },

  /**
   * Returns an array of reviews sorted by creation date.
   * @returns {Array}
   */
  getSortedReviews: function () {
    return this.reviews;
  },

  /**
   * Loads offline sync meta data and initializes indexedDB database.
   */
  load: async function () {
    this.set(app.getLocalStorage(this.user.id + '-offline'));

    if (this.database) {
      this.database.close();
    }

    this.database = new Dexie('skritter:' + app.user.id);

    this.database.version(1).stores({
      characters: '_id,writing',
      items: 'id,next,part,style',
      lists: 'id,name,studyingMode',
      reviews: 'id',
      vocabs: 'id,writing'
    });

    return Promise.all([
      this.loadItems(),
      this.loadReviews()
    ]);
  },

  /**
   * Loads all items from indexedDB.
   * @returns {Promise.<Array>}
   */
  loadItems: async function () {
    this.items = await this.database.items.toArray();

    return this.items;
  },

  /**
   * Loads all reviews from indexedDB.
   * @returns {Promise.<Array>}
   */
  loadReviews: async function () {
    this.reviews = await this.database.reviews.toArray();

    return this.reviews;
  },

  /**
   * Syncs data based on last sync time offsets.
   */
  sync: async function () {
    await Promise.all([
      this._downloadItems(),
      this._downloadLists(),
      this._downloadVocabs()
    ]);

    this.cache();
  },

  /**
   * Removes offline sync meta data from localStorage.
   */
  uncache: function () {
    app.removeLocalStorage(this.id + '-offline');
  },

  /**
   * Downloads all characters based on writings array.
   * @param {Array} writings
   * @returns {Promise.<*>}
   * @private
   */
  _downloadCharacters: async function (writings) {
    if (!writings ||! writings.length) {
      return Promise.resolve();
    }

    const result = await this._fetchCharacters({ writings });

    return this.database.characters.bulkPut(result.data);
  },

  /**
   * Downloads all items based on changed offset.
   * @param {Number} [offset]
   * @returns {Promise.<*>}
   * @private
   */
  _downloadItems: async function (offset) {
    const now = moment().unix();
    let cursor;

    offset = offset || this.get('lastItemSync');

    return new Promise((resolve, reject) => {
      async.whilst(
        () => {
          return cursor !== null;
        },
        async callback => {
          try {
            const result = await this._fetchItems({sort: 'changed', offset, cursor });

            await this.database.items.bulkPut(result.data);

            cursor = result.cursor;

            callback();
          } catch (error) {
            callback(error);
          }
        },
        error => {
          if (error) {
            reject(error);
          } else {
            console.log('items:', now);
            this.set('lastItemSync', now);

            resolve();
          }
        }
      );
    });
  },

  /**
   * Downloads all list marked as currently studying.
   * @returns {Promise.<*>}
   * @private
   */
  _downloadLists: async function () {
    const result = await this._fetchLists({sort: 'studying', fields: 'id'});

    return new Promise((resolve, reject) => {
      async.eachLimit(result.data, 5,
        async (list, callback) => {
          try {
            const result = await this._fetchList(list.id);

            await this.database.lists.put(result.data);

            callback();
          } catch (error) {
            callback(error);
          }
        },
        error => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        }
      );
    });
  },

  /**
   * Downloads all vocabs based on changed offset.
   * @param {Number} [offset]
   * @returns {Promise.<*>}
   * @private
   */
  _downloadVocabs: async function (offset) {
    const now = moment().unix();
    let cursor;

    offset = offset || this.get('lastVocabSync');

    return new Promise((resolve, reject) => {
      async.whilst(
        () => {
          return cursor !== null;
        },
        async callback => {
          try {
            const result = await this._fetchVocabs({sort: 'all', offset, cursor });

            const writings = _
              .chain(result.data)
              .map('writing')
              .join('')
              .split('')
              .uniq()
              .value();

            await Promise.all([
              this.database.vocabs.bulkPut(result.data),
              this._downloadCharacters(writings)
            ]);

            cursor = result.cursor;

            callback();
          } catch (error) {
            callback(error);
          }
        },
        error => {
          if (error) {
            reject(error);
          } else {
            console.log('vocabs:', now);
            this.set('lastVocabSync', now);

            resolve();
          }
        }
      );
    });
  },

  /**
   * Fetches characters from the server based on params.
   * @param {Object} [params]
   * @returns {Promise.<{data: [], cursor: null}>}
   * @private
   */
  _fetchCharacters: async function (params) {
    params = _.defaults(params, {
      lang: app.getLanguage()
    });

    if (params.writings && _.isArray(params.writings)) {
      params.writings = params.writings.join('');
    }

    const response = await $.ajax({
      url: app.getApiUrl(2) + 'characters',
      method: 'GET',
      headers: app.user.session.getHeaders(),
      data: params
    });

    return {data: response, cursor: null};
  },

  /**
   * Fetches items from the server based on params.
   * @param {Object} [params]
   * @returns {Promise.<{data: [], cursor: null}>}
   * @private
   */
  _fetchItems: async function (params) {
    params = _.defaults(params, {
      lang: app.getLanguage()
    });

    if (params.ids && _.isArray(params.ids)) {
      params.ids = params.ids.join('|');
    }

    const response = await $.ajax({
      url: app.getApiUrl() + 'items',
      method: 'GET',
      headers: app.user.session.getHeaders(),
      data: params
    });

    const responseCursor = response.cursor || null;
    const responseItems = response.Items.concat(response.ContainedItems || []);

    return {data: responseItems, cursor: responseCursor};
  },

  /**
   * Fetches a single list from server based on id.
   * @param {String} listId
   * @returns {Promise.<{data: {}, cursor: null}>}
   * @private
   */
  _fetchList: async function (listId) {
    const response = await $.ajax({
      url: app.getApiUrl() + 'vocablists/' + listId,
      method: 'GET',
      headers: app.user.session.getHeaders()
    });

    const responseCursor = response.cursor || null;
    const responseList = response.VocabList;

    return {data: responseList, cursor: responseCursor};
  },

  /**
   * Fetches vocablists from the server based on params.
   * @param {Object} [params]
   * @returns {Promise.<{data: [], cursor: null}>}
   * @private
   */
  _fetchLists: async function (params) {
    params = _.defaults(params, {
      lang: app.getLanguage()
    });

    if (params.ids && _.isArray(params.ids)) {
      params.ids = params.ids.join('|');
    }

    const response = await $.ajax({
      url: app.getApiUrl() + 'vocablists',
      method: 'GET',
      headers: app.user.session.getHeaders(),
      data: params
    });

    const responseCursor = response.cursor || null;
    const responseLists = response.VocabLists;

    return {data: responseLists, cursor: responseCursor};
  },

  /**
   * Fetches vocabs from the server based on params.
   * @param {Object} [params]
   * @returns {Promise.<{data: [], cursor: null}>}
   * @private
   */
  _fetchVocabs: async function (params) {
    params = _.defaults(params, {
      lang: app.getLanguage()
    });

    if (params.ids && _.isArray(params.ids)) {
      params.ids = params.ids.join('|');
    }

    const response = await $.ajax({
      url: app.getApiUrl() + 'vocabs',
      method: 'GET',
      headers: app.user.session.getHeaders(),
      data: params
    });

    const responseCursor = response.cursor || null;
    const responseVocabs = response.Vocabs;

    return {data: responseVocabs, cursor: responseCursor};
  }

});

module.exports = OfflineModel;
