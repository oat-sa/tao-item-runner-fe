/*
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; under version 2
 * of the License (non-upgradable).
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 *
 * Copyright (c) 2014-2020 (original work) Open Assessment Technlogies SA (under the project TAO-PRODUCT);
 *
 */

/**
 * @author Bertrand Chevrier <bertrand@taotesting.com>
 */
import $ from 'jquery';
import eventifier from 'core/eventifier';
import assetManagerFactory from 'taoItems/assets/manager';

/**
 *
 * Builds a brand new {@link itemRunner}.
 *
 * <strong>The factory is an internal mechanism to create encapsulated contexts.
 *  I suggest you to use directly the name <i>itemRunner</i> when you require this module.</strong>
 *
 * @example require(['itemRunner'], function(itemRunner){
 *            itemRunner({itemId : 12})
 *                    .on('statechange', function(state){
 *
 *                    })
 *                    .on('ready', function(){
 *
 *                    })
 *                    .on('response', function(){
 *
 *                    })
 *                   .init()
 *                   .render($('.item-container'));
 *          });
 *
 * @exports itemRunner
 * @namespace itemRunnerFactory
 *
 * @param {String} [providerName] - the name of a provider previously registered see {@link itemRunnerFactory#register}
 * @param {Object} [data] - the data of the item to run
 * @param {Object} [options]
 *
 * @returns {itemRunner}
 */
const itemRunnerFactory = function itemRunnerFactory(providerName, data = {}, options = {}) {
    //flow structure to manage sync calls in an async context.
    const flow = {
        init: {
            done: false,
            pending: []
        },
        render: {
            done: false,
            pending: []
        }
    };

    //optional params based on type
    if (typeof providerName === 'object') {
        data = providerName;
        providerName = void 0;
    }

    /*
     * Select the provider
     */
    const providers = itemRunnerFactory.providers;

    //check a provider is available
    if (!providers || Object.keys(providers).length === 0) {
        throw new Error('No provider registered');
    }

    let provider;

    if (typeof providerName === 'string' && providerName.length > 0) {
        provider = providers[providerName];
    } else if (Object.keys(providers).length === 1) {
        //if there is only one provider, then we take this one
        providerName = Object.keys(providers)[0];
        provider = providers[providerName];
    }

    //now we should have a provider
    if (!provider) {
        throw new Error('No candidate found for the provider');
    }

    //set up a default assetManager using a "do nothing" strategy
    const assetManager =
        options.assetManager ||
        assetManagerFactory(function defaultStrategy(url) {
            return url.toString();
        });

    let suspended = false;
    let closed = false;

    /**
     * The itemRunner
     * @typedef {Object} itemRunner
     */

    /**
     * @type {itemRunner}
     * @lends itemRunnerFactory
     */
    return eventifier({
        /**
         * Items container
         * @type {HTMLElement}
         */
        container: null,

        /**
         * The asset manager used to resolve asset
         * @see taoItems/asset/manager
         * @type {AssetManager}
         */
        assetManager,

        /**
         * To give options to the item runner provider
         * @type {Object}
         */
        options,

        /**
         * Initialize the runner.
         * @param {Object} [newData] - just in case you want to change item data (it should not occurs in most case)
         * @returns {itemRunner} to chain calls
         *
         * @fires itemRunner#init
         */
        init(newData) {
            /**
             * Call back when init is done
             */
            const initDone = () => {
                //manage pending tasks the first time
                if (flow.init.done === false) {
                    flow.init.done = true;

                    flow.init.pending
                        .filter(pendingTask => typeof pendingTask === 'function')
                        .forEach(pendingTask => pendingTask());

                    flow.init.pending = [];
                }

                /**
                 * the runner has initialized correclty the item
                 * @event itemRunner#init
                 */
                this.trigger('init');
            };

            //merge data
            if (newData) {
                data = Object.assign(data, newData);
            }

            if (typeof provider.init === 'function') {
                /**
                 * Calls provider's initialization with item data.
                 * @callback InitItemProvider
                 * @param {Object} data - the item data
                 * @param {Function} done - call once the initialization is done
                 */
                provider.init.call(this, data, initDone);
            } else {
                initDone();
            }

            return this;
        },

        /**
         * Configure the assetManager
         * @see taoItems/assets/manager
         * @param {AssetStrategy[]} strategies - the resolving strategies
         * @param {Object} [contextData] - the context data
         * @param {Object} [assetManagerOptions] - the asset manager options
         * @returns {itemRunner} to chain calls
         */
        assets(strategies, contextData, assetManagerOptions) {
            try {
                this.assetManager = assetManagerFactory(strategies, contextData, assetManagerOptions);
            } catch (err) {
                this.trigger(
                    'error',
                    new Error(`Something was wrong while configuring the asset manager : ${err.message}`)
                );
            }

            return this;
        },

        /**
         * Initialize the current item.
         *
         * @param {HTMLElement|jQueryElement} elt - the DOM element that is going to contain the rendered item.
         * @param {Object} [newOptions] - to update the runner options
         * @returns {itemRunner} to chain calls
         *
         * @fires itemRunner#ready
         * @fires itemRunner#render
         * @fires itemRunner#error if the elt isn't valid
         *
         * @fires itemRunner#statechange the provider is reponsible to trigger this event
         * @fires itemRunner#responsechange  the provider is reponsible to trigger this event
         */
        render(elt, newOptions = {}) {
            /**
             * Call back when render is done
             */
            const renderDone = () => {
                //manage pending tasks the first time
                if (flow.render.done === false) {
                    flow.render.done = true;

                    flow.render.pending
                        .filter(pendingTask => typeof pendingTask === 'function')
                        .forEach(pendingTask => pendingTask());

                    flow.render.pending = [];
                }

                /**
                 * The item is rendered
                 * @event itemRunner#render
                 */
                this.trigger('render');

                /**
                 * The item is ready.
                 * Alias of {@link itemRunner#render}
                 * @event itemRunner#ready
                 */
                this.trigger('ready');
            };

            options = Object.assign(options, newOptions);
            if (!options.state) {
                options.state = {};
            }

            //check elt
            if (!(elt instanceof HTMLElement) && !(elt instanceof $)) {
                return this.trigger(
                    'error',
                    new Error('A valid HTMLElement (or a jquery element) at least is required to render the item')
                );
            }

            //set item state to restore item state after rendering if the provider enables it
            if (options.state) {
                this.setState(options.state, true);
            }

            if (flow.init.done === false) {
                flow.init.pending.push(() => this.render(elt, options));
            } else {
                //we keep a reference to the container
                if (elt instanceof $) {
                    this.container = elt.get(0);
                } else {
                    this.container = elt;
                }

                //the state will be applied only when the rendering is made

                if (typeof provider.render === 'function') {
                    /**
                     * Calls the provider's render
                     * @callback RendertItemProvider
                     * @param {HTMLElement} elt - the element to render inside
                     * @param {Function} done - call once the render is done
                     * @param {Object} [options] - the array of options that the item runner provider may supports
                     * @param {Object} [options.state] - pass initial item state to method render() in case the item runner provider require initial state to render
                     */
                    provider.render.call(this, this.container, renderDone, options);
                } else {
                    renderDone();
                }
            }

            return this;
        },

        /**
         * Clear the running item.
         * @returns {itemRunner}
         *
         * @fires itemRunner#clear
         */
        clear() {
            /**
             * Call back when clear is done
             */
            const clearDone = () => {
                /**
                 * The item is ready.
                 * @event itemRunner#clear
                 */
                this.trigger('clear');
            };

            if (typeof provider.clear === 'function') {
                /**
                 * Calls the provider's clear
                 * @callback ClearItemProvider
                 * @param {HTMLElement} elt - item's container
                 * @param {Function} done - call once the initialization is done
                 */
                provider.clear.call(this, this.container, clearDone);
            } else {
                clearDone();
            }

            return this;
        },

        /**
         * Get the current state of the running item.
         *
         * @returns {Object|Null} state
         */
        getState() {
            if (typeof provider.getState === 'function') {
                /**
                 * Calls the provider's getState
                 * @callback GetStateItemProvider
                 * @returns {Object} the state
                 */
                return provider.getState.call(this);
            }
            return null;
        },

        /**
         * Set the current state of the running item.
         * This should have the effect to restore the item state.
         *
         * @param {Object} state - the new state
         * @param {boolean} [isInitialStateRestore] - state restoring or not
         * @returns {itemRunner}
         *
         * @fires itemRunner#error if the state type doesn't match
         */
        setState(state, isInitialStateRestore = false) {
            if (!state || typeof state !== 'object' || Array.isArray(state)) {
                return this.trigger(
                    'error',
                    new Error(`The item's state must be a JavaScript Plain Object: ${typeof state} given`)
                );
            }

            //the state will be applied only when the rendering is made
            if (flow.render.done === false) {
                flow.render.pending.push(() => this.setState(state, isInitialStateRestore));
            } else if (typeof provider.setState === 'function') {
                /**
                 * Calls the provider's setState
                 * @callback SetStateItemProvider
                 * @param {Object} state -  the state to set
                 */
                provider.setState.call(this, state, isInitialStateRestore);
            }
            return this;
        },

        /**
         * Get the item data.
         *
         * @returns {Object} the item's data
         */
        getData() {
            return data;
        },

        /**
         * Get the responses of the running item.
         *
         * @returns {Object} the item's responses
         */
        getResponses() {
            if (typeof provider.getResponses === 'function') {
                /**
                 * Calls the provider's getResponses
                 * @callback GetResponsesItemProvider
                 * @returns {Object} the responses
                 */
                return provider.getResponses.call(this);
            }
            return {};
        },

        /**
         * Append the modalFeedbacks into the item and create queue of feedbacks that should be displayed to the user
         *
         * @param {Object|Array} feedbacks - all feedbacks of the item
         * @param {Object|Array} itemSession - determine feedbacks which should be displayed
         * @param {function} done - runs after loading feedbacks into the item
         *      # have parameter {Object|Array} renderingQueue with prepared queue of the feedbacks for displaying to the user
         *
         *
         * Example:
         *
         *    this.renderFeedbacks({f1: 'feedback1', f2: 'feedback2', f3: 'feedback3'}, ['f2'], function(renderingQueue){
         *      renderingQueue; // {'feedback2'}
         *    });
         */
        renderFeedbacks(feedbacks, itemSession, done) {
            if (typeof provider.renderFeedbacks === 'function') {
                provider.renderFeedbacks.call(this, feedbacks, itemSession, done);
            }
        },

        /**
         * Call the provider's suspend method
         * @returns {Promise}
         */
        suspend() {
            if (!suspended && !closed && flow.render.done && typeof provider.suspend === 'function') {
                return provider.suspend.call(this).then(result => {
                    suspended = true;
                    return result;
                });
            }
            return Promise.resolve();
        },

        /**
         * Call the provider's hide method
         * @returns {Promise}
         */
        close() {
            if (!closed && flow.render.done && typeof provider.close === 'function') {
                return provider.close.call(this).then(result => {
                    closed = true;
                    return result;
                });
            }
            return Promise.resolve();
        },

        /**
         * Call the provider's resume method.
         * We can resume a previously suspended or closed item.
         * @returns {Promise}
         */
        resume() {
            if ( (suspended || closed) && flow.render.done && typeof provider.resume === 'function') {
                return provider.resume.call(this).then(result => {
                    suspended = false;
                    closed = false;
                    return result;
                });
            }
            return Promise.resolve();
        },

        /**
         * Is the item runner suspended
         * @returns {boolean} true if suspended
         */
        isSuspended() {
            return suspended;
        },

        /**
         * Is the item runner closed
         * @returns {boolean} true if closed
         */
        isClosed(){
            return closed;
        },
    });
};

/**
 * Register an <i>Item Runtime Provider</i> into the item runner.
 * The provider provides the behavior required by the item runner.
 *
 * @param {String} name - the provider name will be used to select the provider while instantiating the runner
 *
 * @param {Object} provider - the Item Runtime Provider as a plain object. The itemRunner forwards encapsulate and delegate calls to the provider.
 * @param {InitItemProvider} provider.init - the provider initializes the item from it's data, for example loading libraries, add some listeners, etc.
 * @param {RenderItemProvider} provider.render - the provider renders the item within the given container element.
 * @param {ClearItemProvider} [provider.clear] - the provider clears the item.
 * @param {GetStateItemProvider} [provider.getState] - the provider get the item's state.
 * @param {SetStateItemProvider} [provider.setState] - the provider restore the item to the given state.
 * @param {GetRespnsesItemProvider} [provider.getResponses] - the provider gives the current responses.
 *
 * @throws TypeError when a wrong provider is given or an empty name.
 */
itemRunnerFactory.register = function registerProvider(name, provider) {
    //type checking
    if (typeof name !== 'string' || name.length <= 0) {
        throw new TypeError('It is required to give a name to your provider.');
    }
    if (
        typeof provider !== 'object' ||
        (typeof provider.init !== 'function' && typeof provider.render !== 'function')
    ) {
        throw new TypeError('A provider is an object that contains at least an init function or a render function.');
    }

    this.providers = this.providers || {};
    this.providers[name] = provider;
};

export default itemRunnerFactory;
