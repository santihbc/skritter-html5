/**
 * @module Skritter
 * @submodule Collection
 * @param {Model} StudySRSConfig
 * @author Joshua McFarland
 */
define([
    'models/StudySRSConfig',
    'backbone'
], function(StudySRSConfig) {
    /**
     * @class StudySRSConfigs
     */
    var StudySRSConfigs = Backbone.Collection.extend({
        /**
         * @method initialize
         */
        initialize: function() {
            this.on('change', function(srsconfig) {
                srsconfig.cache();
            });
        },
        /**
         * @property {StudySRSConfig} model
         */
        model: StudySRSConfig,
        /**
         * @method cache
         * @param {Function} callback
         */
        cache: function(callback) {
            skritter.storage.setItems('srsconfigs', this.toJSON(), function() {
                if (typeof callback === 'function')
                    callback();
            });
        },
        /**
         * @method insert
         * @param {Array} srsconfigs
         * @param {Function} callback
         * @returns {Backbone.Collection}
         */
        insert: function(srsconfigs, callback) {
            this.add(srsconfigs, {merge: true});
            skritter.storage.setItems('srsconfigs', srsconfigs, callback);
            return this;
        },
        /**
         * @method loadAll
         * @param {Function} callback
         */
        loadAll: function(callback) {
            skritter.storage.getAll('srsconfigs', function(srsconfigs) {
                skritter.data.srsconfigs.add(srsconfigs, {silent: true});
                callback(null, srsconfigs);
            });
        }
    });

    return StudySRSConfigs;
});