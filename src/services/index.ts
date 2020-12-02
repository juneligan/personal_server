import { Application } from '../declarations';
import users from './users/users.service';
import restApiDomains from './rest_api_domains/rest_api_domains.service';
import spreadsheetInfo from './spreadsheet_info/spreadsheet_info.service';
// Don't remove this comment. It's needed to format import lines nicely.

export default function (app: Application): void {
  app.configure(users);
  app.configure(restApiDomains);
  app.configure(spreadsheetInfo);
}
