import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { getCreditBalanceApi } from './api';

/** The account's real balance from the backend, refreshed whenever the screen is focused. Null until it loads. */
export const useCreditBalance = () => {
  const [balance, setBalance] = useState<number | null>(null);
  useFocusEffect(
    useCallback(() => {
      let active = true;
      getCreditBalanceApi()
        .then((value) => {
          if (active) setBalance(value);
        })
        .catch(() => {});
      return () => {
        active = false;
      };
    }, []),
  );
  return [balance, setBalance] as const;
};
