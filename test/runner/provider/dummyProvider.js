/**
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
 * Copyright (c) 2019 (original work) Open Assessment Technologies SA ;
 */

define(['lodash'], function(_) {
    'use strict';

    /**
     * Use for test  mocking.
     * Create a dummy provider that runs input like items (just the input tag)
     */
    var dummyItemRuntimeProvider = {
        init: function(data, done) {
            this._data = data;
            done();
        },

        render: function(elt, done) {
            var self = this;
            var input;
            var type = this._data.type || 'text';
            var val = this._data.value || '';

            elt.innerHTML = '<input type="' + type + '" value="' + val + '"/>';
            input = elt.querySelector('input');
            input.addEventListener('change', function() {
                self.trigger('statechange', { value: input.value });
            });

            done();
        },

        clear: function(elt, done) {
            elt.innerHTML = '';
            done();
        },

        getState: function() {
            var state = {
                value: null
            };
            var input = this.container.querySelector('input');
            if (input) {
                state.value = input.value;
            }
            return state;
        },

        setState: function(state) {
            var input = this.container.querySelector('input');
            if (input && state && typeof state.value !== 'undefined') {
                input.value = state.value;
            }
        },

        getResponses: function() {
            var responses = [];
            var input = this.container.querySelector('input');
            if (input) {
                responses.push(input.value);
            }
            return responses;
        },

        renderFeedbacks: function(feedbacks, itemSession, done) {
            var renderingQueue = [];

            _.forEach(feedbacks, function(val, key) {
                if (itemSession.indexOf(key) === -1) {
                    return true; //continue with next feedback
                }
                renderingQueue.push(val);
            });

            done(renderingQueue);
        },

        getApipData: function getApipData() {
            return this._item && _.isFunction(this._item.getApipAccessibility) && this._item.getApipAccessibility() || null;
        }
    };

    return dummyItemRuntimeProvider;
});
