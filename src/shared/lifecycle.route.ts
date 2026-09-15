import { LifecycleStage, Workflow } from './lifecycle.enum';

const STAGE_TO_WORKFLOW: Readonly<Record<LifecycleStage, Workflow>> = {
  [LifecycleStage.ORDER_PLACED]: Workflow.SUPPORT,
  [LifecycleStage.IN_TRANSIT]: Workflow.SUPPORT,
  [LifecycleStage.DELIVERED]: Workflow.SUPPORT,
  [LifecycleStage.RETURN_OPEN]: Workflow.SUPPORT,
  [LifecycleStage.PRE_PURCHASE]: Workflow.PRESALE,
  [LifecycleStage.CLOSED]: Workflow.WINBACK,
};

export function stageToWorkflow(stage: LifecycleStage): Workflow {
  return STAGE_TO_WORKFLOW[stage];
}
