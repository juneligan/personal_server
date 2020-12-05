import {Id, NullableId, Paginated, Params, ServiceMethods} from '@feathersjs/feathers';
import {Application} from '../../declarations';
import {GoogleSpreadsheet, GoogleSpreadsheetRow, GoogleSpreadsheetWorksheet} from "google-spreadsheet";
import {RestApiDomainRequestDto} from "../../models/rest_api_domains/rest_api_domains.request_dto";
import {RestApiDomainsModel} from "../../models/rest_api_domains/rest_api_domains.model";

interface Data {}

interface ServiceOptions {}

export class RestApiDomains implements ServiceMethods<Data> {
  app: Application;
  options: ServiceOptions;

  constructor (options: ServiceOptions = {}, app: Application) {
    this.options = options;
    this.app = app;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async find (params?: Params): Promise<Data[] | Paginated<Data>> {
    if (!params || !params.user || !params.query) {
      return [];
    }

    const request = new RestApiDomainRequestDto(params.query);
    const header = request.table;
    const userEmail = params.user.email;
    const doc = await this._getGoogleSheet();

    const sheet = doc.sheetsByTitle[userEmail]; // or use doc.sheetsById[id] or doc.sheetsByTitle[title]

    const rows = await sheet.getRows({ limit: 100, offset:0 });
    return this._collectData(header, rows);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async get (id: Id, params?: Params): Promise<Data> {
    if (!id || !params || !params.user || !params.query ) {
      return {};
    }

    const request = new RestApiDomainRequestDto(params.query);

    const header = request.table;
    const userEmail = params.user.email;
    const intId = parseInt(id.toString());

    const doc = await this._getGoogleSheet();

    const existingSheet = doc.sheetsByTitle[userEmail];
    const sheet = await this._createInitialDetails(doc, userEmail, header, existingSheet);
    const rows = await sheet.getRows();
    if (rows.length === 0) {
      return {};
    }

    const row = rows[intId];
    if (row === undefined) {
      return {};
    }

    const data = row[header];
    if (this._isNull(data)) {
      return {};
    }

    return {
      internalId: id,
      ...JSON.parse(data)
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async create (data: Data, params?: Params): Promise<Data> {
    if (!params || !params.user || !params.query ) {
      return {};
    }

    const request = new RestApiDomainRequestDto(params.query);

    const header = request.table;
    const userEmail = params.user.email;
    const doc = await this._getGoogleSheet();

    const model = new RestApiDomainsModel(header, data);

    const existingSheet = doc.sheetsByTitle[userEmail];
    const sheet = await this._createInitialDetails(doc, userEmail, header, existingSheet);
    const rows = await sheet.getRows();
    const headers = sheet.headerValues;

    const isHeaderExist = sheet.headerValues.find((e: string) => e === header);
    if (!isHeaderExist) {
      await sheet.setHeaderRow([...headers, header]);
    }
    return await this._addData(model, rows, sheet);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async update (id: NullableId, data: Data, params?: Params): Promise<Data> {
    if (!id || id < 0 || !params || !params.user || !params.query ) {
      return {};
    }

    const request = new RestApiDomainRequestDto(params.query);

    const header = request.table;
    const userEmail = params.user.email;
    const intId = id ? parseInt(id.toString()): -1;

    const doc = await this._getGoogleSheet();

    const existingSheet = doc.sheetsByTitle[userEmail];
    const sheet = await this._createInitialDetails(doc, userEmail, header, existingSheet);
    const rows = await sheet.getRows();
    if (rows.length === 0) {
      return {};
    }

    const row = rows[intId];
    if (row === undefined) {
      return {};
    }

    if (this._isNull(row[header])) {
      return {};
    }

    row[header] = JSON.stringify(data);

    await rows[intId].save();
    return {
      internalId: intId
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async patch (id: NullableId, data: Data, params?: Params): Promise<Data> {
    return data;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async remove (id: NullableId, params?: Params): Promise<Data> {
    if (!id || id < 0 || !params || !params.user || !params.query ) {
      return {};
    }

    const request = new RestApiDomainRequestDto(params.query);

    const header = request.table;
    const userEmail = params.user.email;
    const intId = id ? parseInt(id.toString()): -1;

    const doc = await this._getGoogleSheet();

    const existingSheet = doc.sheetsByTitle[userEmail];
    const sheet = await this._createInitialDetails(doc, userEmail, header, existingSheet);
    const rows = await sheet.getRows();
    // TODO to consider, currently, there's no batch update
    // if (rows.length === 0 && !id) {
    //   return [];
    // } else if (!id) {
    //   return this._removeAll(header, rows, sheet);
    // } else
    if (rows.length === 0) {
      return {};
    }

    const row = rows[intId];
    if (row === undefined) {
      return {};
    }

    if (this._isNull(row[header])) {
      return {};
    }

    row[header] = 'null';
    await rows[intId].save();
    return {
      internalId: intId
    };
  }

  async _getGoogleSheet() {
    const privateKey =this.app.get('google_sheet_private_key');
    const evaluatedPrivateKey = eval(`"${privateKey}"`);
    const formattedPrivateKey = evaluatedPrivateKey.split('_').join(' ');
    const doc = new GoogleSpreadsheet(this.app.get('google_sheet_id'));
    await doc.useServiceAccountAuth({
      client_email: this.app.get('google_sheet_client_email'),
      private_key: formattedPrivateKey,
    });

    await doc.loadInfo();
    return doc;
  }

  async _createInitialDetails(doc: GoogleSpreadsheet, title: String, header: String, sheet: GoogleSpreadsheetWorksheet) {
    if (!sheet) {
      return await doc.addSheet({ title: title.toString(), headerValues: [header.toString()] });
    }
    return sheet;
  }

  async _addData(model: RestApiDomainsModel, rows: Array<GoogleSpreadsheetRow>, sheet: GoogleSpreadsheetWorksheet) {
    const header = model.header;
    let index = 0;
    for (let row of rows) {
      if (this._isNull(row[header])) {
        row[header] = JSON.stringify(model.rowData);
        await row.save();
        return {
          internalId: index,
          ...model.rowData
        };
      }
      index += 1;
    }

    await sheet.addRow(model.getJsonFormat())
    return {
      internalId: index,
      ...model.rowData
    }
  }

  async _collectData(header: string, rows: Array<GoogleSpreadsheetRow>): Promise<Data[]> {
    const list: Data[] = [];
    let index = 0;
    for (let row of rows) {
      if (!this._isNull(row[header])) {
        list.push({
          internalId: index,
          ...JSON.parse(row[header]),
        });
      }
      index += 1;
    }
    return list;
  }

  // TODO to consider
  async _removeAll(header: string, rows: Array<GoogleSpreadsheetRow>, sheet: GoogleSpreadsheetWorksheet) {
    const list: Data[] = [];
    let index = 0;
    for (let row of rows) {
      if (this._isNull(row[header])) {
        break;
      }
      row[header] = 'null';
      await row.save();
      list.push({
        internalId: index,
      });
      index += 1;
    }
    return list;
  }

  _isNull(data: any) {
    return data === undefined || data === null || data === '' || data === 'null';
  }
}
