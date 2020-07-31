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

import path from 'path';
import glob from 'glob';
import alias from '@rollup/plugin-alias';
import wildcardExternal from '@oat-sa/rollup-plugin-wildcard-external';
import istanbul from 'rollup-plugin-istanbul';

const { srcDir, outputDir, aliases } = require('./path');

const inputs = glob.sync(path.join(srcDir, '**', '*.js'));

/**
 * Define all modules as external, so rollup won't bundle them together.
 */
const localExternals = inputs.map(
    input => `taoItems/${path
        .relative(srcDir, input)
        .replace(/\\/g, '/')
        .replace(/\.js$/, '')}`
);

export default inputs.map(input => {
    const name = path.relative(srcDir, input).replace(/\.js$/, '');
    const dir = path.dirname(path.relative(srcDir, input));

    return {
        input,
        output: {
            dir: path.join(outputDir, dir),
            format: 'amd',
            name
        },
        external: ['jquery', 'lodash', ...localExternals],
        plugins: [
            wildcardExternal(['core/**', 'util/**']),
            alias({
                resolve: ['.js', '.json', '.tpl'],
                entries : aliases
            }),
            ...(process.env.COVERAGE ? [istanbul()] : []),
        ]
    };
});
