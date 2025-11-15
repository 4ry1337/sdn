import z from "zod"

//http://www.localhost:8080/wm/core/storage/tables/json
export const FloodlightTablesSchema = z.array( z.string() )
// "controller_controller",
// "controller_controllerinterface",
// "controller_switchconfig",
// "controller_forwardingconfig",
// "controller_staticentrytable",
// "controller_topologyconfig",
// "controller_link",
// "controller_firewallrules"
