import {Query} from "@feathersjs/feathers";

export class RestApiDomainRequestDto {
  table: string;
  internalId: Number;

  constructor (request: Query) {
    this.table = request.table;
    this.internalId = request.internalId;
  }
}
