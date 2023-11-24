/*!
 * vencord-tokipona, a Vencord plugin to translate Discord into toki pona
 * Copyright (c) 2023 rini
 * SPDX-License-Identifier: Apache-2.0
 */

import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";
import { findByProps } from "@webpack";
import { Button, useRef } from "@webpack/common";

const DEFAULT_SOURCE = "https://raw.githubusercontent.com/somasis/discord-tokipona-data/main/i18n/tok.json";

const settings = definePluginSettings({
    dataSource: {
        type: OptionType.STRING,
        description: "",
    },
    _export: {
        type: OptionType.COMPONENT,
        description: "Export data",
        component: ExportButton,
    }
});

export default definePlugin({
    name: "tokipona",
    description: "nja",
    authors: [Devs.Rini],
    settings,

    patches: [
        // i18n loader
        {
            find: "{getMessages:",
            replacement: {
                // en-US is loaded as a fallback synchronously on a second call, so we can't overwrite it here
                match: /(?<=getMessages:(\i)=>)"en-US"===\i\?(\i)\(\i\)/,
                replace: '$1==="tok"?$self.getMessages().then($2):$&'
            }
        },
        // date-fns locales. moment.js seems to be used within the UI instead, but this still has to be defined
        {
            find: "dateFnsLocales:function()",
            replacement: {
                match: /"en-US":\(\)=>/,
                replace: 'tok(){return this["en-GB"]()},$&',
            }
        },
        {
            find: "momentjs.com",
            replacement: {
                match: /(\i)\("en",{/,
                replace: '$1("tok",$self.momentLocale);$&'
            }
        },
        // i18n module, we force the locale to `tok` here
        {
            find: "._requestedLocale=",
            replacement: {
                match: /setLocale\((\i)\)\{/,
                replace: '$&$1="tok";'
            }
        }
    ],

    getMessages: () => fetch(settings.store.dataSource ?? DEFAULT_SOURCE).then(r => r.json()),

    momentLocale: {
        invalidDate: "tenpo nasin ike",
        calendar: {
            lastDay: "[tenpo suno pini la tenpo] LT",
            lastWeek: "[tenpo] dddd [pini la] LT",
            nextDay: "[[tenpo suno kama la tenpo] LT] LT",
            nextWeek: "[tenpo] dddd [kama la tenpo] LT",
            sameDay: "[tenpo suno ni la tenpo] LT",
            sameElse: "[tenpo] L"
        },
        relativeTime: {
            M: "tenpo mun",
            MM: "tenpo mun %d",
            d: "tenpo suno",
            dd: "tenpo suno %d",
            future: "lon kama pi %s",
            h: "tenpo ilo wan",
            hh: "tenpo ilo %d",
            m: "tenpo ilo lili wan",
            mm: "tenpo ilo %d",
            past: "lon %s pini",
            s: "tenpo ilo lili",
            ss: "tenpo ilo lili %d",
            y: "tenpo sike",
            yy: "tenpo sike %d"
        }
    }
});

function ExportButton() {
    const ref = useRef<HTMLAnchorElement>(null);

    return <>
        <Button onClick={downloadData}>
            o pana e lipu pi toki Inli
        </Button>
        <a ref={ref} download="i18n.json" hidden />
    </>;

    // webdev was a mistake
    function downloadData() {
        if (!ref.current)
            return;

        const blob = new Blob([JSON.stringify(findByProps("DISCORD_DESC_SHORT"), null, 4)], {
            type: "application/json"
        });
        const url = URL.createObjectURL(blob);

        ref.current.href = url;
        ref.current.click();
        URL.revokeObjectURL(url);
    }
}

/* eslint simple-header/header: 0 */
