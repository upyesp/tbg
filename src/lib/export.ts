/**
 * Journey Plan → Markdown export (the first of the three agreed export
 * formats; Docx and PDF build on the same intermediate).
 */

import type { JourneyPlan } from './domain';
import { encodePlusCode } from './pluscode';
import { formatLatLng } from './guidance-text';

export const MODE_LABELS: Record<string, string> = {
  walking: 'Walking',
  manual_wheelchair: 'Manual wheelchair',
  power_wheelchair: 'Power wheelchair',
  bus_coach: 'Bus or coach',
  train: 'Train',
  tram_metro: 'Tram or metro',
  taxi_rideshare: 'Taxi or rideshare',
  car_passenger: 'Car (passenger)',
  ferry: 'Ferry',
};

export function planToMarkdown(plan: JourneyPlan): string {
  const lines: string[] = [];
  lines.push(`# ${plan.name}`, '');
  lines.push('_Journey plan from To Boldly Go (tbg.life)_', '');

  plan.stops.forEach((stop, i) => {
    lines.push(`## Stop ${i + 1}: ${stop.name}`, '');
    lines.push(`- Coordinates: ${formatLatLng(stop.lat, stop.lng)}`);
    lines.push(`- Plus code: ${encodePlusCode(stop.lat, stop.lng)}`);
    if (stop.note !== undefined && stop.note !== '') lines.push(`- Note: ${stop.note}`);
    lines.push('');

    const leg = plan.legs[i];
    const next = plan.stops[i + 1];
    if (leg !== undefined && next !== undefined) {
      const mode = leg.modeOfTravel !== undefined ? MODE_LABELS[leg.modeOfTravel] ?? leg.modeOfTravel : 'unspecified';
      lines.push(`**To ${next.name}** — ${mode}.`, '');
    }
  });

  return lines.join('\n').trimEnd() + '\n';
}
