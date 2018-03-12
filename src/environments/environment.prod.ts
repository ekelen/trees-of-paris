import {IParams} from '../app/model/types/IParams'


export const environment = {
  production: true,
  useMyTestData: false,
  myTestParams: <IParams> null,
  useFromLocal: false,
  useMockData: false,
  mockTrees: <any> [],
  useMyTestChart: false,
  myTestChart: { input1: '', input2: '' },
};

export const MAPBOX_API_KEY = 'pk.eyJ1IjoiZXJzemthIiwiYSI6ImNpdTFjM2gyZTA5cHYyb3J3aXd2cmdkcDcifQ.rKMQnv43cbfHWGWX0XNewQ'
