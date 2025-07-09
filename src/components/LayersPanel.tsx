import { useEffect, useState } from 'react'
import { Canvas, FabricObject } from 'fabric'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import {
  Layers,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown,
  Square,
  Circle,
  Type,
  Image,
  Pen,
} from 'lucide-react'

interface LayersPanelProps {
  canvas: Canvas | null
  selectedObject: FabricObject | null
}

interface Layer {
  id: string
  object: FabricObject
  type: string
  name: string
  visible: boolean
  locked: boolean
}

export default function LayersPanel({ canvas, selectedObject }: LayersPanelProps) {
  const [layers, setLayers] = useState<Layer[]>([])

  useEffect(() => {
    if (!canvas) return

    const updateLayers = () => {
      const objects = canvas.getObjects()
      const newLayers = objects.map((obj, index) => ({
        id: obj.get('id') as string || `layer-${index}`,
        object: obj,
        type: obj.type || 'object',
        name: obj.get('name') as string || getObjectName(obj),
        visible: obj.visible !== false,
        locked: obj.lockMovementX === true,
      }))
      setLayers(newLayers.reverse()) // Show newest on top
    }

    updateLayers()

    // Listen to canvas events
    canvas.on('object:added', updateLayers)
    canvas.on('object:removed', updateLayers)
    canvas.on('object:modified', updateLayers)

    return () => {
      canvas.off('object:added', updateLayers)
      canvas.off('object:removed', updateLayers)
      canvas.off('object:modified', updateLayers)
    }
  }, [canvas])

  const getObjectName = (obj: fabric.Object): string => {
    switch (obj.type) {
      case 'rect': return 'Rectangle'
      case 'circle': return 'Circle'
      case 'triangle': return 'Triangle'
      case 'polygon': return 'Polygon'
      case 'path': return 'Path'
      case 'i-text':
      case 'text': return 'Text'
      case 'image': return 'Image'
      case 'group': return 'Group'
      default: return 'Object'
    }
  }

  const getObjectIcon = (type: string) => {
    switch (type) {
      case 'rect': return Square
      case 'circle': return Circle
      case 'triangle': return Square
      case 'polygon': return Square
      case 'path': return Pen
      case 'i-text':
      case 'text': return Type
      case 'image': return Image
      default: return Square
    }
  }

  const handleToggleVisibility = (layer: Layer) => {
    layer.object.set('visible', !layer.visible)
    canvas?.renderAll()
  }

  const handleToggleLock = (layer: Layer) => {
    const locked = !layer.locked
    layer.object.set({
      lockMovementX: locked,
      lockMovementY: locked,
      lockRotation: locked,
      lockScalingX: locked,
      lockScalingY: locked,
      selectable: !locked,
    })
    canvas?.renderAll()
  }

  const handleSelectLayer = (layer: Layer) => {
    if (!layer.locked && canvas) {
      canvas.setActiveObject(layer.object)
      canvas.renderAll()
    }
  }

  const handleDeleteLayer = (layer: Layer) => {
    if (canvas && !layer.locked) {
      canvas.remove(layer.object)
      canvas.renderAll()
    }
  }

  const handleDuplicateLayer = (layer: Layer) => {
    if (!canvas) return

    layer.object.clone((cloned: fabric.Object) => {
      cloned.set({
        left: (cloned.left || 0) + 10,
        top: (cloned.top || 0) + 10,
      })
      canvas.add(cloned)
      canvas.setActiveObject(cloned)
      canvas.renderAll()
    })
  }

  const handleLayerReorder = (result: any) => {
    if (!result.destination || !canvas) return

    const items = Array.from(layers)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    // Update canvas object order
    const objects = items.map(layer => layer.object).reverse()
    canvas._objects = objects
    canvas.renderAll()

    setLayers(items)
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold flex items-center space-x-2">
          <Layers size={16} />
          <span>Layers</span>
          <span className="text-sm text-text-secondary">({layers.length})</span>
        </h3>
      </div>

      <DragDropContext onDragEnd={handleLayerReorder}>
        <Droppable droppableId="layers">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="flex-1 overflow-y-auto"
            >
              {layers.length === 0 ? (
                <div className="p-4 text-center text-text-secondary">
                  <p className="text-sm">No layers yet</p>
                  <p className="text-xs mt-2">Add objects to see them here</p>
                </div>
              ) : (
                layers.map((layer, index) => {
                  const Icon = getObjectIcon(layer.type)
                  const isSelected = selectedObject === layer.object

                  return (
                    <Draggable
                      key={layer.id}
                      draggableId={layer.id}
                      index={index}
                      isDragDisabled={layer.locked}
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`
                            group px-3 py-2 border-b border-border cursor-pointer
                            transition-all hover:bg-background
                            ${isSelected ? 'bg-primary/10 border-l-2 border-l-primary' : ''}
                            ${snapshot.isDragging ? 'shadow-lg bg-surface' : ''}
                          `}
                          onClick={() => handleSelectLayer(layer)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2 flex-1 min-w-0">
                              <Icon size={14} className="flex-shrink-0" />
                              <span className="text-sm truncate">{layer.name}</span>
                            </div>

                            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleToggleVisibility(layer)
                                }}
                                className="p-1 hover:bg-background rounded"
                                title={layer.visible ? 'Hide' : 'Show'}
                              >
                                {layer.visible ? (
                                  <Eye size={14} />
                                ) : (
                                  <EyeOff size={14} className="text-text-secondary" />
                                )}
                              </button>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleToggleLock(layer)
                                }}
                                className="p-1 hover:bg-background rounded"
                                title={layer.locked ? 'Unlock' : 'Lock'}
                              >
                                {layer.locked ? (
                                  <Lock size={14} className="text-warning" />
                                ) : (
                                  <Unlock size={14} />
                                )}
                              </button>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDuplicateLayer(layer)
                                }}
                                className="p-1 hover:bg-background rounded"
                                title="Duplicate"
                                disabled={layer.locked}
                              >
                                <Copy size={14} />
                              </button>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeleteLayer(layer)
                                }}
                                className="p-1 hover:bg-background rounded text-error"
                                title="Delete"
                                disabled={layer.locked}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  )
                })
              )}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {/* Layer Actions */}
      {selectedObject && (
        <div className="p-3 border-t border-border flex items-center justify-around">
          <button
            onClick={() => {
              if (canvas) {
                canvas.bringToFront(selectedObject)
                canvas.renderAll()
              }
            }}
            className="p-2 hover:bg-background rounded transition-colors"
            title="Bring to Front"
          >
            <ChevronUp size={16} />
          </button>
          <button
            onClick={() => {
              if (canvas) {
                canvas.sendToBack(selectedObject)
                canvas.renderAll()
              }
            }}
            className="p-2 hover:bg-background rounded transition-colors"
            title="Send to Back"
          >
            <ChevronDown size={16} />
          </button>
        </div>
      )}
    </div>
  )
}