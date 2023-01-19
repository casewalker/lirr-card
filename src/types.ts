// import { ActionConfig, LovelaceCard, LovelaceCardConfig, LovelaceCardEditor } from 'custom-card-helpers';
import { LovelaceCard, LovelaceCardConfig, LovelaceCardEditor } from 'custom-card-helpers';

declare global {
  interface HTMLElementTagNameMap {
    'lirr-card-editor': LovelaceCardEditor;
    'hui-error-card': LovelaceCard;
  }
}

export interface LirrCardConfig extends LovelaceCardConfig {
  type: string;
  name?: string;
  entity: string;
  entities: string[];
  // tap_action?: ActionConfig;
  // hold_action?: ActionConfig;
  // double_tap_action?: ActionConfig;
}

export type Departure = {
  durationMinutes: number,
  departTime: Date,
  peak: boolean,
};
