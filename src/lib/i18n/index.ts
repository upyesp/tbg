/**
 * Top-8 languages (per the design): English, Mandarin, Hindi, Spanish,
 * French, Arabic (RTL), Bengali, Portuguese. English ships complete; other
 * dictionaries fall back to English until translations land.
 */

export const LOCALES = ['en', 'zh', 'hi', 'es', 'fr', 'ar', 'bn', 'pt'] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'en';

const en = {
  app_name: 'To Boldly Go',
  skip_to_content: 'Skip to main content',
  planner_title: 'Journey plans',
  planner_intro: 'Your journey plans',
  create_plan: 'New journey plan',
  plan_name_placeholder: 'Name your journey plan',
  open_plan: 'Open plan',
  follow_plan: 'Follow this journey',
  delete_plan: 'Delete plan',
  reverse_plan: 'Reverse journey',
  export_plan: 'Export as document',
  add_stop: 'Add stop',
  remove_stop: 'Remove stop',
  stop_name: 'Stop name',
  latitude: 'Latitude',
  longitude: 'Longitude',
  note: 'Note',
  leg_note: 'Leg note',
  move_up: 'Move earlier',
  move_down: 'Move later',
  from_catalogue: 'From the place catalogue',
  manual_entry: 'Enter manually',
  mode_of_travel: 'Mode of travel for this leg',
  no_plans: 'No journey plans yet. Create your first one.',
  stops_count: 'stops',
  back_to_planner: 'Back to journey plans',
  follow_stop_of: 'Stop',
  follow_of: 'of',
  repeat_guidance: 'Repeat guidance',
  next_stop: 'Next stop',
  where_am_i: 'Where am I?',
  end_follow: 'End following',
  weak_signal: 'Weak GPS signal.',
  last_fix_ago: 'Last position fix',
  seconds_ago: 'seconds ago',
  journey_complete: 'You have arrived at your final stop. Journey complete.',
  metres: 'metres',
  kilometre: 'kilometre',
  kilometres: 'kilometres',
  oclock: "o'clock",
  to_the_north: 'to the north',
  to_the_east: 'to the east',
  to_the_south: 'to the south',
  to_the_west: 'to the west',
  arrived_at: 'You have arrived at',
  approaching: 'Approaching',
  moving_away_from: 'Moving away from',
  check_your_direction: 'Check your direction',
  position_unknown: 'Position unknown.',
  waiting_for_fix: 'Waiting for a position fix…',
  no_fix_yet: 'No position fix yet.',
  plus_code_label: 'Plus code',
  coordinates_label: 'Coordinates',
  your_location: 'Your location',
  near: 'Near',
} as const;

export type StringKey = keyof typeof en;
type Dict = Partial<Record<StringKey, string>>;

const dictionaries: Record<Locale, Dict> = {
  en,
  zh: {},
  hi: {},
  es: {},
  fr: {},
  ar: {},
  bn: {},
  pt: {},
};

/** Translate `key` for `locale` (defaults to the app locale), falling back to English. */
export function t(key: StringKey, locale: Locale = DEFAULT_LOCALE): string {
  return dictionaries[locale][key] ?? en[key];
}

/** Text direction for the locale (Arabic is right-to-left). */
export function dir(locale: Locale): 'ltr' | 'rtl' {
  return locale === 'ar' ? 'rtl' : 'ltr';
}

/** BCP-47 tag for speech synthesis. */
export function speechLang(locale: Locale): string {
  const tags: Record<Locale, string> = {
    en: 'en-GB',
    zh: 'zh-CN',
    hi: 'hi-IN',
    es: 'es-ES',
    fr: 'fr-FR',
    ar: 'ar-SA',
    bn: 'bn-BD',
    pt: 'pt-PT',
  };
  return tags[locale];
}
