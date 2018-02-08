export interface ITree {
  id: string;
  species: string;
  genus: string;
  commonName: string;
  fullName: string;

  street: string;
  arrondissement: number;
  geometry: GeoJSON.Point;

  notable: boolean;
  usage: string;

  circumference: number;
  height: number;
}
