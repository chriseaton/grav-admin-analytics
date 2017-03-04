//establish JS namespacing
var admin = admin || {};
admin.plugin = admin.plugin || {};

//our plugin object
admin.plugin.analytics = {

    domReady: false,

    //loads the plugin.
    init: function(config) {
        var self = this;
        this.ga.init(this, config.ga);
        document.addEventListener("DOMContentLoaded", function() {
            self.ready.apply(self, arguments);
        }, false);
    },

    //fires when the DOM content has been loaded and we can begin tying functionality to it.
    ready: function() {
        this.domReady = true;
        this.ga.ready();
    },

    //object representing Google Analytics functionality.
    ga: {

        //the parent plugin object (admin.plugin.analytics).
        plugin: null,

        //the configuration for Google Analytics.
        config: null,

        gapi: null,

        charts: [],

        //loads the GA functionality.
        init: function(plugin, config) {
            this.plugin = plugin;
            this.config = config;
            //create the google analytics code (if auth-token is present).
            if (this.config.auth_token) {
                this._injectScript();
            }
        },

        //creates the script reference to Google Analytics.
        _injectScript: function() {
            var self = this;
            (function(w,d,s,g,js,fs){
                g = w.gapi || (w.gapi={});
                g.analytics={
                    q:[],
                    ready: function(f){
                        this.q.push(f);
                    }
                };
                js = d.createElement(s);
                fs = d.getElementsByTagName(s)[0];
                js.src = 'https://apis.google.com/js/platform.js';
                js.setAttribute('async', 'async');
                js.setAttribute('defer', 'defer');
                fs.parentNode.insertBefore(js, fs);
                js.onload = function(){
                    g.load('analytics');
                    self.gapi = g;
                    self.ready();
                };
            }(window, document, 'script'));
        },

        ready: function() {
            //ensure both th DOM is ready and that gapi has been loaded.
            if (this.plugin.domReady === false || this.gapi === null) {
                return;
            }
            var self = this;
            //let's get going! build the dashboard
            this.gapi.analytics.ready(function() {
                self._authorize();
                self._buildViewSelector();
                self._buildCharts();
            });
        },

        changeView: function(viewIDs) {
            //update all charts with a new ID
            for (var x = 0, xlen = this.charts.length; x < xlen; x++) {
                this.charts[x].set({ query: { ids: viewIDs } }).execute();
            }
        },

        //authorize the user with an access token provided by the passed in config object.
        _authorize: function() {
            this.gapi.analytics.auth.authorize({
                'serverAuth': {
                    'access_token': this.config.auth_token
                }
            });
        },

        _buildViewSelector: function() {
            var self = this;
            var vs = new this.gapi.analytics.ViewSelector({
                container: 'view-selector'
            });
            vs.on('change', function(ids) {
                self.changeView(ids);
            });
            vs.execute();
        },

        _buildCharts: function() {
            this.charts.push(new this.gapi.analytics.googleCharts.DataChart({
                query: {
                    metrics: 'ga:sessions',
                    dimensions: 'ga:date',
                    'start-date': '30daysAgo',
                    'end-date': 'yesterday'
                },
                chart: {
                    container: 'chart-primary',
                    type: 'LINE',
                    options: {
                        width: '100%'
                    }
                }
            }));
        }

    }

};