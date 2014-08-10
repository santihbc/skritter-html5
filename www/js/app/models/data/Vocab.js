/**
 * @module Application
 */
define([
   "framework/GelatoModel"
], function(GelatoModel) {
    /**
     * @class DataVocab
     * @extends GelatoModel
     */
    return GelatoModel.extend({
        /**
         * @property idAttribute
         * @type String
         */
        idAttribute: "id"
    });
});
