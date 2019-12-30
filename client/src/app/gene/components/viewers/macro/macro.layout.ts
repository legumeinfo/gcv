import { MacroComponent } from './macro.component';


export const macroLayoutComponent = {component: MacroComponent, name: 'macro'};


export function macroConfigFactory(
  name: string,
  source: string,
  clusterID: number,
  outputs: any={})
{
  // NOTE: should the id include end genes?
  const id = `macro:${name}:${source}`;
  const options = {autoResize: true};
  let _outputs = {};
  _outputs = Object.assign(_outputs, outputs);
  return  {
    type: 'component',
    componentName: 'macro',
    id: id,
    title: `${name} (cluster ${clusterID}) Macro Synteny`,
    componentState: {
      inputs: {name, source, clusterID, options},
      outputs: _outputs,
    },
  };
}
