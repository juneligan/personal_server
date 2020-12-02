import { Id, NullableId, Paginated, Params, ServiceMethods } from '@feathersjs/feathers';
import { Application } from '../../declarations';
import {GoogleSpreadsheet} from "google-spreadsheet";
import {authenticate} from "@feathersjs/authentication";

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

    const doc = await this._getGoogleSheet();
    await doc.loadInfo();

    const sheet = doc.sheetsByTitle['Sheet1']; // or use doc.sheetsById[id] or doc.sheetsByTitle[title]

    console.log(sheet.title);
    console.log(sheet.rowCount);
    console.log("test-----4")
    console.log(this.app.get('authentication').local);

    // const newSheet = doc.addSheet({ title: 'hot new sheet!2' });
    // newSheet.then((result) => { console.log(result.title); }, (error) => console.log(error));
    return ['TEST'];
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async get (id: Id, params?: Params): Promise<Data> {
    return {
      id, text: `A new message with ID: ${id}!`
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async create (data: Data, params?: Params): Promise<Data> {
    if (Array.isArray(data)) {
      return Promise.all(data.map(current => this.create(current, params)));
    }

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
    console.log("==============1");
    console.log(`"${privateKey}"`);
    // let evaluatedPrivateKey = eval(privateKey);
    console.log("==============1a");
    console.log(formattedPrivateKey);
    console.log("==============2");
    const doc = new GoogleSpreadsheet(this.app.get('google_sheet_id'));
    await doc.useServiceAccountAuth({
      client_email: this.app.get('google_sheet_client_email'),
      private_key: formattedPrivateKey,
    });
    return doc;
  }
}
