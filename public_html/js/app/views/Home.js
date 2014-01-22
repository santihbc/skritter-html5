/**
 * @module Skritter
 * @submodule Views
 * @param templateIn
 * @param templateOut
 * @param VocabListsTable
 * @author Joshua McFarland
 */
define([
    'require.text!templates/home-logged-in.html',
    'require.text!templates/home-logged-out.html',
    'views/components/VocabListsTable'
], function(templateIn, templateOut, VocabListsTable) {
    /**
     * @class Home
     */
    var Home = Backbone.View.extend({
        /**
         * @method initialize
         */
        initialize: function() {
            Home.this = this;
            Home.lists = new VocabListsTable();
        },
        /**
         * @method render
         * @returns {Backbone.View}
         */
        render: function() {
            if (skritter.user.isLoggedIn()) {
                this.$el.html(templateIn);
                this.$('#user-avatar').html(skritter.user.getAvatar('img-circle'));
                this.$('.user-name').text(skritter.user.getSetting('name'));
                Home.lists.setElement(this.$('#active-lists #table-container')).load('studying', {
                    'name': 'Name',
                    'studyingMode': 'Status'
                });
                this.listenTo(skritter.scheduler, 'change:schedule', this.updateDueCount);
                this.updateDueCount();
            } else {
                this.$el.html(templateOut);
            }
            return this;
        },
        /**
         * @property {Object} events
         */
        events: {
            'click.Home #home-view .login-button': 'handleLoginClicked',
            'click.Home #home-view .logout-button': 'handleLogoutClicked',
            'click.Home #home-view .options-button': 'handleOptionsClicked'
        },
        handleLoginClicked: function(event) {
            skritter.modal.show('login');
            event.preventDefault();
        },
        handleLogoutClicked: function(event) {
            skritter.user.logout();
            event.preventDefault();
        },
        handleOptionsClicked: function(event) {
            skritter.router.navigate('options', {trigger: true});
            event.preventDefault();
        },
        updateDueCount: function() {
            Home.this.$('#user-items-due').text(skritter.scheduler.getDueCount());
        }
    });

    return Home;
});