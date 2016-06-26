const {each, isStr} = require('../util');
const {win, jq} = require('../globals');
const server = require('../server');
const event = require('../core/event');
const format = require('../core/format');
const langs = require('../core/langs');
const allsettings = require('../core/settings');
const store = require('../core/store');

const settings = Object.assign({
    enabled: false,
    lang: 'en',
    useBrowserLang: true
}, allsettings.l10n);
const defaultTranslations = {
    isoCode: 'en',
    lang: 'english',

    dateFormat: 'YYYY-MM-DD HH:mm',
    details: 'details',
    download: 'download',
    empty: 'empty',
    files: 'files',
    filter: 'filter',
    folders: 'folders',
    grid: 'grid',
    icons: 'icons',
    language: 'Language',
    lastModified: 'Last modified',
    name: 'Name',
    noMatch: 'no match',
    parentDirectory: 'Parent Directory',
    search: 'search',
    size: 'Size',
    tree: 'Tree',
    view: 'View'
};
const blockTemplate =
        `<div class="block">
            <h1 class="l10n-language">Language</h1>
            <div class="select">
                <select id="langs"/>
            </div>
        </div>`;
const optionTemplate = '<option/>';
const storekey = 'ext/l10n';
const loaded = {
    en: Object.assign({}, defaultTranslations)
};
let currentLang = loaded.en;


const update = lang => {
    if (lang) {
        currentLang = lang;
    }

    jq('#langs option')
        .removeAttr('selected').removeProp('selected')
        .filter('.' + currentLang.isoCode)
        .attr('selected', 'selected').prop('selected', 'selected');

    each(currentLang, (value, key) => {
        jq('.l10n-' + key).text(value);
        jq('.l10n_ph-' + key).attr('placeholder', value);
    });
    format.setDefaultDateFormat(currentLang.dateFormat);

    jq('#items .item .date').each((idx, el) => {
        const $el = jq(el);
        $el.text(format.formatDate($el.data('time')));
    });
};

const loadLanguage = (isoCode, callback) => {
    if (loaded[isoCode]) {
        callback(loaded[isoCode]);
    } else {
        server.request({action: 'get', l10n: [isoCode]}).then(response => {
            const json = response.l10n && response.l10n[isoCode] ? response.l10n[isoCode] : {};
            loaded[isoCode] = Object.assign({}, defaultTranslations, json, {isoCode});
            callback(loaded[isoCode]);
        });
    }
};

const localize = (languages, isoCode, useBrowserLang) => {
    const storedIsoCode = store.get(storekey);

    if (languages[storedIsoCode]) {
        isoCode = storedIsoCode;
    } else if (useBrowserLang) {
        const browserLang = win.navigator.language || win.navigator.browserLanguage;
        if (browserLang) {
            if (languages[browserLang]) {
                isoCode = browserLang;
            } else if (browserLang.length > 2 && languages[browserLang.substr(0, 2)]) {
                isoCode = browserLang.substr(0, 2);
            }
        }
    }

    if (!languages[isoCode]) {
        isoCode = 'en';
    }

    loadLanguage(isoCode, update);
};

const initLangSelector = languages => {
    const $block = jq(blockTemplate);
    const $select = $block.find('select')
        .on('change', ev => {
            const isoCode = ev.target.value;
            store.put(storekey, isoCode);
            localize(languages, isoCode, false);
        });

    each(languages, (language, isoCode) => {
        jq(optionTemplate)
            .attr('value', isoCode)
            .addClass(isoCode)
            .text(isoCode + ' - ' + (isStr(language) ? language : language.lang))
            .appendTo($select);
    });

    $block.appendTo('#sidebar');
};

const init = () => {
    if (settings.enabled) {
        initLangSelector(langs);
    }

    event.sub('view.changed', () => {
        localize(langs, settings.lang, settings.useBrowserLang);
    });
};


init();
