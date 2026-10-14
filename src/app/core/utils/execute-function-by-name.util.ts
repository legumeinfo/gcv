// general support for namespace function strings
export function executeFunctionByName(functionName, context, ...args): any {
  const namespaces = functionName.split('.');
  const func = namespaces.pop();
  for (const space of namespaces) {
    context = context[space];
  }
  return context[func](...args);
}
