import { mock, MockProxy } from 'jest-mock-extended';
import { ObjectLiteral, Repository } from 'typeorm';

export const createMockRepository = <T extends ObjectLiteral>(): MockProxy<
  Repository<T>
> => {
  return mock<Repository<T>>();
};
