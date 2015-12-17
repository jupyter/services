// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import { IAjaxOptions } from './utils';

import * as utils from './utils';

import * as validate from './validate';


/**
 * The url for the contents service.
 */
var SERVICE_CONTENTS_URL = 'api/contents';


/**
 * Options for a contents object.
 */
export
interface IContentsOpts {
  /**
   * The type of file.
   *
   * #### Notes
   * One of `{ "directory", "file", "notebook" }`
   */
  type?: string;

  /**
   * The format of the file `content`.
   *
   * #### Notes
   * One of `{ 'json', text', 'base64' }`
   *
   * Only relevant for type: 'file'
   */
  format?: string;

  /**
   * The file content, or whether to include the file contents.
   *
   * #### Notes
   * Can either contain the content of a file for upload, or a boolean
   * indicating whether to include contents in the response.
   */
  content?: any;

  /**
   * The file extension, including a leading `.`.
   */
  ext?: string;

  /**
   * The name of the file.
   */
  name?: string;
}


/**
 * Contents model.
 *
 * #### Notes
 * If the model does not contain content, the `content`, `format`, and
 * `mimetype` keys will be `null`.
 */
export
interface IContentsModel {

  /**
   * Name of the contents file.
   *
   * #### Notes
   *  Equivalent to the last part of the `path` field.
   */
  name: string;

  /**
   * The full file path.
   *
   * #### Notes
   * It will *not* start with `/`, and it will be `/`-delimited.
   */
  path: string;

  /**
   * The type of file.
   *
   * #### Notes
   * One of `{ "directory", "file", "notebook" }`
   */
  type: string;

  /**
   * Whether the requester has permission to edit the file they have requested.
   */
  writable: boolean;

  /**
   * File creation timestamp.
   */
  created: string;

  /**
   * Last modified timestamp.
   */
  last_modified: string;

  /**
   * Specify the mime-type of file contents.
   *
   * #### Notes
   * Only non-`null` when `content` is present and `type` is `"file"`.
   */
  mimetype?: string;

  /**
   * The file content.
   */
  content?: any;

  /**
   * The format of the file `content`.
   *
   * #### Notes
   * One of `{ 'json', text', 'base64' }`
   *
   * Only relevant for type: 'file'
   */
  format?: string;
}


/**
 * Checkpoint model.
 */
export
interface ICheckpointModel {
  /**
   * The unique identifier for the checkpoint.
   */
  id: string;

  /**
   * Last modified timestamp.
   */
  last_modified: string;
}


/**
 * Interface that a content manager should implement.
 **/
export
interface IContents {
  /**
   * Get a file or directory.
   *
   * @param path: Path to the file or directory.
   * @param options: Use `options.content = true` to return file contents.

   * #### Notes
   * Uses the [Jupyter Notebook API](http://petstore.swagger.io/?url=https://raw.githubusercontent.com/jupyter/jupyter-js-services/master/rest_api.yaml#!/contents) and validates the response model.
   *
   * The promise is fulfilled on a valid response and rejected otherwise.
   */
  get(path: string, options: IContentsOpts, ajaxOptions?: IAjaxOptions): Promise<IContentsModel>;

  /**
   * Create a new untitled file or directory in the specified directory path.
   *
   * @param path: The directory in which to create the new file/directory.
   * @param options: Use `ext` and `type` options to choose the type of file.
   *
   * #### Notes
   * Uses the [Jupyter Notebook API](http://petstore.swagger.io/?url=https://raw.githubusercontent.com/jupyter/jupyter-js-services/master/rest_api.yaml#!/contents) and validates the response model.
   *
   * The promise is fulfilled on a valid response and rejected otherwise.
   */
  newUntitled(path: string, options: IContentsOpts, ajaxOptions?: IAjaxOptions): Promise<IContentsModel>;

  /**
   * Delete a file.
   *
   * #### Notes
   * Uses the [Jupyter Notebook API](http://petstore.swagger.io/?url=https://raw.githubusercontent.com/jupyter/jupyter-js-services/master/rest_api.yaml#!/contents).
   *
   * The promise is fulfilled on a valid response and rejected otherwise.
   */
  delete(path: string, ajaxOptions?: IAjaxOptions): Promise<void>;

  /**
   * Rename a file.
   *
   * #### Notes
   * Uses the [Jupyter Notebook API](http://petstore.swagger.io/?url=https://raw.githubusercontent.com/jupyter/jupyter-js-services/master/rest_api.yaml#!/contents) and validates the response model.
   *
   * The promise is fulfilled on a valid response and rejected otherwise.
   */
  rename(path: string, newPath: string, ajaxOptions?: IAjaxOptions): Promise<IContentsModel>;

  /**
   * Save a file.
   *
   * #### Notes
   * Ensure that `model.content` is populated for the file.
   *
   * Uses the [Jupyter Notebook API](http://petstore.swagger.io/?url=https://raw.githubusercontent.com/jupyter/jupyter-js-services/master/rest_api.yaml#!/contents) and validates the response model.
   *
   * The promise is fulfilled on a valid response and rejected otherwise.
   */
  save(path: string, model: any, ajaxOptions?: IAjaxOptions): Promise<IContentsModel>;

  /**
   * Copy a file into a given directory.
   *
   * #### Notes
   * The server will select the name of the copied file.
   *
   * Uses the [Jupyter Notebook API](http://petstore.swagger.io/?url=https://raw.githubusercontent.com/jupyter/jupyter-js-services/master/rest_api.yaml#!/contents) and validates the response model.
   *
   * The promise is fulfilled on a valid response and rejected otherwise.
   */
  copy(path: string, toDir: string, ajaxOptions?: IAjaxOptions): Promise<IContentsModel>;

  /**
   * List notebooks and directories at a given path.
   *
   * @param: path: The path to list notebooks in.
   *
   * #### Notes
   * Uses the [Jupyter Notebook API](http://petstore.swagger.io/?url=https://raw.githubusercontent.com/jupyter/jupyter-js-services/master/rest_api.yaml#!/contents) and validates the response model.
   *
   * The promise is fulfilled on a valid response and rejected otherwise.
   */
  listContents(path: string, ajaxOptions?: IAjaxOptions): Promise<IContentsModel>;

  /**
   * Create a checkpoint for a file.
   *
   * #### Notes
   * Uses the [Jupyter Notebook API](http://petstore.swagger.io/?url=https://raw.githubusercontent.com/jupyter/jupyter-js-services/master/rest_api.yaml#!/contents) and validates the response model.
   *
   * The promise is fulfilled on a valid response and rejected otherwise.
   */
  createCheckpoint(path: string, ajaxOptions?: IAjaxOptions): Promise<ICheckpointModel>;

  /**
   * List available checkpoints for a file.
   *
   * #### Notes
   * Uses the [Jupyter Notebook API](http://petstore.swagger.io/?url=https://raw.githubusercontent.com/jupyter/jupyter-js-services/master/rest_api.yaml#!/contents) and validates the response model.
   *
   * The promise is fulfilled on a valid response and rejected otherwise.
   */
  listCheckpoints(path: string, ajaxOptions?: IAjaxOptions): Promise<ICheckpointModel[]>;

  /**
   * Restore a file to a known checkpoint state.
   *
   * #### Notes
   * Uses the [Jupyter Notebook API](http://petstore.swagger.io/?url=https://raw.githubusercontent.com/jupyter/jupyter-js-services/master/rest_api.yaml#!/contents).
   *
   * The promise is fulfilled on a valid response and rejected otherwise.
   */
  restoreCheckpoint(path: string, checkpointID: string, ajaxOptions?: IAjaxOptions): Promise<void>;

  /**
   * Delete a checkpoint for a file.
   *
   * #### Notes
   * Uses the [Jupyter Notebook API](http://petstore.swagger.io/?url=https://raw.githubusercontent.com/jupyter/jupyter-js-services/master/rest_api.yaml#!/contents).
   *
   * The promise is fulfilled on a valid response and rejected otherwise.
   */
  deleteCheckpoint(path: string, checkpointID: string, ajaxOptions?: IAjaxOptions): Promise<void>;
}


/**
 * A contents handle passing file operations to the back-end.
 *
 * This includes checkpointing with the normal file operations.
 */
export
class Contents implements IContents {

  /**
   * Create a new contents object.
   */
  constructor(baseUrl: string) {
    this._apiUrl = utils.urlPathJoin(baseUrl, SERVICE_CONTENTS_URL);
  }

  /**
   * Get a file or directory.
   *
   * @param path: Path to the file or directory.
   * @param options: Use `options.content = true` to return file contents.

   * #### Notes
   * Uses the [Jupyter Notebook API](http://petstore.swagger.io/?url=https://raw.githubusercontent.com/jupyter/jupyter-js-services/master/rest_api.yaml#!/contents) and validates the response model.
   *
   * The promise is fulfilled on a valid response and rejected otherwise.
   */
  get(path: string, options: IContentsOpts, ajaxOptions?: IAjaxOptions): Promise<IContentsModel> {
    var settings = {
      method : "GET",
      dataType : "json",
    };
    var url = this._getUrl(path);
    var params: IContentsOpts = {};
    if (options.type) { params.type = options.type; }
    if (options.format) { params.format = options.format; }
    if (options.content === false) { params.content = '0'; }
    url = url + utils.jsonToQueryString(params);
    return utils.ajaxRequest(url, settings, ajaxOptions).then((success: utils.IAjaxSuccess): IContentsModel => {
      if (success.xhr.status !== 200) {
        throw Error('Invalid Status: ' + success.xhr.status);
      }
      validate.validateContentsModel(success.data);
      return success.data;
    });
  }

  /**
   * Create a new untitled file or directory in the specified directory path.
   *
   * @param path: The directory in which to create the new file/directory.
   * @param options: Use `ext` and `type` options to choose the type of file.
   *
   * #### Notes
   * Uses the [Jupyter Notebook API](http://petstore.swagger.io/?url=https://raw.githubusercontent.com/jupyter/jupyter-js-services/master/rest_api.yaml#!/contents) and validates the response model.
   *
   * The promise is fulfilled on a valid response and rejected otherwise.
   */
  newUntitled(path: string, options?: IContentsOpts, ajaxOptions?: IAjaxOptions): Promise<IContentsModel> {
    var settings: utils.IAjaxSettings = {
        method : "POST",
        dataType : "json",
    };
    if (options) {
      var data = JSON.stringify({
        ext: options.ext,
        type: options.type
      });
      settings.data = data;
      settings.contentType = 'application/json';
    }
    var url = this._getUrl(path);
    return utils.ajaxRequest(url, settings, ajaxOptions).then((success: utils.IAjaxSuccess): IContentsModel => {
      if (success.xhr.status !== 201) {
        throw Error('Invalid Status: ' + success.xhr.status);
      }
      validate.validateContentsModel(success.data);
      return success.data;
    });
  }

  /**
   * Delete a file.
   *
   * #### Notes
   * Uses the [Jupyter Notebook API](http://petstore.swagger.io/?url=https://raw.githubusercontent.com/jupyter/jupyter-js-services/master/rest_api.yaml#!/contents).
   *
   * The promise is fulfilled on a valid response and rejected otherwise.
   */
  delete(path: string, ajaxOptions?: IAjaxOptions): Promise<void> {
    var settings = {
      method : "DELETE",
      dataType : "json",
    };
    var url = this._getUrl(path);
    return utils.ajaxRequest(url, settings, ajaxOptions).then((success: utils.IAjaxSuccess): void => {
      if (success.xhr.status !== 204) {
        throw Error('Invalid Status: ' + success.xhr.status);
      }
    }, // Translate certain errors to more specific ones.
      (error: utils.IAjaxError) => {
        // TODO: update IPEP27 to specify errors more precisely, so
        // that error types can be detected here with certainty.
        if (error.xhr.status === 400) {
          throw new Error('Directory not found');
        }
        throw new Error(error.xhr.statusText);
      }
    );
  }

  /**
   * Rename a file.
   *
   * #### Notes
   * Uses the [Jupyter Notebook API](http://petstore.swagger.io/?url=https://raw.githubusercontent.com/jupyter/jupyter-js-services/master/rest_api.yaml#!/contents) and validates the response model.
   *
   * The promise is fulfilled on a valid response and rejected otherwise.
   */
  rename(path: string, newPath: string, ajaxOptions?: IAjaxOptions): Promise<IContentsModel> {
    var data = {path: newPath};
    var settings = {
      method : "PATCH",
      data : JSON.stringify(data),
      dataType: "json",
      contentType: 'application/json',
    };
    var url = this._getUrl(path);
    return utils.ajaxRequest(url, settings, ajaxOptions).then((success: utils.IAjaxSuccess): IContentsModel => {
      if (success.xhr.status !== 200) {
        throw Error('Invalid Status: ' + success.xhr.status);
      }
      validate.validateContentsModel(success.data);
      return success.data;
    });
  }

  /**
   * Save a file.
   *
   * #### Notes
   * Ensure that `model.content` is populated for the file.
   *
   * Uses the [Jupyter Notebook API](http://petstore.swagger.io/?url=https://raw.githubusercontent.com/jupyter/jupyter-js-services/master/rest_api.yaml#!/contents) and validates the response model.
   *
   * The promise is fulfilled on a valid response and rejected otherwise.
   */
  save(path: string, model: IContentsOpts, ajaxOptions?: IAjaxOptions): Promise<IContentsModel> {
    var settings = {
      method : "PUT",
      dataType: "json",
      data : JSON.stringify(model),
      contentType: 'application/json',
    };
    var url = this._getUrl(path);
    return utils.ajaxRequest(url, settings, ajaxOptions).then((success: utils.IAjaxSuccess): IContentsModel => {
      // will return 200 for an existing file and 201 for a new file
      if (success.xhr.status !== 200 && success.xhr.status !== 201) {
        throw Error('Invalid Status: ' + success.xhr.status);
      }
      validate.validateContentsModel(success.data);
      return success.data;
    });
  }

  /**
   * Copy a file into a given directory.
   *
   * #### Notes
   * The server will select the name of the copied file.
   *
   * Uses the [Jupyter Notebook API](http://petstore.swagger.io/?url=https://raw.githubusercontent.com/jupyter/jupyter-js-services/master/rest_api.yaml#!/contents) and validates the response model.
   *
   * The promise is fulfilled on a valid response and rejected otherwise.
   */
  copy(fromFile: string, toDir: string, ajaxOptions?: IAjaxOptions): Promise<IContentsModel> {
    var settings = {
      method: "POST",
      data: JSON.stringify({copy_from: fromFile}),
      contentType: 'application/json',
      dataType : "json",
    };
    var url = this._getUrl(toDir);
    return utils.ajaxRequest(url, settings, ajaxOptions).then((success: utils.IAjaxSuccess): IContentsModel => {
      if (success.xhr.status !== 201) {
        throw Error('Invalid Status: ' + success.xhr.status);
      }
      validate.validateContentsModel(success.data);
      return success.data;
    });
  }

  /**
   * List notebooks and directories at a given path.
   *
   * @param: path: The path to list notebooks in.
   *
   * #### Notes
   * Uses the [Jupyter Notebook API](http://petstore.swagger.io/?url=https://raw.githubusercontent.com/jupyter/jupyter-js-services/master/rest_api.yaml#!/contents) and validates the response model.
   *
   * The promise is fulfilled on a valid response and rejected otherwise.
   */
  listContents(path: string, ajaxOptions?: IAjaxOptions): Promise<IContentsModel> {
    return this.get(path, {type: 'directory'}, ajaxOptions);
  }

  /**
   * Create a checkpoint for a file.
   *
   * #### Notes
   * Uses the [Jupyter Notebook API](http://petstore.swagger.io/?url=https://raw.githubusercontent.com/jupyter/jupyter-js-services/master/rest_api.yaml#!/contents) and validates the response model.
   *
   * The promise is fulfilled on a valid response and rejected otherwise.
   */
  createCheckpoint(path: string, ajaxOptions?: IAjaxOptions): Promise<ICheckpointModel> {
    var settings = {
      method : "POST",
      dataType : "json",
    };
    var url = this._getUrl(path, 'checkpoints');
    return utils.ajaxRequest(url, settings, ajaxOptions).then((success: utils.IAjaxSuccess): ICheckpointModel => {
      if (success.xhr.status !== 201) {
        throw Error('Invalid Status: ' + success.xhr.status);
      }
      validate.validateCheckpointModel(success.data);
      return success.data;
    });
  }

  /**
   * List available checkpoints for a file.
   *
   * #### Notes
   * Uses the [Jupyter Notebook API](http://petstore.swagger.io/?url=https://raw.githubusercontent.com/jupyter/jupyter-js-services/master/rest_api.yaml#!/contents) and validates the response model.
   *
   * The promise is fulfilled on a valid response and rejected otherwise.
   */
  listCheckpoints(path: string, ajaxOptions?: IAjaxOptions): Promise<ICheckpointModel[]> {
    var settings = {
      method : "GET",
      dataType: "json",
    };
    var url = this._getUrl(path, 'checkpoints');
    return utils.ajaxRequest(url, settings, ajaxOptions).then((success: utils.IAjaxSuccess): ICheckpointModel[] => {
      if (success.xhr.status !== 200) {
        throw Error('Invalid Status: ' + success.xhr.status);
      }
      if (!Array.isArray(success.data)) {
        throw Error('Invalid Checkpoint list');
      }
      for (var i = 0; i < success.data.length; i++) {
        validate.validateCheckpointModel(success.data[i]);
      }
      return success.data;
    });
  }

  /**
   * Restore a file to a known checkpoint state.
   *
   * #### Notes
   * Uses the [Jupyter Notebook API](http://petstore.swagger.io/?url=https://raw.githubusercontent.com/jupyter/jupyter-js-services/master/rest_api.yaml#!/contents).
   *
   * The promise is fulfilled on a valid response and rejected otherwise.
   */
  restoreCheckpoint(path: string, checkpointID: string, ajaxOptions?: IAjaxOptions): Promise<void> {
    var settings = {
      method : "POST",
      dataType: "json",
    };
    var url = this._getUrl(path, 'checkpoints', checkpointID);
    return utils.ajaxRequest(url, settings, ajaxOptions).then((success: utils.IAjaxSuccess): void => {
      if (success.xhr.status !== 204) {
        throw Error('Invalid Status: ' + success.xhr.status);
      }
    });

  }

  /**
   * Delete a checkpoint for a file.
   *
   * #### Notes
   * Uses the [Jupyter Notebook API](http://petstore.swagger.io/?url=https://raw.githubusercontent.com/jupyter/jupyter-js-services/master/rest_api.yaml#!/contents).
   *
   * The promise is fulfilled on a valid response and rejected otherwise.
   */
  deleteCheckpoint(path: string, checkpointID: string, ajaxOptions?: IAjaxOptions): Promise<void> {
    var settings = {
      method : "DELETE",
      dataType: "json",
    };
    var url = this._getUrl(path, 'checkpoints', checkpointID);
    return utils.ajaxRequest(url, settings, ajaxOptions).then((success: utils.IAjaxSuccess): void => {
      if (success.xhr.status !== 204) {
        throw Error('Invalid Status: ' + success.xhr.status);
      }
    });
  }

  /**
   * Get a REST url for this file given a path.
   */
  private _getUrl(...args: string[]): string {
    var url_parts = [].concat(
                Array.prototype.slice.apply(args));
    return utils.urlPathJoin(this._apiUrl,
                             utils.urlJoinEncode.apply(null, url_parts));
  }

  private _apiUrl = "unknown";
}
