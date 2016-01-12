// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
import {
  IAjaxSettings
} from './utils';

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
   * One of `["directory", "file", "notebook"]`.
   */
  type?: string;

  /**
   * The format of the file `content`.
   *
   * #### Notes
   * One of `['json', text', 'base64']`.
   *
   * Only relevant for type: `'file'`.
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
   * One of `["directory", "file", "notebook"]`
   */
  type: string;

  /**
   * Whether the requester has permission to edit the file they have requested.
   */
  writable?: boolean;

  /**
   * File creation timestamp.
   */
  created?: string;

  /**
   * Last modified timestamp.
   */
  last_modified?: string;

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
 * Interface that a contents manager should implement.
 **/
export
interface IContentsManager {
  /**
   * Get a file or directory.
   *
   * @param path: Path to the file or directory.
   *
   * @param options: The options describing the file.
   *   Use `options.content = true` to return file contents.
   *
   * @returns A promise which resolves with the file content.
   */
  get(path: string, options?: IContentsOpts): Promise<IContentsModel>;

  /**
   * Create a new untitled file or directory in the specified directory path.
   *
   * @param path: The directory in which to create the new file/directory.
   *
   * @param options: The options describing the new item.
   *
   * @returns A promise which resolves with the created file content when the
   *    file is created.
   */
  newUntitled(path: string, options: IContentsOpts): Promise<IContentsModel>;

  /**
   * Delete a file.
   *
   * @param path - The path to the file.
   *
   * @returns A promise which resolves when the file is deleted.
   */
  delete(path: string): Promise<void>;

  /**
   * Rename a file or directory.
   *
   * @param path - The original file path.
   *
   * @param newPath - The new file path.
   *
   * @returns A promise which resolves with the new file content model when the
   *   file is renamed.
   */
  rename(path: string, newPath: string): Promise<IContentsModel>;

  /**
   * Save a file.
   *
   * @param path - The desired file path.
   *
   * @param model - The file model to save.
   *
   * @returns A promise which resolves with the file content model when the
   *   file is saved.
   */
  save(path: string, model: any): Promise<IContentsModel>;

  /**
   * Copy a file into a given directory.
   *
   * @param path - The original file path.
   *
   * @param toDir - The destination directory path.
   *
   * @returns A promise which resolves with the new content model when the
   *  file is copied.
   */
  copy(path: string, toDir: string): Promise<IContentsModel>;

  /**
   * List notebooks and directories at a given path.
   *
   * @param: path - The path in which to list the contents.
   *
   * @returns A promise which resolves with a model with the directory content.
   */
  listContents(path: string): Promise<IContentsModel>;

  /**
   * Create a checkpoint for a file.
   *
   * @param path - The path of the file.
   *
   * @returns A promise which resolves with the new checkpoint model when the
   *   checkpoint is created.
   */
  createCheckpoint(path: string): Promise<ICheckpointModel>;

  /**
   * List available checkpoints for a file.
   *
   * @param path - The path of the file.
   *
   * @returns A promise which resolves with a list of checkpoint models for
   *    the file.
   */
  listCheckpoints(path: string): Promise<ICheckpointModel[]>;

  /**
   * Restore a file to a known checkpoint state.
   *
   * @param path - The path of the file.
   *
   * @param checkpointID - The id of the checkpoint to restore.
   *
   * @returns A promise which resolves when the checkpoint is restored.
   */
  restoreCheckpoint(path: string, checkpointID: string): Promise<void>;

  /**
   * Delete a checkpoint for a file.
   *
   * @param path - The path of the file.
   *
   * @param checkpointID - The id of the checkpoint to delete.
   *
   * @returns A promise which resolves when the checkpoint is deleted.
   */
  deleteCheckpoint(path: string, checkpointID: string): Promise<void>;

  /**
   * Optional default settings for ajax requests, if applicable.
   */
  ajaxSettings?: IAjaxSettings;
}


/**
 * A contents manager that passes file operations to the server.
 *
 * This includes checkpointing with the normal file operations.
 */
export
class ContentsManager implements IContentsManager {
  /**
   * Construct a new contents manager object.
   *
   * @param baseUrl - The base URL for the server.
   *
   * @param ajaxSettings - Optional initial ajax settings.
   */
  constructor(baseUrl: string, ajaxSettings?: IAjaxSettings) {
    baseUrl = baseUrl || utils.DEFAULT_BASE_URL;
    if (ajaxSettings) this.ajaxSettings = ajaxSettings;
    this._apiUrl = utils.urlPathJoin(baseUrl, SERVICE_CONTENTS_URL);
  }

  /**
   * Get a copy of the default ajax settings for the contents manager.
   */
  get ajaxSettings(): IAjaxSettings {
    return JSON.parse(this._ajaxSettings);
  }
  /**
   * Set the default ajax settings for the contents manager.
   */
  set ajaxSettings(value: IAjaxSettings) {
    this._ajaxSettings = JSON.stringify(value);
  }

  /**
   * Get a file or directory.
   *
   * @param path: Path to the file or directory.
   *
   * @param options: The options describing the file.
   *   Use `options.content = true` to return file contents.
   *
   * @returns A promise which resolves with the file content.
   *
   * #### Notes
   * Uses the [Jupyter Notebook API](http://petstore.swagger.io/?url=https://raw.githubusercontent.com/jupyter/jupyter-js-services/master/rest_api.yaml#!/contents) and validates the response model.
   */
  get(path: string, options?: IContentsOpts): Promise<IContentsModel> {
    let ajaxSettings = this.ajaxSettings;
    ajaxSettings.method = 'GET';
    ajaxSettings.dataType = 'json';
    ajaxSettings.cache = false;

    let url = this._getUrl(path);

    if (options) {
      let params: IContentsOpts = {};
      if (options.type) { params.type = options.type; }
      if (options.format) { params.format = options.format; }
      if (options.content === false) { params.content = '0'; }
      url += utils.jsonToQueryString(params);
    }

    return utils.ajaxRequest(url, ajaxSettings).then((success: utils.IAjaxSuccess): IContentsModel => {
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
   *
   * @param options: The options describing the new item.
   *
   * @returns A promise which resolves with the created file content when the
   *    file is created.
   *
   * #### Notes
   * Uses the [Jupyter Notebook API](http://petstore.swagger.io/?url=https://raw.githubusercontent.com/jupyter/jupyter-js-services/master/rest_api.yaml#!/contents) and validates the response model.
   */
  newUntitled(path: string, options?: IContentsOpts): Promise<IContentsModel> {
    let ajaxSettings = this.ajaxSettings;
    ajaxSettings.method = 'POST';
    ajaxSettings.dataType = 'json';
    if (options) {
      let data = JSON.stringify({
        ext: options.ext,
        type: options.type
      });
      ajaxSettings.data = data;
      ajaxSettings.contentType = 'application/json';
    }
    let url = this._getUrl(path);
    return utils.ajaxRequest(url, ajaxSettings).then(success => {
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
   * @param path - The path to the file.
   *
   * @returns A promise which resolves when the file is deleted.
   *
   * #### Notes
   * Uses the [Jupyter Notebook API](http://petstore.swagger.io/?url=https://raw.githubusercontent.com/jupyter/jupyter-js-services/master/rest_api.yaml#!/contents).
   */
  delete(path: string): Promise<void> {
    let ajaxSettings = this.ajaxSettings;
    ajaxSettings.method = 'DELETE';
    ajaxSettings.dataType = 'json';

    let url = this._getUrl(path);
    return utils.ajaxRequest(url, ajaxSettings).then(success => {
      if (success.xhr.status !== 204) {
        throw Error('Invalid Status: ' + success.xhr.status);
      }
    }, error => {
        // Translate certain errors to more specific ones.
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
   * Rename a file or directory.
   *
   * @param path - The original file path.
   *
   * @param newPath - The new file path.
   *
   * @returns A promise which resolves with the new file contents model when
   *   the file is renamed.
   *
   * #### Notes
   * Uses the [Jupyter Notebook API](http://petstore.swagger.io/?url=https://raw.githubusercontent.com/jupyter/jupyter-js-services/master/rest_api.yaml#!/contents) and validates the response model.
   */
  rename(path: string, newPath: string): Promise<IContentsModel> {
    let ajaxSettings = this.ajaxSettings;
    ajaxSettings.method = 'PATCH';
    ajaxSettings.dataType = 'json';
    ajaxSettings.contentType = 'application/json';
    ajaxSettings.data = JSON.stringify({ path: newPath });

    let url = this._getUrl(path);
    return utils.ajaxRequest(url, ajaxSettings).then(success => {
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
   * @param path - The desired file path.
   *
   * @param model - The file model to save.
   *
   * @returns A promise which resolves with the file contents model when the
   *   file is saved.
   *
   * #### Notes
   * Ensure that `model.content` is populated for the file.
   *
   * Uses the [Jupyter Notebook API](http://petstore.swagger.io/?url=https://raw.githubusercontent.com/jupyter/jupyter-js-services/master/rest_api.yaml#!/contents) and validates the response model.
   */
  save(path: string, model: IContentsOpts): Promise<IContentsModel> {
    let ajaxSettings = this.ajaxSettings;
    ajaxSettings.method = 'PUT';
    ajaxSettings.dataType = 'json';
    ajaxSettings.data = JSON.stringify(model);
    ajaxSettings.contentType = 'application/json';
    ajaxSettings.cache = false;

    let url = this._getUrl(path);
    return utils.ajaxRequest(url, ajaxSettings).then(success => {
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
   * @param path - The original file path.
   *
   * @param toDir - The destination directory path.
   *
   * @returns A promise which resolves with the new contents model when the
   *  file is copied.
   *
   * #### Notes
   * The server will select the name of the copied file.
   *
   * Uses the [Jupyter Notebook API](http://petstore.swagger.io/?url=https://raw.githubusercontent.com/jupyter/jupyter-js-services/master/rest_api.yaml#!/contents) and validates the response model.
   */
  copy(fromFile: string, toDir: string): Promise<IContentsModel> {
    let ajaxSettings = this.ajaxSettings;
    ajaxSettings.method = 'POST';
    ajaxSettings.data = JSON.stringify({ copy_from: fromFile });
    ajaxSettings.contentType = 'application/json';
    ajaxSettings.dataType = 'json';

    let url = this._getUrl(toDir);
    return utils.ajaxRequest(url, ajaxSettings).then(success => {
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
   * @param: path - The path in which to list the contents.
   *
   * @returns A promise which resolves with a model with the directory
   *    contents.
   *
   * #### Notes
   * Uses the [Jupyter Notebook API](http://petstore.swagger.io/?url=https://raw.githubusercontent.com/jupyter/jupyter-js-services/master/rest_api.yaml#!/contents) and validates the response model.
   */
  listContents(path: string): Promise<IContentsModel> {
    return this.get(path, {type: 'directory'});
  }

  /**
   * Create a checkpoint for a file.
   *
   * @param path - The path of the file.
   *
   * @returns A promise which resolves with the new checkpoint model when the
   *   checkpoint is created.
   *
   * #### Notes
   * Uses the [Jupyter Notebook API](http://petstore.swagger.io/?url=https://raw.githubusercontent.com/jupyter/jupyter-js-services/master/rest_api.yaml#!/contents) and validates the response model.
   */
  createCheckpoint(path: string): Promise<ICheckpointModel> {
    let ajaxSettings = this.ajaxSettings;
    ajaxSettings.method = 'POST';
    ajaxSettings.dataType = 'json'

    let url = this._getUrl(path, 'checkpoints');
    return utils.ajaxRequest(url, ajaxSettings).then(success => {
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
   * @param path - The path of the file.
   *
   * @returns A promise which resolves with a list of checkpoint models for
   *    the file.
   *
   * #### Notes
   * Uses the [Jupyter Notebook API](http://petstore.swagger.io/?url=https://raw.githubusercontent.com/jupyter/jupyter-js-services/master/rest_api.yaml#!/contents) and validates the response model.
   */
  listCheckpoints(path: string): Promise<ICheckpointModel[]> {
    let ajaxSettings = this.ajaxSettings;
    ajaxSettings.method = 'GET';
    ajaxSettings.dataType = 'json';
    ajaxSettings.cache = false;

    let url = this._getUrl(path, 'checkpoints');
    return utils.ajaxRequest(url, ajaxSettings).then(success => {
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
   * @param path - The path of the file.
   *
   * @param checkpointID - The id of the checkpoint to restore.
   *
   * @returns A promise which resolves when the checkpoint is restored.
   *
   * #### Notes
   * Uses the [Jupyter Notebook API](http://petstore.swagger.io/?url=https://raw.githubusercontent.com/jupyter/jupyter-js-services/master/rest_api.yaml#!/contents).
   */
  restoreCheckpoint(path: string, checkpointID: string): Promise<void> {
    let ajaxSettings = this.ajaxSettings;
    ajaxSettings.method = 'POST';
    ajaxSettings.dataType = 'json';

    let url = this._getUrl(path, 'checkpoints', checkpointID);
    return utils.ajaxRequest(url, ajaxSettings).then(success => {
      if (success.xhr.status !== 204) {
        throw Error('Invalid Status: ' + success.xhr.status);
      }
    });

  }

  /**
   * Delete a checkpoint for a file.
   *
   * @param path - The path of the file.
   *
   * @param checkpointID - The id of the checkpoint to delete.
   *
   * @returns A promise which resolves when the checkpoint is deleted.
   *
   * #### Notes
   * Uses the [Jupyter Notebook API](http://petstore.swagger.io/?url=https://raw.githubusercontent.com/jupyter/jupyter-js-services/master/rest_api.yaml#!/contents).
   */
  deleteCheckpoint(path: string, checkpointID: string): Promise<void> {
    let ajaxSettings = this.ajaxSettings;
    ajaxSettings.method = 'DELETE';
    ajaxSettings.dataType = 'json';

    let url = this._getUrl(path, 'checkpoints', checkpointID);
    return utils.ajaxRequest(url, ajaxSettings).then(success => {
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
  private _ajaxSettings = '{}';
}
