import { Component } from "../exports";
import T_ROUTER from "../interfaces/T_router";

export const Router = function(this: any, routes: Array<object>) {
    this.loadedRoutes = []


    this.Init = (): T_ROUTER => {

        // load in the routes
        this.LoadRoutes()

        return { isRouter: true, init: this.Init, route: this.route }
    }

    this.LoadRoutes = () => {
        routes.forEach(route => {

            let builtRoute = {};

            //* check if route requires params
            if (route.path.includes(":")) {

                //* get the params required
                let params = route.path.split(":");

                //* remove the path from array
                let path = params.splice(0, 1)[0];

                //* build up a required params object for this route
                let required = {};
                params.forEach(param => {

                    //* check for defaults
                    if (param.includes("=")) {

                        //* get values
                        const defaultedVals = param.split("=");
                        const key = defaultedVals[0];
                        const value = defaultedVals[1];

                        if (value.includes("true") || value.includes("false")) {
                            if (value.includes("true")) {
                                required[key] = Boolean(value);
                            } else {
                                required[key] = Boolean(!value);
                            }
                        } else {
                            if (isNaN(Number(value))) {
                                required[key] = value;
                            } else if (!isNaN(Number(value))) {
                                required[key] = Number(value);
                            } else {
                                required[key] = value;
                            }
                        }
                    } else {
                        required[param] = false;
                    }
                });

                //* setup route object with newly built up params
                builtRoute["path"] = path;
                builtRoute["params"] = required;
                builtRoute["component"] = route.component;
                builtRoute["name"] = route.name;

            }
            //* route doesn't need params
            else {
                builtRoute["path"] = route.path;
                builtRoute["params"] = false;
                builtRoute["component"] = route.component;
                builtRoute["name"] = route.name;
            }

            this.loadedRoutes.push(builtRoute);

        });
    }


    this.route = async (route: string) => {
        // check if route exists
        const found = this.loadedRoutes.filter(R => R.path === route)[0]
        if (found) {
            window.history.pushState(found.params, "", found.path)
            return await Component(found.name, found.component)
        }
        return
    }
}
