/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  LitElement,
  html,
  TemplateResult,
  css,
  PropertyValues,
  CSSResultGroup,
} from 'lit';
import { customElement, property, state } from "lit/decorators";
import {
  HomeAssistant,
  hasConfigOrEntityChanged,
  hasAction,
  ActionHandlerEvent,
  handleAction,
  LovelaceCardEditor,
  getLovelace,
} from 'custom-card-helpers'; // This is a community maintained npm module with common helper functions/types. https://github.com/custom-cards/custom-card-helpers

import './editor';

import type { BoilerplateCardConfig } from './types';
import type { Departure } from './types';
import { actionHandler } from './action-handler-directive';
import { CARD_VERSION } from './const';
import { localize } from './localize/localize';

/* eslint no-console: 0 */
console.info(
  `%c  CITYMAPPER-NYCSUBWAY-CARD \n%c  ${localize('common.version')} ${CARD_VERSION}    `,
  'color: orange; font-weight: bold; background: black',
  'color: white; font-weight: bold; background: dimgray',
);

// This puts your card into the UI card picker dialog
(window as any).customCards = (window as any).customCards || [];
(window as any).customCards.push({
  type: 'lirr-card',
  name: 'LIRR Card',
  description: 'Custom card presenting LIRR information for a specific trip query',
});

@customElement('lirr-card')
export class BoilerplateCard extends LitElement {
  public static async getConfigElement(): Promise<LovelaceCardEditor> {
    return document.createElement('lirr-card-editor');
  }

  public static getStubConfig(): Record<string, unknown> {
    return {};
  }

  // TODO Add any properities that should cause your element to re-render here
  // https://lit.dev/docs/components/properties/
  @property({ attribute: false }) public hass!: HomeAssistant;
  @state() private config!: BoilerplateCardConfig;

  // https://lit.dev/docs/components/properties/#accessors-custom
  public setConfig(config: BoilerplateCardConfig): void {
    // TODO Check for required fields and that they are of the proper format
    if (!config) {
      throw new Error(localize('common.invalid_configuration'));
    }
    if (!config.entity) {
      throw new Error(localize('common.missing_entity'));
    }
    if (!config.source || !config.destination) {
      throw new Error(localize('common.missing_source_or_dest'));
    }

    if (config.test_gui) {
      getLovelace().setEditMode(true);
    }

    this.config = {
      name: 'Long Island Rail Road Times',
      ...config,
    };
  }

  // https://lit.dev/docs/components/lifecycle/#reactive-update-cycle-performing
  protected shouldUpdate(changedProps: PropertyValues): boolean {
    if (!this.config) {
      return false;
    }
    return hasConfigOrEntityChanged(this, changedProps, false);
  }

  // https://lit.dev/docs/components/rendering/
  protected render(): TemplateResult | void {
    // TODO Check for stateObj or other necessary things and render a warning if missing
    if (this.config.show_warning) {
      return this._showWarning(localize('common.show_warning'));
    }

    console.log("Hello from the LIRR trains card!");
    const trainTrips: Departure[] = [];

    // dumb dumb dumb
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const trips = this.hass.states[this.config.entity!].attributes["TRIPS"];

    trips.forEach((trip: any) => {
      const tripDate = trip.ROUTE_DATE;
      const tripTime = trip.LEGS[0].DEPART_TIME;
      const departTime = new Date(tripDate.substr(0, 4), tripDate.substr(4, 2) - 1, tripDate.substr(6, 2), tripTime.substr(0, 2), tripTime.substr(2, 2));

      trainTrips.push({
        duration: trip.DURATION,
        peak: trip.PEAK_INDICATOR != 0,  // Currently always zero:
        depart_time: departTime,
        depart_time_string: tripTime
      });
      console.log(trainTrips.at(-1));
    });

    // Get HTML for each trip
    const trainsHtml: TemplateResult[] = [];
    if (trainTrips.length > 0) {
      trainTrips.sort((a, b) => a.depart_time < b.depart_time ? -1 : 1);  // probably not necessary

      // Get exactly 4 departures
      for (let i = 0; i < 4; i++) {
        if (i < trainTrips.length) {
          const trip = trainTrips[i];
          const minsCountdown = new MinsCountdown();
          minsCountdown.departureTime = trip.depart_time;
          trainsHtml.push(html`
            <span class="${i == 0 ? 'first' : ''} departure">
              <span class="time">${this._getTimeStr(trip.depart_time)}</span>
              ${minsCountdown}
              <span class="duration">${localize("common.duration_short")}: ${trip.duration} ${localize("common.minutes_short")}</span>
              ${trip.peak ? html`<span class="peak">&#119823;</span>` : ''}
            </span>
          `);
        } else {
          trainsHtml.push(html`
            <span class="departure empty">
              <span class="time">--:--</span>
            </span>
          `);
        }
      }
    }

    // Put it all together
    return html`
      <ha-card
        @action=${this._handleAction}
        .actionHandler=${actionHandler({  // To do: do I want extra info on action? that is a long way off. screw it for now.
          hasHold: hasAction(this.config.hold_action),
          hasDoubleClick: hasAction(this.config.double_tap_action),
        })}
        tabindex="0"
        .label=${`LIRR: ${this.config.entity || 'No Entity Defined'}`}
      >

        <!-- Card Header -->
        <div>
          <svg class="mta" width="47" height="51" xmlns="http://www.w3.org/2000/svg" fill="#094C99">
            <path d="M29.909 21.372l-2.743-.234v14.56l-4.088.724-.01-15.644-3.474-.308v-5.734l10.315 1.803v4.833zm7.785 12.484l-2.426.421-.283-2.122-2.363.307-.296 2.335-3.125.553 3.094-18.36 2.937.51 2.462 16.356zm-3.141-5.288l-.65-5.606h-.142l-.658 5.691 1.45-.085zM21.038 50.931c13.986 0 25.32-11.402 25.32-25.465C46.359 11.4 35.025 0 21.039 0 12.27 0 4.545 4.483 0 11.296l7.017 1.237 1.931 14.78c.007-.024.14-.009.14-.009l2.118-14.036 7.022 1.229V37.28l-4.432.776v-9.79s.164-4.217.067-4.938c0 0-.193.005-.196-.011l-2.644 15.236-4.403.777-3.236-16.412-.195-.014c-.069.594.237 5.744.237 5.744v11.243L.532 40.4c4.603 6.38 12.072 10.53 20.506 10.53v.001z"></path>
          </svg>
          <span class="title" style="display: inline-block;">${this.config.name}</span>
          <span class="route-container">
            <span class="route">${this.config.source} &#11157; ${this.config.destination}</span>
          </span>
        </div>

        <!-- Each departure's info -->
        <div id="lirr-departure-table">
          <span class="image">
            <ha-state-icon icon="mdi:train"></ha-state-icon>
          </span>
          <span class="departures-wrapper">
            <span class="departures">
              ${trainsHtml.length > 0
                ? trainsHtml.map(departure => html`${departure}`)
                : html`<span class="departure no-trains">${localize("common.no_trains")}</span>`
              }
            </span>
          </span>
        </div>
        <div class="legend">&#119823; = ${localize("common.peak_desc")}</span></div>
      </ha-card>
    `;
  }

  private _getTimeStr(date: Date): string {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }

  private _handleAction(ev: ActionHandlerEvent): void {
    if (this.hass && this.config && ev.detail.action) {
      handleAction(this, this.hass, this.config, ev.detail.action);
    }
  }

  private _showWarning(warning: string): TemplateResult {
    return html`
      <hui-warning>${warning}</hui-warning>
    `;
  }

  private _showError(error: string): TemplateResult {
    const errorCard = document.createElement('hui-error-card');
    errorCard.setConfig({
      type: 'error',
      error,
      origConfig: this.config,
    });
    return html`
      ${errorCard}
    `;
  }

  // https://lit.dev/docs/components/styles/
  static get styles(): CSSResultGroup {
    return css`
      svg.mta {
        padding-left: 24px;
        padding-top: 20px;
        padding-bottom: 6px;
        overflow: visible;
      }
      .title {
        position: absolute;
        left: 1.8em;
        font-weight: 300;
        font-size: 3em;
        top: 38px;
        color: var(--primary-text-color);
      }
      span.route {
        font-weight: 500;
        color: var(--secondary-text-color);
      }
      span.image {
        position: absolute;
        left: 30px;
        padding-top: 8px;
      }
      span.departures-wrapper {
        margin: 0px auto;
        width: 98%;
      }
      span.departures {
        display: flex;
        width: 90%;
        padding: 5px 0px 2px 50px;
      }
      span.departure {
        width: 100%;
        text-align: center;
        padding: 0px 2px 0px 2px;
        border-left: 0.1em solid rgb(217, 217, 217);
      }
      span.departure.first {
        border-left: none;
      }
      span.time {
        font-size: medium;
        font-weight: 600;
        text-transform: lowercase;
        display: block;
        margin-bottom: -2px;
      }
      span.no-trains {
        padding: 3px 30px 28px 0px;
      }
      div.legend {
        font-size: x-small;
        font-weight: 200;
        text-align: right;
        padding-right: 16px;
        margin-top: -5px;
      }
    `;
  }
}

/*
 * Class to hold the minutes until the train departs, allowing the countdown
 * to be successfully re-rendered every 5 seconds.
 */
@customElement("mins-countdown-lirr")
class MinsCountdown extends LitElement {

  _defaultDeparture = new Date("2020-12-31 23:59:59");
  @state() departureTime: Date = this._defaultDeparture;
  @state() private mins = '0 mins';

  protected render(): TemplateResult | void {
    // Update the element every 5 seconds
    setInterval(() => this._updateMins(), 5000);
    this.mins = this._minuteDifference(this.departureTime);
    return html`
      <span class="countdown ${this.mins ? "" : "empty"}">${this.mins}</span>
    `;
  }

  _updateMins(): void {
    this.mins = this._minuteDifference(this.departureTime);
  }

  private _minuteDifference(date: Date): string {
    const diff = Math.round((date.getTime() - Date.now()) / 60000);
    return diff <= 0 ? "" : diff == 1 ? diff + " min" : diff + " mins";
  }

  static styles = css`
    span.countdown {
      display: block;
      font-size: smaller;
      font-style: italic;
      margin-bottom: -8px;
    }
    span.empty {
      margin-bottom: 12px;
    }
  `;
}
