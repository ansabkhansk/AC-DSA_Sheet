import { useQuery } from '@tanstack/react-query';
import { fetchSheet } from './api';

export function useSheet() {
  return useQuery({
    queryKey: ['sheet'],
    queryFn: fetchSheet,
  });
}
