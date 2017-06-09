const GelatoComponent = require('gelato/component');
const Vocablists = require('collections/VocablistCollection');

/**
 * @class VocablistsBrowseTableComponent
 * @extends {GelatoComponent}
 */
const VocablistsBrowseTableComponent = GelatoComponent.extend({

  /**
   * @property events
   * @typeof {Object}
   */
  events: {
    'click #title-sort': 'handleClickTitleSort',
    'click #popularity-sort': 'handleClickPopularitySort',
    'click .add-to-queue-link': 'handleClickAddToQueueLink',
    'error #grid img': 'handleLoadImageError'
  },

  /**
   * @property template
   * @type {Function}
   */
  template: require('./VocablistsBrowseTable.jade'),

  /**
   * @method initialize
   * @constructor
   */
  initialize: function() {
    this._lists = [];
    this._filterString = '';
    this._filterType = [];
    this._layout = 'list';
    this._sortType = 'popularity';
    this.vocablists = new Vocablists();
    this.listenTo(this.vocablists, 'state', this.render);

    const data = {
      sort: 'official',
      lang: app.getLanguage(),
      languageCode: app.getLanguage()
    };

    this.vocablists.fetch({
      data: data
    });
    this.listenTo(this.vocablists, 'sync', function() {
      if (this.vocablists.cursor) {
        data.cursor = this.vocablists.cursor;
        this.vocablists.fetch({data: data, remove: false})
      } else {
        this.trigger('component:loaded', 'table');
      }
    });

    /**
     * Stores state of whether a list is currently being added
     * @type {boolean}
     * @private
     */
    this._adding = false;
  },

  /**
   * @param {String} [state] the state change that caused the rerender,
   * if this was called through an event
   * @method render
   * @returns {VocablistsBrowseTableComponent}
   */
  render: function(state) {
    if (state === 'saving') {
      return;
    }

    this.update();
    this.renderTemplate();
    this.delegateEvents();
    return this;
  },

  /**
   * @method handleClickTitleSort
   * @param {Event} event
   */
  handleClickTitleSort: function(event) {
    event.preventDefault();
    this._sortType = 'title';
    this.render();
  },

  /**
   * @method handleClickPopularitySort
   * @param {Event} event
   */
  handleClickPopularitySort: function(event) {
    event.preventDefault();
    this._sortType = 'popularity';
    this.render();
  },

  /**
   * @method handleClickAddToQueueLink
   * @param {Event} event
   */
  handleClickAddToQueueLink: function(event) {
    event.preventDefault();
    const self = this;
    const target = $(event.currentTarget);
    const listId = target.data('vocablist-id');
    const vocablist = this.vocablists.get(listId);

    if (vocablist.get('studyingMode') === 'not studying' && !this._adding) {
      this._adding = true;
      vocablist.justAdded = true;
      target.removeClass('add-to-queue-link');
      target.find('.glyphicon-plus-sign').hide();
      target.find('.add-to-queue-text').text(app.locale('pages.vocabLists.adding'));

      vocablist.save({'studyingMode': 'adding'}, {
        patch: true,
        success: function() {
          if (app.getSetting('newuser-' + app.user.id)) {
            app.getSetting('newuser-' + app.user.id, false);
            app.router.navigateStudy();
          } else {
            self.render();
          }
        },
        error: function() {
          self.render();
          app.notifyUser({
            message: app.locale('pages.vocabLists.errorAddingList')
          });
        }
      });
    }
  },

  /**
   * @method handleLoadImageError
   * @param {Event} event
   */
  handleLoadImageError: function(event) {
    this.$(event.target).remove();
  },

  /**
   * @method setFilterString
   * @param {String} value
   */
  setFilterString: function(value) {
    this._filterString = value.toLowerCase();
    this.render();
  },

  /**
   * @method setLayout
   * @param {String} value
   */
  setLayout: function(value) {
    this._layout = value.toLowerCase();
    this.render();
  },

  /**
   * @method update
   * @returns {VocablistsBrowseTableComponent}
   */
  update: function() {
    this._lists = this.vocablists.models;
    this.updateFilter();
    this.updateSort();
    return this;
  },

  /**
   * @method updateFilter
   */
  updateFilter: function() {
    this._lists = _.filter(this._lists, (function(vocablist) {
      if (this._filterString !== '') {
        var name = vocablist.get('name').toLowerCase();
        var shortName = vocablist.get('shortName').toLowerCase();

        if (_.includes(name, this._filterString)) {
          return true;
        }

        return _.includes(shortName, this._filterString);
      }

      if (this._filterType.length) {
        //TODO: support checkbox filters
        return false;
      }
      return true;
    }).bind(this));
  },

  /**
   * @method updateSort
   */
  updateSort: function() {
    this._lists = _.sortBy(this._lists, (function(vocablist) {
      if (this._sortType === 'popularity') {
        return -vocablist.get('peopleStudying');
      }
      return vocablist.get('name');
    }).bind(this));
  }

});

module.exports = VocablistsBrowseTableComponent;
