import { html, TemplateResult } from 'lit';
import { HassEntity } from "home-assistant-js-websocket";
import { Departure } from './types';
import { MinutesCountdown } from './minutes-countdown';
import { localize } from './localize/localize';

/**
 * Make a time-string of the format 'XX:YY (a|p)m', enforcing that "minute" is always
 * two digits while "hour" can be one or two digits.
 *
 * @param date The datetime value to render
 * @returns The formatted time-string
 */
function getTimeStr(date: Date): string {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

/**
 * Generate HTML templates that each house the details for rendering a LIRR trip.
 *
 * @param entity HassEntity from a LIRR API call
 * @returns An array of HTML templates representing train-trip details
 */
export function generateTripDeparturesHtmlArr(entity: HassEntity): TemplateResult[] {
    const trips = entity.attributes['trips'];
    const trainTrips: Departure[] = [];

    trips.forEach((trip: any) => {
        const tripDepartTime = trip?.trip_start ?? 0;
        const tripArriveTime = trip?.trip_end ?? 0;
        const tripDepartTimeDate = new Date(tripDepartTime * 1000);

        trainTrips.push({
            durationMinutes: (tripArriveTime - tripDepartTime) / 60,
            departTime: tripDepartTimeDate,
            peak: "P" === trip?.peak_code,
        });
        console.log(trainTrips.at(-1));
    });

    // Make HTML for each trip
    const trainsHtml: TemplateResult[] = [];
    if (trainTrips.length > 0) {
        // Probably not necessary (API seems to return sorted), but sort just in case
        trainTrips.sort((a, b) => a.departTime < b.departTime ? -1 : 1);


        // Remove trips when there are too many in the past
        const now = new Date();
        while (trainTrips.length > 2 && trainTrips[0].departTime < now) {
            trainTrips.shift();
        }

        // Get exactly 4 departures
        for (let i = 0; i < 4; i++) {
            if (i < trainTrips.length) {
                const trip = trainTrips[i];
                const minutesCountdown = new MinutesCountdown();
                minutesCountdown.departureTime = trip.departTime;
                trainsHtml.push(
                    html`
                    <span class="${i == 0 ? 'first' : ''} departure">
                        <span class="time">${getTimeStr(trip.departTime)}</span>
                        ${minutesCountdown}
                        <span class="duration">
                          ${localize("common.duration_short")}: ${trip.durationMinutes} ${localize("common.minutes_short")}
                        </span>
                        ${trip.peak ? html`<span class="peak">&#119823;</span>` : ''}
                    </span>`
                );
            } else {
                trainsHtml.push(
                    html`
                    <span class="departure empty">
                        <span class="time">--:--</span>
                    </span>`
                );
            }
        }
    }
    return trainsHtml;
}
