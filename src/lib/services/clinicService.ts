import { isMockDataMode } from '../environment';
import {
  DatabaseClinicRepository,
  IClinicRepository,
  MockClinicRepository,
} from '../repositories/clinicRepository';

const dbRepo = new DatabaseClinicRepository();
const mockRepo = new MockClinicRepository();

export function getClinicRepository(): IClinicRepository {
  if (isMockDataMode()) {
    return mockRepo;
  }
  return dbRepo;
}

