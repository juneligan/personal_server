export class RestApiDomainsModel {
  header: string;
  rowData: any;

  constructor (header: String, data: any) {
    this.header = header.toString();
    this.rowData = data;
  }

  getJsonFormat() {
    return {
      [this.header]: JSON.stringify(this.rowData)
    };
  }

  getJsonHeader() {
    return { headerValues: [this.header] };
  }
}
