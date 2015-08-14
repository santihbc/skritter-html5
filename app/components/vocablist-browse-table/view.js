var GelatoComponent = require('gelato/component');

/**
 * @class VocablistBrowseTable
 * @extends {GelatoComponent}
 */
module.exports = GelatoComponent.extend({
    /**
     * @method initialize
     * @constructor
     */
    initialize: function() {
        this.lists = [];
        this.type = null;
        this.listenTo(app.user.data.vocablists, 'fetch', this.render);
        this.layout = 'list';
        this.sort = 'title';
        this.searchString = '';
        this.filterTypes = [];
    },
    /**
     * @property events
     * @typeof {Object}
     */
    events: {
        'vclick #title-sort': 'handleClickTitleSort',
        'vclick #popularity-sort': 'handleClickPopularitySort',
        'vclick .add-to-queue-link': 'handleClickAddToQueueLink'
    },
    /**
     * @property template
     * @type {Function}
     */
    template: require('components/vocablist-browse-table/template'),
    /**
     * @method render
     * @returns {VocablistTable}
     */
    render: function() {
        this.update();
        this.renderTemplate();
        this.$el.find('img').error(function(e) {
            $(e.target).remove();
        });
        this.delegateEvents();
        return this;
    },
    setType: function(type) {
        this.type = type;
        this.update();
        return this;
    },
    /**
     * @method setSearchString
     * @param {String} searchString
     * @returns {VocablistTable}
     */
    setSearchString: function(searchString) {
        this.searchString = searchString;
        return this;
    },
    /**
     * @method update
     * @param {Array} filterTypes
     * @returns {VocablistTable}
     */
    setFilterTypes: function(filterTypes) {
        if (!filterTypes)
            filterTypes = [];
        this.filterTypes = filterTypes;
        return this;
    },
    /**
     * @method update
     */
    update: function() {
        var predicate = function(vocablist) {
            if(this.searchString) {
                var name = (vocablist.get('name') || '').toLowerCase();
                var shortName = (vocablist.get('shortName') || '').toLowerCase();
                var contained = _.contains(name, this.searchString) || _.contains(shortName, this.searchString);
                if (!contained) {
                    return false;
                }
            }

            if (this.filterTypes.length) {
                var sort = vocablist.get('sort');
                var majorCategory = (vocablist.get('categories') || [])[0];
                if (sort === 'custom' && _.contains(this.filterTypes, 'custom'))
                    return true;

                if (sort === 'official' && _.contains(this.filterTypes, 'other-official') && majorCategory === 'Other')
                    return true;

                if (sort === 'official' && _.contains(this.filterTypes, 'textbooks') && majorCategory === 'Textbooks')
                    return true;

                return false;
            }
            return true;
        };

        predicate = _.bind(predicate, this);
        this.lists = app.user.data.vocablists.filter(predicate);

        if (this.sort === 'title') {
            this.lists = _.sortBy(this.lists, function(vocablist) {
                return vocablist.get('name').toLowerCase();
            })
        }

        if (this.sort === 'popularity') {
            this.lists = _.sortBy(this.lists, function(vocablist) {
                return -vocablist.get('peopleStudying');
            });
        }
    },
    /**
     * @method handleClickTitleSort
     */
    handleClickTitleSort: function() {
        this.sort = 'title';
        this.render();
    },
    /**
     * @method handleClickPopularitySort
     */
    handleClickPopularitySort: function() {
        this.sort = 'popularity';
        this.render();
    },
    /**
     * @method handleClickAddToQueueLink
     */
    handleClickAddToQueueLink: function(e) {
        var listID = $(e.target).closest('.add-to-queue-link').data('vocablist-id');
        var vocablist = app.user.data.vocablists.get(listID);
        if (vocablist.get('studyingMode') !== 'not studying')
            return;

        vocablist.set('studyingMode', 'adding');
        vocablist.save();
        this.render();
    }
});
