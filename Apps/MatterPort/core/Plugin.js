var Plugin = {};
export {Plugin};
import {Common} from "./Common.js";
(function() {
    Plugin._registry = {};
    Plugin.register = function(plugin) {
        if (!Plugin.isPlugin(plugin)) {
            Common.warn('Plugin.register:', Plugin.toString(plugin), 'does not implement all required fields.');
        }
        if (plugin.name in Plugin._registry) {
            var registered = Plugin._registry[plugin.name],
                pluginVersion = Plugin.versionParse(plugin.version).number,
                registeredVersion = Plugin.versionParse(registered.version).number;
            if (pluginVersion > registeredVersion) {
                Common.warn('Plugin.register:', Plugin.toString(registered), 'was upgraded to', Plugin.toString(plugin));
                Plugin._registry[plugin.name] = plugin;
            } else if (pluginVersion < registeredVersion) {
                Common.warn('Plugin.register:', Plugin.toString(registered), 'can not be downgraded to', Plugin.toString(plugin));
            } else if (plugin !== registered) {
                Common.warn('Plugin.register:', Plugin.toString(plugin), 'is already registered to different plugin object');
            }
        } else {
            Plugin._registry[plugin.name] = plugin;
        }
        return plugin;
    };
    Plugin.resolve = function(dependency) {
        return Plugin._registry[Plugin.dependencyParse(dependency).name];
    };
    Plugin.toString = function(plugin) {
        return typeof plugin === 'string' ? plugin : (plugin.name || 'anonymous') + '@' + (plugin.version || plugin.range || '0.0.0');
    };
    Plugin.isPlugin = function(obj) {
        return obj && obj.name && obj.version && obj.install;
    };
    Plugin.isUsed = function(module, name) {
        return module.used.indexOf(name) > -1;
    };
    Plugin.isFor = function(plugin, module) {
        var parsed = plugin.for && Plugin.dependencyParse(plugin.for);
        return !plugin.for || (module.name === parsed.name && Plugin.versionSatisfies(module.version, parsed.range));
    };
    Plugin.use = function(module, plugins) {
        module.uses = (module.uses || []).concat(plugins || []);
        if (module.uses.length === 0) {
            Common.warn('Plugin.use:', Plugin.toString(module), 'does not specify any dependencies to install.');
            return;
        }
        var dependencies = Plugin.dependencies(module),
            sortedDependencies = Common.topologicalSort(dependencies),
            status = [];
        for (var i = 0; i < sortedDependencies.length; i += 1) {
            if (sortedDependencies[i] === module.name) {
                continue;
            }
            var plugin = Plugin.resolve(sortedDependencies[i]);
            if (!plugin) {
                status.push('❌ ' + sortedDependencies[i]);
                continue;
            }
            if (Plugin.isUsed(module, plugin.name)) {
                continue;
            }
            if (!Plugin.isFor(plugin, module)) {
                Common.warn('Plugin.use:', Plugin.toString(plugin), 'is for', plugin.for, 'but installed on', Plugin.toString(module) + '.');
                plugin._warned = true;
            }
            if (plugin.install) {
                plugin.install(module);
            } else {
                Common.warn('Plugin.use:', Plugin.toString(plugin), 'does not specify an install function.');
                plugin._warned = true;
            }
            if (plugin._warned) {
                status.push('🔶 ' + Plugin.toString(plugin));
                delete plugin._warned;
            } else {
                status.push('✅ ' + Plugin.toString(plugin));
            }
            module.used.push(plugin.name);
        }
        if (status.length > 0) {
            Common.info(status.join('  '));
        }
    };
    Plugin.dependencies = function(module, tracked) {
        var parsedBase = Plugin.dependencyParse(module),
            name = parsedBase.name;
        tracked = tracked || {};
        if (name in tracked) {
            return;
        }
        module = Plugin.resolve(module) || module;
        tracked[name] = Common.map(module.uses || [], function(dependency) {
            if (Plugin.isPlugin(dependency)) {
                Plugin.register(dependency);
            }
            var parsed = Plugin.dependencyParse(dependency),
                resolved = Plugin.resolve(dependency);
            if (resolved && !Plugin.versionSatisfies(resolved.version, parsed.range)) {
                Common.warn(
                    'Plugin.dependencies:', Plugin.toString(resolved), 'does not satisfy',
                    Plugin.toString(parsed), 'used by', Plugin.toString(parsedBase) + '.'
                );
                resolved._warned = true;
                module._warned = true;
            } else if (!resolved) {
                Common.warn(
                    'Plugin.dependencies:', Plugin.toString(dependency), 'used by',
                    Plugin.toString(parsedBase), 'could not be resolved.'
                );
                module._warned = true;
            }
            return parsed.name;
        });
        for (var i = 0; i < tracked[name].length; i += 1) {
            Plugin.dependencies(tracked[name][i], tracked);
        }
        return tracked;
    };
    Plugin.dependencyParse = function(dependency) {
        if (Common.isString(dependency)) {
            var pattern = /^[\w-]+(@(\*|[\^~]?\d+\.\d+\.\d+(-[0-9A-Za-z-+]+)?))?$/;
            if (!pattern.test(dependency)) {
                Common.warn('Plugin.dependencyParse:', dependency, 'is not a valid dependency string.');
            }
            return {
                name: dependency.split('@')[0],
                range: dependency.split('@')[1] || '*'
            };
        }
        return {
            name: dependency.name,
            range: dependency.range || dependency.version
        };
    };
    Plugin.versionParse = function(range) {
        var pattern = /^(\*)|(\^|~|>=|>)?\s*((\d+)\.(\d+)\.(\d+))(-[0-9A-Za-z-+]+)?$/;
        if (!pattern.test(range)) {
            Common.warn('Plugin.versionParse:', range, 'is not a valid version or range.');
        }
        var parts = pattern.exec(range);
        var major = Number(parts[4]);
        var minor = Number(parts[5]);
        var patch = Number(parts[6]);
        return {
            isRange: Boolean(parts[1] || parts[2]),
            version: parts[3],
            range: range,
            operator: parts[1] || parts[2] || '',
            major: major,
            minor: minor,
            patch: patch,
            parts: [major, minor, patch],
            prerelease: parts[7],
            number: major * 1e8 + minor * 1e4 + patch
        };
    };
    Plugin.versionSatisfies = function(version, range) {
        range = range || '*';
        var r = Plugin.versionParse(range),
            v = Plugin.versionParse(version);
        if (r.isRange) {
            if (r.operator === '*' || version === '*') {
                return true;
            }
            if (r.operator === '>') {
                return v.number > r.number;
            }
            if (r.operator === '>=') {
                return v.number >= r.number;
            }
            if (r.operator === '~') {
                return v.major === r.major && v.minor === r.minor && v.patch >= r.patch;
            }
            if (r.operator === '^') {
                if (r.major > 0) {
                    return v.major === r.major && v.number >= r.number;
                }
                if (r.minor > 0) {
                    return v.minor === r.minor && v.patch >= r.patch;
                }
                return v.patch === r.patch;
            }
        }
        return version === range || version === '*';
    };
})();