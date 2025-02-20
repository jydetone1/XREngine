import React, { Component } from 'react'
import NodeEditor from './NodeEditor'
import InputGroup from '../inputs/InputGroup'
import BooleanInput from '../inputs/BooleanInput'
import NumericInputGroup from '../inputs/NumericInputGroup'
import { PropertiesPanelButton } from '../inputs/Button'
import { ProgressDialog } from '../dialogs/ProgressDialog'
import ErrorDialog from '../dialogs/ErrorDialog'
import { withDialog } from '../contexts/DialogContext'
import { withSettings } from '../contexts/SettingsContext'
import { ShoePrints } from '@styled-icons/fa-solid/ShoePrints'
import FloorPlanNode from '@xrengine/engine/src/editor/nodes/FloorPlanNode'
import i18n from 'i18next'
import { withTranslation } from 'react-i18next'
import { Config } from '../../../../helper'

/**
 * Defining properties for FloorPlanNodeEditor.
 *
 * @author Robert Long
 * @type {Object}
 */
type FloorPlanNodeEditorProps = {
  hideDialog: (...args: any[]) => any
  showDialog: (...args: any[]) => any
  editor?: object
  settings: object
  node?: FloorPlanNode
  t: Function
}

/**
 * FloorPlanNodeEditor class component used to render view to customize properties of floor plan element.
 *
 * @author Robert Long
 * @extends Component
 */
class FloorPlanNodeEditor extends Component<FloorPlanNodeEditorProps, {}> {
  //initializing floorPlanNode properties
  constructor(props) {
    super(props)
    const createPropSetter = (propName) => (value) => (this.props.editor as any).setPropertySelected(propName, value)
    this.onChangeAutoCellSize = createPropSetter('autoCellSize')
    this.onChangeCellSize = createPropSetter('cellSize')
    this.onChangeCellHeight = createPropSetter('cellHeight')
    this.onChangeAgentHeight = createPropSetter('agentHeight')
    this.onChangeAgentRadius = createPropSetter('agentRadius')
    this.onChangeAgentMaxClimb = createPropSetter('agentMaxClimb')
    this.onChangeAgentMaxSlope = createPropSetter('agentMaxSlope')
    this.onChangeRegionMinSize = createPropSetter('regionMinSize')
    this.onChangeMaxTriangles = createPropSetter('maxTriangles')
    this.onChangeForceTrimesh = createPropSetter('forceTrimesh')
  }

  // setting icon component
  static iconComponent = ShoePrints

  // setting description and will appears in the property Container
  static description = i18n.t('editor:properties.floorPlan.description')

  // Declairing floorPlanNode Properties
  onChangeAutoCellSize: (value: any) => any
  onChangeCellSize: (value: any) => any
  onChangeCellHeight: (value: any) => any
  onChangeAgentHeight: (value: any) => any
  onChangeAgentRadius: (value: any) => any
  onChangeAgentMaxClimb: (value: any) => any
  onChangeAgentMaxSlope: (value: any) => any
  onChangeRegionMinSize: (value: any) => any
  onChangeMaxTriangles: (value: any) => any
  onChangeForceTrimesh: (value: any) => any

  // function to Regenerate floorPlanNode
  onRegenerate = async () => {
    const abortController = new AbortController()

    // showing message dialog
    this.props.showDialog(ProgressDialog, {
      title: this.props.t('editor:properties.floorPlan.generatePlan'),
      message: this.props.t('editor:properties.floorPlan.generatePlanMsg'),
      cancelable: true,
      onCancel: () => abortController.abort()
    })

    // generating floorPlanNode
    try {
      await this.props.node?.generate(abortController.signal, Config.publicRuntimeConfig.wasmUrl)
      this.props.hideDialog()
    } catch (error) {
      if (error['aborted']) {
        this.props.hideDialog()
        return
      }
      console.error(error)

      //showing error dialog if there is an error
      this.props.showDialog(ErrorDialog, {
        title: this.props.t('editor:properties.floorPlan.generatePlanError'),
        message: error.message || this.props.t('editor:properties.floorPlan.generatePlanErrorMsg'),
        error
      })
    }
  }

  //rendering floorPlanNode view
  render() {
    FloorPlanNodeEditor.description = this.props.t('editor:properties.floorPlan.description')
    const { node, settings } = this.props as any
    return (
      /* @ts-ignore */
      <NodeEditor {...this.props} description={FloorPlanNodeEditor.description}>
        {/* @ts-ignore */}
        <InputGroup name="Auto Cell Size" label={this.props.t('editor:properties.floorPlan.lbl-autoCellSize')}>
          <BooleanInput value={node.autoCellSize} onChange={this.onChangeAutoCellSize} />
        </InputGroup>
        {!node.autoCellSize && (
          /* @ts-ignore */
          <NumericInputGroup
            name="Cell Size"
            label={this.props.t('editor:properties.floorPlan.lbl-cellSize')}
            value={node.cellSize}
            smallStep={0.001}
            mediumStep={0.01}
            largeStep={0.1}
            min={0.1}
            displayPrecision={0.0001}
            onChange={this.onChangeCellSize}
          />
        )}
        {/* @ts-ignore */}
        <NumericInputGroup
          name="Cell Height"
          label={this.props.t('editor:properties.floorPlan.lbl-cellHeight')}
          value={node.cellHeight}
          smallStep={0.001}
          mediumStep={0.01}
          largeStep={0.1}
          min={0.1}
          onChange={this.onChangeCellHeight}
          unit="m"
        />
        {/* @ts-ignore */}
        <NumericInputGroup
          name="Agent Height"
          label={this.props.t('editor:properties.floorPlan.lbl-agentHeight')}
          value={node.agentHeight}
          smallStep={0.001}
          mediumStep={0.01}
          largeStep={0.1}
          min={0.1}
          onChange={this.onChangeAgentHeight}
          unit="m"
        />
        {/* @ts-ignore */}
        <NumericInputGroup
          name="Agent Radius"
          label={this.props.t('editor:properties.floorPlan.lbl-agentRadius')}
          value={node.agentRadius}
          min={0}
          smallStep={0.001}
          mediumStep={0.01}
          largeStep={0.1}
          onChange={this.onChangeAgentRadius}
          unit="m"
        />
        {/* @ts-ignore */}
        <NumericInputGroup
          name="Maximum Step Height"
          label={this.props.t('editor:properties.floorPlan.lbl-maxStepHeight')}
          value={node.agentMaxClimb}
          min={0}
          smallStep={0.001}
          mediumStep={0.01}
          largeStep={0.1}
          onChange={this.onChangeAgentMaxClimb}
          unit="m"
        />
        {/* @ts-ignore */}
        <NumericInputGroup
          name="Maximum Slope"
          label={this.props.t('editor:properties.floorPlan.lbl-maxSlope')}
          value={node.agentMaxSlope}
          min={0.00001}
          max={90}
          smallStep={1}
          mediumStep={5}
          largeStep={15}
          onChange={this.onChangeAgentMaxSlope}
          unit="°"
        />
        {/* @ts-ignore */}
        <NumericInputGroup
          name="Minimum Region Area"
          label={this.props.t('editor:properties.floorPlan.lbl-minRegionArea')}
          value={node.regionMinSize}
          min={0.1}
          smallStep={0.1}
          mediumStep={1}
          largeStep={10}
          onChange={this.onChangeRegionMinSize}
          unit="m²"
        />
        {/* @ts-ignore */}
        <InputGroup name="Force Trimesh" label={this.props.t('editor:properties.floorPlan.lbl-forceTrimesh')}>
          <BooleanInput value={node.forceTrimesh} onChange={this.onChangeForceTrimesh} />
        </InputGroup>
        {!node.forceTrimesh && (
          /* @ts-ignore */
          <NumericInputGroup
            name="Collision Geo Triangle Threshold"
            label={this.props.t('editor:properties.floorPlan.lbl-collisionThreshold')}
            value={node.maxTriangles}
            min={10}
            max={10000}
            smallStep={1}
            mediumStep={100}
            largeStep={1000}
            precision={1}
            onChange={this.onChangeMaxTriangles}
          />
        )}
        <PropertiesPanelButton onClick={this.onRegenerate}>
          {this.props.t('editor:properties.floorPlan.lbl-regenerate')}
        </PropertiesPanelButton>
      </NodeEditor>
    )
  }
}
const FloorPlanNodeEditorContainer = withDialog(withSettings(FloorPlanNodeEditor))
;(FloorPlanNodeEditorContainer as any).iconComponent = FloorPlanNodeEditor.iconComponent
;(FloorPlanNodeEditorContainer as any).description = FloorPlanNodeEditor.description
export default withTranslation()(FloorPlanNodeEditorContainer)
