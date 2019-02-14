export class Family {
  id: string;
  name: string;
}


export function isFamily(instance: any): instance is Family {
  const family = <Family>instance;
  return family !== null &&
         typeof family.id === "string" &&
         typeof family.name === "string";
}
