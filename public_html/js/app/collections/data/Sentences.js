/**
 * @module Skritter
 * @submodule Collections
 * @param Sentence
 * @author Joshua McFarland
 */
define([
    'models/data/Sentence'
], function(Sentence) {
    /**
     * @class DataSentences
     */
    var Sentences = Backbone.Collection.extend({
        /**
         * @method initialize
         */
        initialize: function() {
            this.on('change', function(sentence) {
                sentence.cache();
            });
        },
        /**
         * @property {Backbone.Model} model
         */
        model: Sentence,
        /**
         * @method loadAll
         * @param {Function} callback
         */
        loadAll: function(callback) {
            var self = this;
            skritter.storage.getAll('sentences', function(sentences) {
                self.add(sentences, {merge: true, silent: true});
                callback();
            });
        }
    });

    return Sentences;
});