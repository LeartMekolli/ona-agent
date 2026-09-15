import { stageToWorkflow } from './lifecycle.route';
import { LifecycleStage, Workflow } from './lifecycle.enum';

describe('stageToWorkflow', () => {
  it.each([
    [LifecycleStage.ORDER_PLACED, Workflow.SUPPORT],
    [LifecycleStage.IN_TRANSIT, Workflow.SUPPORT],
    [LifecycleStage.DELIVERED, Workflow.SUPPORT],
    [LifecycleStage.RETURN_OPEN, Workflow.SUPPORT],
    [LifecycleStage.PRE_PURCHASE, Workflow.PRESALE],
    [LifecycleStage.CLOSED, Workflow.WINBACK],
  ])('maps %s to %s', (stage, workflow) => {
    expect(stageToWorkflow(stage)).toBe(workflow);
  });

  it('covers every stage in the enum', () => {
    for (const stage of Object.values(LifecycleStage)) {
      expect(() => stageToWorkflow(stage)).not.toThrow();
    }
  });
});
