import assert from 'assert';
import app from '../../src/app';

describe('\'spreadsheet_info\' service', () => {
  it('registered the service', () => {
    const service = app.service('spreadsheet-info');

    assert.ok(service, 'Registered the service');
  });
});
