// Run after building: node --test tests/test_plugin.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const zlib = require('node:zlib');
const {test} = require('node:test');
const root = path.resolve(__dirname, '../../../.sync-stage/alibaba-build');
const summary = JSON.parse(fs.readFileSync(path.join(root, 'summary.json'), 'utf8'));
const script = fs.readFileSync(path.join(root, 'plugins/alibaba-cloud.js'), 'utf8');

function host() {
    const state = {palettes: [], search: [], active: null, rendered: []};
    const ui = {
        sidebar: {
            setCurrentSearchEntryLibrary(id) { state.active = id; },
            addEntries(data, tags) { state.search.push({id: state.active, data, tags}); },
            addPalette(id, title, expanded, render, eager) {
                state.palettes.push({id, title, expanded, eager});
                render({id});
            }
        },
        getResource(title) { return title.main; },
        addLibraryEntries(data, content) { state.rendered.push({id: content.id, data}); }
    };
    // No fetch, DOM, or network API: the generated plugin must be self-contained.
    const context = vm.createContext({Draw: {loadPlugin(fn) { fn(ui); }}});
    return {state, ui, run: () => vm.runInContext(script, context)};
}

test('all source categories are searchable, offline and have blank labels', () => {
    const {state, run} = host();
    run();
    assert.equal(state.palettes.length, summary.categories.length);
    assert.equal(new Set(state.palettes.map(p => p.id)).size, summary.categories.length);
    assert.equal(state.active, undefined);
    let total = 0;
    for (const [index, palette] of state.palettes.entries()) {
        const category = summary.categories[index];
        assert.equal(palette.id, 'alibaba-cloud-' + category.id);
        assert.equal(palette.title, '阿里云 · ' + category.name + ' / ' + category.name_en);
        assert.equal(palette.expanded, false);
        assert.equal(palette.eager, true);
        const data = state.rendered[index].data;
        assert.equal(data.length, category.total);
        assert.equal(state.search[index].id, palette.id);
        assert.equal(state.search[index].data, data);
        for (const item of data) {
            const xml = decodeURIComponent(zlib.inflateRawSync(Buffer.from(item.xml, 'base64')).toString());
            assert.ok(item.title && item.tags);
            assert.match(xml, /<object[^>]* label=""/);
            assert.match(xml, /iconName="[^"]+"/);
            assert.match(xml, /verticalLabelPosition=bottom;verticalAlign=top;/);
            assert.match(xml, /image=data:image\/svg\+xml,/);
            total++;
        }
    }
    assert.equal(total, summary.collection_occurrences);
    run();
    assert.equal(state.palettes.length, summary.categories.length, 'loading twice must not duplicate palettes');
});

test('missing host API fails clearly before creating palettes', () => {
    const {ui, state, run} = host();
    delete ui.addLibraryEntries;
    assert.throws(run, /required sidebar API/);
    assert.equal(state.palettes.length, 0);
});
