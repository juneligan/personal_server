import assert from 'assert';
import app from '../../src/app';

describe('\'rest_api_domains\' service', () => {
  it('registered the service', () => {
    const service = app.service('rest-api-domains');

    assert.ok(service, 'Registered the service');
  });
});
