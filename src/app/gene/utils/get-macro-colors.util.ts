import { AppConfig } from '@gcv/app.config';
import { Track } from '@gcv/gene/models';


export function getMacroColors(chromosomes: Track[]): any {
  if (chromosomes.length == 0) {
    return undefined;
  }
  const s: any = AppConfig.getServer(chromosomes[0].source);
  if (s !== undefined && s.macroColors !== undefined) {
    return s.macroColors.function;
  }
  return undefined;
}
