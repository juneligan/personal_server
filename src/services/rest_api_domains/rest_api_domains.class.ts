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

    console.log(sheet.title);
    console.log(sheet.rowCount);
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

    const doc = await this._getGoogleSheet();

    const existingSheet = doc.sheetsByTitle[userEmail];
    const sheet = await this._createInitialDetails(doc, userEmail, header, existingSheet);

    // rows[0][header.toString()].get

    const formatted = parseInt(id.toString());
    // const test = await rows[formatted][header];

    return {
      id, text: `A new message with ID: ${id}!`
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

    const isHeaderExist = headers.find((e: string) => e === header);

    if (!isHeaderExist) {
      await sheet.setHeaderRow([...headers, header]);
    }
    await this._addData(model, rows, sheet);

    return data;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async update (id: NullableId, data: Data, params?: Params): Promise<Data> {
    return data;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async patch (id: NullableId, data: Data, params?: Params): Promise<Data> {
    return data;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async remove (id: NullableId, params?: Params): Promise<Data> {
    return { id };
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


    let loopBroke = false;
    let index = 1;
    for (let row of rows) {
      if (row[header] === undefined || row[header] === null || row[header] === '') {
        row[header] =  JSON.stringify(model.rowData);
        await row.save();
        loopBroke = true;
        break;
      }
      index += 1;
    }
    if (!loopBroke) {
      await sheet.addRow(model.getJsonFormat())
    }
  }

  async _collectData(header: string, rows: Array<GoogleSpreadsheetRow>): Promise<Data[]> {
    const list: Data[] = [];
    for (let row of rows) {
      if (row[header] === undefined || row[header] === null || row[header] === '') {
        break;
      }
      list.push(JSON.parse(row[header]));
    }
    return list;
  }
}
