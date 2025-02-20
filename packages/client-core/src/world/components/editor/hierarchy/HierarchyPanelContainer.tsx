import React, { useContext, useState, useEffect, useCallback, memo, Fragment } from 'react'
import styled from 'styled-components'
import PropTypes from 'prop-types'
import DefaultNodeEditor from '../properties/DefaultNodeEditor'
import { ContextMenu, MenuItem, ContextMenuTrigger } from '../layout/ContextMenu'
import { cmdOrCtrlString } from '@xrengine/engine/src/editor/functions/utils'
import { EditorContext } from '../contexts/EditorContext'
import { useDrag, useDrop } from 'react-dnd'
import { getEmptyImage } from 'react-dnd-html5-backend'
import { FixedSizeList, areEqual } from 'react-window'
import AutoSizer from 'react-virtualized-auto-sizer'
import { ItemTypes, addAssetOnDrop, isAsset, AssetTypes } from '../dnd'
import traverseEarlyOut from '@xrengine/engine/src/editor/functions/traverseEarlyOut'
import { CaretRight } from '@styled-icons/fa-solid/CaretRight'
import { CaretDown } from '@styled-icons/fa-solid/CaretDown'
import useUpload from '../assets/useUpload'
import { AllFileTypes } from '../assets/fileTypes'
import NodeIssuesIcon from './NodeIssuesIcon'
import { useTranslation } from 'react-i18next'

/**
 * uploadOption initializing object containing Properties multiple, accepts.
 *
 * @author Robert Long
 * @type {Object}
 */

const uploadOptions = {
  multiple: true,
  accepts: AllFileTypes
}

/**
 * function provides node menu properties.
 *
 * @author Robert Long
 * @param  {object} node
 * @return {object}
 */
function collectNodeMenuProps({ node }) {
  return node
}

/**
 * PanelContainer used as wrapper element for   penal content.
 *
 * @author Robert Long
 * @type {Styled component}
 */
const PanelContainer = (styled as any).div`
  outline: none;
  user-select: none;
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  flex-direction: column;
  color: ${(props) => props.theme.text2};
`

/**
 * TreeDepthContainer used to provide the styles for hierarchy tree.
 *
 * @author Robert Long
 * @type {Styled component}
 */
const TreeDepthContainer = (styled as any).li``

/**
 * treeNodeBackgroundColor function used to provide background color for tree nodes.
 *
 * @author Robert Long
 * @param  {boolean} root
 * @param  {boolean} selected
 * @param  {boolean} active
 * @param  {object} theme
 * @return {string}
 */
function treeNodeBackgroundColor({ root, selected, active, theme }) {
  if (selected) {
    if (active) {
      return theme.bluePressed
    } else {
      return theme.selected
    }
  } else {
    if (root) {
      return theme.panel2
    } else {
      return theme.panel
    }
  }
}

/**
 * getNodeKey function used to get object id at given index.
 *
 * @author Robert Long
 * @param  {number} index [index of the node to get object id]
 * @param  {object} data
 * @return {string}
 */
function getNodeKey(index, data) {
  return data.nodes[index].object.id
}

/**
 * getNodeElId function provides id for node.
 *
 * @author Robert Long
 * @param  {object} node
 * @return {string}
 */
function getNodeElId(node) {
  return 'hierarchy-node-' + node.id
}

/**
 * TreeNodeContainer used to provide styles to node tree.
 *
 * @author Robert Long
 * @type {Styled component}
 */
const TreeNodeContainer = (styled as any).div`
  display: flex;
  flex-direction: column;
  outline: none;
  overflow: hidden;

  background-color: ${treeNodeBackgroundColor};
  border-bottom: ${(props) => (props.root ? props.theme.borderStyle : 'none')};

  color: ${(props) => (props.selected || props.focused ? props.theme.text : props.theme.text2)};

  :hover,
  :focus {
    background-color: ${(props) => (props.selected ? props.theme.blueHover : props.theme.hover)};
    color: ${(props) => props.theme.text};
  }

  :active {
    background-color: ${(props) => props.theme.bluePressed};
    color: ${(props) => props.theme.text};
  }
`

/**
 * TreeNodeSelectTarget used to provide styles for node inside hierarchy container.
 *
 * @author Robert Long
 * @type {Styled component}
 */
const TreeNodeSelectTarget = (styled as any).div`
  display: flex;
  flex: 1;
  padding: 2px 4px 2px 0;
`

/**
 * TreeNodeLabelContainer used to provide styles for label text on hierarchy node.
 *
 * @author Robert Long
 * @type {Styled component}
 */
const TreeNodeLabelContainer = (styled as any).div`
  display: flex;
  flex: 1;
`

/**
 * TreeNodeContent used to provide styles for container element of TreeNodeIcon TreeNodeLabel.
 *
 * @author Robert Long
 * @type {Styled Component}
 */
const TreeNodeContent = (styled as any).div`
  outline: none;
  display: flex;
  padding-right: 8px;
  padding-left: ${(props) => props.depth * 8 + 2 + 'px'};
`

/**
 * TreeNodeToggle creates element used to toggle node.
 *
 * @author Robert Long
 * @type {Styled component}
 */
const TreeNodeToggle = (styled as any).div`
  padding: 2px 4px;
  margin: 0 4px;

  :hover {
    color: ${(props) => props.theme.text};
    background-color: ${(props) => props.theme.hover2};
    border-radius: 3px;
  }
`

/**
 * TreeNodeLeafSpacer used to create space between leaf node.
 *
 * @author Robert Long
 * @type {Styled component}
 */
const TreeNodeLeafSpacer = (styled as any).div`
  width: 20px;
`

/**
 * TreeNodeIcon used provide style for icon inside tree node.
 *
 * @author Robert Long
 * @type {Styled component}
 */
const TreeNodeIcon = (styled as any).div`
  width: 12px;
  height: 12px;
  margin: 2px 4px;
`

/**
 * TreeNodeLabel used to provide styles for label content of tree node.
 *
 * @author Robert Long
 * @type {Styled component}
 */
const TreeNodeLabel = (styled as any).div`
  background-color: ${(props) => (props.isOver && props.canDrop ? 'rgba(255, 255, 255, 0.3)' : 'transparent')};
  color: ${(props) => (props.isOver && props.canDrop ? props.theme.text : 'inherit')};
  border-radius: 4px;
  padding: 0 2px;
`

/**
 * borderStyle function used to provide styles for border.
 *
 * @author Robert Long
 * @param  {Boolean} isOver
 * @param  {Boolean}  canDrop
 * @param  {string}  position
 * @return {string}
 */
function borderStyle({ isOver, canDrop, position }) {
  if (isOver && canDrop) {
    return `border-${position === 'before' ? 'top' : 'bottom'}: 2px solid rgba(255, 255, 255, 0.3)`
  } else {
    return ''
  }
}

/**
 * TreeNodeDropTarget used to provide styles to drop target node.
 *
 * @author Robert Long
 * @type {Styled component}
 */
const TreeNodeDropTarget = (styled as any).div`
  height: 4px;
  box-sizing: content-box;
  ${borderStyle};
  margin-left: ${(props) => (props.depth > 0 ? props.depth * 8 + 20 : 0)}px;
`

/**
 * TreeNodeRenameInput used to provides styles for rename input of node.
 *
 * @author Robert Long
 * @type {Styled Component}
 */
const TreeNodeRenameInput = (styled as any).input`
  position: absolute;
  top: -3px;
  background-color: ${(props) => props.theme.inputBackground};
  color: ${(props) => props.theme.text};
  border: ${(props) => props.theme.borderStyle};
  padding: 2px 4px;
`

/**
 * TreeNodeRenameInputContainer used to provide styles for rename input container of tree node.
 *
 * @author Robert Long
 * @type {Styled component}
 */
const TreeNodeRenameInputContainer = (styled as any).div`
  position: relative;
  height: 15px;
`

/**
 * isAncestor used to check if object contains leaf nodes or not.
 *
 * @author Robert Long
 * @param  {object}  object
 * @param  {object}  otherObject
 * @return {Boolean}
 */
function isAncestor(object, otherObject) {
  return !traverseEarlyOut(object, (child) => child !== otherObject)
}

/**
 * TreeNode function provides tree node hierarchy view.
 *
 * @author Robert Long
 * @param       {number} index
 * @param       {object} data
 * @param       {object} renamingNode
 * @param       {function} onToggle
 * @param       {function} onKeyDown
 * @param       {function} onMouseDown
 * @param       {function} onClick
 * @param       {function} onChangeName
 * @param       {function} onRenameSubmit
 * @param       {function} onUpload
 * @param       {object} style
 * @constructor
 */
function TreeNode({
  index,
  data: { nodes, renamingNode, onToggle, onKeyDown, onMouseDown, onClick, onChangeName, onRenameSubmit, onUpload },
  style
}) {
  //initializing node from nodes array at specific index
  const node = nodes[index]

  //initializing variables using node.
  const { isLeaf, object, depth, selected, active, iconComponent, isCollapsed, childIndex, lastChild } = node

  //initializing editor using EditorContext
  const editor = useContext(EditorContext)

  //callback function to handle click on node of hierarchy panel
  const onClickToggle = useCallback(
    (e) => {
      e.stopPropagation()

      if (onToggle) {
        onToggle(e, node)
      }
    },
    [onToggle, node]
  )

  //callback function used to handle KeyDown event on node
  const onNodeKeyDown = useCallback(
    (e) => {
      e.stopPropagation()

      if (onKeyDown) {
        onKeyDown(e, node)
      }
    },
    [onKeyDown, node]
  )

  /**
   * onKeyDownNameInput callback function to handle key down event on name input.
   *
   * @author Robert Long
   * @type {function}
   */
  const onKeyDownNameInput = useCallback(
    (e) => {
      if (e.key === 'Escape') {
        onRenameSubmit(node, null)
      } else if (e.key === 'Enter') {
        onRenameSubmit(node, e.target.value)
      }
    },
    [onRenameSubmit, node]
  )

  /**
   * onClickNode callback function used to hanlde click node inside hierarchy panel.
   *
   * @author Robert Long
   * @type {function}
   */
  const onClickNode = useCallback(
    (e) => {
      onClick(e, node)
    },
    [node, onClick]
  )

  /**
   * onMouseDownNode callback function used to handle mouse down event on node.
   *
   * @author Robert Long
   * @type {function}
   */
  const onMouseDownNode = useCallback(
    (e) => {
      onMouseDown(e, node)
    },
    [node, onMouseDown]
  )

  /**
   * onChangeNodeName callback function used to handle change in name of node.
   *
   * @author Robert Long
   * @type {function}
   */
  const onChangeNodeName = useCallback(
    (e) => {
      onChangeName(node, e.target.value)
    },
    [node, onChangeName]
  )

  /**
   * onSubmitNodeName callback function to handle submit or rename nade input.
   *
   * @author Robert Long
   * @type {function}
   */
  const onSubmitNodeName = useCallback(
    (e) => {
      onRenameSubmit(node, e.target.value)
    },
    [onRenameSubmit, node]
  )

  /**
   * initializing renaming setting renaming true if renamingNode id equals node id.
   *
   * @author Robert Long
   * @type {boolean}
   */
  const renaming = renamingNode && renamingNode.id === node.id

  //initializing _dragProps, drag, preview
  const [_dragProps, drag, preview] = useDrag({
    type: ItemTypes.Node,
    item() {
      const multiple = editor.selected.length > 1
      return { type: ItemTypes.Node, multiple, value: multiple ? editor.selected : editor.selected[0] }
    },
    canDrag() {
      return !editor.selected.some((selectedObj) => !selectedObj.parent)
    },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging()
    })
  })

  //calling preview function with change in property
  useEffect(() => {
    preview(getEmptyImage(), { captureDraggingState: true })
  }, [preview])

  //initializing canDropBefore and isOverBefore
  const [{ canDropBefore, isOverBefore }, beforeDropTarget] = useDrop({
    //initializing accept type with array containing node itemTypes, file ItemTypes and asset types
    accept: [ItemTypes.Node, ItemTypes.File, ...AssetTypes],

    //function used to drop items
    drop(item: any) {
      //check if item contain files
      if (item.files) {
        //uploading files then adding as media to the editor
        onUpload(item.files).then((assets) => {
          if (assets) {
            for (const asset of assets) {
              editor.addMedia(asset.url, object.parent, object)
            }
          }
        })
        return
      }

      //check if addAssetOnDrop returns true then return
      if (addAssetOnDrop(editor, item, object.parent, object)) {
        return
      } else {
        //check if items contain multiple then calling reparentMultiple else  call reparent of editor
        if (item.multiple) {
          editor.reparentMultiple(item.value, object.parent, object)
        } else {
          editor.reparent(item.value, object.parent, object)
        }
      }
    },
    canDrop(item, monitor) {
      //used to check item that item is dropable or not

      //check if monitor is over or object is not parent element
      if (!monitor.isOver() || !object.parent) {
        return false
      }

      //check item is asset
      if (isAsset(item)) {
        return true
      }

      //check if item type is equals to node
      if (item.type === ItemTypes.Node) {
        return (
          object.parent &&
          !(item.multiple
            ? item.value.some((otherObject) => isAncestor(otherObject, object))
            : isAncestor(item.value, object))
        )
      }

      return true
    },
    collect: (monitor) => ({
      canDropBefore: monitor.canDrop(),
      isOverBefore: monitor.isOver()
    })
  })

  /**
   * initializing variable using useDrop.
   *
   * @author Robert Long
   */
  const [{ canDropAfter, isOverAfter }, afterDropTarget] = useDrop({
    // initializing accept with array containing types
    accept: [ItemTypes.Node, ItemTypes.File, ...AssetTypes],
    drop(item: any) {
      // initializing next and is true if not last child and object parent contains children property and contain childIndex
      const next = !lastChild && object.parent.children[childIndex + 1]

      //check if item contains files
      if (item.files) {
        //uploading files then adding assets to editor media
        onUpload(item.files).then((assets) => {
          if (assets) {
            for (const asset of assets) {
              editor.addMedia(asset.url, object.parent, next)
            }
          }
        })
        return
      }

      if (addAssetOnDrop(editor, item, object.parent, next)) {
        return
      } else {
        if (item.multiple) {
          editor.reparentMultiple(item.value, object.parent, next)
        } else {
          editor.reparent(item.value, object.parent, next)
        }
      }
    },

    /**
     * canDrop used to check item is dropable or not.
     *
     * @author Robert Long
     * @param  {object} item
     * @param  {object} monitor
     * @return {boolean}
     */
    canDrop(item, monitor) {
      if (!monitor.isOver() || !object.parent) {
        return false
      }

      // check if item is asset
      if (isAsset(item)) {
        return true
      }

      //check if item is of node type
      if (item.type === ItemTypes.Node) {
        return (
          object.parent &&
          !(item.multiple
            ? item.value.some((otherObject) => isAncestor(otherObject, object))
            : isAncestor(item.value, object))
        )
      }

      return true
    },
    collect: (monitor) => ({
      canDropAfter: monitor.canDrop(),
      isOverAfter: monitor.isOver()
    })
  })

  const [{ canDropOn, isOverOn }, onDropTarget] = useDrop({
    //initializing accept with array containing types
    accept: [ItemTypes.Node, ItemTypes.File, ...AssetTypes],
    drop(item: any) {
      // check if item contain files
      if (item.files) {
        //uploading files then adding assets to editor media
        onUpload(item.files).then((assets) => {
          if (assets) {
            for (const asset of assets) {
              editor.addMedia(asset.url, object)
            }
          }
        })
        return
      }

      if (addAssetOnDrop(editor, item, object)) {
        return
      } else {
        // check if item contains multiple
        if (item.multiple) {
          editor.reparentMultiple(item.value, object)
        } else {
          editor.reparent(item.value, object)
        }
      }
    },
    canDrop(item, monitor) {
      // check if monitor is not over
      if (!monitor.isOver()) {
        return false
      }

      //check item is asset
      if (isAsset(item)) {
        return true
      }

      // check if item is of node type
      if (item.type === ItemTypes.Node) {
        return !(item.multiple
          ? item.value.some((otherObject) => isAncestor(otherObject, object))
          : isAncestor(item.value, object))
      }

      return true
    },
    collect: (monitor) => ({
      canDropOn: monitor.canDrop(),
      isOverOn: monitor.isOver()
    })
  })

  //returning tree view for hierarchy panel
  return (
    <TreeDepthContainer style={style}>
      {/* @ts-ignore */}
      <ContextMenuTrigger holdToDisplay={-1} id="hierarchy-node-menu" node={node} collect={collectNodeMenuProps}>
        <TreeNodeContainer
          ref={drag}
          id={getNodeElId(node)}
          onMouseDown={onMouseDownNode}
          onClick={onClickNode}
          tabIndex="0"
          onKeyDown={onNodeKeyDown}
          root={depth === 0}
          selected={selected}
          active={active}
        >
          <TreeNodeDropTarget
            ref={beforeDropTarget}
            depth={depth}
            position="before"
            canDrop={canDropBefore}
            isOver={isOverBefore}
          />
          <TreeNodeContent depth={depth} ref={onDropTarget}>
            {isLeaf ? (
              <TreeNodeLeafSpacer />
            ) : (
              <TreeNodeToggle collapsed={isCollapsed} onClick={onClickToggle}>
                {isCollapsed ? <CaretRight size={12} /> : <CaretDown size={12} />}
              </TreeNodeToggle>
            )}

            <TreeNodeSelectTarget>
              <TreeNodeIcon as={iconComponent} />
              <TreeNodeLabelContainer>
                {renaming ? (
                  <TreeNodeRenameInputContainer>
                    <TreeNodeRenameInput
                      type="text"
                      onChange={onChangeNodeName}
                      onKeyDown={onKeyDownNameInput}
                      onBlur={onSubmitNodeName}
                      value={renamingNode.name}
                      autoFocus
                    />
                  </TreeNodeRenameInputContainer>
                ) : (
                  <TreeNodeLabel canDrop={canDropOn} isOver={isOverOn}>
                    {object.name}
                  </TreeNodeLabel>
                )}
              </TreeNodeLabelContainer>
              {node.object.issues.length > 0 && <NodeIssuesIcon node={node.object} />}
            </TreeNodeSelectTarget>
          </TreeNodeContent>

          <TreeNodeDropTarget
            depth={depth}
            ref={afterDropTarget}
            position="after"
            canDrop={canDropAfter}
            isOver={isOverAfter}
          />
        </TreeNodeContainer>
      </ContextMenuTrigger>
    </TreeDepthContainer>
  )
}

/**
 * [declairing propTypes for TreeNode]
 * @type {Object}
 */
TreeNode.propTypes = {
  data: PropTypes.shape({
    nodes: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.any.isRequired,
        object: PropTypes.object.isRequired,
        isLeaf: PropTypes.bool,
        depth: PropTypes.number,
        selected: PropTypes.bool,
        active: PropTypes.bool,
        iconComponent: PropTypes.object,
        isCollapsed: PropTypes.bool,
        childIndex: PropTypes.number.isRequired,
        lastChild: PropTypes.bool.isRequired
      })
    ),
    renamingNode: PropTypes.object,
    onRenameSubmit: PropTypes.func.isRequired,
    onChangeName: PropTypes.func.isRequired,
    onMouseDown: PropTypes.func.isRequired,
    onClick: PropTypes.func.isRequired,
    onToggle: PropTypes.func.isRequired,
    onKeyDown: PropTypes.func.isRequired,
    onUpload: PropTypes.func.isRequired
  }),
  index: PropTypes.number,
  style: PropTypes.object.isRequired,
  isScrolling: PropTypes.bool
}

/**
 * initializing MemoTreeNode.
 *
 * @author Robert Long
 */
const MemoTreeNode = memo(TreeNode, areEqual)

/**
 * treeWalker function used to handle tree.
 *
 * @author Robert Long
 * @param  {object}    editor
 * @param  {object}    collapsedNodes
 */
function* treeWalker(editor, collapsedNodes) {
  const stack = []

  stack.push({
    depth: 0,
    object: editor.scene,
    childIndex: 0,
    lastChild: true
  })

  while (stack.length !== 0) {
    const { depth, object, childIndex, lastChild } = stack.pop()

    const NodeEditor = editor.getNodeEditor(object) || DefaultNodeEditor
    const iconComponent = NodeEditor.WrappedComponent
      ? NodeEditor.WrappedComponent.iconComponent
      : NodeEditor.iconComponent

    const isCollapsed = collapsedNodes[object.id]

    yield {
      id: object.id,
      isLeaf: object.children.filter((c) => c.isNode).length === 0,
      isCollapsed,
      depth,
      object,
      iconComponent,
      selected: editor.selected.indexOf(object) !== -1,
      active: editor.selected.length > 0 && object === editor.selected[editor.selected.length - 1],
      childIndex,
      lastChild
    }

    if (object.children.length !== 0 && !isCollapsed) {
      for (let i = object.children.length - 1; i >= 0; i--) {
        const child = object.children[i]

        if (child.isNode) {
          stack.push({
            depth: depth + 1,
            object: child,
            childIndex: i,
            lastChild: i === 0
          })
        }
      }
    }
  }
}

/**
 * HierarchyPanel function component provides view for hierarchy tree.
 *
 * @author Robert Long
 * @constructor
 */
export default function HierarchyPanel() {
  const editor = useContext(EditorContext)
  const onUpload = useUpload(uploadOptions)
  const [renamingNode, setRenamingNode] = useState(null)
  const [collapsedNodes, setCollapsedNodes] = useState({})
  const [nodes, setNodes] = useState([])
  const updateNodeHierarchy = useCallback(() => {
    setNodes(Array.from(treeWalker(editor, collapsedNodes)))
  }, [editor, collapsedNodes])
  const { t } = useTranslation()

  /**
   * expandNode callback function used to expand node.
   *
   * @author Robert Long
   * @type {function}
   */
  const expandNode = useCallback(
    (node) => {
      delete collapsedNodes[node.id]
      setCollapsedNodes({ ...collapsedNodes })
    },
    [collapsedNodes]
  )

  /**
   * collapseNode function used to collapse node.
   *
   * @author Robert Long
   * @type {function}
   */
  const collapseNode = useCallback(
    (node) => {
      setCollapsedNodes({ ...collapsedNodes, [node.id]: true })
    },
    [setCollapsedNodes, collapsedNodes]
  )

  /**
   * expandChildren function used to expand children.
   *
   * @author Robert Long
   * @type {function}
   */
  const expandChildren = useCallback(
    (node) => {
      node.object.traverse((child) => {
        if (child.isNode) {
          delete collapsedNodes[child.id]
        }
      })
      setCollapsedNodes({ ...collapsedNodes })
    },
    [setCollapsedNodes, collapsedNodes]
  )

  /**
   * collapseChildren function used to collapse children.
   *
   * @author Robert Long
   * @type {function}
   */
  const collapseChildren = useCallback(
    (node) => {
      node.object.traverse((child) => {
        if (child.isNode) {
          collapsedNodes[child.id] = true
        }
      })
      setCollapsedNodes({ ...collapsedNodes })
    },
    [setCollapsedNodes, collapsedNodes]
  )

  /**
   * function used to expand all node.
   *
   * @author Robert Long
   * @type {function}
   */
  const onExpandAllNodes = useCallback(() => {
    setCollapsedNodes({})
  }, [setCollapsedNodes])

  /**
   * function used to collapse all nodes.
   *
   * @author Robert Long
   * @type {function}
   */
  const onCollapseAllNodes = useCallback(() => {
    const newCollapsedNodes = {}
    editor.scene.traverse((child) => {
      if (child.isNode) {
        newCollapsedNodes[child.id] = true
      }
    })
    setCollapsedNodes(newCollapsedNodes)
  }, [editor, setCollapsedNodes])

  /**
   * onObjectChanged callback function used to handle changes on object.
   *
   * @author Robert Long
   * @type {function}
   */
  const onObjectChanged = useCallback(
    (objects, propertyName) => {
      if (propertyName === 'name' || !propertyName) {
        updateNodeHierarchy()
      }
    },
    [updateNodeHierarchy]
  )

  useEffect(() => {
    editor.addListener('sceneGraphChanged', updateNodeHierarchy)
    editor.addListener('selectionChanged', updateNodeHierarchy)
    editor.addListener('objectsChanged', onObjectChanged)

    return () => {
      editor.removeListener('sceneGraphChanged', updateNodeHierarchy)
      editor.removeListener('selectionChanged', updateNodeHierarchy)
      editor.removeListener('objectsChanged', onObjectChanged)
    }
  }, [editor, updateNodeHierarchy, onObjectChanged])

  /**
   * onMouseDown callback function used to handle mouse down event.
   *
   * @author Robert Long
   * @type {function}
   */
  const onMouseDown = useCallback(
    (e, node) => {
      if (e.detail === 1) {
        if (e.shiftKey) {
          editor.toggleSelection(node.object)
        } else if (!node.selected) {
          editor.setSelection([node.object])
        }
      }
    },
    [editor]
  )

  /**
   * onClick callback function for handling onClick event on hierarchy penal item.
   *
   * @author Robert Long
   * @type {function}
   */
  const onClick = useCallback(
    (e, node) => {
      if (e.detail === 2) {
        editor.editorControls.focus([node.object])
      } else if (!e.shiftKey) {
        editor.setSelection([node.object])
      }
    },
    [editor]
  )

  /**
   * onToggle function used to handle toggle on hierarchy penal item.
   *
   * @author Robert Long
   * @type {function}
   */
  const onToggle = useCallback(
    (_e, node) => {
      if (collapsedNodes[node.id]) {
        expandNode(node)
      } else {
        collapseNode(node)
      }
    },
    [collapsedNodes, expandNode, collapseNode]
  )

  /**
   * onKeyDown callback function to handle onKeyDown event on hierarchy penal item.
   *
   * @author Robert Long
   * @type {function}
   */
  const onKeyDown = useCallback(
    (e, node) => {
      // check if key equals to ArrowDown
      if (e.key === 'ArrowDown') {
        e.preventDefault()

        // initializing nodeIndex using nodes array
        const nodeIndex = nodes.indexOf(node)

        // initializing nextNode using nodes array
        const nextNode = nodeIndex !== -1 && nodes[nodeIndex + 1]

        // check if nextNode is not Empty
        if (nextNode) {
          if (e.shiftKey) {
            editor.select(nextNode.object)
          }
          // initializing nextNodeEl using nextNode element id
          const nextNodeEl = document.getElementById(getNodeElId(nextNode))

          //check if nextNodeEl is not empty
          if (nextNodeEl) {
            nextNodeEl.focus()
          }
        }

        //check if pressed key equals to ArrowUp
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()

        // initializing nodeIndex  using nodes array
        const nodeIndex = nodes.indexOf(node)

        // initializing prevNode using nodes array current nodeIndex -1
        const prevNode = nodeIndex !== -1 && nodes[nodeIndex - 1]

        // if prevNode is not empty
        if (prevNode) {
          if (e.shiftKey) {
            editor.select(prevNode.object)
          }

          // initializing prevNodeEl using prevNode Id
          const prevNodeEl = document.getElementById(getNodeElId(prevNode))

          //check if prevNodeEl is not empty
          if (prevNodeEl) {
            prevNodeEl.focus()
          }
        }
        // check if pressed key equals to left arrow and node object children node length is greator then 0
      } else if (e.key === 'ArrowLeft' && node.object.children.filter((o) => o.isNode).length > 0) {
        if (e.shiftKey) {
          collapseChildren(node)
        } else {
          collapseNode(node)
        }

        //check if pressed key equals to arrow right
        //and node property object children node length ius greator then zero.
      } else if (e.key === 'ArrowRight' && node.object.children.filter((o) => o.isNode).length > 0) {
        if (e.shiftKey) {
          expandChildren(node)
        } else if (node.object.children.filter((o) => o.isNode).length > 0) {
          expandNode(node)
        }

        //check if pressed key equals to enter
      } else if (e.key === 'Enter') {
        if (e.shiftKey) {
          editor.toggleSelection(node.object)
        } else {
          editor.setSelection([node.object])
        }
      }
    },
    [nodes, editor, expandNode, collapseNode, expandChildren, collapseChildren]
  )

  /**
   * onDeleteNode callback function used to handle delete on node.
   *
   * @author Robert Long
   * @type {function}
   */
  const onDeleteNode = useCallback(
    (e, node) => {
      if (node.selected) {
        editor.removeSelectedObjects()
      } else {
        editor.removeObject(node.object)
      }
    },
    [editor]
  )

  /**
   * onDuplicateNode callback function to handle Duplication of node.
   *
   * @author Robert Long
   * @type {function}
   */
  const onDuplicateNode = useCallback(
    (e, node) => {
      if (node.selected) {
        editor.duplicateSelected()
      } else {
        editor.duplicate(node.object)
      }
    },
    [editor]
  )

  /**
   * onGroupNodes callback function used to handle grouping of nodes.
   *
   * @author Robert Long
   * @type {function}
   */
  const onGroupNodes = useCallback(
    (e, node) => {
      if (node.selected) {
        editor.groupSelected()
      } else {
        editor.groupMultiple([node.object])
      }
    },
    [editor]
  )

  /**
   * onRenameNode callback function to handle rename node.
   *
   * @author Robert Long
   * @type {function}
   */
  const onRenameNode = useCallback(
    (e, node) => {
      setRenamingNode({ id: node.id, name: node.object.name })
    },
    [setRenamingNode]
  )

  /**
   * onChangeName callback  function used to handle changes in name.
   *
   * @author Robert Long
   * @type {function}
   */
  const onChangeName = useCallback(
    (node, name) => {
      setRenamingNode({ id: node.id, name })
    },
    [setRenamingNode]
  )

  /**
   * onRenameSubmit callback function used to handle rename input submit.
   *
   * @author Robert Long
   * @type {function}
   */
  const onRenameSubmit = useCallback(
    (node, name) => {
      if (name !== null) {
        editor.setProperty(node.object, 'name', name)
      }
      setRenamingNode(null)
    },
    [editor]
  )

  /**
   * initializing treeContainerDropTarget.
   *
   * @author Robert Long
   * @type {Array}
   */
  const [, treeContainerDropTarget] = useDrop({
    // initializing accept using array of  types
    accept: [ItemTypes.Node, ItemTypes.File, ...AssetTypes],
    drop(item: any, monitor) {
      if (monitor.didDrop()) {
        return
      }

      // check if item contains files
      if (item.files) {
        //uploading files then adding to editor media
        onUpload(item.files).then((assets) => {
          if (assets) {
            for (const asset of assets) {
              editor.addMedia(asset.url)
            }
          }
        })
        return
      }

      if (addAssetOnDrop(editor, item)) {
        return
      }

      // check if item contains multiple
      if (item.multiple) {
        editor.reparentMultiple(item.value, editor.scene)
      } else {
        editor.reparent(item.value, editor.scene)
      }
    },
    canDrop(item, monitor) {
      if (!monitor.isOver({ shallow: true })) {
        return false
      }
      // check if item is asset
      if (isAsset(item)) {
        return true
      }
      // check if item is of node type
      if (item.type === ItemTypes.Node) {
        return !(item.multiple
          ? item.value.some((otherObject) => isAncestor(otherObject, editor.scene))
          : isAncestor(item.value, editor.scene))
      }

      return true
    }
  })

  useEffect(() => {
    updateNodeHierarchy()
  }, [collapsedNodes, updateNodeHierarchy])

  //returning hierarchy penal view
  return (
    /* @ts-ignore */
    <Fragment>
      <PanelContainer>
        {editor.scene && (
          <AutoSizer>
            {({ height, width }) => (
              <FixedSizeList
                height={height}
                width={width}
                itemSize={32}
                itemCount={nodes.length}
                itemData={{
                  renamingNode,
                  nodes,
                  onKeyDown,
                  onChangeName,
                  onRenameSubmit,
                  onMouseDown,
                  onClick,
                  onToggle,
                  onUpload
                }}
                itemKey={getNodeKey}
                outerRef={treeContainerDropTarget}
                innerElementType="ul"
              >
                {MemoTreeNode}
              </FixedSizeList>
            )}
          </AutoSizer>
        )}
      </PanelContainer>
      {/* @ts-ignore */}
      <ContextMenu id="hierarchy-node-menu">
        <MenuItem onClick={onRenameNode}>{t('editor:hierarchy.lbl-rename')}</MenuItem>
        <MenuItem onClick={onDuplicateNode}>
          {t('editor:hierarchy.lbl-duplicate')}
          <div>{cmdOrCtrlString + '+ D'}</div>
        </MenuItem>
        <MenuItem onClick={onGroupNodes}>
          {t('editor:hierarchy.lbl-group')}
          <div>{cmdOrCtrlString + '+ G'}</div>
        </MenuItem>
        <MenuItem onClick={onDeleteNode}>{t('editor:hierarchy.lbl-delete')}</MenuItem>
        <MenuItem onClick={onExpandAllNodes}>{t('editor:hierarchy.lbl-expandAll')}</MenuItem>
        <MenuItem onClick={onCollapseAllNodes}>{t('editor:hierarchy.lbl-collapseAll')}</MenuItem>
      </ContextMenu>
    </Fragment>
  )
}
