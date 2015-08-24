// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import utils = require('./utils');


/**
 * The url for the config service.
 */
var SERVICE_CONFIG_URL = 'api/config';


/**
 * Configurable data section.
 */
export 
class ConfigSection {

  /**
   * Create a config section.
   */
  constructor(sectionName: string, baseUrl: string) {
    this._url = utils.urlJoinEncode(baseUrl, SERVICE_CONFIG_URL, sectionName);

    this._loaded = new Promise<any>((resolve, reject) => {
      this._finishFirstLoad = resolve;
    })
  }

  /**
   * Get the data for this section.
   */
  get data(): any {
      return this._data;
  }

  /**
   * Promose fullfilled when the config section is first loaded.
   */
  get onLoaded(): Promise<any> {
    return this._loaded;
  }
  
  /**
   * Retrieve the data for this section.
   */
  load(): Promise<any> {
    return utils.ajaxRequest(this._url, {
      method: "GET",
      dataType: "json",
    }).then((success: utils.IAjaxSuccess) => {
      if (success.xhr.status !== 200) {
        throw Error('Invalid Status: ' + success.xhr.status);
      }
      this._data = success.data;
      this._loadDone();
      return this._data;
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
      this._loadDone();
      return this._data;
    });
  }


  /**
   * Handle a finished load, fulfilling the onLoaded promise on the first call.
   */
  private _loadDone(): void {
    if (!this._oneLoadFinished) {
      this._oneLoadFinished = true;
      this._finishFirstLoad(this._data);
    }
  }

  private _url = "unknown";
  private _data: any = { };
  private _loaded: Promise<any> = null;
  private _oneLoadFinished = false;
  private _finishFirstLoad: (data: any) => void = null;

}


/**
 * Configurable object with defaults.
 */
export 
class ConfigWithDefaults {
  
  /**
   * Create a new config with defaults.
   */
  constructor(section: ConfigSection, defaults: any, classname?: string) {
    this._section = section;
    this._defaults = defaults;
    this._className = classname;
  }
  
  /**
   * Wait for config to have loaded, then get a value or the default.
   *
   * Note: section.load() must be called somewhere else.
   */
  get(key: string): Promise<any> {
    var that = this;
    return this._section.onLoaded.then(() => {
      return this._classData()[key] || this._defaults[key]
    });
  }
  
  /**
   * Return a config value. If config is not yet loaded, return the default
   * instead of waiting for it to load.
   */
  getSync(key: string): any {
    return this._classData()[key] || this._defaults[key];
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

  private _section: ConfigSection = null;
  private _defaults: any = null;
  private _className = "unknown";
}
