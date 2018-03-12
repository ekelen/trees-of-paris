export enum SearchKind {
  by_coordinates,
  by_arrdt
}

export interface IParams {
  first_visit: boolean;
  user_arrdt: number;
  user_coordinates: [number, number];
  search_choice: SearchKind;
  has_any_location: boolean;
  confirmed_any_location: boolean;
}
