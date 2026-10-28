import { FigureComponent } from './figure.component';

export const figureLayoutComponent = {
  component: FigureComponent,
  name: 'figure',
};

export const FIGURE_ID = 'figure';

// clusterID is null when the figure's gene is in no one cluster
export function figureConfigFactory(
  clusterID: number | null,
  outputs: { closed?: () => void } = {},
) {
  return {
    type: 'component',
    componentType: 'figure',
    id: FIGURE_ID,
    title: clusterID === null ? 'Figure' : `Cluster ${clusterID} Figure`,
    componentState: {
      inputs: { clusterID },
      outputs: { closed: () => outputs.closed?.() },
    },
  };
}
