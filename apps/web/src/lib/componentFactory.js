function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export function createComponentInstance(definition) {
  return {
    id: uid(),
    type: definition.type,
    label: definition.label,
    description: definition.description,
    config: { ...definition.defaults }
  };
}
