var ts = require("./timeseries-processor");

module.exports = {
  name: "tsBetween",
  synonims: {},
  "internal aliases": {"to": "to", "from" : "from"},
  defaultProperty: {},

  execute: function (command, state, config) {
    if (state.head.type != "timeseries")
      throw new Error("Required type : 'timeseries', actual: '" + state.head.type + "'");
    var to = command.settings.to;
    var from = command.settings.from;
    if(!(to instanceof Date)) {
      to = new Date(to);
    }
    if(!(from instanceof Date)) {
      from = new Date(from);
    }
    var timeSeries = state.head.data.to(to, from);
    state.head.data = timeSeries;
    return state;
  },

  help: {
    synopsis: "Smooth timeseries with moving average method",

    name: {
      "default": "ma",
      synonims: []
    },
    input: ["string"],
    output: "timeseries",
    "default param": "none",

    params: [],

    example: {
      description: "Moving average"
    }
  }
}
