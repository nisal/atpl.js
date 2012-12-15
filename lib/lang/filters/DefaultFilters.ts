﻿import RuntimeUtils = module('../../runtime/RuntimeUtils');

export class DefaultFilters {
	// http://twig.sensiolabs.org/doc/filters/abs.html
	static abs(value: number) {
		return Math.abs(value);
	}

	// http://twig.sensiolabs.org/doc/filters/capitalize.html
	static capitalize(value: string) {
		return RuntimeUtils.capitalize(value);
	}

	// http://twig.sensiolabs.org/doc/filters/convert_encoding.html
	static convert_encoding(value: string, from: string, to: string) {
		throw (new Error("Not implemented [no use on javascript that works with unicode]"));
	}

	// http://twig.sensiolabs.org/doc/filters/date.html
	static date(value: string, format?, timezone?) {
		throw (new Error("Not implemented filter [date]"));
	}

	// http://twig.sensiolabs.org/doc/filters/date_modify.html
	static date_modify(value: string, modifier?) {
		throw (new Error("Not implemented filter [date_modify]"));
	}

	// http://twig.sensiolabs.org/doc/filters/default.html
	static $default(value: string, default_value: any) {
		if (value === null || value === undefined) return default_value;
		return value;
	}

	// http://twig.sensiolabs.org/doc/filters/escape.html
	static e(value: string, strategy?: string, charset?: string) { return DefaultFilters.escape(value, strategy, charset); }
	static escape(value: string, strategy: any = true, charset?: string = 'utf-8') {
		this['currentAutoescape'] = strategy;
		return value;
	}

	// http://twig.sensiolabs.org/doc/filters/format.html
	static format(format: string, ...parameters: any[]) {
		throw (new Error("Not implemented filter [format]"));
	}

	// http://twig.sensiolabs.org/doc/filters/join.html
	static join(value: any, separator: string = '') {
		if (value === null || value === undefined) return '';
		if (value instanceof Array) {
			return value.join(separator);
		} else {
			return value;
		}
	}

	// http://twig.sensiolabs.org/doc/filters/json_encode.html
	static json_encode(value: any) {
		return JSON.stringify(value);
	}

	// http://twig.sensiolabs.org/doc/filters/keys.html
	static keys(value: any) {
		var keys = [];
		for (var key in value) keys.push(key);
		return keys;
	}

	// http://twig.sensiolabs.org/doc/filters/length.html
	static length(value: any) {
		if (value === null || value === undefined) return 0;
		return value.length;
	}

	// http://twig.sensiolabs.org/doc/filters/lower.html
	static lower(value: any) {
		return String(lower).toLowerCase();
	}

	// http://twig.sensiolabs.org/doc/filters/merge.html
	static merge(value: any, add: any) {
		throw (new Error("Not implemented filter [merge]"));
	}

	// http://twig.sensiolabs.org/doc/filters/nl2br.html
	static nl2br(value: any) {
		return String(value).replace(/\n/g, '<br />');
	}

	// http://twig.sensiolabs.org/doc/filters/number_format.html
	static number_format(value: any, decimal: number = 0, decimal_point: string = '.', decimal_sep: string = ',') {
		throw (new Error("Not implemented filter [number_format]"));
	}

	// http://twig.sensiolabs.org/doc/filters/raw.html
	static raw(value: string) {
		this['currentAutoescape'] = false;
		return value;
	}

	// http://twig.sensiolabs.org/doc/filters/replace.html
	static replace(value: string, replace_pairs: any) {
		throw (new Error("Not implemented filter [replace]"));
	}

	// http://twig.sensiolabs.org/doc/filters/reverse.html
	static reverse(value: any) {
		if (value !== undefined && value !== null) {
			if (value instanceof Array) {
				return value.reverse();
			}
			else if (value instanceof String) {
				throw (new Error("Not implemented filter [reverse]"));
			}
		}
		return value;
	}

	// http://twig.sensiolabs.org/doc/filters/slice.html
	static slice(value: any, start, length, preserve_keys?) {
		if (value instanceof Array) return value.slice(start, length);
		if (value instanceof String) return value.substr(start, length);
		return value;
	}

	// http://twig.sensiolabs.org/doc/filters/sort.html
	static sort(value: any) {
		if (value instanceof Array) return value.sort();
		return value;
	}

	// http://twig.sensiolabs.org/doc/filters/split.html
	static split(value: any, delimiter: string, limit: number) {
		throw (new Error("Not implemented filter [split]"));
	}

	// http://twig.sensiolabs.org/doc/filters/strip_tags.html
	static strip_tags(value: any) {
		throw (new Error("Not implemented filter [strip_tags]"));
	}

	// http://twig.sensiolabs.org/doc/filters/title.html
	static title(value: any) {
		return RuntimeUtils.title(value);
	}

	// http://twig.sensiolabs.org/doc/filters/trim.html
	static trim(value: any, characters?: string) {
		if (characters !== undefined) throw (new Error("Not implemented filter [trim] with special characters"));
		return String(value).trim();
	}

	// http://twig.sensiolabs.org/doc/filters/upper.html
	static upper(value: any) {
		return String(upper).toUpperCase();
	}

	// http://twig.sensiolabs.org/doc/filters/url_encode.html
	static url_encode(value: any) {
		throw (new Error("Not implemented filter [url_encode]"));
	}
}