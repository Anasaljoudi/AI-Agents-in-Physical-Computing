export function ComponentLibrary({
  catalog,
  components,
  onAdd,
  onRemove
}) {
  return (
    <div className="component-layout">
      <div className="component-grid">
        {catalog.map((item) => {
          const selectedComponent = components.find(
            (component) => component.type === item.type
          );

          const isSelected = Boolean(selectedComponent);

          function handleClick() {
            if (isSelected) {
              onRemove(selectedComponent.id);
            } else {
              onAdd(item);
            }
          }

          return (
            <button
              key={item.type}
              className={`component-tile ${
                isSelected ? "selected" : ""
              }`}
              onClick={handleClick}
            >
              <strong>{item.label}</strong>
            </button>
          );
        })}
      </div>
    </div>
  );
}