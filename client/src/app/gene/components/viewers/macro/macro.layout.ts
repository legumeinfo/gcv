import { MacroComponent } from './macro.component';


export const macroLayoutComponent = {component: MacroComponent, name: 'macro'};


export function macroConfigFactory(name: string, source: string, outputs: any={})
{
  const id = `macro:${name}:${source}`;
  const options = {autoResize: true};
  let _outputs = {};
  _outputs = Object.assign(_outputs, outputs);
  return  {
    type: 'component',
    componentName: 'macro',
    id: id,
    title: `${name} (${source}) Macro Synteny`,
    componentState: {
      inputs: {name, source, options},
      outputs: _outputs,
    },
  };
}
