import {
  LitElement,
  html,
  TemplateResult,
  css,
} from 'lit';
import { customElement, state } from "lit/decorators";

/*
 * Class to hold the minutes until the train departs, allowing the countdown to be
 * successfully re-rendered every 5 seconds.
 */
@customElement("mins-countdown-lirr")
export class MinutesCountdown extends LitElement {

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

  private _updateMins(): void {
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
