// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import * as utils from './utils';


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
   * Read-only.
   */
  data: any;

  /**
   * Modify the config values stored. Update the local data immediately,
   * send the change to the server, and use the updated data from the server
   * when the reply comes.
   */
  update(newdata: any): Promise<any>;

}


/**
 * Get a config section and return a Promise that is fulfilled with the
 * data is loaded.
 */
export
function getConfigSection(sectionName: string, baseUrl: string): Promise<IConfigSection> {
  var section = new ConfigSection(sectionName, baseUrl);
  return section.load();
}


/**
 * Implementation of the Configurable data section.
 */
class ConfigSection implements IConfigSection {

  /**
   * Create a config section.
   */
  constructor(sectionName: string, baseUrl: string) {
    this._url = utils.urlPathJoin(baseUrl, SERVICE_CONFIG_URL, sectionName);
  }

  /**
   * Get the data for this section.
   *
   * Read-only.
   */
  get data(): any {
      return this._data;
  }
  
  /**
   * Load the initial data for this section.
   */
  load(): Promise<IConfigSection> {
    return utils.ajaxRequest(this._url, {
      method: "GET",
      dataType: "json",
    }).then((success: utils.IAjaxSuccess) => {
      if (success.xhr.status !== 200) {
        throw Error('Invalid Status: ' + success.xhr.status);
      }
      this._data = success.data;
      return this;
    });
  }
  
  /**
   * Modify the config values stored. Update the local data immediately,
   * send the change to the server, and use the updated data from the server
   * when the reply comes.
   */
  update(newdata: any): Promise<any> {
    this._data = utils.extend(this._data, newdata);

    return utils.ajaxRequest(this._url, {
      method : "PATCH",
      data: JSON.stringify(newdata),
      dataType : "json",
      contentType: 'application/json',
    }).then((success: utils.IAjaxSuccess) => {
      if (success.xhr.status !== 200) {
        throw Error('Invalid Status: ' + success.xhr.status);
      }

      this._data = success.data;
      return this._data;
    });
  }

  private _url = "unknown";
  private _data: any = { };
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
    return this._classData()[key] || this._defaults[key]
  }
  
  /**
   * Set a config value. Send the update to the server, and change our
   * local copy of the data immediately.
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
   * If we have no classname, get all of the data in the Section
   */
  private _classData(): any {
    if (this._className) {
      return this._section.data[this._className] || {};
    } else {
      return this._section.data
    }
  }

  private _section: IConfigSection = null;
  private _defaults: any = null;
  private _className = "unknown";
}
