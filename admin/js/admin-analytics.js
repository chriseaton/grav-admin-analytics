//establish JS namespacing

/** @namespace admin **/
var admin = admin || {};

/** @namespace admin.plugin **/
admin.plugin = admin.plugin || {};

/**
 * The Grav Admin Analytics namespace.
 * @namespace admin.plugin.analytics
 * @prop {Boolean} domReady - indicates the DOM has been loaded.
 * @prop {Array} panels - representation of panels containing one or more charts and/or metrics.
 */
admin.plugin.analytics = {

    domReady: false,

    panels: [],

    /**
     * Loads the plugin.
     * @param {Object} config - the configuration for this plugin.
     **/
    init: function(config) {
        var self = this;
        this.ga.init(this, config.ga);
        document.addEventListener("DOMContentLoaded", function() {
            self.ready.apply(self, arguments);
        }, false);
    },

    /**
     * Fires when the DOM content has been loaded and we can begin tying functionality to it.
     */
    ready: function() {
        this.domReady = true;
        this.ga.ready();
    },

    /**
     * Creates an HTML panel element in the dashboard area.
     **/
    createPanel: function(title, size, sizeIndex, bgColor) {
        var index = this.panels.length;
        if (!size || !size.match(/^(full|half|third)$/i)) {
            size = 'full';
        }
        var id = 'panel-' + size + '-' + index;
        if (!bgColor) {
            bgColor = 'auto';
        }
        var html = '<div class="default-box-shadow analytics-panel size-' + size + ' size-index-' + sizeIndex +'">\n' +
                   '  <div class="admin-block" style="background-color: ' + bgColor + ';">\n' +
                   '    <div id="' + id + '" data-analytics-panel-index="' + index + '"></div>\n' +
                   '  </div>\n' +
                   '</div>';
        return {
            id: id,
            title: title,
            html: html
        };
    },

    appendPanel: function(panel) {
        document.getElementById('panel-collection').innerHTML += panel.html;
    },

    /**
     * Utilities namespace, for generic functionality used anywhere in the plugin.
     * @namespace admin.plugin.analytics.utils
     **/
    utils: {

        /**
         * Ensures the input is returned as an array.
         * @param {Object|Object[]|...Object} input - The input value to ensure is returned as an array.
         * @returns {Array} Returns the given object as an Array. If null or undefined, an empty array is returned.
         *                  If multiple parameters are specified, they are returned as an array.
         **/
        asArray: function(input) {
            if (typeof input !== 'undefined') {
                if (Array.isArray(input)) {
                    return input;
                } else if (arguments.length > 1) {
                    return Array.prototype.slice.call(arguments);
                } else if (input !== null) {
                    return [input];
                }
            }
            return [];
        },

        /**
         * Prefixes all array (string) values with a given prefix value.
         * @param {Array<String>} arr
         * @param {String} prefix
         **/
        prefix: function(arr, prefix) {
            for (var x = 0, xlen = arr.length; x < xlen; x++) {
                arr[x] = prefix + arr[x];
            }
        }

    },

    /**
     * Google Analytics functionality namespace.
     * @namespace admin.plugin.analytics.ga
     * @prop {admin.plugin.analytics} plugin - the parent plugin namespace object (admin.plugin.analytics).
     * @prop {Object} config - the configuration for Google Analytics.
     * @prop {Object} gapi - the google api object.
     **/
    ga: {

        plugin: null,

        config: null,

        gapi: null,

        /**
         * Loads the GA functionality.
         * @param {admin.plugin.analytics} plugin
         * @param {Object} config
         */
        init: function(plugin, config) {
            this.plugin = plugin;
            this.config = config;
            //create the google analytics code (if auth-token is present).
            if (this.config.auth_token) {
                this._injectScript();
            }
        },

        /**
         * Creates the script reference to Google Analytics.
         * @private
         **/
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

        /**
         * Funcation call made when resources have been, potentially, loaded, and the DOM is ready.
         **/
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
                self._buildPanels();
            });
        },

        /**
         * Changes all panels to new view ID(s).
         */
        changeView: function(viewIDs) {
            viewIDs = admin.plugin.analytics.utils.asArray(viewIDs);
            //update all charts with a new ID
            for (var x = 0, xlen = this.plugin.panels.length; x < xlen; x++) {
                if (this.plugin.panels[x].provider === 'ga') {
                    this.plugin.panels[x].chart.set({ query: { ids: viewIDs } }).execute();
                }
            }
        },

        /**
         * Authorize the user with an access token provided by the passed in config object.
         * @private
         **/
        _authorize: function() {
            this.gapi.analytics.auth.authorize({
                'serverAuth': {
                    'access_token': this.config.auth_token
                }
            });
        },

        /**
         * Build the view selector element(s).
         * @private
         **/
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

        /**
         * Build the panel element(s).
         * @private
         **/
        _buildPanels: function() {
            if (this.config.charts) {
                var lastSize = '';
                var lastSizeCount = 0;
                for (var x = 0, xlen = this.config.charts.length; x < xlen; x++) {
                    var pcc = this.config.charts[x];
                     //save the last size so an indexing class can be applied to the panel
                    if (lastSize !== pcc.panel_size) {
                        lastSize = pcc.panel_size;
                        lastSizeCount = 0;
                    }
                    //build the panel
                    var panel = this.plugin.createPanel(pcc.panel_title, pcc.panel_size, lastSizeCount, pcc.panel_color);
                    this.plugin.appendPanel(panel);
                    //inc. lastSizeCount so next loop it is incremented (if applicable).
                    lastSizeCount++;
                    //clean up plugin chart config.
                    pcc.metrics = this.plugin.utils.asArray(pcc.metrics);
                    pcc.dimensions = this.plugin.utils.asArray(pcc.dimensions);
                    this.plugin.utils.prefix(pcc.metrics, 'ga:');
                    this.plugin.utils.prefix(pcc.dimensions, 'ga:');
                    //create the ga chart config
                    var gaChartConfig = {
                        query: {
                            metrics: pcc.metrics.join(','),
                            dimensions: pcc.dimensions.join(','),
                            'start-date': '30daysAgo',
                            'end-date': 'yesterday'
                        },
                        chart: {
                            container: panel.id,
                            type: pcc.type.toUpperCase(),
                            options: {
                                title: pcc.panel_title,
                                backgroundColor:{
                                    'fill': '#FFFFFF',
                                    'fillOpacity': 0
                                },
                                width: '100%'
                            }
                        }
                    };
                    this.plugin.panels.push({
                            provider: 'ga',
                            chart: new this.gapi.analytics.googleCharts.DataChart(gaChartConfig)
                        });
                }
            }
        }

    }

};