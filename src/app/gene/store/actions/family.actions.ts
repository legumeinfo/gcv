import { createAction, props } from '@ngrx/store';

export const Clear = createAction('[FAMILY] CLEAR');
export const OmitFamilies = createAction(
  '[FAMILY] OMIT_FAMILIES',
  props<{families: string[]}>()
);
export const IncludeFamilies = createAction(
  '[FAMILY] INCLUDE_FAMILIES',
  props<{families: string[]}>()
);
