type StageNode = {
    id: string
    title: string
    parentId: string | null
    children: StageNode[]
  }
  
  export default function StageTree({
    stage,
    onDelete,
    onAddChild
  }: {
    stage: StageNode
    onDelete: (id: string) => void
    onAddChild: (parentId: string) => void
  }) {
    return (
      <div className="ml-4 border-l pl-4 mt-2">
        <div className="flex gap-2 items-center">
          <span>{stage.title}</span>
  
          <button
            className="text-red-500"
            onClick={() => onDelete(stage.id)}
          >
            delete
          </button>
  
          <button
            className="text-blue-500"
            onClick={() => onAddChild(stage.id)}
          >
            add child
          </button>
        </div>
  
        {stage.children.map(child => (
          <StageTree
            key={child.id}
            stage={child}
            onDelete={onDelete}
            onAddChild={onAddChild}
          />
        ))}
      </div>
    )
  }