import { mock, MockProxy } from 'jest-mock-extended';

export const createMockService = <T>(): MockProxy<T> => {
  return mock<T>();
};
