// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import {
  IAjaxSettings
} from 'jupyter-js-utils';

import * as utils from 'jupyter-js-utils';


/**
 * The url for the config service.
 */
var SERVICE_CONFIG_URL = 'api/config';


/**
 * A Configurable data section.
 */
export
interface IConfigSection {
  /**
   * The data for this section.
   *
   * #### Notes
   * This is a read-only property.
   */
  data: any;

  /**
   * Modify the stored config values.
   *
   * #### Notes
   * Updates the local data immediately, sends the change to the server,
   * and updates the local data with the response, and fullfils the promise
   * with that data.
   */
  update(newdata: any): Promise<any>;

  /**
   * Optional default settings for ajax requests, if applicable.
   */
  ajaxSettings?: IAjaxSettings;
}


/**
 * Create a config section.
 *
 * @returns A Promise that is fulfilled with the config section is loaded.
 */
export
function getConfigSection(sectionName: string, baseUrl?: string, ajaxSettings?: IAjaxSettings): Promise<IConfigSection> {
  var section = new ConfigSection(sectionName, baseUrl, ajaxSettings);
  return section.load();
}


/**
 * Implementation of the Configurable data section.
 */
class ConfigSection implements IConfigSection {

  /**
   * Create a config section.
   */
  constructor(sectionName: string, baseUrl?: string, ajaxSettings?: IAjaxSettings) {
    baseUrl = baseUrl || utils.getBaseUrl();
    if (ajaxSettings) this.ajaxSettings = ajaxSettings;
    this._url = utils.urlPathJoin(baseUrl, SERVICE_CONFIG_URL,
                                  utils.urlJoinEncode(sectionName));
  }

  /**
   * Get a copy of the default ajax settings for the section.
   */
  get ajaxSettings(): IAjaxSettings {
    return JSON.parse(this._ajaxSettings);
  }
  /**
   * Set the default ajax settings for the section.
   */
  set ajaxSettings(value: IAjaxSettings) {
    this._ajaxSettings = JSON.stringify(value);
  }

  /**
   * Get the data for this section.
   *
   * #### Notes
   * This is a read-only property.
   */
  get data(): any {
    return this._data;
  }

  /**
   * Load the initial data for this section.
   *
   * #### Notes
   * Uses the [Jupyter Notebook API](http://petstore.swagger.io/?url=https://raw.githubusercontent.com/jupyter/jupyter-js-services/master/rest_api.yaml#!/config).
   *
   * The promise is fulfilled on a valid response and rejected otherwise.
   */
  load(): Promise<IConfigSection> {
    let ajaxSettings = this.ajaxSettings;
    ajaxSettings.method = 'GET';
    ajaxSettings.dataType = 'json';
    ajaxSettings.cache = false;
    return utils.ajaxRequest(this._url, ajaxSettings).then(success => {
      if (success.xhr.status !== 200) {
        throw Error('Invalid Status: ' + success.xhr.status);
      }
      this._data = success.data;
      return this;
    });
  }

  /**
   * Modify the stored config values.
   *
   * #### Notes
   * Uses the [Jupyter Notebook API](http://petstore.swagger.io/?url=https://raw.githubusercontent.com/jupyter/jupyter-js-services/master/rest_api.yaml#!/config).
   *
   * The promise is fulfilled on a valid response and rejected otherwise.
   *
   * Updates the local data immediately, sends the change to the server,
   * and updates the local data with the response, and fulfils the promise
   * with that data.
   */
  update(newdata: any): Promise<any> {
    this._data = utils.extend(this._data, newdata);
    let ajaxSettings = this.ajaxSettings;
    ajaxSettings.method = 'PATCH';
    ajaxSettings.data = JSON.stringify(newdata);
    ajaxSettings.dataType = 'json';
    ajaxSettings.contentType = 'application/json';

    return utils.ajaxRequest(this._url, ajaxSettings).then(success => {
      if (success.xhr.status !== 200) {
        throw Error('Invalid Status: ' + success.xhr.status);
      }

      this._data = success.data;
      return this._data;
    });
  }

  private _url = 'unknown';
  private _data: any = { };
  private _ajaxSettings = '{}';
}


/**
 * Configurable object with defaults.
 */
export
class ConfigWithDefaults {

  /**
   * Create a new config with defaults.
   */
  constructor(section: IConfigSection, defaults: any, classname?: string) {
    this._section = section;
    this._defaults = defaults;
    this._className = classname;
  }

  /**
   * Get data from the config section or fall back to defaults.
   */
  get(key: string): any {
    return this._classData()[key] || this._defaults[key];
  }

  /**
   * Set a config value.
   *
   * #### Notes
   * Uses the [Jupyter Notebook API](http://petstore.swagger.io/?url=https://raw.githubusercontent.com/jupyter/jupyter-js-services/master/rest_api.yaml#!/config).
   *
   * The promise is fulfilled on a valid response and rejected otherwise.
   *
   * Sends the update to the server, and changes our local copy of the data
   * immediately.
   */
  set(key: string, value: any): Promise<any> {
     var d: any = {};
     d[key] = value;
     if (this._className) {
      var d2: any = {};
      d2[this._className] = d;
      return this._section.update(d2);
    } else {
      return this._section.update(d);
    }
  }

  /**
   * Get data from the Section with our classname, if available.
   *
   * #### Notes
   * If we have no classname, get all of the data in the Section
   */
  private _classData(): any {
    if (this._className) {
      return this._section.data[this._className] || {};
    } else {
      return this._section.data;
    }
  }

  private _section: IConfigSection = null;
  private _defaults: any = null;
  private _className = 'unknown';
}
