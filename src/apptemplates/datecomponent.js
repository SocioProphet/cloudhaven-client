export default `var uiConfig = {
  props: {
    value: {type: "Date"},
    label: {type: "String"}
  },
  dataModel:{
    curDate:''
  },
  methods: {
    mounted: {
      body:''
    },
    onChange: {
      body:'console.log("got onChange")'
    },
    dateRule: {
      args: ["value"],
      body: \`
      if (!value) return true;
      var parts = this.curDate.split(/[^\\d]/);
      if (!parts || parts.length<3 || (parts[0].length<4 && parts[1].length<4 && parts[2].length<4)) {
        return "Enter a valid date format.";
      }
      var isValid = this._moment(this.curDate, "l").isValid();
      return isValid || "Enter a valid date format.";
      \`
    },
    input: {
      args: ["value"],
      body: \`
      if (!value) {
        this.$emit("input", null);
        return;
      }
      this.curDate = value;
      var parts = value.split(/[^\\d]/);
      if (!parts || parts.length<3 || (parts[0].length<4 && parts[1].length<4 && parts[2].length<4)) return;
      var emitVal = this._moment(value, "L");
      if (emitVal.year()<1000) return;
      if (emitVal.isValid()) {
        this.$emit("input", emitVal.toDate());
      }
      \`
    },
    dateToString: {
      args:["value"],
      body:\`
      var v = value?this.moment(value).format("l"):"";
      this.curDate = v;
      return v;
      \`
    }
  },
  computed: {
    listeners: {
      args:[],
      body: \`
      const { input, ...listeners } = this.$listeners;
      return listeners;
      \`
    }
  },
  uiSchema: {component: "textField", props: {":label":"label", ":value":"dateToString(value)", ":rules":"[dateRule]"}, 
    inheritListeners:true, on:{input:"input"}
  }
};

`