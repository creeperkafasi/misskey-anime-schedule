import moment from "https://deno.land/x/momentjs@2.29.1-deno/mod.ts";
import dayjs from "npm:dayjs";
import utc from "npm:dayjs/plugin/utc.js"
import timezone from "npm:dayjs/plugin/timezone.js"

dayjs.extend(utc)
dayjs.extend(timezone)


const SCHEDULE_API_KEY = Deno.env.get("SCHEDULE_API_KEY") ?? Deno.args.find((s) => s.startsWith("skey="))?.split("skey=")[1];
const MISSKEY_API_KEY = Deno.env.get("MISSKEY_API_KEY") ?? Deno.args.find((s) => s.startsWith("mkey="))?.split("mkey=")[1];

interface scheduleItem {
    title: string,
    route: string,
    native: string
    english: string,
    delayedText: string,
    delayedFrom: string,
    delayedUntil: string,
    status: "Ongoing" | "Finished" | "Delayed",
    episodeDate: string,
    episodeNumber: number,
    episodes: number,
    lengthMin: number,
    donghua: boolean,
    airType: "sub" | "dub" | "raw",
    mediaTypes: { name: string, route: string }[],
    imageVersionRoute: string,
    streams: {
        crunchyroll: string,
        funimation: string,
        wakanim: string,
        amazon: string,
        hidive: string,
        hulu: string,
        youtube: string,
        netflix: string,
    },
    airingStatus: "airing" | "aired" | "delayed-air"
}

const schedule: scheduleItem[] = await fetch(
    "https://animeschedule.net/api/v3/timetables/sub",
    {
        headers: {
            "Authorization": `Bearer ${SCHEDULE_API_KEY}`
        },
    }
).then((r) => r.json())


const lines = schedule.filter((item) => dayjs(item.episodeDate).utc().date() == dayjs().utc().date()).map(item =>
    `${dayjs(item.episodeDate).tz("UTC").format("HH:mm (UTC)")} | ` +
    `$[font.monospace ${truncateWithEllipses(item.title, 30)}]`
    // `| ${dayjs(item.episodeDate).tz("JST").format("HH:mm (JST)")}`
);

const post = `<center>**Anime Schedule for ${dayjs().utc().format("ddd DD/MM/YYYY")}**</center>\n${lines.join("\n")}`;

const res =
    await fetch(
        "https://misskey.io/api/notes/create",
        {
            method: "POST",
            body: JSON.stringify({ "text": post, "i": MISSKEY_API_KEY }),
            headers: { "Content-Type": "application/json" }

        },
    )

console.log(await res.text())

function truncateWithEllipses(text: string, max: number) {
    return text.substring(0, max - 1) + (text.length > max ? '…' : '');
}
