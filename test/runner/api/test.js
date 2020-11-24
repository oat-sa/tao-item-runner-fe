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
 * Copyright (c) 2019-2020 (original work) Open Assessment Technologies SA ;
 */

define(['jquery', 'taoItems/runner/api/itemRunner', 'test/taoItems/runner/provider/dummyProvider'], function (
    $,
    itemRunner,
    dummyProvider
) {
    let noop;

    QUnit.module('API');

    QUnit.test('module', assert => {
        assert.ok(typeof itemRunner !== 'undefined', 'The module exports something');
        assert.ok(typeof itemRunner === 'function', 'The module exports a function');
        assert.ok(typeof itemRunner.register === 'function', 'The function has a property function register');
    });

    QUnit.module('Register a Provider', {
        afterEach() {
            //reset the providers
            itemRunner.providers = noop;
        }
    });

    QUnit.test('Error without provider', assert => {
        assert.expect(1);

        assert.throws(() => itemRunner(), Error, 'An error is thrown');
    });

    QUnit.test('Error with a wrong provider', assert => {
        assert.expect(3);

        assert.throws(() => itemRunner.register(''), TypeError, 'A name is expected');

        assert.throws(() => itemRunner.register('testProvider'), TypeError, 'A objet is expected');

        assert.throws(
            () => itemRunner.register('testProvider', {}),
            TypeError,
            'At least init or render method is expected'
        );
    });

    QUnit.test('Register a minimal provider', assert => {
        assert.expect(4);

        assert.ok(typeof itemRunner.providers === 'undefined', 'the itemRunner comes without a provider');

        itemRunner.register('testProvider', {
            init() {}
        });
        itemRunner();

        assert.ok(typeof itemRunner.providers === 'object', 'The providers property is defined');
        assert.ok(typeof itemRunner.providers.testProvider === 'object', 'The testProvider is set');
        assert.ok(
            typeof itemRunner.providers.testProvider.init === 'function',
            'The testProvider has an init function'
        );
    });

    QUnit.module('ItemRunner init', {
        afterEach() {
            //reset the providers
            itemRunner.providers = noop;
        }
    });

    QUnit.test('Initialize the runner', assert => {
        const ready = assert.async();
        assert.expect(4);

        assert.throws(() => itemRunner('dummyProvider', {}), Error, 'An error is thrown when no provider is set');

        itemRunner.register('dummyProvider', dummyProvider);

        assert.throws(
            () => itemRunner('zoommyProvider', {}),
            Error,
            'An error is thrown when requesting the wrong provider'
        );

        itemRunner('dummyProvider', {
            type: 'number'
        })
            .on('init', function () {
                assert.ok(typeof this._data === 'object', 'the itemRunner context got the data assigned');
                assert.equal(this._data.type, 'number', 'the itemRunner context got the right data assigned');

                ready();
            })
            .init();
    });

    QUnit.test('Get the default provider', assert => {
        const ready = assert.async();
        assert.expect(2);

        itemRunner.register('dummyProvider', dummyProvider);

        itemRunner({
            type: 'number'
        })
            .on('init', function () {
                assert.ok(typeof this._data === 'object', 'the itemRunner context got the data assigned');
                assert.equal(this._data.type, 'number', 'the itemRunner context got the right data assigned');

                ready();
            })
            .init();
    });

    QUnit.test('Initialize the item with new data', assert => {
        const ready = assert.async();
        assert.expect(2);

        itemRunner.register('dummyProvider', dummyProvider);

        itemRunner('dummyProvider', {
            type: 'number'
        })
            .on('init', function () {
                assert.ok(typeof this._data === 'object', 'the itemRunner context got the data assigned');
                assert.equal(this._data.type, 'text', 'the itemRunner context got the right data assigned');
                ready();
            })
            .init({
                type: 'text'
            });
    });

    QUnit.test('No init in the provider', assert => {
        const ready = assert.async();
        assert.expect(1);

        const wrongProvider = Object.assign({}, dummyProvider);
        delete wrongProvider.init;
        itemRunner.register('wrongProvider', wrongProvider);

        itemRunner('wrongProvider', {
            type: 'search'
        })
            .on('init', () => {
                assert.ok(true, 'init is still called');

                ready();
            })
            .init();
    });

    QUnit.module('ItemRunner render', {
        afterEach() {
            //reset the providers
            itemRunner.providers = noop;
        }
    });

    QUnit.test('Render an item from an HTMLElement', assert => {
        const ready = assert.async();
        assert.expect(5);

        const container = document.getElementById('item-container');
        assert.equal(container.id, 'item-container', 'the item container exists');
        assert.equal(container.childNodes.length, 0, 'the container has no children');

        itemRunner.register('dummyProvider', dummyProvider);

        itemRunner('dummyProvider', {
            type: 'number'
        })
            .on('render', function () {
                assert.ok(typeof this._data === 'object', 'the itemRunner context got the data assigned');
                assert.equal(this._data.type, 'number', 'the itemRunner context got the right data assigned');
                assert.equal(container.childNodes.length, 1, 'the container has now children');

                ready();
            })
            .init()
            .render(container);
    });

    QUnit.test('Render an item from a jQueryElement', assert => {
        const ready = assert.async();
        assert.expect(4);

        const $container = $('#item-container');
        assert.equal($container.length, 1, 'the item container exists');
        assert.equal($('input', $container).length, 0, 'the container does not contains an input');

        itemRunner.register('dummyProvider', dummyProvider);

        itemRunner('dummyProvider', {
            type: 'search'
        })
            .on('render', function () {
                const $input = $('input', $container);
                assert.equal($input.length, 1, 'the container contains an input');
                assert.equal($input.attr('type'), 'search', 'the input has the right type');

                ready();
            })
            .init()
            .render($container);
    });

    QUnit.test('Render an item into wrong element', assert => {
        const ready = assert.async();
        assert.expect(3);

        itemRunner.register('dummyProvider', dummyProvider);

        itemRunner('dummyProvider', {
            type: 'search'
        })
            .on('error', err => {
                assert.ok(err instanceof Error, 'An error is thrown');
                assert.ok(typeof err.message === 'string', 'An error message is given');
                assert.ok(err.message.length > 0, 'A non empty message is given');
                ready();
            })
            .init()
            .render('item-container');
    });

    QUnit.test('Render an item without element', assert => {
        const ready = assert.async();
        assert.expect(3);

        itemRunner.register('dummyProvider', dummyProvider);

        itemRunner('dummyProvider', {
            type: 'search'
        })
            .on('error', err => {
                assert.ok(err instanceof Error, 'An error is thrown');
                assert.ok(typeof err.message === 'string', 'An error message is given');
                assert.ok(err.message.length > 0, 'A non empty message is given');
                ready();
            })
            .init()
            .render();
    });

    QUnit.test('No clear in the provider', assert => {
        const ready = assert.async();
        assert.expect(1);

        const $container = $('#item-container');

        const provider = Object.assign({}, dummyProvider);
        delete provider.render;
        itemRunner.register('dummyProvider', provider);

        itemRunner('dummyProvider', {
            type: 'search'
        })
            .on('render', function () {
                assert.ok(true, 'render is still called');

                ready();
            })
            .init()
            .render($container);
    });

    QUnit.test('Render sync with init async', assert => {
        const ready = assert.async();
        assert.expect(2);

        const $container = $('#item-container');
        assert.equal($container.length, 1, 'the item container exists');

        itemRunner.register(
            'dummyProvider',
            Object.assign({}, dummyProvider, {
                init(data, done) {
                    setTimeout(() => {
                        this._data = data;
                        done();
                    }, 100);
                }
            })
        );

        itemRunner('dummyProvider', {
            type: 'text'
        })
            .on('render', function () {
                assert.ok(true, 'Rendered done');
                ready();
            })
            .init()
            .render($container);
    });

    QUnit.module('ItemRunner clear', {
        afterEach() {
            //reset the providers
            itemRunner.providers = noop;
        }
    });

    QUnit.test('Clear a rendered element', assert => {
        const ready = assert.async();
        assert.expect(4);

        const $container = $('#item-container');
        assert.equal($container.length, 1, 'the item container exists');
        assert.equal($container.children().length, 0, 'the container has no children');

        itemRunner.register('dummyProvider', dummyProvider);

        itemRunner('dummyProvider', {
            type: 'search'
        })
            .on('render', function () {
                assert.equal($container.children().length, 1, 'the container has a child');

                this.clear();
            })
            .on('clear', function () {
                assert.equal($container.children().length, 0, 'the container children are removed');

                ready();
            })
            .init()
            .render($container);
    });

    QUnit.test('No clear in the provider', assert => {
        const ready = assert.async();
        assert.expect(1);

        const $container = $('#item-container');

        const provider = Object.assign({}, dummyProvider);
        delete provider.clear;
        itemRunner.register('dummyProvider', provider);

        itemRunner('dummyProvider', {
            type: 'search'
        })
            .on('render', function () {
                this.clear();
            })
            .on('clear', function () {
                assert.ok(true, 'clear is still called');

                ready();
            })
            .init()
            .render($container);
    });

    QUnit.module('ItemRunner state', {
        afterEach() {
            //reset the provides
            itemRunner.providers = noop;
        }
    });

    QUnit.test('setState after render', assert => {
        const ready = assert.async();
        assert.expect(4);

        const $container = $('#item-container');
        assert.equal($container.length, 1, 'the item container exists');

        itemRunner.register('dummyProvider', dummyProvider);

        itemRunner('dummyProvider', {
            type: 'number',
            value: 0
        })
            .on('render', function () {
                const $input = $('input', $container);
                assert.equal($input.length, 1, 'the container contains an input');
                assert.equal($input.val(), 0, 'the input value is set before');

                this.setState({ value: 12 });

                assert.equal($input.val(), 12, 'the input value has changed regarding to the state');

                ready();
            })
            .init()
            .render($container);
    });

    QUnit.test('set initial state', assert => {
        const ready = assert.async();
        assert.expect(2);

        const $container = $('#item-container');
        assert.equal($container.length, 1, 'the item container exists');

        itemRunner.register(
            'fooProvider',
            Object.assign({}, dummyProvider, {
                setState(newState, isInitialSetStateRequest) {
                    assert.equal(isInitialSetStateRequest, true, 'initial set state request is correct');
                }
            })
        );

        itemRunner('fooProvider', {
            type: 'number'
        })
            .on('render', function () {
                ready();
            })
            .init()
            .render($container, { state: { value: 13 } });
    });

    QUnit.test('set a wrong state', assert => {
        const ready = assert.async();
        assert.expect(3);

        itemRunner.register('dummyProvider', dummyProvider);

        itemRunner('dummyProvider', {
            type: 'number',
            value: 0
        })
            .on('error', err => {
                assert.ok(err instanceof Error, 'An error is sent in parameter');
                assert.ok(typeof err.message === 'string', 'An error message is given');
                assert.ok(err.message.length > 0, 'A non empty message is given');
                ready();
            })
            .init()
            .setState([]);
    });

    QUnit.test('get the current state', assert => {
        const ready = assert.async();
        assert.expect(7);

        const $container = $('#item-container');
        assert.equal($container.length, 1, 'the item container exists');

        itemRunner.register('dummyProvider', dummyProvider);

        itemRunner('dummyProvider', {
            type: 'number',
            value: 0
        })
            .on('render', function () {
                let state;
                const $input = $('input', $container);
                assert.equal($input.length, 1, 'the container contains an input');
                assert.equal($input.val(), 0, 'the input value is set before');

                state = this.getState();

                assert.ok(typeof state === 'object', 'the state is an object');
                assert.equal(state.value, 0, 'got the initial state');

                $input.val(14);

                state = this.getState();

                assert.ok(typeof state === 'object', 'the state is an object');
                assert.equal(state.value, 14, 'got the last state value');

                ready();
            })
            .init()
            .render($container);
    });

    QUnit.test('listen for state change', assert => {
        const ready = assert.async();
        assert.expect(5);

        const $container = $('#item-container');
        assert.equal($container.length, 1, 'the item container exists');

        itemRunner.register('dummyProvider', dummyProvider);

        itemRunner('dummyProvider', {
            type: 'number',
            value: 0
        })
            .on('statechange', function (state) {
                const $input = $('input', $container);

                assert.ok(typeof state === 'object', 'the state is an object');
                assert.equal($input.length, 1, 'the container contains an input');
                assert.equal(state.value, 16, 'the state has the updated value');
                assert.equal($input.val(), state.value, 'the given state match the input value');

                ready();
            })
            .on('render', function () {
                const $input = $('input', $container);
                const evt = document.createEvent('HTMLEvents');
                evt.initEvent('change', false, true);
                $input.val(16)[0].dispatchEvent(evt);
            })
            .init()
            .render($container);
    });

    QUnit.module('ItemRunner getResponses', {
        afterEach() {
            //reset the providers
            itemRunner.providers = noop;
        }
    });

    QUnit.test('getResponses with no changes', assert => {
        const ready = assert.async();
        assert.expect(4);

        const $container = $('#item-container');
        assert.equal($container.length, 1, 'the item container exists');

        itemRunner.register('dummyProvider', dummyProvider);

        itemRunner('dummyProvider', {
            type: 'number',
            value: 0
        })
            .on('render', function () {
                const responses = this.getResponses();

                assert.ok(responses instanceof Array, 'responses is an array');
                assert.equal(responses.length, 1, 'responses contains one entry');
                assert.equal(responses[0], 0, 'response is the initial value');

                ready();
            })
            .init()
            .render($container);
    });

    QUnit.test('getResponses after changes', assert => {
        const ready = assert.async();
        assert.expect(4);

        const $container = $('#item-container');
        assert.equal($container.length, 1, 'the item container exists');

        itemRunner.register('dummyProvider', dummyProvider);

        itemRunner('dummyProvider', {
            type: 'number',
            value: 0
        })
            .on('render', function () {
                const $input = $('input', $container);
                $input.val(18);

                const responses = this.getResponses();

                assert.ok(responses instanceof Array, 'responses is an array');
                assert.equal(responses.length, 1, 'responses contains one entry, the last response only');
                assert.equal(responses[0], 18, 'response is the initial value');

                ready();
            })
            .init()
            .render($container);
    });

    QUnit.module('ItemRunner events', {
        afterEach() {
            //reset the provides
            itemRunner.providers = noop;
        }
    });

    QUnit.test('multiple events binding', assert => {
        const ready = assert.async();
        assert.expect(2);

        let inc = 0;

        itemRunner.register('dummyProvider', dummyProvider);

        itemRunner('dummyProvider', {
            type: 'number'
        })
            .on('test', function () {
                assert.equal(inc, 0, 'handler called first');
                inc++;
            })
            .on('test', function () {
                assert.equal(inc, 1, 'first called 2nd');
                ready();
            })
            .init()
            .trigger('test');
    });

    QUnit.test('unbinding events', assert => {
        const ready = assert.async();
        assert.expect(1);

        itemRunner.register('dummyProvider', dummyProvider);

        itemRunner('dummyProvider', {
            type: 'number'
        })
            .on('test', function () {
                assert.ok(false, 'Should not be called');
            })
            .on('test', function () {
                assert.ok(false, 'should not be callled');
            })
            .init()
            .off('test')
            .trigger('test');

        setTimeout(() => {
            assert.ok(true, 'handlers not called after off');
            ready();
        }, 10);
    });

    QUnit.module('ItemRunner renderFeedbacks', {
        afterEach() {
            //reset the providers
            itemRunner.providers = noop;
        }
    });

    QUnit.test('renderFeedbacks with empty queue', assert => {
        const ready = assert.async();
        assert.expect(3);

        const $container = $('#item-container');
        assert.equal($container.length, 1, 'the item container exists');

        itemRunner.register('dummyProvider', dummyProvider);

        itemRunner('dummyProvider', {
            type: 'number',
            value: 0
        })
            .on('render', function () {
                this.renderFeedbacks([], [], function (renderingQueue) {
                    assert.ok(renderingQueue instanceof Array, 'renderingQueue is an array');
                    assert.equal(renderingQueue.length, 0, 'renderingQueue is empty');

                    ready();
                });
            })
            .init()
            .render($container);
    });

    QUnit.test('getResponses after changes', assert => {
        const ready = assert.async();
        assert.expect(4);

        const $container = $('#item-container');
        assert.equal($container.length, 1, 'the item container exists');

        itemRunner.register('dummyProvider', dummyProvider);

        itemRunner('dummyProvider', {
            type: 'number',
            value: 0
        })
            .on('render', function () {
                this.renderFeedbacks({ f1: 'feedback1', f2: 'feedback2', f3: 'feedback3' }, ['f2'], function (
                    renderingQueue
                ) {
                    assert.ok(renderingQueue instanceof Array, 'renderingQueue is an array');
                    assert.equal(renderingQueue.length, 1, 'renderingQueue contains one entry');
                    assert.equal(renderingQueue[0], 'feedback2', 'renderingQueue contains selected entry');

                    ready();
                });
            })
            .init()
            .render($container);
    });

    QUnit.test('access item data', assert => {
        const ready = assert.async();
        const dummyData = {
            alpha: 1,
            beta: 'sample string',
            gamma: {
                delta: 'string 2',
                epsilon: 'string 2'
            }
        };

        assert.expect(1);

        itemRunner.register('dummyProvider', dummyProvider);

        itemRunner('dummyProvider', dummyData)
            .on('init', function () {
                assert.deepEqual(this.getData(), dummyData, 'getData() returns expected data');
                ready();
            })
            .init();
    });

    QUnit.test('set new item data', assert => {
        const ready = assert.async();
        assert.expect(3);

        const dummyData = {
            alpha: 1,
            beta: 'sample string',
            gamma: {
                delta: 'string 2',
                epsilon: 'string 2'
            }
        };

        const $container = $('#item-container');
        assert.equal($container.length, 1, 'the item container exists');

        itemRunner.register('dummyProvider', dummyProvider);

        itemRunner('dummyProvider', {})
            .on('init', function () {
                assert.deepEqual(this.getData(), {}, 'getData() returns empty data');
            })
            .on('render', function () {
                this.setData(dummyData);
                assert.deepEqual(this.getData(), dummyData, 'getData() returns new data');
                ready();
            })
            .init()
            .render($container);
    });

    QUnit.module('ItemRunner suspend, resume and close', {
        afterEach() {
            //reset the provides
            itemRunner.providers = noop;
        }
    });

    QUnit.test('Suspend has no effect before rendering', assert => {
        const ready = assert.async();
        assert.expect(2);

        itemRunner.register(
            'dummyProvider',
            Object.assign({}, dummyProvider, {
                suspend() {
                    assert.ok(false, 'The provider should not be executed');
                }
            })
        );

        itemRunner('dummyProvider', {
            type: 'number'
        })
            .on('init', function () {
                assert.equal(this.isSuspended(), false, 'The runner does not start suspended');

                this.suspend().then(() => {
                    assert.equal(this.isSuspended(), false, 'We cannot suspend it before rendered');
                    ready();
                });
            })
            .init();
    });

    QUnit.test('Suspend/resume calls the providers', assert => {
        const ready = assert.async();
        const $container = $('#item-container');
        assert.expect(5);

        itemRunner.register(
            'dummyProvider',
            Object.assign({}, dummyProvider, {
                suspend() {
                    assert.ok(true, 'The provider suspends the item');
                    return new Promise(resolve => setTimeout(resolve, 20));
                },
                resume() {
                    assert.ok(true, 'The provider resumes the item');
                    return new Promise(resolve => setTimeout(resolve, 10));
                }
            })
        );

        itemRunner('dummyProvider', {
            type: 'number'
        })
            .on('render', function () {
                assert.equal(this.isSuspended(), false, 'The runner does not start suspended');

                this.suspend()
                    .then(() => {
                        assert.equal(this.isSuspended(), true, 'The runner is now suspended');
                        return this.resume();
                    })
                    .then(() => {
                        assert.equal(this.isSuspended(), false, 'The runner is resumed');
                        ready();
                    });
            })
            .init()
            .render($container);
    });

    QUnit.test('Suspend and resume are asynchronous', assert => {
        const ready = assert.async();
        const $container = $('#item-container');
        assert.expect(8);

        itemRunner.register(
            'dummyProvider',
            Object.assign({}, dummyProvider, {
                suspend() {
                    assert.ok(true, 'The provider suspends the item');
                    return new Promise(resolve => setTimeout(resolve, 10));
                },
                resume() {
                    assert.ok(true, 'The provider resumes the item');
                    return new Promise(resolve => setTimeout(resolve, 20));
                }
            })
        );

        itemRunner('dummyProvider', {
            type: 'number'
        })
            .on('render', function () {
                assert.equal(this.isSuspended(), false, 'The runner starts resumed');
                const suspendPromise = this.suspend();
                this.resume();
                suspendPromise
                    .then(() => this.resume())
                    .then(() => {
                        assert.equal(this.isSuspended(), false, 'The runner is resumed');
                        return this.suspend();
                    })
                    .then(() => {
                        assert.equal(this.isSuspended(), true, 'The runner is suspendd');
                        return this.suspend(); //not called
                    })
                    .then(() => this.resume())
                    .then(() => {
                        assert.equal(this.isSuspended(), false, 'The runner is resumed');
                        return this.resume(); //not called
                    })
                    .then(ready);
            })
            .init()
            .render($container);
    });


    QUnit.test('Close has no effect before rendering', assert => {
        const ready = assert.async();
        assert.expect(2);

        itemRunner.register(
            'dummyProvider',
            Object.assign({}, dummyProvider, {
                close() {
                    assert.ok(false, 'The provider should not be executed');
                }
            })
        );

        itemRunner('dummyProvider', {
            type: 'number'
        })
            .on('init', function () {
                assert.equal(this.isClosed(), false, 'The runner is closed unless rendered');
                this.close().then(() => {
                    assert.equal(this.isClosed(), false, 'The runner remains closed unless rendered');
                    ready();
                });
            })
            .init();
    });

    QUnit.test('Close/resume calls the providers', assert => {
        const ready = assert.async();
        const $container = $('#item-container');
        assert.expect(5);

        itemRunner.register(
            'dummyProvider',
            Object.assign({}, dummyProvider, {
                close() {
                    assert.ok(true, 'The provider closes the item');
                    return new Promise(resolve => setTimeout(resolve, 20));
                },
                resume() {
                    assert.ok(true, 'The provider resumes the item');
                    return new Promise(resolve => setTimeout(resolve, 10));
                }
            })
        );

        itemRunner('dummyProvider', {
            type: 'number'
        })
            .on('render', function () {
                assert.equal(this.isClosed(), false, 'The runner does not start closed');
                this.close()
                    .then(() => {
                        assert.equal(this.isClosed(), true, 'The runner is now closed');
                        return this.resume();
                    })
                    .then(() => {
                        assert.equal(this.isClosed(), false, 'The runner is resumed');
                        ready();
                    });
            })
            .init()
            .render($container);
    });

    QUnit.test('Close/resume are asynchronous', assert => {
        const ready = assert.async();
        const $container = $('#item-container');
        assert.expect(8);

        itemRunner.register(
            'dummyProvider',
            Object.assign({}, dummyProvider, {
                close() {
                    assert.ok(true, 'The provider closes the item');
                    return new Promise(resolve => setTimeout(resolve, 10));
                },
                resume() {
                    assert.ok(true, 'The provider resumes the item');
                    return new Promise(resolve => setTimeout(resolve, 30));
                }
            })
        );

        itemRunner('dummyProvider', {
            type: 'number'
        })
            .on('render', function () {
                assert.equal(this.isClosed(), false, 'The runner does not start closed');
                const closePromise = this.close();
                this.resume();
                closePromise
                    .then(() => this.resume())
                    .then(() => {
                        assert.equal(this.isClosed(), false, 'The runner is resumed');
                        return this.close();
                    })
                    .then(() => {
                        assert.equal(this.isClosed(), true, 'The runner is still closed');
                        return this.close(); //not called
                    })
                    .then(() => this.resume())
                    .then(() => {
                        assert.equal(this.isClosed(), false, 'The runner is resumed');
                        return this.resume(); //not called
                    })
                    .then(ready);
            })
            .init()
            .render($container);
    });
});
