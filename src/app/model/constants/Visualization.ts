import {InputLabel} from '../types/Chart'

export const INPUTS: InputLabel[] = [
  'species', 'genus', 'commonName', 'fullName', 'street',
  'arrondissement', 'usage', 'circumference', 'height']

export const CONTINUOUS_VARS: InputLabel[] = ['height', 'circumference']
export const NUM_VARS: InputLabel[] = [...CONTINUOUS_VARS, 'arrondissement']
