import { describe, expect, it } from 'vitest';
import { addStop, makePlan, makeStop, setLegMode, setLegNote, type JourneyPlan } from './domain';
import { planToMarkdown } from './export';

function samplePlan(): JourneyPlan {
  let plan = makePlan('Market trip');
  plan = addStop(plan, makeStop('Town Hall', 51.50722, -0.1275, undefined, 'Meet by the lions'));
  plan = addStop(plan, makeStop('Library', 51.5155, -0.1321));
  plan = setLegMode(plan, plan.legs[0]!.id, 'walking');
  return plan;
}

describe('planToMarkdown', () => {
  it('starts with the plan name', () => {
    expect(planToMarkdown(samplePlan())).toMatch(/^# Market trip\n/);
  });

  it('lists stops with coordinates and plus codes', () => {
    const md = planToMarkdown(samplePlan());
    expect(md).toContain('## Stop 1: Town Hall');
    expect(md).toContain('## Stop 2: Library');
    expect(md).toContain('51.50722, -0.12750');
    expect(md).toMatch(/Plus code: [23456789CFGHJMPQRVWX]{8}\+[23456789CFGHJMPQRVWX]{2}/);
  });

  it('includes stop notes and leg modes', () => {
    const md = planToMarkdown(samplePlan());
    expect(md).toContain('Note: Meet by the lions');
    expect(md).toContain('**To Library** — Walking.');
  });

  it('has no leg after the final stop', () => {
    const md = planToMarkdown(samplePlan());
    expect(md).not.toContain('To undefined');
    const legLines = md.split('\n').filter((l) => l.startsWith('**To '));
    expect(legLines).toHaveLength(1);
  });

  it('includes leg notes', () => {
    const base = samplePlan();
    const plan = setLegNote(base, base.legs[0]!.id, 'Step-free entrance on the south side');
    const md = planToMarkdown(plan);
    expect(md).toContain('Leg note: Step-free entrance on the south side');
  });
});
