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
 * Copyright (c) 2015-2017 (original work) Open Assessment Technologies SA;
 *
 */

/**
 * Test the module {@link taoItems/assets/manager}
 *
 * @author Bertrand Chevrier <bertrand@taotesting.com>
 */
define(['taoItems/assets/manager'], function (assetManagerFactory) {
    'use strict';

    QUnit.module('API');

    QUnit.test('module', function (assert) {
        var assetManager;

        assert.expect(8);

        assert.ok(typeof assetManagerFactory !== 'undefined', 'The module exports something');
        assert.ok(typeof assetManagerFactory === 'function', 'The module exports a function');

        assetManager = assetManagerFactory();

        assert.ok(typeof assetManager === 'object', 'The factory creates an object');
        assert.ok(typeof assetManager.addStrategy === 'function', 'The manager has a method addStrategy');
        assert.ok(typeof assetManager.prependStrategy === 'function', 'The manager has a method prependStrategy');
        assert.ok(typeof assetManager.resolve === 'function', 'The manager has a method resolve');
        assert.ok(typeof assetManager.resolveBy === 'function', 'The manager has a method resolveBy');
        assert.ok(typeof assetManager.clearCache === 'function', 'The manager has a method clearCache');
    });

    QUnit.module('Strategy');

    QUnit.test('add a strategy', function (assert) {
        var strategy = {
            name: 'foo',
            handle: path => `foo${path}`
        };
        var newStrategy = {
            name: 'bar',
            handle: function () {}
        };
        var assetManager = assetManagerFactory(strategy);

        assert.expect(7);

        assert.throws(
            function () {
                assetManager.addStrategy(null);
            },
            TypeError,
            'The strategy must be an object'
        );

        assert.throws(
            function () {
                assetManager.addStrategy({
                    bar: true
                });
            },
            TypeError,
            'The strategy must have a name'
        );

        assert.throws(
            function () {
                assetManager.addStrategy({
                    name: 'bar'
                });
            },
            TypeError,
            'The strategy must have a handle method'
        );

        assert.throws(
            function () {
                assetManager.addStrategy({
                    name: null
                });
            },
            TypeError,
            'The strategy must have a name'
        );

        assert.equal(assetManager._strategies.length, 1);
        assetManager.addStrategy(newStrategy);

        assert.equal(assetManager._strategies.length, 2);
        assert.equal(assetManager._strategies[1].name, newStrategy.name, 'The strategy has been added');
    });

    QUnit.test('prepend a strategy', function (assert) {
        var strategy = {
            name: 'foo',
            handle: path => `foo${path}`
        };
        var newStrategy = {
            name: 'bar',
            handle: function () {}
        };
        var assetManager = assetManagerFactory(strategy);

        assert.expect(7);

        assert.throws(
            function () {
                assetManager.prependStrategy(null);
            },
            TypeError,
            'The strategy must be an object'
        );

        assert.throws(
            function () {
                assetManager.prependStrategy({
                    foo: true
                });
            },
            TypeError,
            'The strategy must have a name'
        );

        assert.throws(
            function () {
                assetManager.prependStrategy({
                    name: 'foo'
                });
            },
            TypeError,
            'The strategy must have a handle method'
        );

        assert.throws(
            function () {
                assetManager.prependStrategy({
                    name: null
                });
            },
            TypeError,
            'The strategy must have a name'
        );

        assert.equal(assetManager._strategies.length, 1);
        assetManager.prependStrategy(newStrategy);

        assert.equal(assetManager._strategies.length, 2);
        assert.equal(assetManager._strategies[0].name, newStrategy.name, 'The strategy has been prepended');
    });

    QUnit.test('strategy resolution', function (assert) {
        var strategy = {
            name: 'foo',
            handle: path => `foo${path}`
        };

        var assetManager = assetManagerFactory(strategy);
        assert.equal(assetManager._strategies.length, 1, 'There is one strategy');
        assert.equal(assetManager._strategies[0].name, strategy.name, 'The strategy has been added');

        const result = assetManager.resolve('bar');
        assert.equal(result, 'foobar', 'The strategy has resolved');
    });

    QUnit.test('multiple strategies resolution', function (assert) {
        var assetManager = assetManagerFactory([
            {
                name: 'foo',
                handle: path => {
                    if (path.toString() === 'far') {
                        return `foo${path}`;
                    }
                }
            },
            {
                name: 'boo',
                handle: path => {
                    if (path.toString() === 'bar') {
                        return `boo${path}`;
                    }
                }
            }
        ]);

        assert.equal(assetManager._strategies.length, 2, 'There are 2 strategies');
        assert.equal(assetManager._strategies[0].name, 'foo', 'The foo strategy has been added');
        assert.equal(assetManager._strategies[1].name, 'boo', 'The boo strategy has been added');

        const res1 = assetManager.resolve('far');
        assert.equal(res1, 'foofar', 'The path is resolved by foo');

        const res2 = assetManager.resolve('bar');
        assert.equal(res2, 'boobar', 'The path is resolved by boo');

        const res3 = assetManager.resolveBy('foo', 'far');
        assert.equal(res3, 'foofar', 'The path is resolved by foo');

        const res4 = assetManager.resolve('moo');
        assert.equal(res4, '', 'The path is not resolved');

        const res5 = assetManager.resolveBy('too');
        assert.equal(res5, '', 'The path is not resolved');
    });

    QUnit.test('anonymous strategies', function (assert) {
        var assetManager = assetManagerFactory([
            function (path) {
                if (path.toString() === 'far') {
                    return `foo${path}`;
                }
            },
            function (path) {
                if (path.toString() === 'bar') {
                    return `boo${path}`;
                }
            }
        ]);

        assert.equal(assetManager._strategies.length, 2, 'There are 2 strategies');

        const res1 = assetManager.resolve('far');
        assert.equal(res1, 'foofar', 'The path is resolved by foo');

        const res2 = assetManager.resolve('bar');
        assert.equal(res2, 'boobar', 'The path is resolved by boo');

        const res3 = assetManager.resolve('moo');
        assert.equal(res3, '', 'The path is not resolved');
    });

    QUnit.module('Options');

    QUnit.test('create a data context', function (assert) {
        var base = 'http://t.ao/';
        var otherBase = 'https://tao.test/';
        var path = 'bar.html';

        var strategies = [
            {
                name: 'foo',
                handle: (handledPath, data) => `${data.base}${handledPath}`
            }
        ];

        var assetManager = assetManagerFactory(strategies, { base: base });

        var otherAssetManager = assetManagerFactory(strategies, { base: otherBase });

        assert.notEqual(assetManager, otherAssetManager, 'The 2 asset manager are differents');

        assert.equal(assetManager._strategies.length, 1, 'There is one strategy');
        assert.equal(assetManager._strategies[0].name, 'foo', 'The strategy has been added');

        assert.equal(otherAssetManager._strategies.length, 1, 'There is one strategy');
        assert.equal(otherAssetManager._strategies[0].name, 'foo', 'The strategy has been added');

        const res1 = assetManager.resolve(path);
        assert.equal(res1, base + path, 'The path is resolved');
        assert.equal(res1, 'http://t.ao/bar.html', 'The path is resolved');

        const res2 = otherAssetManager.resolve(path);
        assert.equal(res2, otherBase + path, 'The path is resolved');
        assert.equal(res2, 'https://tao.test/bar.html', 'The path is resolved');

        assert.notEqual(res1, res2, 'The resolution is different in contexts');
    });

    QUnit.test('update the data context', function (assert) {
        var base = 'http://t.ao/';
        var base2 = 'https://tao.test/';
        var base3 = '//taotesting.com/';
        var path = 'bar.html';

        var strategies = [
            {
                name: 'foo',
                handle: (handledPath, data) => `${data.base}${handledPath}`
            }
        ];

        var assetManager = assetManagerFactory(strategies, { base: base });

        assert.equal(assetManager.getData('base'), base, 'The base are the same');
        assert.deepEqual(assetManager.getData(), { base: base }, 'The context is the same');

        const res1 = assetManager.resolve(path);
        assert.equal(res1, base + path, 'The path is resolved');
        assert.equal(res1, 'http://t.ao/bar.html', 'The path is resolved');

        assetManager.setData('base', base2);
        assert.equal(assetManager.getData('base'), base2, 'The base are the same');

        const res2 = assetManager.resolve(path);
        assert.equal(res2, base2 + path, 'The path is resolved');
        assert.equal(res2, 'https://tao.test/bar.html', 'The path is resolved');

        assetManager.setData({ base: base3 });
        assert.equal(assetManager.getData('base'), base3, 'The base are the same');

        const res3 = assetManager.resolve(path);
        assert.equal(res3, base3 + path, 'The path is resolved');
        assert.equal(res3, '//taotesting.com/bar.html', 'The path is resolved');
    });
    QUnit.test('use caching', function (assert) {
        var strategy = {
            name: 'foo',
            handle: function (url, data){
                data.counter++;
                return `match_${data.counter}`;
            }
        };

        var noCacheAssetManager = assetManagerFactory(strategy, { counter: 0 }, { cache: false });

        assert.equal(noCacheAssetManager.resolve('bar.html'), 'match_1', 'The url resolve from strategy');
        assert.equal(noCacheAssetManager.resolve('bar.html'), 'match_2', 'The url resolve from strategy');
        assert.equal(noCacheAssetManager.resolve('bar.html'), 'match_3', 'The url resolve from strategy');

        const cacheAssetManager = assetManagerFactory(strategy, { counter: 0 }, { cache: true });

        assert.equal(cacheAssetManager.resolve('bar.html'), 'match_1', 'The url resolve from strategy');
        assert.equal(cacheAssetManager.resolve('bar.html'), 'match_1', 'The url resolve from cache');
        assert.equal(cacheAssetManager.resolve('bar.html'), 'match_1', 'The url resolve from cache');

        cacheAssetManager.clearCache();
        assert.equal(
            cacheAssetManager.resolve('bar.html'),
            'match_2',
            'The url resolve from strategy after clearing the cache'
        );
        assert.equal(cacheAssetManager.resolve('bar.html'), 'match_2', 'The url resolve from cache');
    });

    QUnit.test('url parsing', function (assert) {
        var strategy = {
            name: 'port',
            handle: url => `${url.protocol}://${url.host}:8080${url.path}`
        };

        var assetManager = assetManagerFactory(strategy, {}, { parseUrl: true });

        var res1 = assetManager.resolve('http://taotesting.com/tao/download.html');
        assert.equal(res1, 'http://taotesting.com:8080/tao/download.html', 'The path is resolved');

        const res2 = assetManager.resolve('https://taotesting.com/tao/download.html?foo=bar');
        assert.equal(res2, 'https://taotesting.com:8080/tao/download.html', 'The path is resolved');
    });
});
