// Initializes the `spreadsheet_info` service on path `/spreadsheet-info`
import { ServiceAddons } from '@feathersjs/feathers';
import { Application } from '../../declarations';
import { SpreadsheetInfo } from './spreadsheet_info.class';
import createModel from '../../models/spreadsheet_info.model';
import hooks from './spreadsheet_info.hooks';

// Add this service to the service type index
declare module '../../declarations' {
  interface ServiceTypes {
    'spreadsheet-info': SpreadsheetInfo & ServiceAddons<any>;
  }
}

export default function (app: Application): void {
  const options = {
    Model: createModel(app),
    paginate: app.get('paginate')
  };

  // Initialize our service with any options it requires
  app.use('/spreadsheet-info', new SpreadsheetInfo(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('spreadsheet-info');

  service.hooks(hooks);
}
