/**
 * @module Application
 */
define([
    'framework/BaseRouter',
    'pages/Dashboard',
    'pages/Landing',
    'pages/Login',
    'pages/Tests',
    'pages/getting-started/LanguageSelect',
    'pages/getting-started/ListSelect'
], function(BaseRouter, PageDashboard, PageLanding, PageLogin, PageTests, PageLanguageSelect, PageListSelect) {
    /**
     * @class Router
     * @extends BaseRouter
     */
    var Router = BaseRouter.extend({
        /**
         * @property routes
         * @type Object
         */
        routes: {
            '': 'showHome',
            'getting-started': 'showGettingStarted',
            'login': 'showLogin',
            'logout': 'handleLogout',
            'tests': 'showTests',
            '*route': 'defaultRoute'
        },
        /**
         * @method defaultRoute
         */
        defaultRoute: function() {
            this.navigate(app.isLocalhost() ? '/#' : '', {replace: true, trigger: true});
        },
        /**
         * @method handleLogout
         */
        handleLogout: function() {
            app.user.logout(true);
        },
        /**
         * @method showDashboard
         */
        showDashboard: function() {
            this.currentPage = new PageDashboard();
            this.currentPage.render();
        },
        /**
         * @method showGettingStarted
         */
        showGettingStarted: function() {
            var self = this;
            if (app.api.isGuestValid()) {
                this.showLanguageSelect();
            } else {
                app.api.authenticateGuest(function() {
                    self.showLanguageSelect();
                }, function() {
                    self.defaultRoute();
                });
            }
        },
        /**
         * @method showLanguageSelect
         */
        showLanguageSelect: function() {
            this.currentPage = new PageLanguageSelect();
            this.currentPage.render();
        },
        /**
         * @method showListSelect
         */
        showListSelect: function() {
            this.currentPage = new PageListSelect();
            this.currentPage.render();
        },
        /**
         * @method showHome
         */
        showHome: function() {
            if (app.user.isAuthenticated()) {
                this.showDashboard();
            } else {
                this.showLanding();
            }
        },
        /**
         * @method showLanding
         */
        showLanding: function() {
            this.currentPage = new PageLanding();
            this.currentPage.render();
        },
        /**
         * @method showLogin
         */
        showLogin: function() {
            this.currentPage = new PageLogin();
            this.currentPage.render();
        },
        /**
         * @method showTests
         */
        showTests: function() {
            this.currentPage = new PageTests();
            this.currentPage.render();
        }
    });

    return Router;
});
