// Initializes the `rest_api_domains` service on path `/rest-api-domains`
import { ServiceAddons } from '@feathersjs/feathers';
import { Application } from '../../declarations';
import { RestApiDomains } from './rest_api_domains.class';
import hooks from './rest_api_domains.hooks';

// Add this service to the service type index
declare module '../../declarations' {
  interface ServiceTypes {
    'rest-api-domains': RestApiDomains & ServiceAddons<any>;
  }
}

export default function (app: Application): void {
  const options = {
    paginate: app.get('paginate')
  };

  // Initialize our service with any options it requires
  app.use('/rest-api-domains', new RestApiDomains(options, app));

  // Get our initialized service so that we can register hooks
  const service = app.service('rest-api-domains');

  service.hooks(hooks);
}
