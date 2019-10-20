export enum ACTIONS_RESULT {
  HALT = 'HALT',
  SHIFT_AND_CONTINUE = 'SHIFT_AND_CONTINUE',
  SHIFT_AND_STOP = 'SHIFT_AND_STOP',
  WAIT_NEXT_TICK = 'WAIT_NEXT_TICK',
  UNSHIFT_AND_CONTINUE = 'UNSHIFT_AND_CONTINUE',
  UNSHIFT_AND_STOP = 'UNSHIFT_AND_STOP',
  SHIFT_UNSHIFT_AND_CONTINUE = 'SHIFT_UNSHIFT_AND_CONTINUE',
  SHIFT_UNSHIFT_AND_STOP = 'SHIFT_UNSHIFT_AND_STOP',
  WAIT_NEXT_TICK_ALL = 'WAIT_NEXT_TICK_ALL',
  RETRY = 'RETRY'
}
