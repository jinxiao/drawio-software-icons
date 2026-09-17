/* Alibaba Cloud category palettes. Generated bundles embed every SVG; no fetch is needed.
 * Original collection colors. Install in a self-hosted draw.io build. See README.md.
 */
Draw.loadPlugin(function (ui) {
    'use strict';
    var bundle = __PLUGIN_DATA__;
    var sidebar = ui.sidebar;
    if (ui.alibabaCloudIconsVersion) {
        if (ui.alibabaCloudIconsVersion !== bundle.version) {
            throw new Error('Alibaba Cloud: reload draw.io before installing another version.');
        }
        return;
    }
    if (!sidebar || typeof sidebar.addPalette !== 'function' ||
        typeof sidebar.addEntries !== 'function' ||
        typeof sidebar.setCurrentSearchEntryLibrary !== 'function' ||
        typeof ui.addLibraryEntries !== 'function') {
        throw new Error('Alibaba Cloud: this draw.io build does not expose the required sidebar API.');
    }
    bundle.palettes.forEach(function (palette) {
        var title = typeof ui.getResource === 'function' ? ui.getResource(palette.title) : palette.title.main;
        sidebar.setCurrentSearchEntryLibrary(palette.id, palette.id);
        try {
            sidebar.addEntries(palette.data, palette.tags);
        } finally {
            sidebar.setCurrentSearchEntryLibrary();
        }
        // Eager creation also supports versions predating virtual sidebar palettes.
        sidebar.addPalette(palette.id, title, false, function (content) {
            ui.addLibraryEntries(palette.data, content);
        }, true);
    });
    ui.alibabaCloudIconsVersion = bundle.version;
});
