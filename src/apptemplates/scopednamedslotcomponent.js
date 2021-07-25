export default `var uiConfig = {
  props: {
    items: 'Array'
  },
  uiSchema: {
    component: "div", contents: [
      {component: "loop", dataList:"items", itemAlias:"item", contents: [
        {component: 'sheet', props:{"min-width":"100px", "min-height":"100px"}, template:"<div><slot name='content' v-bind:item='item'></slot></div>"}
      ]}
    ]
  }
}
`