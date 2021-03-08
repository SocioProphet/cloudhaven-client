import CHTextField from '../components/CHTextField'
import CHForm from '../components/CHForm'
import Vue from 'vue'

var elementMap = {
  'text-field': {
      component: CHTextField,
      creator: ( parentEl, component, metaData, formId ) => {
        var CompClass = Vue.extend( component );
        var instance = new CompClass({propsData: {formId: formId, metaData: metaData}});
        instance.$mount();
        parentEl.appendChild(instance.$el);
      }
  },
  'form': {
    component: CHForm,
    creator: ( parentEl, component, metaData ) => {
      var CompClass = Vue.extend( component );
      var instance = new CompClass({propsData: {metaData: metaData}});
      instance.$mount();
      parentEl.appendChild(instance.$el);
    }
  }

};

export function addComponent( parentEl, metaData, formId ) {
  var builder = elementMap[metaData.element];
  (builder.creator)(parentEl, builder.component, metaData, formId);
}

